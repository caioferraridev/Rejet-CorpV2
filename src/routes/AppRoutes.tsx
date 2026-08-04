import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import LoginPage from "../pages/auth/Login/LoginPage";
import DashboardPage from "../pages/auth/dashboard/DashboardPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
