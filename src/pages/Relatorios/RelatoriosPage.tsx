import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiDownload, FiPrinter } from "react-icons/fi";

import styles from "./RelatoriosPage.module.css";

import { Button, Card, Loader } from "../../components/ui";
import { getCompanyStats } from "../../services/companies/companyService";
import {
  getNegotiationStats,
  listNegotiations,
} from "../../services/negotiations/negotiationService";
import { listMyProducts } from "../../services/products/productService";
import { downloadCSV, printReport } from "../../services/exports/exportService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  monthLabel,
} from "../../utils/format";
import {
  NEGOTIATION_STATUS_LABELS,
  type NegotiationStats,
} from "../../types/negotiation";
import type { CompanyStats } from "../../types/company";
import type { Negotiation } from "../../types/negotiation";
import type { Product } from "../../types/product";

export default function RelatoriosPage() {
  const { profile, user } = useAuth();
  const companyId = profile?.id ?? user?.id ?? null;
  const { error } = useToast();

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [negStats, setNegStats] = useState<NegotiationStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  const reportRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [companyStats, negotiationStats, myProducts, myNegotiations] =
        await Promise.all([
          getCompanyStats(companyId),
          getNegotiationStats(companyId),
          listMyProducts(companyId),
          listNegotiations(companyId),
        ]);
      setStats(companyStats);
      setNegStats(negotiationStats);
      setProducts(myProducts);
      setNegotiations(myNegotiations);
    } catch {
      error("Falha ao carregar os dados do relatório.");
    } finally {
      setLoading(false);
    }
  }, [companyId, error]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const chart = useMemo(() => {
    const buckets = new Array(12).fill(0);
    products.forEach((product) => {
      const month = new Date(product.created_at).getMonth();
      if (!isNaN(month)) buckets[month] += 1;
    });
    const max = Math.max(1, ...buckets);
    return buckets.map((count, index) => ({
      label: monthLabel(index),
      count,
      height: count === 0 ? 0 : Math.max(10, Math.round((count / max) * 100)),
    }));
  }, [products]);

  function exportProducts() {
    downloadCSV("relatorio-produtos.csv", [
      "Produto",
      "Categoria",
      "Quantidade",
      "Unidade",
      "Preço",
      "Status",
      "Visualizações",
      "Data",
    ], products.map((product) => [
      product.product,
      product.category ?? "",
      product.quantities ?? "",
      product.unit ?? "",
      product.price ?? "",
      product.status,
      product.views ?? 0,
      formatDate(product.created_at),
    ]));
  }

  function exportNegotiations() {
    downloadCSV("relatorio-negociacoes.csv", [
      "Produto",
      "Comprador",
      "Vendedor",
      "Quantidade",
      "Preço oferecido",
      "Status",
      "Atualizado em",
    ], negotiations.map((negotiation) => [
      negotiation.product?.product ?? "",
      negotiation.buyer?.company_name ?? "",
      negotiation.seller?.company_name ?? "",
      negotiation.quantity ?? "",
      negotiation.offered_price ?? "",
      NEGOTIATION_STATUS_LABELS[negotiation.status],
      formatDate(negotiation.updated_at),
    ]));
  }

  if (loading) {
    return <Loader text="Gerando relatório..." fullPage />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Relatórios</h1>
          <p className={styles.subtitle}>
            Indicadores da sua empresa e exportação de dados.
          </p>
        </div>

        <div className={styles.exportActions}>
          <Button variant="outline" size="sm" onClick={exportProducts}>
            <FiDownload /> Produtos (CSV)
          </Button>
          <Button variant="outline" size="sm" onClick={exportNegotiations}>
            <FiDownload /> Negociações (CSV)
          </Button>
          <Button variant="ghost" size="sm" onClick={() => printReport("Relatório geral", reportRef.current)}>
            <FiPrinter /> Imprimir
          </Button>
        </div>
      </div>

      <div ref={reportRef} className={styles.report}>
        <section className={styles.period}>
          <h2>Período: todo o histórico</h2>
          <p>Emitido em {new Date().toLocaleString("pt-BR")}</p>
        </section>

        <div className={styles.statsGrid}>
          <Card className={styles.stat}>
            <strong>{formatNumber(stats?.products)}</strong>
            <span>Produtos publicados</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{formatNumber(stats?.activeProducts)}</strong>
            <span>Produtos ativos</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{formatNumber(negStats?.total)}</strong>
            <span>Negociações</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{formatNumber(negStats?.completed)}</strong>
            <span>Finalizadas</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{formatCurrency(negStats?.totalValue)}</strong>
            <span>Valor negociado</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{formatNumber(stats?.sales)}</strong>
            <span>Vendas</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{formatNumber(stats?.purchases)}</strong>
            <span>Compras</span>
          </Card>
          <Card className={styles.stat}>
            <strong>{Number(stats?.averageRating ?? 0).toFixed(1)}</strong>
            <span>Avaliação média</span>
          </Card>
        </div>

        <div className={styles.columns}>
          <Card title="Produtos publicados por mês" className={styles.chartCard}>
            <div className={styles.chart}>
              {chart.map((bar) => (
                <div key={bar.label} className={styles.chartCol}>
                  <div className={styles.barArea}>
                    <span className={styles.barValue}>{bar.count}</span>
                    <div className={styles.bar} style={{ height: `${bar.height}%` }} />
                  </div>
                  <span className={styles.barLabel}>{bar.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Negociações por status" className={styles.statusCard}>
            {negStats ? (
              <div className={styles.statusList}>
                {(Object.keys(negStats.byStatus) as (keyof typeof negStats.byStatus)[]).map(
                  (status) => (
                    <div key={status} className={styles.statusRow}>
                      <span className={styles.statusLabel}>
                        {NEGOTIATION_STATUS_LABELS[status]}
                      </span>
                      <span className={styles.statusValue}>
                        {negStats.byStatus[status]}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className={styles.emptyText}>Sem dados de negociação.</p>
            )}
          </Card>
        </div>

        <Card title="Últimas negociações">
          {negotiations.length === 0 ? (
            <p className={styles.emptyText}>Nenhuma negociação registrada.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Status</th>
                    <th>Quantidade</th>
                    <th>Preço</th>
                    <th>Atualizado em</th>
                  </tr>
                </thead>
                <tbody>
                  {negotiations.slice(0, 10).map((negotiation) => (
                    <tr key={negotiation.id}>
                      <td>{negotiation.product?.product ?? "—"}</td>
                      <td>
                        <span className={styles.statusPill}>
                          {NEGOTIATION_STATUS_LABELS[negotiation.status]}
                        </span>
                      </td>
                      <td>{negotiation.quantity ?? "—"}</td>
                      <td>{formatCurrency(negotiation.offered_price)}</td>
                      <td>{formatDate(negotiation.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
