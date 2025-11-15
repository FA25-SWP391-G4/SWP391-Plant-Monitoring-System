"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddPlantPage(){
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [deviceIp, setDeviceIp] = useState('192.168.4.1'); // common ESP softAP
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Detect if we might be connected to the ESP32 AP
async function checkSmartPlantConnection() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch("http://192.168.4.1/status", {
      mode: "cors",
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeout);

    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j.status === "ready") {
        setStatus("✅ Connected to SmartPlant_AP — device is ready.");
        setDeviceIp("192.168.4.1");
        setStep(2);
        return true;
      }
    }
    setStatus("⚠️ Could not reach SmartPlant_AP. Are you connected to its Wi-Fi?");
    return false;
  } catch (err) {
    setStatus("❌ Not connected to SmartPlant_AP. Please join the ESP32 Wi-Fi network first.");
    return false;
  }
}


  const isOfflineMode = () => {
  // Common IP range of ESP32 AP or if window.navigator shows no internet
  return deviceIp.startsWith('192.168.4.') || !navigator.onLine;
};

  const commonIps = ['192.168.4.1', '192.168.4.2', '192.168.0.1', '192.168.1.1'];

  async function probeDevice() {
    setLoading(true);
    setStatus('Probing common device addresses...');
    for (const ip of commonIps) {
      try {
        const res = await fetch(`http://${ip}/status`, { mode: 'cors' , cache: 'no-store'});
        if (res.ok) {
          setDeviceIp(ip);
          setStatus(`Found device at ${ip}`);
          setStep(2);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore
      }
    }
    setStatus('No device found at common addresses — enter device IP manually');
    setLoading(false);
    setStep(2);
  }

  async function sendCredentials() {
  setLoading(true);
  setStatus('Sending credentials to device...');

  const userId = localStorage.getItem('user_id');
  const form = new URLSearchParams();
  form.append('ssid', ssid);
  form.append('password', password);
  form.append('userId', userId);

  try {
    // ✅ If we're connected to SmartPlant_AP (offline mode)
    if (isOfflineMode()) {
      console.log('📡 Detected SmartPlant_AP mode — sending directly to device');
      try {
        const res = await fetch(`http://${deviceIp}/config`, {
          method: 'POST',
          body: form,
          mode: 'cors',
        });

        if (res.ok) {
          setStatus('✅ Device accepted Wi-Fi credentials! Please switch back to your normal Wi-Fi network...');
          setStep(3);

          // Auto redirect to dashboard after user switches Wi-Fi
          setTimeout(() => {
            router.push('/dashboard');
          }, 15000); // wait ~15s for device to join new Wi-Fi
        } else {
          const errText = await res.text().catch(() => '');
          setStatus(`❌ Device responded with ${res.status}: ${errText || res.statusText}`);
        }
      } catch (err) {
        console.error('Direct connection failed:', err);
        setStatus(`❌ Could not reach device at ${deviceIp}. Are you still connected to SmartPlant_AP?`);
      }
      return;
    }

    // 🌐 Otherwise, we’re online → use backend proxy
    console.log('🌍 Using backend proxy (online mode)');
    const proxyResp = await fetch('/api/device-proxy/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceIp, ssid, password, userId }),
    });

    const data = await proxyResp.json().catch(() => ({}));
    if (proxyResp.ok && data.ok) {
      setStatus(`✅ Device linked: ${data.data.device_name || 'ESP32'} (ID ${data.data.device_key})`);
      setStep(3);
      setTimeout(() => router.push('/dashboard'), 2000);
    } else {
      setStatus(`❌ Proxy error: ${data.error || proxyResp.statusText} — ${data.details || ''}`);
    }
  } catch (err) {
    setStatus(`❌ Unexpected error: ${err.message || String(err)}`);
  } finally {
    setLoading(false);
  }
}


  async function diagnoseFromServer() {
    setLoading(true);
    setStatus('Asking server to diagnose device reachability...');
    try {
      const resp = await fetch(`/api/device-proxy/diagnose?deviceIp=${encodeURIComponent(deviceIp)}`);
      const j = await resp.json().catch(() => ({}));
      if (resp.ok) setStatus(`Server diagnosis: ${JSON.stringify(j.status || j)}`);
      else setStatus(`Server cannot reach device: ${j.details || j.error || resp.statusText}`);
    } catch (err) {
      setStatus(`Diagnosis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white shadow rounded p-6">
        <h1 className="text-xl font-semibold mb-4">Add New Device — Wi‑Fi Setup</h1>

        {step === 1 && (
          <div>
            <p className="mb-4">To configure your ESP32, first connect your computer to the device's Wi‑Fi access point (usually its SSID). Then click "Find Device" and the page will probe common device IPs.</p>
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded"
              onClick={checkSmartPlantConnection}
              disabled={loading}
            >
              Check Connection to SmartPlant_AP
            </button>

            <button
              className="ml-2 px-4 py-2 border rounded"
              onClick={probeDevice}
              disabled={loading}
            >
              Probe Common IPs
            </button>
            <button className="ml-2 px-4 py-2 border rounded" onClick={() => setStep(2)}>Enter IP manually</button>
            <p className="mt-3 text-sm text-gray-600">Status: {status}</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block mb-2">Device IP (e.g. 192.168.4.1)</label>
            <input className="w-full border rounded p-2 mb-3" value={deviceIp} onChange={e => setDeviceIp(e.target.value)} />

            <label className="block mb-2">Wi‑Fi SSID</label>
            <input className="w-full border rounded p-2 mb-3" value={ssid} onChange={e => setSsid(e.target.value)} />

            <label className="block mb-2">Wi‑Fi Password</label>
            <input className="w-full border rounded p-2 mb-3" type="password" value={password} onChange={e => setPassword(e.target.value)} />

            <div className="flex items-center">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={sendCredentials} disabled={loading}>Send Credentials</button>
              <button className="ml-2 px-4 py-2 border rounded" onClick={() => { setStep(1); setStatus(''); }}>Back</button>
            </div>

            <p className="mt-3 text-sm text-gray-600">Status: {status}</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-4">Configuration sent. The device should connect to the provided Wi‑Fi network. It may take 10–30 seconds. After the device connects, it should appear in your dashboard.</p>
            <div className="flex">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
