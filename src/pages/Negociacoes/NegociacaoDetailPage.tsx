import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCheck, FiMessageSquare, FiPackage, FiX } from "react-icons/fi";

import styles from "./NegociacaoDetailPage.module.css";

import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Loader,
} from "../../components/ui";
import {
  getNegotiation,
  listNegotiationHistory,
  updateNegotiationStatus,
} from "../../services/negotiations/negotiationService";
import { getPublicUrl } from "../../services/storage/storageService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency, formatDateTime, formatQuantity, timeAgo } from "../../utils/format";
import { NEGOTIATION_STATUS_LABELS, type Negotiation, type NegotiationHistoryEntry, type NegotiationStatus } from "../../types/negotiation";

const STATUS_VARIANT: Record<string, "primary" | "secondary" | "success" | "danger" | "warning" | "neutral"> = {
  interesse: "secondary",
  em_negociacao: "primary",
  aceito: "success",
  recusado: "danger",
  cancelado: "warning",
  finalizado: "neutral",
};

export default function NegociacaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  const currentUserId = profile?.id ?? user?.id ?? null;
  const { success, error } = useToast();

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [history, setHistory] = useState<NegotiationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [data, historyData] = await Promise.all([
        getNegotiation(id),
        listNegotiationHistory(id).catch(() => []),
      ]);
      setNegotiation(data);
      setHistory(historyData);
    } catch {
      setNegotiation(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <Loader text="Carregando negociação..." fullPage />;
  }

  if (!negotiation) {
    return (
      <div className={styles.notFound}>
        <h2>Negociação não encontrada</h2>
        <Button to="/negociacoes" variant="outline">
          Voltar para negociações
        </Button>
      </div>
    );
  }

  const isSeller = currentUserId != null && negotiation.seller_id === currentUserId;
  const isBuyer = currentUserId != null && negotiation.buyer_id === currentUserId;
  const other = isBuyer ? negotiation.seller : negotiation.buyer;
  const product = negotiation.product;
  const productImage = product ? getPublicUrl(product.main_image) : null;

  const canRespond = isSeller && (negotiation.status === "interesse" || negotiation.status === "em_negociacao");
  const canFinalize = (isSeller || isBuyer) && negotiation.status === "aceito";
  const canCancel = (isBuyer || isSeller) && (negotiation.status === "interesse" || negotiation.status === "em_negociacao");
  const canNegotiate = isSeller && negotiation.status === "interesse";

  const changeStatus = async (next: NegotiationStatus) => {
    setUpdating(true);
    try {
      await updateNegotiationStatus(negotiation.id, next, negotiation.product_id);
      success("Status atualizado.");
      void refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : "Falha ao atualizar status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.page}>
      <Breadcrumb
        items={[
          { label: "Negociações", to: "/negociacoes" },
          { label: "Detalhes da negociação" },
        ]}
      />

      <div className={styles.layout}>
        <Card className={styles.mainCard}>
          <div className={styles.statusRow}>
            <Badge
              variant={STATUS_VARIANT[negotiation.status] ?? "neutral"}
            >
              {NEGOTIATION_STATUS_LABELS[negotiation.status]}
            </Badge>
            <span className={styles.date}>{formatDateTime(negotiation.updated_at)}</span>
          </div>

          {product && (
            <div className={styles.productRow}>
              <div className={styles.productImage}>
                {productImage ? (
                  <img src={productImage} alt={product.product} />
                ) : (
                  <span className={styles.noImage}>
                    <FiPackage />
                  </span>
                )}
              </div>

              <div className={styles.productInfo}>
                <Link to={`/produto/${product.id}`} className={styles.productTitle}>
                  {product.product}
                </Link>
                <span className={styles.productMeta}>
                  {product.category ?? "Sem categoria"} · {product.condition ?? "—"}
                </span>
                <strong className={styles.productPrice}>
                  {formatCurrency(product.price)}
                </strong>
              </div>
            </div>
          )}

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span>Quantidade</span>
              <strong>{formatQuantity(negotiation.quantity, product?.unit)}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Preço oferecido</span>
              <strong>{formatCurrency(negotiation.offered_price)}</strong>
            </div>
            <div className={styles.detailItem}>
              <span>Preço total estimado</span>
              <strong>
                {negotiation.quantity != null
                  ? formatCurrency((negotiation.offered_price ?? product?.price ?? 0) * negotiation.quantity)
                  : formatCurrency(negotiation.offered_price ?? product?.price ?? 0)}
              </strong>
            </div>
          </div>

          {negotiation.message && (
            <div className={styles.message}>
              <span className={styles.messageLabel}>Mensagem do interessado</span>
              <p>{negotiation.message}</p>
            </div>
          )}

          {(canRespond || canFinalize || canCancel) && (
            <div className={styles.actions}>
              {canRespond && (
                <>
                  <Button onClick={() => changeStatus("aceito")} disabled={updating}>
                    <FiCheck /> Aceitar proposta
                  </Button>
                  <Button variant="danger" onClick={() => changeStatus("recusado")} disabled={updating}>
                    <FiX /> Recusar
                  </Button>
                </>
              )}

              {canNegotiate && (
                <Button
                  variant="secondary"
                  onClick={() => changeStatus("em_negociacao")}
                  disabled={updating}
                >
                  <FiMessageSquare /> Iniciar negociação
                </Button>
              )}

              {canFinalize && (
                <Button onClick={() => changeStatus("finalizado")} disabled={updating}>
                  <FiCheck /> Finalizar negociação
                </Button>
              )}

              {canCancel && (
                <Button variant="danger" onClick={() => changeStatus("cancelado")} disabled={updating}>
                  <FiX /> Cancelar
                </Button>
              )}
            </div>
          )}
        </Card>

        <div className={styles.sideColumn}>
          <Card className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Outra parte</h2>
            <div className={styles.party}>
              <Avatar
                src={other?.logo_url ?? null}
                name={other?.company_name ?? "Empresa"}
                size="lg"
              />
              <div>
                <strong className={styles.partyName}>{other?.company_name ?? "Empresa"}</strong>
                <span className={styles.partyMeta}>
                  {[other?.city, other?.state].filter(Boolean).join(", ") || "Localização não informada"}
                </span>
                <div className={styles.partyBadge}>
                  <Badge variant={isSeller ? "secondary" : "success"}>
                    {isSeller ? "Comprador" : "Vendedor"}
                  </Badge>
                  {other?.verified && <Badge variant="success">Verificada</Badge>}
                </div>
              </div>
            </div>
          </Card>

          {history.length > 0 && (
            <Card title="Histórico" className={styles.sideCard}>
              <div className={styles.timeline}>
                {history.map((entry, index) => (
                  <div key={entry.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    {index < history.length - 1 && <div className={styles.timelineLine} />}
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <strong>{NEGOTIATION_STATUS_LABELS[entry.new_status as keyof typeof NEGOTIATION_STATUS_LABELS] ?? entry.new_status}</strong>
                        <span className={styles.timelineTime}>{timeAgo(entry.created_at)}</span>
                      </div>
                      {entry.actor && (
                        <span className={styles.timelineActor}>
                          por {entry.actor.company_name}
                        </span>
                      )}
                      {entry.observation && (
                        <span className={styles.timelineObs}>{entry.observation}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
