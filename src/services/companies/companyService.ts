import { supabase } from "../supabase/client";
import type { Company, CompanyInput, CompanyStats } from "../../types/company";

const COMPANY_SELECT = "id,company_name,trade_name,cnpj,email,phone,address,city,state,cep,segment,description,website,instagram,linkedin,logo_url,banner_url,role,verified,active,onboarding_done,rating,review_count,created_at,updated_at";

export async function getCompany(id: string) {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Company;
}

export async function getCurrentCompany(userId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Company | null) ?? null;
}

export async function listCompanies(query = "") {
  let request = supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .order("company_name", { ascending: true });

  const q = query.trim();
  if (q) {
    request = request.or(
      `company_name.ilike.%${q}%,trade_name.ilike.%${q}%,cnpj.eq.${q},city.ilike.%${q}%,segment.ilike.%${q}%`
    );
  }

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as Company[];
}

export async function updateCompany(id: string, input: CompanyInput) {
  const { error } = await supabase
    .from("companies")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markOnboardingDone(id: string) {
  const { error } = await supabase
    .from("companies")
    .update({ onboarding_done: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getCompanyStats(id: string): Promise<CompanyStats> {
  const products = await supabase
    .from("produtos")
    .select("id,status,price")
    .eq("created_by", id);

  const asBuyer = await supabase
    .from("negotiations")
    .select("id,status,offered_price")
    .eq("buyer_id", id);

  const asSeller = await supabase
    .from("negotiations")
    .select("id,status,offered_price")
    .eq("seller_id", id);

  const company = await getCompany(id);

  const items = products.data ?? [];
  const buyers = asBuyer.data ?? [];
  const sellers = asSeller.data ?? [];

  return {
    products: items.length,
    activeProducts: items.filter((p) => p.status === "active").length,
    sales: sellers.filter(
      (n) => n.status === "finalizado" || n.status === "aceito"
    ).length,
    purchases: buyers.filter(
      (n) => n.status === "finalizado" || n.status === "aceito"
    ).length,
    averageRating: Number(company?.rating ?? 0),
    reviewCount: company?.review_count ?? 0,
    totalNegotiations: buyers.length + sellers.length,
  };
}
