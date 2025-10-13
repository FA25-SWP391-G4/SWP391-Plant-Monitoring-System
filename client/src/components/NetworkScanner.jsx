import React from "react";

// Mock function for RSSI-to-bars conversion if lib/wifiApi doesn't exist
const rssiToBars = (rssi) => {
  if (rssi >= -65) return 4;
  if (rssi >= -75) return 3;
  if (rssi >= -85) return 2;
  return 1;
};

// Mock hook for scanning if actual hook doesn't exist
const useWifiScan = (baseUrl, endpoints) => {
  const [networks, setNetworks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const scan = React.useCallback(() => {
    setLoading(true);
    setError(null);

    // Simulate network scan
    setTimeout(() => {
      setLoading(false);
      setNetworks([
        { ssid: 'PlantSmart_Hub1', rssi: -67, secure: true },
        { ssid: 'PlantSmart_Hub2', rssi: -72, secure: true },
        { ssid: 'Home_WiFi', rssi: -55, secure: true },
        { ssid: 'GuestNetwork', rssi: -85, secure: false }
      ]);
    }, 1500);
  }, []);

  return { networks, loading, error, scan };
};

export default function NetworkScanner({ baseUrl = "", endpoints = {}, ssid, setSsid }){
  const { networks, loading, error, scan } = useWifiScan(baseUrl, endpoints);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow">
      <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
        <div className="text-base font-semibold">Available Networks</div>
        <button onClick={scan} disabled={loading} className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm hover:bg-white/10">
          {loading ? "Scanning…" : "Refresh"}
        </button>
      </div>

      {error && <div className="px-4 pt-3 text-sm text-red-400">{error}</div>}
      {networks.length===0 && !loading ? (
        <div className="p-4 text-[var(--muted)]">No networks yet. Click Refresh.</div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {networks.map((n,idx)=> (
            <label key={idx} className={`flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-[var(--primary)]/5 ${ssid===n.ssid?"bg-[var(--primary)]/10":""}`}>
              <input type="radio" name="ssid" value={n.ssid} checked={ssid===n.ssid} onChange={()=>setSsid(n.ssid)} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{n.ssid || "<hidden>"}</div>
                  <Bars count={rssiToBars(n.rssi)} />
                </div>
                <div className="mt-0.5 flex gap-3 text-xs text-[var(--muted)]">
                  <span>{n.secure?"Secured":"Open"}</span>
                  {typeof n.rssi==="number" && <span>RSSI {n.rssi} dBm</span>}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Bars({ count = 0 }){
  const arr = [0,1,2,3];
  return (
    <div className="flex items-end gap-0.5">
      {arr.map((i)=> (
        <span key={i} className={`w-1 rounded-sm ${i<count?"bg-[var(--primary)]":"bg-white/30 dark:bg-white/20"}`} style={{ height: 6 + i*4 }} />
      ))}
    </div>
  );
}