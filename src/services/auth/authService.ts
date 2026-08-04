import { supabase } from "../supabase/client";

export async function signIn(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(
  companyName: string,
  cnpj: string,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return { data, error };

  if (!data.user) return { data, error };

  await supabase.from("companies").insert({
    id: data.user.id,
    company_name: companyName,
    cnpj,
    email,
  });

  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}