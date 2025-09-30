import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import { useAuth } from "../auth/AuthContext";

export default function Login(){
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); setErr("");
    try{
      const { data } = await authApi.login(email, password); // adjust /api/auth/login vs /auth/login
      login(data.token, data.user);
      nav("/");
    }catch(e){
      setErr(e?.response?.data?.message || "Login failed");
    }
  };

const devBypass = () => {
  const fake = {
    token: "dev-token",
    user: { id: 1, name: "Dev User", role: "Premium" },
  };

  // Update AuthContext (important!)
  login(fake.token, fake.user);

  // Persist in localStorage
  localStorage.setItem("token", fake.token);
  localStorage.setItem("user", JSON.stringify(fake.user));

  // Redirect
  nav("/");
};


  return (
    <div style={{display:"grid", placeItems:"center", height:"100vh"}}>
      <div className="sf-card" style={{width:380}}>
        <div className="sf-card-header"><div><b>Sign in</b></div></div>
        <form onSubmit={onSubmit} className="d-grid gap-2">
          <input className="sf-input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="sf-input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
          {err && <div style={{color:"salmon", fontSize:13}}>{err}</div>}
          <button className="sf-btn primary" type="submit">Login</button>
          <button className="sf-btn" type="button" onClick={devBypass}>Dev bypass (Premium)</button>
        </form>
      </div>
    </div>
  );
}
