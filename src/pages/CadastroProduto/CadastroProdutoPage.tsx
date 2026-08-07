import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import styles from "./CadastroProdutoPage.module.css";

import {
  Button,
  Checkbox,
  ImageUploader,
  Input,
  Select,
  Textarea,
} from "../../components/ui";
import { createProduct, getProduct, updateProduct } from "../../services/products/productService";
import { listCategories, listSubcategories } from "../../services/categories/categoryService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast";
import {
  MATERIAL_TYPES,
  PRODUCT_CONDITIONS,
  PRODUCT_UNITS,
} from "../../types/product";
import type { Category, Subcategory } from "../../types/category";

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

function formatNumberInput(value: string) {
  return value.replace(/[^\d.,]/g, "");
}

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function CadastroProdutoPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const { profile, user } = useAuth();
  const companyId = profile?.id ?? user?.id ?? null;
  const { success, error } = useToast();

  const [form, setForm] = useState({
    product: "",
    description: "",
    category: "",
    subcategory: "",
    material_type: "",
    condition: "",
    quantities: "",
    unit: "kg",
    price: "",
    is_free: false,
    has_pickup: true,
    has_delivery: false,
    cep: "",
    city: "",
    state: "",
    locationc: "",
    main_image: null as string | null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!form.category) {
      setSubcategories([]);
      return;
    }
    const category = categories.find((item) => item.name === form.category);
    if (!category) return;
    listSubcategories(category.id)
      .then(setSubcategories)
      .catch(() => setSubcategories([]));
  }, [form.category, categories]);

  useEffect(() => {
    if (!editId) return;

    getProduct(editId)
      .then((target) => {
        setForm({
          product: target.product,
          description: target.description ?? "",
          category: target.category ?? "",
          subcategory: target.subcategory ?? "",
          material_type: target.material_type ?? "",
          condition: target.condition ?? "",
          quantities: target.quantities != null ? String(target.quantities) : "",
          unit: target.unit ?? "kg",
          price: target.price != null ? String(target.price) : "",
          is_free: target.is_free,
          has_pickup: target.has_pickup,
          has_delivery: target.has_delivery,
          cep: target.cep ?? "",
          city: target.city ?? "",
          state: target.state ?? "",
          locationc: target.locationc ?? "",
          main_image: target.main_image,
        });
      })
      .catch(() => {
        error("Não foi possível carregar o produto para edição.");
      });
  }, [editId, error]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm({
      product: "",
      description: "",
      category: "",
      subcategory: "",
      material_type: "",
      condition: "",
      quantities: "",
      unit: "kg",
      price: "",
      is_free: false,
      has_pickup: true,
      has_delivery: false,
      cep: "",
      city: "",
      state: "",
      locationc: "",
      main_image: null,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.product.trim()) {
      error("Informe o nome do produto.");
      return;
    }

    if (!companyId) {
      error("Você precisa estar autenticado.");
      return;
    }

    if (!form.is_free && (!form.price || Number(form.price) < 0)) {
      error("Informe um preço válido.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product: form.product.trim(),
        description: form.description.trim() || undefined,
        category: form.category || undefined,
        subcategory: form.subcategory || undefined,
        material_type: form.material_type || undefined,
        condition: form.condition || undefined,
        quantities: form.quantities ? Number(form.quantities) : undefined,
        unit: form.unit,
        price: form.is_free ? 0 : Number(form.price) || undefined,
        is_free: form.is_free,
        has_pickup: form.has_pickup,
        has_delivery: form.has_delivery,
        cep: form.cep ? form.cep.replace(/\D/g, "") : undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        locationc: form.locationc || undefined,
        main_image: form.main_image,
        status: "active" as const,
      };

      if (editId) {
        await updateProduct(editId, payload);
        success("Produto atualizado com sucesso!");
      } else {
        await createProduct(payload);
        success("Produto cadastrado com sucesso!");
        resetForm();
      }
    } catch (err) {
      error(err instanceof Error ? err.message : "Falha ao salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {editId ? "Editar Produto" : "Cadastrar Produto"}
          </h1>
          <p className={styles.subtitle}>
            Preencha as informações do produto para publicá-lo no marketplace.
          </p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informações básicas</h2>

          <Input
            label="Nome do produto"
            name="product"
            required
            placeholder="Ex.: Sucata de alumínio"
            value={form.product}
            onChange={(event) => update("product", event.target.value)}
          />

          <Textarea
            label="Descrição"
            name="description"
            rows={4}
            placeholder="Descreva o material, quantidade, condições de entrega..."
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
          />

          <div className={styles.row}>
            <Select
              label="Categoria"
              name="category"
              placeholder="Selecione"
              value={form.category}
              onChange={(event) => {
                update("category", event.target.value);
                update("subcategory", "");
              }}
              options={categories.map((category) => ({
                value: category.name,
                label: category.name,
              }))}
            />

            {subcategories.length > 0 && (
              <Select
                label="Subcategoria"
                name="subcategory"
                placeholder="Selecione"
                value={form.subcategory}
                onChange={(event) => update("subcategory", event.target.value)}
                options={subcategories.map((item) => ({
                  value: item.name,
                  label: item.name,
                }))}
              />
            )}

            <Select
              label="Tipo de material"
              name="material_type"
              placeholder="Selecione"
              value={form.material_type}
              onChange={(event) => update("material_type", event.target.value)}
              options={MATERIAL_TYPES.map((material) => ({
                value: material,
                label: material,
              }))}
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Condição"
              name="condition"
              placeholder="Selecione"
              value={form.condition}
              onChange={(event) => update("condition", event.target.value)}
              options={PRODUCT_CONDITIONS.map((condition) => ({
                value: condition.value,
                label: condition.label,
              }))}
            />

            <Input
              label="Quantidade"
              name="quantities"
              type="number"
              min={0}
              step="any"
              placeholder="0"
              value={form.quantities}
              onChange={(event) => update("quantities", event.target.value)}
            />

            <Select
              label="Unidade"
              name="unit"
              value={form.unit}
              onChange={(event) => update("unit", event.target.value)}
              options={PRODUCT_UNITS.map((unit) => ({
                value: unit.value,
                label: unit.label,
              }))}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Preço e logística</h2>

          <div className={styles.row}>
            <Input
              label="Preço (R$)"
              name="price"
              type="number"
              min={0}
              step="any"
              placeholder="0,00"
              disabled={form.is_free}
              value={form.price}
              onChange={(event) => update("price", formatNumberInput(event.target.value))}
            />

            <label className={styles.freeCheck}>
              <Checkbox
                checked={form.is_free}
                onChange={(event) => update("is_free", event.target.checked)}
              />
              Produto gratuito
            </label>
          </div>

          <div className={styles.row}>
            <Input
              label="CEP"
              name="cep"
              maxLength={9}
              placeholder="00000-000"
              value={form.cep}
              onChange={(event) => update("cep", formatCEP(event.target.value))}
            />

            <Input
              label="Cidade"
              name="city"
              placeholder="São Paulo"
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
            />

            <Select
              label="Estado"
              name="state"
              placeholder="UF"
              value={form.state}
              onChange={(event) => update("state", event.target.value)}
              options={UFS.map((uf) => ({ value: uf, label: uf }))}
            />
          </div>

          <Input
            label="Local de coleta / retirada"
            name="locationc"
            placeholder="Ex.: Rua das Indústrias, 1000 — Distrito Industrial"
            value={form.locationc}
            onChange={(event) => update("locationc", event.target.value)}
          />

          <div className={styles.logistics}>
            <Checkbox
              checked={form.has_pickup}
              onChange={(event) => update("has_pickup", event.target.checked)}
              label="Aceito retirada no local"
            />
            <Checkbox
              checked={form.has_delivery}
              onChange={(event) => update("has_delivery", event.target.checked)}
              label="Ofereço entrega"
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Imagem do produto</h2>
          <ImageUploader
            label="Imagem principal"
            value={form.main_image}
            onChange={(image) => update("main_image", image)}
            hint="PNG, JPG ou WEBP até 5 MB."
          />
        </section>

        <div className={styles.footerActions}>
          <Button type="button" variant="ghost" onClick={resetForm}>
            Limpar formulário
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? "Salvando..."
              : editId
                ? "Atualizar produto"
                : "Publicar produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
