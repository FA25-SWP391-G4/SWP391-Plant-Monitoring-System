import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import ThemeProvider from "./components/ThemeProvider";
import { PageTransitionLoader } from "./components/Loading";
import { usePageTransition } from "./hooks/usePageTransition";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Zones from "./pages/Zones";
import Reports from "./pages/Reports";
import Thresholds from "./pages/Thresholds";
import SearchReports from "./pages/SearchReports";
import CustomizeDashboard from "./pages/CustomizeDashboard";
import Upgrade from "./pages/Upgrade";

function AppContent() {
  const { isLoading } = usePageTransition();

  return (
    <>
      <PageTransitionLoader isLoading={isLoading} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

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
    </>
  );
}

export default function App(){
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
