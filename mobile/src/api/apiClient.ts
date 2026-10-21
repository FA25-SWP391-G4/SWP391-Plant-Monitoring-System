import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve host dynamically so physical devices, emulators, and local development work out of the box
export const getBackendBaseUrl = (): string => {
  // If running via Expo Go on physical device or simulator
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3010`;
  }

  // Android emulator local loopback alias
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3010';
  }

  // Default web / iOS simulator
  return 'http://localhost:3010';
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
  },

  dashboard: {
    getData: async () => {
      return request('/api/dashboard');
    },
  },

  devices: {
    getAll: async () => {
      return request('/api/devices');
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
};

export default api;
