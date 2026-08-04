import { supabase } from "../supabase/client";

export interface ProductItem {
  id: string;
  product: string;
  description: string | null;
  quantities: number | null;
  cep: string;
  locationc: string | null;
  price: number | null;
  image_name: string | null;
  created_by: string;
}

export async function listProducts(query = "") {
  const q = query.trim();

  let request = supabase.from("produtos").select("*");

  if (q) {
    request = request.or(
      `product.ilike.%${q}%,description.ilike.%${q}%,cep.eq.${q},locationc.ilike.%${q}%`
    );
  }

  const { data, error } = await request;

  if (error) throw error;
  return (data ?? []) as ProductItem[];
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ProductItem;
}

export async function createProduct(
  payload: Omit<ProductItem, "id" | "created_by">
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("produtos")
    .insert({ ...payload, created_by: user?.id ?? null })
    .select()
    .single();

  if (error) throw error;
  return data as ProductItem;
}

export async function updateProduct(
  id: string,
  payload: Partial<Omit<ProductItem, "id" | "created_by">>
) {
  const { error } = await supabase
    .from("produtos")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) throw error;
}
