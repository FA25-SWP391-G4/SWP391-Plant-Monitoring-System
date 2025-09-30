import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Zones from "./pages/Zones";
import Reports from "./pages/Reports";
import Thresholds from "./pages/Thresholds";
import SearchReports from "./pages/SearchReports";
import CustomizeDashboard from "./pages/CustomizeDashboard";
import Upgrade from "./pages/Upgrade";

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout><Dashboard/></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/zones"
        element={
          <ProtectedRoute roles={["Premium","Admin"]}>
            <MainLayout><Zones/></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={["Premium","Admin"]}>
            <MainLayout><Reports/></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/thresholds"
        element={
          <ProtectedRoute roles={["Premium","Admin"]}>
            <MainLayout><Thresholds/></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/search-reports"
        element={
          <ProtectedRoute roles={["Premium","Admin"]}>
            <MainLayout><SearchReports/></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customize"
        element={
          <ProtectedRoute roles={["Premium","Admin"]}>
            <MainLayout><CustomizeDashboard/></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upgrade"
        element={
          <ProtectedRoute>
            <MainLayout><Upgrade/></MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
