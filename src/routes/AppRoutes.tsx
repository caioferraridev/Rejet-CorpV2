import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import PrivateRoute from "./PrivateRoute";
import AppLayout from "../components/layout/AppLayout/AppLayout";
import { Loader } from "../components/ui";

const LoginPage = lazy(() => import("../pages/auth/Login/LoginPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPassword/ResetPasswordPage"));
const DashboardPage = lazy(() => import("../pages/auth/dashboard/DashboardPage"));
const MarketplacePage = lazy(() => import("../pages/Marketplace/MarketplacePage"));
const ProductDetailPage = lazy(() => import("../pages/ProductDetail/ProductDetailPage"));
const ProdutosPage = lazy(() => import("../pages/Produtos/ProdutosPage"));
const CadastroProdutoPage = lazy(() => import("../pages/CadastroProduto/CadastroProdutoPage"));
const NegociacoesPage = lazy(() => import("../pages/Negociacoes/NegociacoesPage"));
const NegociacaoDetailPage = lazy(() => import("../pages/Negociacoes/NegociacaoDetailPage"));
const ChatPage = lazy(() => import("../pages/Chat/ChatPage"));
const FavoritosPage = lazy(() => import("../pages/Favoritos/FavoritosPage"));
const NotificacoesPage = lazy(() => import("../pages/Notificacoes/NotificacoesPage"));
const RelatoriosPage = lazy(() => import("../pages/Relatorios/RelatoriosPage"));
const PerfilPage = lazy(() => import("../pages/Perfil/PerfilPage"));
const ConfigPage = lazy(() => import("../pages/Config/ConfigPage"));
const AdminPage = lazy(() => import("../pages/Admin/AdminPage"));

function PageFallback() {
  return <Loader text="Carregando..." fullPage />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

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
      </Suspense>
    </BrowserRouter>
  );
}
