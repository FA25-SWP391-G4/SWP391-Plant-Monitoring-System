import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../components/ThemeProvider";
import { FiGrid, FiSettings, FiBarChart2, FiCpu, FiLayers, FiLogOut, FiSearch, FiStar, FiSun, FiMoon, FiBell, FiUser } from "react-icons/fi";

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isPremium = user?.role === "Premium" || user?.role === "Admin";

  return (
    <div className="sf-app">
      <aside className="sf-sidebar">
        <div className="sf-brand">
          <span className="dot" /> 
          <span>PlantSmart</span>
        </div>
        <nav className="sf-nav d-grid gap-1">
          <NavLink to="/" className={({isActive})=> isActive? "active": undefined }>
            <FiGrid/> Dashboard
          </NavLink>
          {isPremium && <>
            <NavLink to="/zones" className={({isActive})=> isActive? "active": undefined }>
              <FiLayers/> Zones
            </NavLink>
            <NavLink to="/reports" className={({isActive})=> isActive? "active": undefined }>
              <FiBarChart2/> Reports
            </NavLink>
            <NavLink to="/thresholds" className={({isActive})=> isActive? "active": undefined }>
              <FiSettings/> Thresholds
            </NavLink>
            <NavLink to="/search-reports" className={({isActive})=> isActive? "active": undefined }>
              <FiSearch/> Search
            </NavLink>
            <NavLink to="/customize" className={({isActive})=> isActive? "active": undefined }>
              <FiCpu/> Customize
            </NavLink>
          </>}
          {user?.role === "Regular" && (
            <NavLink to="/upgrade" className={({isActive})=> isActive? "active": undefined }>
              <FiStar/> Upgrade
            </NavLink>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <button 
            className="sf-btn theme-toggle" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FiMoon/> : <FiSun/>}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </div>
      </aside>

      <header className="sf-topbar">
        <div className="topbar-left">
          <div className="welcome-text">
            <span className="greeting">Welcome back</span>
            {user?.name && <span className="user-name">{user.name}</span>}
          </div>
        </div>
        
        <div className="topbar-right">
          <button className="sf-btn icon-btn" title="Notifications">
            <FiBell/>
            <span className="notification-badge">3</span>
          </button>
          
          <div className="user-menu">
            <button className="sf-btn user-btn">
              <FiUser/>
              <span>{user?.name || 'User'}</span>
            </button>
          </div>
          
          <button className="sf-btn logout-btn" onClick={logout} title="Logout">
            <FiLogOut/>
          </button>
        </div>
      </header>

      <main className="sf-content animate-fade-in">{children}</main>
    </div>
  );
}
