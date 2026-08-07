import { supabase } from "../supabase/client";
import type { Company } from "../../types/company";
import type { Product } from "../../types/product";

const COMPANY_SELECT = "id,company_name,trade_name,cnpj,email,phone,city,state,segment,description,logo_url,banner_url,role,verified,active,onboarding_done,rating,review_count,created_at,updated_at";

export interface AdminDashboardData {
  totalCompanies: number;
  totalProducts: number;
  totalNegotiations: number;
  totalReports: number;
  totalUsers: number;
  activeProducts: number;
  finishedNegotiations: number;
  pendingReports: number;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const companies = await supabase.from("companies").select("id", { count: "exact", head: true });
  const products = await supabase.from("produtos").select("id,status", { count: "exact" });
  const negotiations = await supabase.from("negotiations").select("id,status", { count: "exact" });
  const reports = await supabase.from("reports").select("id,status", { count: "exact" });
  const authUsers = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  const allProducts = products.data ?? [];
  const allNegotiations = negotiations.data ?? [];
  const allReports = reports.data ?? [];

  return {
    totalCompanies: companies.count ?? 0,
    totalProducts: products.count ?? 0,
    totalNegotiations: negotiations.count ?? 0,
    totalReports: reports.count ?? 0,
    totalUsers: (authUsers.data as { total?: number } | null)?.total ?? 0,
    activeProducts: allProducts.filter((p) => p.status === "active").length,
    finishedNegotiations: allNegotiations.filter((n) => n.status === "finalizado").length,
    pendingReports: allReports.filter((r) => r.status === "pending").length,
  };
}

export async function adminListCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Company[];
}

export async function adminToggleCompanyVerified(id: string, verified: boolean) {
  const { error } = await supabase
    .from("companies")
    .update({ verified, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function adminToggleCompanyActive(id: string, active: boolean) {
  const { error } = await supabase
    .from("companies")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function adminDeleteCompany(id: string) {
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;
}

const ADMIN_PRODUCT_SELECT = `id,product,description,category,price,status,images,main_image,created_by,created_at,
company:companies(company_name,logo_url)`;

export async function adminListProducts(status?: string) {
  let query = supabase
    .from("produtos")
    .select(ADMIN_PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function adminDeleteProduct(id: string) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) throw error;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const content = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
