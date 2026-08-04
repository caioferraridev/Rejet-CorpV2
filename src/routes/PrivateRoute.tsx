import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { JSX } from "react/jsx-runtime";

interface Props {
  children: JSX.Element;
}

export default function PrivateRoute({
  children,
}: Props) {
  const { user, loading } = useAuth();

  if (loading) return <h2>Carregando...</h2>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}