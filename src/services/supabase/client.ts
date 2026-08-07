import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas no arquivo .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getErrorMessage(error: unknown, fallback = "Erro inesperado.") {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
