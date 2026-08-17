import { supabase } from "../supabase/client";
import type {
  Negotiation,
  NegotiationHistoryEntry,
  NegotiationInput,
  NegotiationStats,
  NegotiationStatus,
} from "../../types/negotiation";

const NEGOTIATION_SELECT = `id,product_id,buyer_id,seller_id,status,quantity,offered_price,message,created_at,updated_at,
buyer:companies!negotiations_buyer_id_fkey(id,company_name,trade_name,logo_url,city,state,verified,rating),
seller:companies!negotiations_seller_id_fkey(id,company_name,trade_name,logo_url,city,state,verified,rating),
product:produtos(id,product,description,price,main_image,images,city,state,condition,quantities,unit)`;

export async function createNegotiation(userId: string, input: NegotiationInput) {
  const product = await supabase
    .from("produtos")
    .select("id,created_by")
    .eq("id", input.product_id)
    .single();

  if (product.error) throw product.error;
  if (!product.data || product.data.created_by === userId) {
    throw new Error("Você não pode negociar este produto.");
  }

  const { data, error } = await supabase
    .from("negotiations")
    .insert({
      product_id: input.product_id,
      buyer_id: userId,
      seller_id: product.data.created_by,
      status: "interesse",
      quantity: input.quantity ?? null,
      offered_price: input.offered_price ?? null,
      message: input.message ?? null,
    })
    .select(NEGOTIATION_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as Negotiation;
}

export async function listNegotiations(userId: string) {
  const { data, error } = await supabase
    .from("negotiations")
    .select(NEGOTIATION_SELECT)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Negotiation[];
}

export async function getNegotiation(id: string) {
  const { data, error } = await supabase
    .from("negotiations")
    .select(NEGOTIATION_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as Negotiation;
}

export async function updateNegotiationStatus(
  id: string,
  status: NegotiationStatus,
  productId?: string
) {
  const updateData: Record<string, string> = { status, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("negotiations")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;

  if ((status === "aceito" || status === "finalizado") && productId) {
    await supabase
      .from("produtos")
      .update({ status: "sold", updated_at: new Date().toISOString() })
      .eq("id", productId);
  }
}

export async function getNegotiationStats(
  userId: string
): Promise<NegotiationStats> {
  const items = await listNegotiations(userId);

  const byStatus: Record<NegotiationStatus, number> = {
    interesse: 0,
    em_negociacao: 0,
    aceito: 0,
    recusado: 0,
    cancelado: 0,
    finalizado: 0,
  };

  items.forEach((n) => {
    byStatus[n.status] = (byStatus[n.status] ?? 0) + 1;
  });

  const totalValue = items
    .filter((n) => n.status === "finalizado" || n.status === "aceito")
    .reduce((acc, n) => acc + (n.offered_price ?? n.product?.price ?? 0), 0);

  return {
    total: items.length,
    byStatus,
    totalValue,
    completed: byStatus.finalizado,
  };
}

const HISTORY_SELECT = `id,negotiation_id,actor_id,previous_status,new_status,observation,created_at,
actor:companies!negotiation_history_actor_id_fkey(id,company_name,logo_url)`;

export async function listNegotiationHistory(negotiationId: string) {
  const { data, error } = await supabase
    .from("negotiation_history")
    .select(HISTORY_SELECT)
    .eq("negotiation_id", negotiationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as NegotiationHistoryEntry[];
}
