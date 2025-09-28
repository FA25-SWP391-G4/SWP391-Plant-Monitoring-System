// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
import { useAuth } from "../auth/AuthContext";

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
      setErr(e?.response?.data?.message || "Login failed");
    }
  };

  const loginWithGoogle = () => {
    window.location.href = "/auth/google"; // backend should handle this route
  };

  return (
    <div className="container py-5">
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="mb-3">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control mb-2"
        />
        <button
  type="button"
  className="btn btn-secondary"
  onClick={()=>{
    const fake = { token:"dev", user:{id:1,name:"Dev",role:"Premium"} };
    localStorage.setItem("token", fake.token);
    localStorage.setItem("user", JSON.stringify(fake.user));
    window.location.href="/";
  }}
>
  Dev bypass
</button>

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control mb-2"
        />
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      {err && <p className="text-danger">{err}</p>}
      <hr />
      <button onClick={loginWithGoogle} className="btn btn-outline-danger">
        Continue with Google
      </button>
    </div>
  );
}
