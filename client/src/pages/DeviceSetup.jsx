import React, { useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme.js';
import { CONFIG_SERVER } from '../config.js';

const MOCK_NETWORKS = ['Home_2.4G', 'MyWifi', 'Viettel_Fiber', 'Cafe_Garden', 'Office_AP'];

export default function DeviceSetup() {
  const [dark, toggleTheme] = useTheme();
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [scan, setScan] = useState([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const hiddenFormRef = useRef(null);

  const doScan = () => {
    // mock scan list (real scan would be done by the ESP32 AP page)
    setScan(MOCK_NETWORKS.sort(() => Math.random() - 0.5).slice(0, 5));
  };

  // Primary: fetch to our backend (urlencoded) -> which relays to ESP32
  const sendToDevice = async () => {
    if (!ssid || !password) {
      setStatus('Please enter SSID and password');
      return;
    }
    try {
      setBusy(true);
      setStatus('Sending credentials to ESP32 AP…');

      const body = new URLSearchParams();
      body.append('ssid', ssid);
      body.append('password', password);

      const resp = await fetch(`${CONFIG_SERVER}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json, text/html;q=0.9',
        },
        body: body.toString(),
      });

      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        setStatus(data.message || (data.ok ? 'Success' : 'Failed'));
      } else {
        const text = await resp.text();
        setStatus(text.replace(/<[^>]+>/g, '').trim() || 'Done');
      }
    } catch (e) {
      setStatus(`Fetch failed (${e.message}). Falling back to plain form post…`);
      // Fallback: submit a real form to /send (opens backend response)
      if (hiddenFormRef.current) {
        hiddenFormRef.current.ssid.value = ssid;
        hiddenFormRef.current.password.value = password;
        hiddenFormRef.current.submit();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand bg-white border-bottom sticky-top sg-animate">
        <div className="container-fluid">
          <span className="navbar-brand fw-semibold text-success">
            <i className="bi bi-wifi me-2"></i>Device Setup (ESP32 AP)
          </span>
          <div className="ms-auto d-flex gap-2">
            <a className="btn btn-sm btn-outline-secondary" href="/dashboard">Back to Dashboard</a>
            <button className="btn btn-sm btn-outline-dark" onClick={toggleTheme}>
              {dark ? 'Light' : 'Night'} Mode
            </button>
          </div>
        </div>
      </nav>

      <div className="container my-3 sg-animate-slow">
        <div className="row g-3">
          <div className="col-lg-7">
            <div className="card sg p-3 hover-lift">
              <div className="fw-semibold mb-2">Connect Device to Home Wi-Fi</div>
              <ol className="text-muted small">
                <li>Put ESP32 into AP mode (SSID <code>SMARTGARDEN_AP</code>).</li>
                <li>Connect your laptop/phone to that AP (no internet required).</li>
                <li>Enter your home Wi-Fi credentials below, then click <b>Send to Device</b>.</li>
              </ol>

              <div className="d-flex gap-2 my-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={doScan}>
                  <i className="bi bi-search me-1"></i>Scan Networks
                </button>
                {scan.length > 0 && (
                  <div className="text-muted small">Found: {scan.join(', ')}</div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">SSID</label>
                <input
                  className="form-control"
                  list="ssid-list"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Select or type SSID"
                  autoComplete="off"
                />
                <datalist id="ssid-list">
                  {scan.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-success" disabled={busy} onClick={sendToDevice}>
                  {busy ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-1"></i>Send to Device
                    </>
                  )}
                </button>
                <span className="small text-muted align-self-center">
                  Backend: <code>{CONFIG_SERVER}/send</code>
                </span>
              </div>

              {status && (
                <div className="alert soft mt-3" role="alert">
                  {status}
                </div>
              )}

              {/* Fallback real form to exact /send contract (x-www-form-urlencoded) */}
              <form
                ref={hiddenFormRef}
                action={`${CONFIG_SERVER}/send`}
                method="POST"
                style={{ display: 'none' }}
                target="_blank"
              >
                <input name="ssid" defaultValue="" />
                <input name="password" defaultValue="" />
              </form>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card sg p-3 hover-lift">
              <div className="fw-semibold mb-2">Troubleshooting</div>
              <ul className="text-muted small mb-0">
                <li>Make sure you are connected to the ESP32 AP (SSID like <code>SMARTGARDEN_AP</code>).</li>
                <li>ESP32 AP IP: <code>192.168.4.1</code>, endpoint: <code>/config</code>.</li>
                <li>This page posts to <code>http://localhost:3000/send</code> with <code>x-www-form-urlencoded</code>.</li>
                <li>ESP32 receives params: <code>ssid</code> and <code>password</code> (query string).</li>
                <li>Use 2.4 GHz SSIDs (ESP32 doesn’t support 5 GHz).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
