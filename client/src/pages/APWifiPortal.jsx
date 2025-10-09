import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NetworkScanner from "../components/NetworkScanner";
import { makeWifiApi } from "../lib/wifiApi";

// Theme vars (forest green / light mint)
const ThemeCSS = () => (
  <style>{`
  :root[data-theme='dark']{ --background:#07130c; --foreground:#e6f6ea; --card:#0b2317; --border:#13492e; --muted:#8fbfa3; --primary:#16a34a; --accent:#22c55e; }
  :root[data-theme='light']{ --background:#f1fbf5; --foreground:#0b2317; --card:#ffffff; --border:#bfe6cf; --muted:#4c7d64; --primary:#16a34a; --accent:#0ea45a; }
  `}</style>
);

function ThemeToggle({ theme, setTheme }){
  const opposite = theme === "dark" ? "Light" : "Dark";
  return (
    <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:bg-white/10" title={`Switch to ${opposite} mode`}>
      <span className="font-medium">{opposite} mode</span>
    </button>
  );
}

export default function APWifiPortal({ baseUrl = "", endpoints = {} }){
  // theme
  const [theme, setTheme] = useState(()=> (typeof document!=='undefined' && document.documentElement.dataset.theme) || 'dark');
  useEffect(()=>{ if (typeof document!=='undefined') document.documentElement.dataset.theme = theme; },[theme]);

  const api = useMemo(()=> makeWifiApi(baseUrl, endpoints), [baseUrl, endpoints]);

  // state
  const [tab, setTab] = useState('connect');
  const [ssid, setSsid] = useState(localStorage.getItem('ap:ssid') || '');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [dhcp, setDhcp] = useState(true);
  const [ipConf, setIpConf] = useState({ ip:'', gw:'', mask:'', dns:'' });
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState({ state: 'idle' });
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const [saved, setSaved] = useState([]);
  const [ap, setAp] = useState({ ssid: 'ESP32-Setup', channel: 6, hidden: false, auth: 'WPA2' });
  const [apPass, setApPass] = useState('');
  const [dev, setDev] = useState(null);
  const [captive, setCaptive] = useState(false);
  const [otaProgress, setOtaProgress] = useState(0);
  const [checkNet, setCheckNet] = useState(null);

  // boot
  useEffect(()=>{ ssid && localStorage.setItem('ap:ssid', ssid); }, [ssid]);
  useEffect(()=>{ (async()=>{ await loadSaved(); await loadApInfo(); await loadDevInfo(); await getCaptive(); await getStatus(); })(); },[]);
  useEffect(()=>()=> clearInterval(pollRef.current),[]);

  // actions (proxy via Node server same-origin)
  async function connect(){ if(!ssid){ setError('Select or enter an SSID'); return; }
    setError(''); setConnecting(true); setStatus({ state:'connecting' });
    try{ await api.connect({ ssid, pass: pass||'', dhcp, ...(dhcp?{}:ipConf) }); startPoll(); }
    catch(e){ setConnecting(false); setStatus({ state:'failed', reason: e.message }); setError(`Connect failed: ${e.message}`); }
  }
  function startPoll(){ clearInterval(pollRef.current); pollRef.current = setInterval(async()=>{ try{
      const s = await api.status(); setStatus(s); if (s.state==='got_ip' || s.state==='failed'){ clearInterval(pollRef.current); setConnecting(false); }
    } catch(e){ clearInterval(pollRef.current); setConnecting(false); setStatus({ state:'failed', reason: e.message }); } }, 1200); }
  async function getStatus(){ try{ setStatus(await api.status()); } catch(_){} }
  async function loadSaved(){ try{ const d = await api.saved(); setSaved(Array.isArray(d)?d:[]); } catch(_){} }
  async function forget(target){ try{ await api.forget(target); await loadSaved(); await getStatus(); } catch(e){ setError(`Forget failed: ${e.message}`);} }
  async function loadApInfo(){ try{ const info = await api.apInfo(); if(info) setAp({ ...ap, ...info }); } catch(_){} }
  async function updateAp(){ try{ await api.apUpdate({ ...ap, pass: apPass || undefined }); } catch(e){ setError(`AP update failed: ${e.message}`);} }
  async function loadDevInfo(){ try{ setDev(await api.devInfo()); } catch(_){} }
  async function reboot(){ try{ await api.reboot(); } catch(e){ setError(`Reboot failed: ${e.message}`);} }
  async function factoryReset(){ if(!confirm('Factory reset? This clears all settings.')) return; try{ await api.factoryReset(); } catch(e){ setError(`Factory reset failed: ${e.message}`);} }
  async function getCaptive(){ try{ const r = await api.captiveStatus(); setCaptive(!!r?.enabled); } catch(_){} }
  async function setCaptiveEnabled(v){ setCaptive(v); try{ await api.captiveSet(v); } catch(e){ setError(`Captive toggle failed: ${e.message}`);} }
  async function runNetCheck(){ setCheckNet(null); try{ setCheckNet(await api.netCheck()); } catch(e){ setCheckNet({ ok:false, error:e.message }); } }
  async function uploadOta(file){ if(!file) return; setOtaProgress(0); try{ await api.uploadOta(file); setOtaProgress(100); } catch(e){ setError(`OTA failed: ${e.message}`);} }

  const Field = ({ label, children }) => (<label className="block"><div className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>{children}</label>);
  const StatusPill = ({ s }) => {
    const { state, reason, ip, ssid } = s || { state: 'idle' };
    let text = 'Idle'; if (state==='connecting') text='Connecting…'; else if (state==='got_ip') text=`Connected${ssid?` • ${ssid}`:''}${ip?` • ${ip}`:''}`; else if (state==='failed') text=`Failed${reason?` • ${reason}`:''}`;
    return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${state==='got_ip'?"border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300": state==='failed'?"border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200":"border-[var(--border)] bg-white/60 text-[var(--muted)] backdrop-blur dark:bg-white/5"}`}>{text}</span>;
  };

  return (
    <div className="min-h-full w-full bg-[var(--background)] text-[var(--foreground)]">
      <ThemeCSS />
      <div className="bg-gradient-to-br from-[var(--primary)]/20 via-[var(--accent)]/15 to-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">ESP32 AP Portal</h2>
              <p className="text-sm text-[var(--muted)]">Configure Wi-Fi, manage AP, and update device firmware.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={runNetCheck} className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:bg-white/10">Check Internet</button>
              <button onClick={loadDevInfo} className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm hover:bg-white/10">Refresh Info</button>
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto">
            {([['connect','Connect'],['saved','Saved'],['ap','AP Settings'],['device','Device'],['ota','OTA'],['advanced','Advanced']]).map(([key,label])=> (
              <button key={key} onClick={()=>setTab(key)} className={`rounded-md px-3 py-2 text-sm font-medium border ${tab===key?"bg-[var(--primary)] text-white border-transparent shadow":"border-[var(--border)] bg-[var(--card)] hover:bg-white/10"}`}>{label}</button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab==='connect' && (
              <motion.section key="connect" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <NetworkScanner baseUrl="" endpoints={{}} ssid={ssid} setSsid={setSsid} />

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow">
                  <div className="text-base font-semibold">Join Network</div>
                  <Field label="SSID (Manual for hidden)"><input value={ssid} onChange={(e)=>setSsid(e.target.value)} placeholder="Network name" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)]/40" /></Field>
                  <Field label="Password">
                    <div className="flex gap-2">
                      <input value={pass} onChange={(e)=>setPass(e.target.value)} type={showPass?"text":"password"} placeholder="Leave empty for open" className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                      <button onClick={()=>setShowPass(v=>!v)} className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm hover:bg-white/10">{showPass?"Hide":"Show"}</button>
                    </div>
                  </Field>
                  <div className="mt-3"><label className="inline-flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={dhcp} onChange={(e)=>setDhcp(e.target.checked)} /><span>Use DHCP (recommended)</span></label></div>
                  {!dhcp && (<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {["ip","gw","mask","dns"].map(k=> (<Field key={k} label={k.toUpperCase()}>
                      <input value={ipConf[k]} onChange={(e)=>setIpConf({ ...ipConf, [k]: e.target.value })} placeholder={k==="mask"?"255.255.255.0":"192.168.1.x"} className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)]/40" />
                    </Field>))}
                  </div>)}
                  {error && <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={connect} disabled={connecting} className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${connecting?"bg-[var(--primary)]/70":"bg-[var(--primary)] hover:brightness-110"}`}>{connecting?"Connecting…":"Connect"}</button>
                      <button onClick={()=>forget()} className="rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm hover:bg-white/10">Forget Current</button>
                    </div>
                    <StatusPill s={status} />
                  </div>
                </div>
              </motion.section>
            )}

            {/* Saved, AP, Device, OTA, Advanced tabs identical to the canvas version; keep as-is */}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
