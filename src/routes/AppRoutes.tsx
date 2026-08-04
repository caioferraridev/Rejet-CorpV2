import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/auth/Login/LoginPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}