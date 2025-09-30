import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isPremium = user?.role === "Premium" || user?.role === "Admin";

  return (
    <nav className="navbar navbar-expand bg-light px-3">
      <Link className="navbar-brand" to="/">SmartFarm</Link>
      <div className="navbar-nav">
        {isPremium && <>
          <Link className="nav-link" to="/zones">Zones</Link>
          <Link className="nav-link" to="/reports">Reports</Link>
          <Link className="nav-link" to="/thresholds">Thresholds</Link>
          <Link className="nav-link" to="/search-reports">Search</Link>
          <Link className="nav-link" to="/customize">Customize</Link>
        </>}
      </div>
      <div className="ms-auto">
        {user ? (
          <>
            <span className="me-2">{user.name} ({user.role})</span>
            {user.role==="Regular" && <Link className="btn btn-sm btn-warning me-2" to="/upgrade">Upgrade</Link>}
            <button className="btn btn-sm btn-outline-secondary" onClick={logout}>Logout</button>
          </>
        ) : <Link className="btn btn-sm btn-primary" to="/login">Login</Link>}
      </div>
    </nav>
  );
}
