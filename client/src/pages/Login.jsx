// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
// import { useGoogleLogin } from '@react-oauth/google';


export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await authApi.login(email, password);
      // Expect backend returns { token, user }
      login(data.token, data.user);
      nav("/");
    } catch (e) {
          console.error("❌ Login error:", e);
          console.error("❌ Response data:", e?.response?.data);

          // save a user-friendly error message in state
          setErr(
            e?.response?.data?.message || 
            e?.response?.data?.error || 
            e.message || 
            "Login failed"
          );
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
  // const loginWithGoogle = useGoogleLogin({
  //   onSuccess: async (response) => {
  //     try {
  //       // response contains an access token
  //       const token = response.credential || response.access_token; 
  //       const { data } = await authApi.loginWithGoogle(token);
  //       // Save JWT to context/localStorage
  //       login(data.token, { role: data.role }); 
  //       nav("/"); // redirect to home
  //     } catch (err) {
  //       console.error("Google login error:", err);
  //     }
  //   },
  //   onError: () => {
  //     console.error("Google login failed");
  //   },
  // });

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