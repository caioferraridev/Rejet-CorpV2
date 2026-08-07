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
  updateNegotiationStatus,
} from "../../services/negotiations/negotiationService";
import { getPublicUrl } from "../../services/storage/storageService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency, formatDateTime, formatQuantity } from "../../utils/format";
import { NEGOTIATION_STATUS_LABELS, type Negotiation } from "../../types/negotiation";

export default function NegociacaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  const currentUserId = profile?.id ?? user?.id ?? null;
  const { success, error } = useToast();

  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getNegotiation(id);
      setNegotiation(data);
    } catch {
      setNegotiation(null);
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

  const canAccept =
    isSeller && (negotiation.status === "interesse" || negotiation.status === "em_negociacao");
  const canFinalize = isSeller && negotiation.status === "aceito";
  const canCancel =
    isBuyer && (negotiation.status === "interesse" || negotiation.status === "em_negociacao");

  const changeStatus = async (next: "aceito" | "recusado" | "finalizado") => {
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
              variant={
                negotiation.status === "aceito" || negotiation.status === "finalizado"
                  ? "success"
                  : negotiation.status === "recusado"
                    ? "danger"
                    : "secondary"
              }
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

          {(canAccept || canFinalize || canCancel) && (
            <div className={styles.actions}>
              {canAccept && (
                <>
                  <Button onClick={() => changeStatus("aceito")} disabled={updating}>
                    <FiCheck /> Aceitar proposta
                  </Button>
                  <Button variant="danger" onClick={() => changeStatus("recusado")} disabled={updating}>
                    <FiX /> Recusar
                  </Button>
                </>
              )}

              {canFinalize && (
                <Button onClick={() => changeStatus("finalizado")} disabled={updating}>
                  <FiCheck /> Finalizar negociação
                </Button>
              )}

              {canCancel && (
                <Button variant="danger" onClick={() => changeStatus("recusado")} disabled={updating}>
                  <FiX /> Cancelar interesse
                </Button>
              )}
            </div>
          )}
        </Card>

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

          <Button to="/mensagens" variant="secondary" block>
            <FiMessageSquare /> Conversar
          </Button>
        </Card>
      </div>
    </div>
  );
}
