import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import LoginPage from "../pages/auth/Login/LoginPage";
import DashboardPage from "../pages/auth/dashboard/DashboardPage";
import ProdutosPage from "../pages/Produtos/ProdutosPage";
import CadastroProdutoPage from "../pages/CadastroProduto/CadastroProdutoPage";
import ConfigPage from "../pages/Config/ConfigPage";

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

        <Route
          path="/produtos"
          element={
            <PrivateRoute>
              <ProdutosPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/cadastrar-produto"
          element={
            <PrivateRoute>
              <CadastroProdutoPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/config"
          element={
            <PrivateRoute>
              <ConfigPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
