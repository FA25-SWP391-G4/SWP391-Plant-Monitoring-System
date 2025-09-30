import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { FiGrid, FiSettings, FiBarChart2, FiCpu, FiLayers, FiLogOut, FiSearch, FiStar } from "react-icons/fi";

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const isPremium = user?.role === "Premium" || user?.role === "Admin";

  return (
    <div className="sf-app">
      <aside className="sf-sidebar">
        <div className="sf-brand"><span className="dot" /> SmartFarm</div>
        <nav className="sf-nav d-grid gap-1">
          <NavLink to="/" className={({isActive})=> isActive? "active": undefined }><FiGrid/> Dashboard</NavLink>
          {isPremium && <>
            <NavLink to="/zones" className={({isActive})=> isActive? "active": undefined }><FiLayers/> Zones</NavLink>
            <NavLink to="/reports" className={({isActive})=> isActive? "active": undefined }><FiBarChart2/> Reports</NavLink>
            <NavLink to="/thresholds" className={({isActive})=> isActive? "active": undefined }><FiSettings/> Thresholds</NavLink>
            <NavLink to="/search-reports" className={({isActive})=> isActive? "active": undefined }><FiSearch/> Search</NavLink>
            <NavLink to="/customize" className={({isActive})=> isActive? "active": undefined }><FiCpu/> Customize</NavLink>
          </>}
          {user?.role === "Regular" && (
            <NavLink to="/upgrade" className={({isActive})=> isActive? "active": undefined }>
              <FiStar/> Upgrade
            </NavLink>
          )}
        </nav>
      </aside>

      <header className="sf-topbar">
        <div className="sf-muted">Welcome back{user?.name ? `, ${user.name}` : ""}</div>
        <div className="d-flex align-items-center gap-2">
          {user ? <button className="sf-btn" onClick={logout}><FiLogOut/> Logout</button> : null}
        </div>
      </header>

      <main className="sf-content">{children}</main>
    </div>
  );
}
