import { AppRoutes } from "./routes/AppRoutes";
import { supabaseConfigured } from "./services/supabase/client";

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
          padding: 32,
          textAlign: "center",
          background: "#f4f6f5",
          color: "#243127",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>
          Configuração incompleta
        </h1>
        <p style={{ fontSize: 15, maxWidth: 440, lineHeight: 1.6 }}>
          As variáveis de ambiente <code>VITE_SUPABASE_URL</code> e{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> não foram encontradas.
        </p>
        <p style={{ fontSize: 14, marginTop: 8, color: "#666" }}>
          Crie um arquivo <strong>.env</strong> na raiz do projeto com as
          credenciais do Supabase. Consulte o README para mais detalhes.
        </p>
      </div>
    );
  }

  return <AppRoutes />;
}