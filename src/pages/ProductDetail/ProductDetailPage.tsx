import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiBriefcase,
  FiDownload,
  FiFile,
  FiHeart,
  FiMapPin,
  FiMessageSquare,
  FiShare2,
} from "react-icons/fi";

import styles from "./ProductDetailPage.module.css";

import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  EmptyState,
  Loader,
  StarRating,
} from "../../components/ui";
import ProductCard from "../../components/product/ProductCard/ProductCard";
import NegotiationModal from "../../components/negotiation/NegotiationModal/NegotiationModal";
import { ReviewSection } from "../../components/reviews/ReviewSection/ReviewSection";
import {
  getProduct,
  incrementProductViews,
  listRelatedProducts,
} from "../../services/products/productService";
import { getPublicUrl } from "../../services/storage/storageService";
import { getOrCreateConversation } from "../../services/messages/messageService";
import { useFavorites } from "../../hooks/useFavorites";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatCurrency,
  formatQuantity,
} from "../../utils/format";
import type { Product } from "../../types/product";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  const currentUserId = profile?.id ?? user?.id ?? null;
  const navigate = useNavigate();

  const { isFavorite, toggle } = useFavorites();
  const { success, error } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    setLoading(true);
    setProduct(null);

    getProduct(id)
      .then((data) => {
        if (!active) return;
        setProduct(data);
        setActiveImage(data.main_image ?? data.images?.[0] ?? null);

        if (id) {
          incrementProductViews(id).catch(() => undefined);
        }

        return listRelatedProducts(data).then((items) => {
          if (active) setRelated(items);
        });
      })
      .catch((err) => {
        if (active) {
          error(err instanceof Error ? err.message : "Erro ao carregar produto.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, error]);

  const gallery = useMemo(() => {
    const images = product ? [product.main_image, ...(product.images ?? [])] : [];
    return [...new Set(images.filter((image): image is string => Boolean(image)))];
  }, [product]);

  const currentImage = getPublicUrl(activeImage);

  async function handleFavorite() {
    if (!currentUserId) {
      error("Faça login para salvar favoritos.");
      return;
    }
    try {
      const nowFavorite = await toggle(product!.id);
      success(nowFavorite ? "Adicionado aos favoritos." : "Removido dos favoritos.");
    } catch {
      error("Falha ao atualizar favorito.");
    }
  }

  function handleShare() {
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => success("Link copiado!"))
      .catch(() => undefined);
  }

  async function handleStartChat() {
    if (!currentUserId || !product?.company) return;
    setStartingChat(true);
    try {
      const conversationId = await getOrCreateConversation(currentUserId, {
        product_id: product.id,
        participant_b: product.company.id,
      });
      navigate(`/mensagens?conversa=${encodeURIComponent(conversationId)}`);
    } catch {
      error("Falha ao iniciar conversa.");
    } finally {
      setStartingChat(false);
    }
  }

  if (loading) {
    return <Loader text="Carregando produto..." fullPage />;
  }

  if (!product) {
    return (
      <EmptyState
        icon="📦"
        title="Produto não encontrado"
        description="O produto pode ter sido removido ou o link está incorreto."
      />
    );
  }

  const isMine = currentUserId != null && product.created_by === currentUserId;
  const company = product.company;

  return (
    <div className={styles.page}>
      <Breadcrumb
        items={[
          { label: "Marketplace", to: "/marketplace" },
          { label: product.product },
        ]}
      />

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {currentImage ? (
              <img src={currentImage} alt={product.product} />
            ) : (
              <div className={styles.noImage}>
                <span>Sem imagem</span>
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className={styles.thumbs}>
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={activeImage === image ? styles.thumbActive : styles.thumb}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={getPublicUrl(image) ?? ""} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.badges}>
            <Badge variant={product.status === "active" ? "success" : "neutral"}>
              {product.status === "active" ? "Disponível" : "Indisponível"}
            </Badge>
            {product.is_free && <Badge variant="warning">Grátis</Badge>}
            {product.condition && (
              <Badge variant="secondary">{product.condition}</Badge>
            )}
            {product.negotiable && (
              <Badge variant="primary">Negociável</Badge>
            )}
          </div>

          <h1 className={styles.title}>{product.product}</h1>

          <div className={styles.price}>
            {product.is_free ? "Gratuito" : formatCurrency(product.price)}
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span>Quantidade</span>
              <strong>{formatQuantity(product.quantities, product.unit)}</strong>
            </div>
            {product.min_quantity != null && product.min_quantity > 0 && (
              <div className={styles.metaItem}>
                <span>Qtd. mínima</span>
                <strong>{formatQuantity(product.min_quantity, product.unit)}</strong>
              </div>
            )}
            {product.material_type && (
              <div className={styles.metaItem}>
                <span>Material</span>
                <strong>{product.material_type}</strong>
              </div>
            )}
            <div className={styles.metaItem}>
              <span>Estado</span>
              <strong>{product.state ?? "—"}</strong>
            </div>
            {product.views != null && (
              <div className={styles.metaItem}>
                <span>Visualizações</span>
                <strong>{product.views}</strong>
              </div>
            )}
          </div>

          {(product.city || product.state || product.cep || product.locationc) && (
            <div className={styles.location}>
              <FiMapPin />
              {[product.city, product.state].filter(Boolean).join(", ") ||
                product.locationc}
              {product.cep && <span>({product.cep})</span>}
            </div>
          )}

          {product.description && (
            <div className={styles.description}>
              <h2>Descrição</h2>
              <p>{product.description}</p>
            </div>
          )}

          {product.documents && product.documents.length > 0 && (
            <div className={styles.documents}>
              <h2><FiFile /> Documentos</h2>
              <div className={styles.docList}>
                {product.documents.map((doc) => {
                  const url = getPublicUrl(doc);
                  const name = doc.split("/").pop() ?? "Documento";
                  return url ? (
                    <a
                      key={doc}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.docLink}
                    >
                      <FiDownload /> {name}
                    </a>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {!isMine && product.status === "active" ? (
              <Button onClick={() => setNegotiateOpen(true)}>
                <FiBriefcase /> Enviar interesse
              </Button>
            ) : null}

            {isMine && (
              <Button to={`/cadastrar-produto?edit=${encodeURIComponent(product.id)}`}>
                Editar produto
              </Button>
            )}

            <Button variant="outline" onClick={handleFavorite}>
              <FiHeart /> {isFavorite(product.id) ? "Favoritado" : "Favoritar"}
            </Button>

            <Button variant="ghost" onClick={handleShare}>
              <FiShare2 /> Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {company && (
        <Card className={styles.companyCard}>
          <Avatar
            src={company.logo_url}
            name={company.company_name}
            size="lg"
          />
          <div className={styles.companyInfo}>
            <h2 className={styles.companyName}>
              {company.company_name}
              {company.verified && <Badge variant="success">Verificada</Badge>}
            </h2>
            <StarRating value={company.rating} />
            <span className={styles.companyMeta}>
              {[company.city, company.state].filter(Boolean).join(", ") || "Localização não informada"}
            </span>
          </div>
          {!isMine && (
            <Button
              variant="secondary"
              onClick={handleStartChat}
              disabled={startingChat}
            >
              <FiMessageSquare /> {startingChat ? "Abrindo..." : "Conversar com a empresa"}
            </Button>
          )}
        </Card>
      )}

      {company && (
        <ReviewSection companyId={company.id} isOwnCompany={isMine} />
      )}

      {related.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Produtos relacionados</h2>
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <ProductCard key={item.id} product={item} showCompany />
            ))}
          </div>
        </section>
      )}

      {!isMine && (
        <NegotiationModal
          open={negotiateOpen}
          product={product}
          onClose={() => setNegotiateOpen(false)}
          onCreated={() => success("Interesse enviado!")}
        />
      )}
    </div>
  );
}
