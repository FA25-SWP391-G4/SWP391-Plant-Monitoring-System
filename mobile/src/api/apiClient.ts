import Constants from 'expo-constants';
import { Platform } from 'react-native';

let customBackendUrl: string | null = null;
let customAiUrl: string | null = null;

export const setCustomBackendUrl = (url: string | null) => {
  customBackendUrl = url ? url.trim().replace(/\/+$/, '') : null;
};

export const setCustomAiUrl = (url: string | null) => {
  customAiUrl = url ? url.trim().replace(/\/+$/, '') : null;
};

// Resolve host: Defaults directly to the live Render cloud backend
export const getBackendBaseUrl = (): string => {
  if (customBackendUrl) {
    return customBackendUrl;
  }

  // Check if an explicit environment variable was passed at build or runtime
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // Primary production target: Render backend
  return 'https://plantsmart-api.onrender.com';
};

export const getAiDiagnosticBaseUrl = (): string => {
  if (customAiUrl) {
    return customAiUrl;
  }

  if (process.env.EXPO_PUBLIC_AI_URL) {
    return process.env.EXPO_PUBLIC_AI_URL.replace(/\/+$/, '');
  }

  // Primary production target: Render AI backend
  return 'https://plantsmart-ai.onrender.com';
};

// In-memory session store for Mobile
class AuthStore {
  private token: string | null = null;
  private user: any = null;

  setAuth(token: string | null, user: any = null) {
    this.token = token;
    this.user = user;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): any {
    return this.user;
  }

  clear() {
    this.token = null;
    this.user = null;
  }
}

export const authStore = new AuthStore();

// Core Fetch Client with JWT injection and timeout handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = authStore.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && (data.error || data.message)) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Connection timeout reaching backend at ${baseUrl}`);
    }
    throw error;
  }
}

// Mobile API Modules
export const api = {
  baseUrl: getBackendBaseUrl,

  auth: {
    login: async (email: string, password: string) => {
      const result: any = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (result?.data?.token) {
        authStore.setAuth(result.data.token, result.data.user);
      }
      return result;
    },

    register: async (userData: { email: string; password: string; given_name?: string; family_name?: string }) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {
        // ignore
      } finally {
        authStore.clear();
      }
    },

    getCurrentUser: async () => {
      return request('/auth/current-user');
    },
  },

  plants: {
    getAll: async () => {
      const res: any = await request('/api/plants');
      return res?.data && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    },

    getById: async (plantId: number | string) => {
      return request(`/api/plants/${plantId}`);
    },

    create: async (plantData: {
      name: string;
      species_name?: string;
      species?: string;
      location?: string;
      notes?: string;
      moisture_threshold?: number;
      device_key?: string;
    }) => {
      return request('/api/plants', {
        method: 'POST',
        body: JSON.stringify({
          name: plantData.name,
          species_name: plantData.species_name || plantData.species,
          notes: plantData.notes,
          moisture_threshold: plantData.moisture_threshold || 45,
          location: plantData.location,
          device_key: plantData.device_key,
        }),
      });
    },

    water: async (plantId: number | string, duration: number = 5) => {
      return request(`/api/plants/${plantId}/water`, {
        method: 'POST',
        body: JSON.stringify({ duration }),
      });
    },

    getSensorsCurrent: async (plantId: number | string) => {
      return request(`/api/plants/${plantId}/sensors/current`);
    },

    getSensorsHistory: async (plantId: number | string) => {
      return request(`/api/plants/${plantId}/history/sensors`);
    },

    getSchedule: async (plantId: number | string) => {
      return request(`/api/plants/${plantId}/schedule`);
    },

    setSchedule: async (plantId: number | string, scheduleData: any) => {
      return request(`/api/plants/${plantId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });
    },

    toggleAutoWatering: async (plantId: number | string, autoWatering: boolean) => {
      return request(`/api/plants/${plantId}/auto-watering`, {
        method: 'POST',
        body: JSON.stringify({ autoWatering }),
      });
    },

    setThresholds: async (plantId: number | string, thresholds: any) => {
      return request(`/api/plants/${plantId}/thresholds`, {
        method: 'POST',
        body: JSON.stringify({ thresholds }),
      });
    },

    getLastWatered: async (plantId: number | string) => {
      return request(`/api/plants/${plantId}/last-watered`);
    },

    getWateringHistory: async (plantId: number | string) => {
      return request(`/api/plants/${plantId}/history/watering`);
    },
  },

  dashboard: {
    getData: async () => {
      return request('/api/dashboard');
    },
  },

  devices: {
    getAll: async () => {
      const res: any = await request('/api/devices');
      return res?.data && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    },
    configure: async (deviceConfig: {
      deviceIp: string;
      ssid: string;
      password?: string;
      userId?: string | number;
      deviceId?: string;
      plantId?: string | number;
    }) => {
      return request('/api/device-proxy/config', {
        method: 'POST',
        body: JSON.stringify(deviceConfig),
      });
    },
  },

  settings: {
    get: async () => {
      return request('/api/settings');
    },
    update: async (data: any) => {
      return request('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  ai: {
    diagnoseImage: async (
      imageUri: string,
      mimeType?: string,
      fileName?: string,
      base64Data?: string | null
    ) => {
      const baseUrl = getAiDiagnosticBaseUrl();
      const url = `${baseUrl}/diagnose`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s for cold start/ML inference

      try {
        let base64 = base64Data;
        if (!base64 && imageUri.startsWith('data:')) {
          base64 = imageUri.split(',')[1];
        }

        // 1. First attempt: Convert local URI to standard Web Blob
        // This is 100% compliant with React Native / Expo fetch without triggering Unsupported FormDataPart
        try {
          const fetchResp = await fetch(imageUri);
          const blob = await fetchResp.blob();
          const formData = new FormData();
          formData.append('file', blob, fileName || 'plant_leaf.jpg');

          const response = await fetch(url, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          if (response.ok) {
            clearTimeout(timeoutId);
            return await response.json();
          }

          const errText = await response.text();
          // If server rejects multipart or has an unexpected error, proceed to JSON Base64 fallback
          console.warn(`[AI DIAGNOSE] FormData upload returned ${response.status}: ${errText}`);
        } catch (blobErr: any) {
          if (blobErr.name === 'AbortError') throw blobErr;
          console.warn('[AI DIAGNOSE] Blob FormData failed, attempting Base64 JSON fallback:', blobErr?.message);
        }

        // 2. Fallback: Convert to Base64 JSON payload
        if (!base64) {
          try {
            const res = await fetch(imageUri);
            const arrayBuf = await res.arrayBuffer();
            const bytes = new Uint8Array(arrayBuf);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            base64 = btoa(binary);
          } catch (convErr: any) {
            console.warn('[AI DIAGNOSE] Base64 conversion fallback failed:', convErr);
          }
        }

        if (base64) {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64,
              file_name: fileName || 'plant_leaf.jpg',
              mime_type: mimeType || 'image/jpeg',
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`AI Engine error (${response.status}): ${errText || response.statusText}`);
          }

          return await response.json();
        }

        throw new Error('Could not prepare leaf image for diagnosis.');
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error(`Timeout reaching AI Diagnostic service at ${baseUrl}. If using Render free tier, the instance may be spinning up.`);
        }
        throw err;
      }
    },

    checkHealth: async () => {
      const baseUrl = getAiDiagnosticBaseUrl();
      const response = await fetch(`${baseUrl}/health`);
      return response.json();
    },
  },
};

export default api;
