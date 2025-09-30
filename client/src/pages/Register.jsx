// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../api/authApi";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await authApi.register(fullName, email, password);
      // Assume backend returns { token, user }
      login(data.token, data.user);
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container py-5">
      <h2>Create your account</h2>
      <p className="text-muted">
        We’ll set up your profile to personalize recommendations.
      </p>

      <form onSubmit={onSubmit} className="mb-3">
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="form-control mb-2"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-control mb-2"
        />

        <input
          placeholder="Password (at least 8 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control mb-2"
        />

        <button type="submit" className="btn btn-success">Register</button>
      </form>

      {err && <p className="text-danger">{err}</p>}

      <p>
        Already have an account?{" "}
        <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}
