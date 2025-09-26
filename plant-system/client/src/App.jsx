import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./auth/ProtectedRoute";

import Dashboard from "./pages/Dashboard";         // trang tổng quan (placeholder nếu chưa có)
import Login from "./pages/Login";                 // trang login bạn đã có
import Zones from "./pages/Zones";                 // UC13
import Reports from "./pages/Reports";             // UC14
import Thresholds from "./pages/Thresholds";       // UC15
import SearchReports from "./pages/SearchReports"; // UC16
import CustomizeDashboard from "./pages/CustomizeDashboard"; // UC17
import Upgrade from "./pages/Upgrade";             // UC18

export default function App() {
  return (
    <>
      <Navbar />
      <div className="py-3">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/zones" element={<ProtectedRoute roles={["Premium","Admin"]}><Zones /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={["Premium","Admin"]}><Reports /></ProtectedRoute>} />
          <Route path="/thresholds" element={<ProtectedRoute roles={["Premium","Admin"]}><Thresholds /></ProtectedRoute>} />
          <Route path="/search-reports" element={<ProtectedRoute roles={["Premium","Admin"]}><SearchReports /></ProtectedRoute>} />
          <Route path="/customize" element={<ProtectedRoute roles={["Premium","Admin"]}><CustomizeDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
}
