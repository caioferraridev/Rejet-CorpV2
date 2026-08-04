import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import styles from "./ProdutosPage.module.css";

import DashboardLayout from "../../components/layout/DashboardLayout/DashboardLayout";
import {
  deleteProduct,
  listProducts,
  type ProductItem,
} from "../../services/products/productService";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/400x250?text=Sem+imagem";

export default function ProdutosPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    listProducts(query)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos", error);
        alert("Erro ao buscar produtos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Erro ao excluir", error);
      alert("Erro ao excluir produto.");
    }
  }

  function handleEdit(id: string) {
    navigate("/cadastrar-produto?edit=" + encodeURIComponent(id));
  }

  return (
    <DashboardLayout active="produtos">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Catálogo de Produtos</h1>

          <Link to="/cadastrar-produto" className={styles.btnSuccess}>
            Cadastrar Produto
          </Link>
        </div>

        <div className={styles.searchArea}>
          <input
            id="searchInput"
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por produto, CEP ou local"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <p className={styles.status}>Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className={styles.status}>Nenhum produto encontrado.</p>
        ) : (
          <div className={styles.grid}>
            {products.map((item) => (
              <div className={styles.card} key={item.id}>
                <img
                  className={styles.cardImg}
                  src={item.image_name || PLACEHOLDER_IMAGE}
                  alt={item.product}
                />

                <div className={styles.cardBody}>
                  <h5 className={styles.cardTitle}>{item.product}</h5>

                  <p className={styles.cardText}>
                    {item.description || "Sem descrição"}
                  </p>

                  <p className={styles.cardText}>
                    <strong>Quantidade:</strong> {item.quantities}
                  </p>

                  <p className={styles.cardText}>
                    <strong>Preço:</strong> R$ {item.price}
                  </p>

                  <p className={styles.cardText}>
                    <strong>CEP:</strong> {item.cep}
                  </p>

                  <p className={styles.cardText}>
                    <strong>Local entrada:</strong> {item.locationc}
                  </p>

                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleDelete(item.id)}
                    >
                      Excluir
                    </button>

                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => handleEdit(item.id)}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
