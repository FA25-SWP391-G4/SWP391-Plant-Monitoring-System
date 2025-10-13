import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { LanguageSwitcher } from './LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isPremium = user?.role === "Premium" || user?.role === "Admin";

  return (
    <nav className="navbar navbar-expand bg-light px-3">
      <Link className="navbar-brand" href="/">SmartFarm</Link>
      <div className="navbar-nav">
        {isPremium && <>
          <Link className="nav-link" href="/zones">Zones</Link>
          <Link className="nav-link" href="/reports">Reports</Link>
          <Link className="nav-link" href="/thresholds">Thresholds</Link>
          <Link className="nav-link" href="/search-reports">Search</Link>
          <Link className="nav-link" href="/customize">Customize</Link>
        </>}
      </div>
      <div className="ms-auto d-flex align-items-center">
        <div className="me-3">
          <LanguageSwitcher />
        </div>
        {user ? (
          <>
            <span className="me-2">{user.name} ({user.role})</span>
            {user.role==="Regular" && <Link className="btn btn-sm btn-warning me-2" href="/upgrade">Upgrade</Link>}
            <button className="btn btn-sm btn-outline-secondary" onClick={logout}>Logout</button>
          </>
        ) : <Link className="btn btn-sm btn-primary" href="/login">Login</Link>}
      </div>
    </nav>
  );
}
