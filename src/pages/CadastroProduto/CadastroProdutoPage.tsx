import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import styles from "./CadastroProdutoPage.module.css";

import DashboardLayout from "../../components/layout/DashboardLayout/DashboardLayout";
import {
  createProduct,
  getProduct,
  updateProduct,
} from "../../services/products/productService";

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

function formatQuantityFromDigits(rawDigits: string) {
  if (!rawDigits) return "";
  const n = Number(rawDigits);
  return (n / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatPriceFromDigits(rawDigits: string) {
  if (!rawDigits) return "";
  const n = Number(rawDigits);
  return (n / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CadastroProdutoPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [quantityRaw, setQuantityRaw] = useState("");
  const [quantityDisplay, setQuantityDisplay] = useState("");
  const [cep, setCep] = useState("");
  const [locationc, setLocationc] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [imageName, setImageName] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;

    getProduct(editId)
      .then((target) => {
        setProduct(target.product);
        setDescription(target.description ?? "");
        setQuantityDisplay(String(target.quantities ?? ""));
        setQuantityRaw(
          target.quantities != null
            ? String(Math.round(target.quantities * 1000))
            : ""
        );
        setCep(target.cep);
        setLocationc(target.locationc ?? "");
        setPriceDisplay(String(target.price ?? ""));
        setPriceRaw(
          target.price != null ? String(Math.round(target.price * 100)) : ""
        );
        setImageName(target.image_name);
      })
      .catch((error) => {
        console.error("Erro ao carregar produto", error);
        alert("Erro ao carregar produto.");
      });
  }, [editId]);

  function handleQuantityInput(value: string) {
    const raw = value.replace(/\D/g, "").slice(0, 12);
    setQuantityRaw(raw);
    setQuantityDisplay(raw);
  }

  function handleQuantityBlur() {
    setQuantityDisplay(formatQuantityFromDigits(quantityRaw));
  }

  function handlePriceInput(value: string) {
    const raw = value.replace(/\D/g, "").slice(0, 15);
    setPriceRaw(raw);
    setPriceDisplay(raw);
  }

  function handlePriceBlur() {
    setPriceDisplay(formatPriceFromDigits(priceRaw));
  }

  function resetForm() {
    setProduct("");
    setDescription("");
    setQuantityRaw("");
    setQuantityDisplay("");
    setCep("");
    setLocationc("");
    setPriceRaw("");
    setPriceDisplay("");
    setImageName(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const cepDigits = cep.replace(/\D/g, "");

    if (!product.trim()) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!cepDigits || !quantityRaw || !priceRaw) {
      alert("Preencha CEP, quantidade e valor corretamente.");
      return;
    }

    const quantities = parseInt(quantityRaw, 10) / 1000;
    const price = parseInt(priceRaw, 10) / 100;

    if (isNaN(quantities) || isNaN(price)) {
      alert("Preencha CEP, quantidade e valor corretamente.");
      return;
    }

    const payload = {
      product: product.trim(),
      description: description.trim(),
      quantities,
      cep: cepDigits,
      locationc: locationc.trim(),
      price,
      image_name: imageName,
    };

    try {
      if (editId) {
        await updateProduct(editId, payload);
        alert("Produto atualizado com sucesso!");
      } else {
        await createProduct(payload);
        alert("Produto cadastrado com sucesso!");
      }

      resetForm();
    } catch (error) {
      console.error("Erro no backend", error);
      alert("Falha no cadastro: " + String(error));
    }
  }

  return (
    <DashboardLayout active="cadastrar">
      <div className={styles.pageHeader}>
        <div>
          <h1>Rejec Corp</h1>
          <p>Plataforma de economia circular empresarial</p>
        </div>
      </div>

      <div className={styles.productCard}>
        <h2>{editId ? "Editar Produto" : "Cadastrar Produto"}</h2>

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <div>
            <label className={styles.label}>Produto</label>
            <input
              type="text"
              className={styles.input}
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              required
            />
          </div>

          <div className={styles.full}>
            <label className={styles.label}>Descrição</label>
            <textarea
              className={styles.input}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <label className={styles.label}>Quantidade (kg)</label>
            <input
              type="text"
              className={styles.input}
              value={quantityDisplay}
              onChange={(event) => handleQuantityInput(event.target.value)}
              onFocus={() => setQuantityDisplay(quantityRaw)}
              onBlur={handleQuantityBlur}
            />
          </div>

          <div>
            <label className={styles.label}>CEP</label>
            <input
              type="text"
              className={styles.input}
              maxLength={9}
              value={cep}
              onChange={(event) => setCep(formatCEP(event.target.value))}
              required
            />
          </div>

          <div>
            <label className={styles.label}>Local de coleta</label>
            <input
              type="text"
              className={styles.input}
              value={locationc}
              onChange={(event) => setLocationc(event.target.value)}
            />
          </div>

          <div>
            <label className={styles.label}>Valor (R$)</label>
            <input
              type="text"
              className={styles.input}
              value={priceDisplay}
              onChange={(event) => handlePriceInput(event.target.value)}
              onFocus={() => setPriceDisplay(priceRaw)}
              onBlur={handlePriceBlur}
            />
          </div>

          <div>
            <label className={styles.label}>Imagem</label>
            <input
              type="file"
              className={styles.input}
              onChange={(event) =>
                setImageName(event.target.files?.[0]?.name ?? null)
              }
            />
          </div>

          <div className={styles.full}>
            <button type="submit" className={styles.btnSuccess}>
              {editId ? "Atualizar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
