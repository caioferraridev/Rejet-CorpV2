import { supabase } from "../supabase/client";
import type { CompanyInput } from "../../types/company";

export interface SignUpPayload {
  company_name: string;
  cnpj: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  state?: string;
  segment?: string;
  description?: string;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(payload: SignUpPayload) {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        company_name: payload.company_name,
        cnpj: payload.cnpj,
      },
    },
  });

  if (error || !data.user) return { data, error };

  const session = (await supabase.auth.getSession()).data.session;

  if (session) {
    await createCompanyProfile(session.user.id, payload);
  } else {
    localStorage.setItem(
      "rejec_pending_company",
      JSON.stringify({
        id: data.user.id,
        company_name: payload.company_name,
        cnpj: payload.cnpj,
        email: payload.email,
        phone: payload.phone,
        city: payload.city,
        state: payload.state,
        segment: payload.segment,
        description: payload.description,
      })
    );
  }

  return { data, error };
}

export async function createCompanyProfile(
  userId: string,
  payload: Pick<
    SignUpPayload,
    "company_name" | "cnpj" | "email" | "phone" | "city" | "state" | "segment" | "description"
  >
) {
  const { error } = await supabase.from("companies").upsert(
    {
      id: userId,
      company_name: payload.company_name,
      cnpj: payload.cnpj,
      email: payload.email,
      phone: payload.phone ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      segment: payload.segment ?? null,
      description: payload.description ?? null,
    },
    { onConflict: "id" }
  );
  return error;
}

export async function updateProfile(userId: string, input: CompanyInput) {
  const { error } = await supabase
    .from("companies")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return error;
}

export async function signOut() {
  localStorage.removeItem("rejec_pending_company");
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  const origin = window.location.origin;
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}

export async function updateEmail(email: string) {
  return supabase.auth.updateUser({ email });
}
