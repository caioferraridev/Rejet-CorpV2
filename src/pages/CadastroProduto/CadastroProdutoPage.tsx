import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiImage, FiPlus, FiStar, FiTrash2, FiUpload } from "react-icons/fi";

import styles from "./CadastroProdutoPage.module.css";

import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea,
  useToast,
} from "../../components/ui";
import {
  createProduct,
  getProduct,
  updateProduct,
} from "../../services/products/productService";
import {
  getPublicUrl,
  removeFile,
  uploadFile,
} from "../../services/storage/storageService";
import { listCategories, listSubcategories } from "../../services/categories/categoryService";
import { useAuth } from "../../contexts/AuthContext";
import { MATERIAL_TYPES, PRODUCT_CONDITIONS, PRODUCT_UNITS } from "../../types/product";
import type { Category, Subcategory } from "../../types/category";
import { formatCEPInput, fetchCep } from "../../utils/viacep";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const schema = z
  .object({
    product: z.string().min(2, "Informe o nome do produto."),
    description: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    material_type: z.string().optional(),
    condition: z.string().optional(),
    quantities: z.string().optional(),
    unit: z.string().min(1, "Informe a unidade."),
    price: z.string().optional(),
    is_free: z.boolean(),
    negotiable: z.boolean(),
    min_quantity: z.string().optional(),
    has_pickup: z.boolean(),
    has_delivery: z.boolean(),
    cep: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    locationc: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.is_free) {
      const price = value.price === "" || value.price == null ? NaN : Number(value.price);
      if (isNaN(price) || price < 0) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Informe um preço válido." });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface ImageItem {
  id: string;
  path: string | null;
  url: string;
  uploading: boolean;
  error?: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CadastroProdutoPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [addingImages, setAddingImages] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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
      negotiable: false,
      min_quantity: "",
      has_pickup: true,
      has_delivery: false,
      cep: "",
      city: "",
      state: "",
      locationc: "",
    },
  });

  const isFree = watch("is_free");
  const categoryValue = watch("category");

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.name === categoryValue),
    [categories, categoryValue]
  );

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      return;
    }
    listSubcategories(selectedCategory.id)
      .then(setSubcategories)
      .catch(() => setSubcategories([]));
  }, [selectedCategory]);

  useEffect(() => {
    if (!editId) return;

    setLoadingEdit(true);
    getProduct(editId)
      .then((target) => {
        reset({
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
          negotiable: target.negotiable,
          min_quantity: target.min_quantity != null ? String(target.min_quantity) : "",
          has_pickup: target.has_pickup,
          has_delivery: target.has_delivery,
          cep: target.cep ? formatCEPInput(target.cep) : "",
          city: target.city ?? "",
          state: target.state ?? "",
          locationc: target.locationc ?? "",
        });

        const stored = [...(target.images ?? []), target.main_image ?? ""]
          .filter(Boolean)
          .filter((value, index, arr) => arr.indexOf(value) === index);

        setImages(
          stored.map((path) => ({
            id: uid(),
            path,
            url: getPublicUrl(path) ?? "",
            uploading: false,
          }))
        );
      })
      .catch(() => {
        error("Não foi possível carregar o produto para edição.");
      })
      .finally(() => setLoadingEdit(false));
  }, [editId, reset, error]);

  function addImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!userId) {
      error("Você precisa estar autenticado para enviar imagens.");
      return;
    }

    const items: ImageItem[] = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: uid(),
        path: null,
        url: URL.createObjectURL(file),
        uploading: true,
      }));

    if (items.length === 0) {
      error("Envie apenas arquivos de imagem.");
      return;
    }

    setImages((current) => [...current, ...items]);
    setAddingImages(true);

    items.forEach((item, index) => {
      const file = Array.from(files)[index];
      uploadFile(file, "images", userId)
        .then((path) => {
          setImages((current) =>
            current.map((entry) =>
              entry.id === item.id ? { ...entry, path, uploading: false } : entry
            )
          );
        })
        .catch(() => {
          setImages((current) =>
            current.map((entry) =>
              entry.id === item.id ? { ...entry, uploading: false, error: true } : entry
            )
          );
        })
        .finally(() => {
          setImages((current) => {
            if (current.every((entry) => !entry.uploading)) {
              setAddingImages(false);
            }
            return current;
          });
        });
    });
  }

  function removeImage(id: string) {
    const item = images.find((entry) => entry.id === id);
    if (!item) return;
    if (item.path && !item.url.startsWith("blob:")) {
      removeFile(item.path).catch(() => {
        /* arquivo órfão no storage; segue com a remoção local */
      });
    }
    setImages((current) => current.filter((entry) => entry.id !== id));
  }

  function setAsMain(id: string) {
    setImages((current) => {
      const target = current.find((entry) => entry.id === id);
      if (!target) return current;
      return [target, ...current.filter((entry) => entry.id !== id)];
    });
  }

  async function handleCepBlur() {
    const cep = watch("cep")?.replace(/\D/g, "");
    if (!cep || cep.length !== 8) return;
    const result = await fetchCep(cep);
    if (result) {
      setValue("city", result.city);
      setValue("state", result.state);
      info("Endereço preenchido automaticamente pelo CEP.");
    } else {
      error("CEP não encontrado. Preencha cidade e estado manualmente.");
    }
  }

  async function onSubmit(values: FormValues) {
    if (!userId) {
      error("Você precisa estar autenticado.");
      return;
    }

    const ready = images.filter((item) => item.path && !item.error);
    if (ready.length === 0) {
      error("Envie ao menos uma imagem do produto.");
      return;
    }
    if (images.some((item) => item.uploading)) {
      error("Aguarde o upload das imagens terminar.");
      return;
    }

    const paths = ready.map((item) => item.path as string);
    const payload = {
      product: values.product.trim(),
      description: values.description?.trim() || undefined,
      category: values.category || undefined,
      subcategory: values.subcategory || undefined,
      material_type: values.material_type || undefined,
      condition: values.condition || undefined,
      quantities: values.quantities ? Number(values.quantities) : undefined,
      unit: values.unit,
      price: values.is_free ? 0 : values.price ? Number(values.price) : undefined,
      is_free: values.is_free,
      negotiable: values.negotiable,
      min_quantity: values.min_quantity ? Number(values.min_quantity) : null,
      has_pickup: values.has_pickup,
      has_delivery: values.has_delivery,
      cep: values.cep ? values.cep.replace(/\D/g, "") : undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      locationc: values.locationc || undefined,
      main_image: paths[0],
      images: paths,
      status: "active" as const,
    };

    try {
      if (editId) {
        await updateProduct(editId, payload);
        success("Produto atualizado com sucesso!");
      } else {
        const created = await createProduct(payload);
        success("Produto cadastrado com sucesso!");
        navigate(`/produto/${created.id}`);
        return;
      }
      navigate(`/produto/${editId}`);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Falha ao salvar o produto.";
      error(msg);
    }
  }

  if (loadingEdit) {
    return <p className={styles.loadingText}>Carregando produto...</p>;
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

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informações básicas</h2>

          <Input
            label="Nome do produto"
            error={errors.product?.message}
            required
            placeholder="Ex.: Sucata de alumínio"
            {...register("product")}
          />

          <Textarea
            label="Descrição"
            error={errors.description?.message}
            rows={4}
            placeholder="Descreva o material, quantidade, condições de entrega..."
            {...register("description")}
          />

          <div className={styles.row}>
            <Select
              label="Categoria"
              placeholder="Selecione"
              error={errors.category?.message}
              {...register("category")}
              onChange={(event) => {
                setValue("category", event.target.value);
                setValue("subcategory", "");
              }}
              options={categories.map((category) => ({
                value: category.name,
                label: category.name,
              }))}
            />

            {subcategories.length > 0 && (
              <Select
                label="Subcategoria"
                placeholder="Selecione"
                error={errors.subcategory?.message}
                {...register("subcategory")}
                options={subcategories.map((item) => ({
                  value: item.name,
                  label: item.name,
                }))}
              />
            )}

            <Select
              label="Tipo de material"
              placeholder="Selecione"
              error={errors.material_type?.message}
              {...register("material_type")}
              options={MATERIAL_TYPES.map((material) => ({
                value: material,
                label: material,
              }))}
            />
          </div>

          <div className={styles.row}>
            <Select
              label="Condição"
              placeholder="Selecione"
              error={errors.condition?.message}
              {...register("condition")}
              options={PRODUCT_CONDITIONS.map((condition) => ({
                value: condition.value,
                label: condition.label,
              }))}
            />

            <Input
              label="Quantidade"
              type="number"
              min={0}
              step="any"
              placeholder="0"
              error={errors.quantities?.message}
              {...register("quantities")}
            />

            <Select
              label="Unidade"
              error={errors.unit?.message}
              {...register("unit")}
              options={PRODUCT_UNITS.map((unit) => ({
                value: unit.value,
                label: unit.label,
              }))}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Preço e negociação</h2>

          <div className={styles.row}>
            <Input
              label="Preço (R$)"
              type="number"
              min={0}
              step="any"
              placeholder="0,00"
              disabled={isFree}
              error={errors.price?.message}
              {...register("price")}
            />

            <Input
              label="Quantidade mínima por negociação"
              type="number"
              min={0}
              step="any"
              placeholder="Ex.: 10"
              error={errors.min_quantity?.message}
              {...register("min_quantity")}
            />
          </div>

          <div className={styles.logistics}>
            <Checkbox
              label="Produto gratuito (doação)"
              checked={isFree}
              onChange={(event) => setValue("is_free", event.target.checked)}
            />
            <Checkbox
              label="Aceito negociação de preço"
              checked={watch("negotiable")}
              onChange={(event) => setValue("negotiable", event.target.checked)}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Localização e logística</h2>

          <div className={styles.row}>
            <Input
              label="CEP"
              maxLength={9}
              placeholder="00000-000"
              error={errors.cep?.message}
              {...register("cep")}
              onChange={(event) => setValue("cep", formatCEPInput(event.target.value))}
              onBlur={() => void handleCepBlur()}
            />

            <Input
              label="Cidade"
              placeholder="São Paulo"
              error={errors.city?.message}
              {...register("city")}
            />

            <Select
              label="Estado"
              placeholder="UF"
              error={errors.state?.message}
              {...register("state")}
              options={UFS.map((uf) => ({ value: uf, label: uf }))}
            />
          </div>

          <Input
            label="Local de coleta / retirada"
            placeholder="Ex.: Rua das Indústrias, 1000 — Distrito Industrial"
            error={errors.locationc?.message}
            {...register("locationc")}
          />

          <div className={styles.logistics}>
            <Checkbox
              label="Aceito retirada no local"
              checked={watch("has_pickup")}
              onChange={(event) => setValue("has_pickup", event.target.checked)}
            />
            <Checkbox
              label="Ofereço entrega"
              checked={watch("has_delivery")}
              onChange={(event) => setValue("has_delivery", event.target.checked)}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Fotos do produto</h2>
          <p className={styles.uploadHint}>
            A primeira foto será a capa. Você pode adicionar várias imagens (PNG, JPG ou WEBP, até 5 MB cada).
          </p>

          <div className={styles.gallery}>
            {images.map((item, index) => (
              <div
                key={item.id}
                className={`${styles.galleryItem} ${item.uploading ? styles.galleryUploading : ""}`}
              >
                <img src={item.url} alt={`Produto ${index + 1}`} />
                {index === 0 && (
                  <span className={styles.mainBadge} title="Foto principal">
                    <FiStar /> Principal
                  </span>
                )}
                <div className={styles.galleryActions}>
                  {index !== 0 && !item.uploading && (
                    <button type="button" onClick={() => setAsMain(item.id)} title="Tornar principal">
                      <FiStar />
                    </button>
                  )}
                  {!item.uploading && (
                    <button type="button" onClick={() => removeImage(item.id)} title="Remover">
                      <FiTrash2 />
                    </button>
                  )}
                </div>
                {item.uploading && <span className={styles.uploadingLabel}>Enviando...</span>}
                {item.error && <span className={styles.errorLabel}>Falha no envio</span>}
              </div>
            ))}

            <label className={styles.addImage} title="Adicionar fotos">
              {addingImages ? <FiUpload /> : <FiPlus />}
              <span>{addingImages ? "Enviando..." : "Adicionar"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className={styles.hiddenInput}
                onChange={(event) => {
                  addImageFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {images.length === 0 && (
            <div className={styles.noImage}>
              <FiImage size={28} />
              <span>Nenhuma foto ainda. Adicione pelo menos uma imagem.</span>
            </div>
          )}
        </section>

        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              setImages([]);
            }}
          >
            Limpar formulário
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
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
