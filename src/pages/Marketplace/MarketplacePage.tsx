import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter, FiSearch } from "react-icons/fi";

import styles from "./MarketplacePage.module.css";

import { Button, EmptyState, Input, Loader, Pagination, Select } from "../../components/ui";
import ProductCard from "../../components/product/ProductCard/ProductCard";
import { useProducts } from "../../hooks/useProducts";
import { useFavorites } from "../../hooks/useFavorites";
import { listCategories } from "../../services/categories/categoryService";
import { useToast } from "../../components/ui/Toast";
import { MATERIAL_TYPES, PRODUCT_CONDITIONS } from "../../types/product";
import { useAuth } from "../../contexts/AuthContext";
import type { Category } from "../../types/category";
import type { Product, ProductFilters } from "../../types/product";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export default function MarketplacePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { profile, user } = useAuth();
  const currentUserId = profile?.id ?? user?.id ?? null;
  const { isFavorite, toggle } = useFavorites();
  const { success, error } = useToast();

  const [filters, setFilters] = useState({
    query: initialQuery,
    category: "",
    material_type: "",
    state: "",
    condition: "",
    is_free: false,
    min_price: "",
    max_price: "",
    sort: "recent" as ProductFilters["sort"],
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const queryFilters = useMemo(
    () => ({
      query: filters.query || undefined,
      category: filters.category || undefined,
      material_type: filters.material_type || undefined,
      state: filters.state || undefined,
      condition: filters.condition || undefined,
      is_free: filters.is_free || undefined,
      min_price: filters.min_price ? Number(filters.min_price) : undefined,
      max_price: filters.max_price ? Number(filters.max_price) : undefined,
      sort: filters.sort,
      page,
      pageSize,
      only_available: true,
    }),
    [filters, page, pageSize]
  );

  const { items, total, totalPages, loading } = useProducts(queryFilters);

  function updateFilter(key: keyof typeof filters, value: string | boolean) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  const hasActiveFilters = useMemo(
    () =>
      filters.query !== "" ||
      filters.category !== "" ||
      filters.material_type !== "" ||
      filters.state !== "" ||
      filters.condition !== "" ||
      filters.is_free ||
      filters.min_price !== "" ||
      filters.max_price !== "",
    [filters]
  );

  function resetFilters() {
    setFilters({
      query: "",
      category: "",
      material_type: "",
      state: "",
      condition: "",
      is_free: false,
      min_price: "",
      max_price: "",
      sort: "recent",
    });
    setPage(1);
  }

  async function handleFavorite(product: Product) {
    if (!currentUserId) {
      error("Faça login para salvar favoritos.");
      return;
    }
    try {
      const nowFavorite = await toggle(product.id);
      success(nowFavorite ? "Adicionado aos favoritos." : "Removido dos favoritos.");
    } catch {
      error("Falha ao atualizar favorito.");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Marketplace</h1>
          <p className={styles.subtitle}>
            {total} produto{total !== 1 ? "s" : ""} disponível{total !== 1 ? "is" : ""} para
            negociação
          </p>
        </div>

        <div className={styles.searchWrap}>
          <FiSearch />
          <input
            type="search"
            placeholder="Buscar por produto, local ou descrição..."
            value={filters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
            aria-label="Buscar produtos"
          />
        </div>
      </div>

      <div className={styles.filtersBar}>
        <Select
          name="category"
          placeholder="Categoria"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
          options={categories.map((category) => ({
            value: category.name,
            label: category.name,
          }))}
        />

        <Select
          name="material"
          placeholder="Material"
          value={filters.material_type}
          onChange={(event) => updateFilter("material_type", event.target.value)}
          options={MATERIAL_TYPES.map((material) => ({
            value: material,
            label: material,
          }))}
        />

        <Select
          name="state"
          placeholder="Estado"
          value={filters.state}
          onChange={(event) => updateFilter("state", event.target.value)}
          options={UFS.map((uf) => ({ value: uf, label: uf }))}
        />

        <Select
          name="condition"
          placeholder="Condição"
          value={filters.condition}
          onChange={(event) => updateFilter("condition", event.target.value)}
          options={PRODUCT_CONDITIONS.map((condition) => ({
            value: condition.value,
            label: condition.label,
          }))}
        />

        <Select
          name="sort"
          value={filters.sort}
          onChange={(event) => updateFilter("sort", event.target.value)}
          options={[
            { value: "recent", label: "Mais recentes" },
            { value: "popular", label: "Mais populares" },
            { value: "price_asc", label: "Menor preço" },
            { value: "price_desc", label: "Maior preço" },
          ]}
        />

        <Input
          name="min_price"
          type="number"
          min={0}
          placeholder="Preço mín."
          value={filters.min_price}
          onChange={(event) => updateFilter("min_price", event.target.value)}
        />

        <Input
          name="max_price"
          type="number"
          min={0}
          placeholder="Preço máx."
          value={filters.max_price}
          onChange={(event) => updateFilter("max_price", event.target.value)}
        />

        <label className={styles.freeFilter}>
          <input
            type="checkbox"
            checked={filters.is_free}
            onChange={(event) => updateFilter("is_free", event.target.checked)}
          />
          Grátis
        </label>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <FiFilter /> Limpar
          </Button>
        )}
      </div>

      {loading ? (
        <Loader text="Buscando produtos..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nenhum produto encontrado"
          description="Tente ajustar os filtros ou buscar por outro termo."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showCompany
              isFavorite={isFavorite(product.id)}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      )}

      <Pagination totalPages={totalPages} page={page} onChange={setPage} />
    </div>
  );
}
