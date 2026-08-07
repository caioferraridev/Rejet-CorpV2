import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import AppLayout from "../components/layout/AppLayout/AppLayout";

import LoginPage from "../pages/auth/Login/LoginPage";
import DashboardPage from "../pages/auth/dashboard/DashboardPage";
import MarketplacePage from "../pages/Marketplace/MarketplacePage";
import ProductDetailPage from "../pages/ProductDetail/ProductDetailPage";
import ProdutosPage from "../pages/Produtos/ProdutosPage";
import CadastroProdutoPage from "../pages/CadastroProduto/CadastroProdutoPage";
import NegociacoesPage from "../pages/Negociacoes/NegociacoesPage";
import NegociacaoDetailPage from "../pages/Negociacoes/NegociacaoDetailPage";
import ChatPage from "../pages/Chat/ChatPage";
import FavoritosPage from "../pages/Favoritos/FavoritosPage";
import NotificacoesPage from "../pages/Notificacoes/NotificacoesPage";
import RelatoriosPage from "../pages/Relatorios/RelatoriosPage";
import PerfilPage from "../pages/Perfil/PerfilPage";
import ConfigPage from "../pages/Config/ConfigPage";
import AdminPage from "../pages/Admin/AdminPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/produto/:id" element={<ProductDetailPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/cadastrar-produto" element={<CadastroProdutoPage />} />
          <Route path="/negociacoes" element={<NegociacoesPage />} />
          <Route path="/negociacoes/:id" element={<NegociacaoDetailPage />} />
          <Route path="/mensagens" element={<ChatPage />} />
          <Route path="/favoritos" element={<FavoritosPage />} />
          <Route path="/notificacoes" element={<NotificacoesPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
