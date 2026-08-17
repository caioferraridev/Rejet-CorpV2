import { useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiEye, FiHeart, FiMapPin, FiTrash2 } from "react-icons/fi";

import styles from "./ProductCard.module.css";

import { getPublicUrl } from "../../../services/storage/storageService";
import { Badge, StarRating } from "../../ui";
import { formatCurrency, formatQuantity } from "../../../utils/format";
import type { Product, ProductStatus } from "../../../types/product";

const PRODUCT_STATUS: Record<
  ProductStatus,
  { label: string; variant: "success" | "neutral" | "danger" }
> = {
  active: { label: "Ativo", variant: "success" },
  inactive: { label: "Inativo", variant: "neutral" },
  sold: { label: "Vendido", variant: "danger" },
};

interface ProductCardProps {
  product: Product;
  showCompany?: boolean;
  showActions?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onFavorite?: (product: Product) => void;
  isFavorite?: boolean;
}

export default function ProductCard({
  product,
  showCompany = false,
  showActions = false,
  onEdit,
  onDelete,
  onFavorite,
  isFavorite = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const image = imageError ? null : getPublicUrl(product.main_image);
  const status = PRODUCT_STATUS[product.status] ?? PRODUCT_STATUS.active;
  const company = product.company;

  return (
    <article className={styles.card}>
      <Link to={`/produto/${product.id}`} className={styles.imageWrap}>
        {image ? (
          <img
            src={image}
            alt={product.product}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.placeholder}>
            <span>Sem imagem</span>
          </div>
        )}

        <span className={styles.views}>
          <FiEye /> {product.views ?? 0}
        </span>
      </Link>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <Badge variant={status.variant}>{status.label}</Badge>
          {product.is_free && <Badge variant="warning">Grátis</Badge>}
          {product.negotiable && <Badge variant="primary">Negociável</Badge>}
        </div>

        <Link to={`/produto/${product.id}`} className={styles.title}>
          {product.product}
        </Link>

        <div className={styles.meta}>
          <span className={styles.category}>
            {product.category ?? "Sem categoria"}
          </span>
          <span className={styles.quantity}>
            {formatQuantity(product.quantities, product.unit)}
          </span>
        </div>

        <div className={styles.price}>{formatCurrency(product.price)}</div>

        {(product.city || product.state || product.locationc) && (
          <span className={styles.location}>
            <FiMapPin />
            {[product.city, product.state].filter(Boolean).join(", ") ||
              product.locationc}
          </span>
        )}

        {showCompany && company && (
          <div className={styles.company}>
            <span className={styles.companyName}>
              {company.company_name}
              {company.verified && (
                <Badge variant="success" className={styles.verifiedBadge}>
                  ✓
                </Badge>
              )}
            </span>
            <StarRating value={company.rating} size="sm" />
          </div>
        )}

        <div className={styles.actions}>
          <Link to={`/produto/${product.id}`} className={styles.detailBtn}>
            Ver detalhes
          </Link>

          {showActions && onEdit && onDelete && (
            <div className={styles.actionIcons}>
              <button
                type="button"
                title="Editar"
                aria-label="Editar"
                onClick={() => onEdit(product)}
              >
                <FiEdit2 />
              </button>
              <button
                type="button"
                title="Excluir"
                aria-label="Excluir"
                className={styles.deleteBtn}
                onClick={() => onDelete(product)}
              >
                <FiTrash2 />
              </button>
            </div>
          )}

          {onFavorite && (
            <button
              type="button"
              title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-label="Favoritar"
              className={`${styles.favBtn} ${isFavorite ? styles.favActive : ""}`}
              onClick={() => onFavorite(product)}
            >
              <FiHeart />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
