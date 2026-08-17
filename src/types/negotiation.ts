import type { Company } from "./company";
import type { Product } from "./product";

export type NegotiationStatus =
  | "interesse"
  | "em_negociacao"
  | "aceito"
  | "recusado"
  | "cancelado"
  | "finalizado";

export const NEGOTIATION_STATUS_LABELS: Record<NegotiationStatus, string> = {
  interesse: "Interesse enviado",
  em_negociacao: "Em negociação",
  aceito: "Aceito",
  recusado: "Recusado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

export interface Negotiation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  status: NegotiationStatus;
  quantity: number | null;
  offered_price: number | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  product?: Product | null;
  buyer?: Company | null;
  seller?: Company | null;
}

export interface NegotiationInput {
  product_id: string;
  quantity?: number;
  offered_price?: number;
  message?: string;
}

export interface NegotiationStats {
  total: number;
  byStatus: Record<NegotiationStatus, number>;
  totalValue: number;
  completed: number;
}

export interface NegotiationHistoryEntry {
  id: string;
  negotiation_id: string;
  actor_id: string | null;
  previous_status: string | null;
  new_status: string;
  observation: string | null;
  created_at: string;
  actor?: Pick<Company, "id" | "company_name" | "logo_url"> | null;
}
