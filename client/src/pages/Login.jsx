import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getUsers } from '../utils/store.js';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('user@smartgarden.test');
  const [password, setPassword] = useState('123456');
  const [err, setErr] = useState('');
  const users = getUsers();

  useEffect(() => {
    const raw = localStorage.getItem('sg_user');
    if (raw) nav('/dashboard', { replace: true });
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const r = login(email.trim(), password);
    if (!r.ok) return setErr(r.error);
    nav('/dashboard', { replace: true });
  };

  const quick = (role) => {
    const u = users.find(x => x.role === role);
    if (!u) return;
    setEmail(u.email); setPassword(u.password);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="p-4 p-md-5 bg-white rounded-4 shadow-sm border ani-fade hover-lift">
              <div className="text-center mb-3">
                <div className="badge text-bg-success">Smart Garden</div>
                <h2 className="mt-2 fw-bold">Sign in</h2>
                <p className="text-muted">Use a test account: Regular / Premium / Admin</p>
              </div>

              <div className="d-flex gap-2 mb-3">
                <button className="btn btn-outline-secondary flex-fill" onClick={() => quick('regular')}>Regular</button>
                <button className="btn btn-outline-success flex-fill" onClick={() => quick('premium')}>Premium</button>
                <button className="btn btn-outline-dark flex-fill" onClick={() => quick('admin')}>Admin</button>
              </div>

              <form onSubmit={submit} className="ani-slide">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>
                {err && <div className="alert alert-danger py-2">{err}</div>}
                <button className="btn btn-success w-100">Sign in</button>
              </form>

              <div className="text-muted small mt-3">
                Regular: <code>user@smartgarden.test</code> · Premium: <code>premium@smartgarden.test</code> · Admin: <code>admin@smartgarden.test</code> (all <code>123456</code>)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
