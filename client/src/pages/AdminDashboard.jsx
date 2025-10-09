import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, setUsers, logout } from '../utils/store.js';
import { useTheme } from '../hooks/useTheme.js';

export default function AdminDashboard() {
  const nav = useNavigate();
  const [user] = useState(()=> JSON.parse(localStorage.getItem('sg_user')||'{}'));
  useEffect(()=>{ if(user?.role!=='admin') nav('/login'); }, []);

  const [dark, toggleTheme] = useTheme();

  const [list, setList] = useState(getUsers());
  const [q, setQ] = useState('');
  const filtered = useMemo(()=> list.filter(u=> (u.name+u.email+u.role).toLowerCase().includes(q.toLowerCase())), [q, list]);

  const save = (next)=>{ setList(next); setUsers(next); };

  const add = () => {
    const name = prompt('Name?'); if(!name) return;
    const email = prompt('Email?'); if(!email) return;
    const role = prompt('Role: regular | premium | admin', 'regular') || 'regular';
    const pwd = '123456';
    save([{ id: crypto.randomUUID(), name, email, role, password: pwd }, ...list]);
  };
  const del = (id) => { if(!confirm('Delete user?')) return; save(list.filter(u=>u.id!==id)); };
  const changeRole = (id, role) => save(list.map(u=>u.id===id?{...u, role}:u));
  const update = (id) => {
    const u = list.find(x=>x.id===id); if(!u) return;
    const name = prompt('Name', u.name)||u.name;
    const email = prompt('Email', u.email)||u.email;
    save(list.map(x=>x.id===id?{...x,name,email}:x));
  };
  const impersonate = (id) => {
    const u = list.find(x=>x.id===id); if(!u) return;
    localStorage.setItem('sg_user', JSON.stringify({ id:u.id, name:u.name, email:u.email, role:u.role }));
    window.location.assign('/dashboard');
  };

  const onLogout = () => { logout(); nav('/login'); };

  return (
    <>
      <nav className="navbar navbar-expand bg-white border-bottom sticky-top sg-animate">
        <div className="container-fluid">
          <span className="navbar-brand fw-semibold text-success"><i className="bi bi-flower1 me-2"></i>Smart Garden — Admin</span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-dark" onClick={toggleTheme}>{dark?'Light':'Night'} Mode</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </nav>

      <div className="container my-3 sg-animate-slow">
        <div className="d-flex align-items-center gap-2 mb-2">
          <button className="btn btn-success btn-sm" onClick={add}><i className="bi bi-person-plus me-1"></i>Add User</button>
          <input className="form-control" placeholder="Search name/email/role…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <div className="card sg p-3 hover-lift">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th style={{width:260}}>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.id}>
                    <td className="fw-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select className="form-select form-select-sm" value={u.role} onChange={e=>changeRole(u.id, e.target.value)}>
                        <option value="regular">regular</option>
                        <option value="premium">premium</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-outline-secondary btn-sm" onClick={()=>update(u.id)}><i className="bi bi-pencil-square"></i></button>
                      <button className="btn btn-outline-danger btn-sm" onClick={()=>del(u.id)}><i className="bi bi-trash"></i></button>
                      <button className="btn btn-success btn-sm" onClick={()=>impersonate(u.id)} title="Preview as user"><i className="bi bi-person-bounding-box"></i></button>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && <tr><td colSpan={4} className="text-muted">No users</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
