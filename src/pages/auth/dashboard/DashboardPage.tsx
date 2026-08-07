import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBarChart2,
  FiBriefcase,
  FiEye,
  FiMapPin,
  FiPlusCircle,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
  FiTruck,
  FiUser,
} from "react-icons/fi";

import styles from "./DashboardPage.module.css";

import { Avatar, Badge, Button, Card, Loader, StarRating } from "../../../components/ui";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { getCompanyStats } from "../../../services/companies/companyService";
import { listMyProducts } from "../../../services/products/productService";
import {
  formatCNPJ,
  formatCurrency,
  formatNumber,
  monthLabel,
  timeAgo,
} from "../../../utils/format";
import { NOTIFICATION_ICONS } from "../../../types/notification";
import type { CompanyStats } from "../../../types/company";
import type { Product } from "../../../types/product";

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  const companyId = profile?.id ?? user?.id ?? null;

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const refresh = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [companyStats, myProducts] = await Promise.all([
        getCompanyStats(companyId),
        listMyProducts(companyId),
      ]);
      setStats(companyStats);
      setProducts(myProducts);
    } catch {
      setStats(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalViews = useMemo(
    () => products.reduce((acc, product) => acc + (product.views ?? 0), 0),
    [products]
  );

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
      height: count === 0 ? 0 : Math.max(12, Math.round((count / max) * 100)),
    }));
  }, [products]);

  if (loading) {
    return <Loader text="Carregando seu painel..." fullPage />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.greeting}>
            Olá, {profile?.company_name ?? "empresa"} 👋
          </h1>
          <p className={styles.date}>{today}</p>
        </div>

        <Button to="/cadastrar-produto">
          <FiPlusCircle /> Cadastrar produto
        </Button>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconGreen}`}>
            <FiShoppingBag />
          </span>
          <div>
            <strong>{formatNumber(stats?.activeProducts)}</strong>
            <span>Produtos ativos</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FiBriefcase />
          </span>
          <div>
            <strong>{formatNumber(stats?.totalNegotiations)}</strong>
            <span>Negociações</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconGreen}`}>
            <FiTruck />
          </span>
          <div>
            <strong>{formatNumber(stats?.sales)}</strong>
            <span>Vendas</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FiShoppingCart />
          </span>
          <div>
            <strong>{formatNumber(stats?.purchases)}</strong>
            <span>Compras</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconYellow}`}>
            <FiStar />
          </span>
          <div>
            <strong>{Number(stats?.averageRating ?? 0).toFixed(1)}</strong>
            <span>Avaliação média</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FiEye />
          </span>
          <div>
            <strong>{formatNumber(totalViews)}</strong>
            <span>Visualizações</span>
          </div>
        </Card>
      </div>

      <div className={styles.columns}>
        <div className={styles.profileColumn}>
          <Card>
            <div className={styles.profileTop}>
              <Avatar
                src={profile?.logo_url ?? null}
                name={profile?.company_name ?? user?.email}
                size="xl"
              />
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>
                  {profile?.company_name ?? "Minha empresa"}
                  {profile?.verified && <Badge variant="success">Verificada</Badge>}
                </h2>
                {profile?.segment && (
                  <span className={styles.segment}>{profile.segment}</span>
                )}
                <StarRating value={profile?.rating} count={profile?.review_count} />
              </div>
            </div>

            <div className={styles.profileMeta}>
              {profile?.cnpj && (
                <span>
                  <FiBriefcase /> {formatCNPJ(profile.cnpj)}
                </span>
              )}
              {(profile?.city || profile?.state) && (
                <span>
                  <FiMapPin /> {[profile.city, profile.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            <div className={styles.profileActions}>
              <Button to="/perfil" variant="outline" size="sm">
                <FiUser /> Editar perfil
              </Button>
              <Button to="/marketplace" variant="ghost" size="sm">
                Ver marketplace
              </Button>
            </div>
          </Card>

          <Card title="Atalhos rápidos">
            <div className={styles.shortcuts}>
              <Link to="/cadastrar-produto" className={styles.shortcut}>
                <FiPlusCircle /> Cadastrar produto
              </Link>
              <Link to="/negociacoes" className={styles.shortcut}>
                <FiBriefcase /> Negociações
              </Link>
              <Link to="/mensagens" className={styles.shortcut}>
                <FiShoppingCart /> Mensagens
              </Link>
              <Link to="/relatorios" className={styles.shortcut}>
                <FiBarChart2 /> Relatórios
              </Link>
            </div>
          </Card>
        </div>

        <Card title="Notificações recentes" className={styles.notifCard}>
          {unreadCount > 0 && (
            <Link to="/notificacoes" className={styles.unreadLink}>
              Você tem {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </Link>
          )}

          {notifications.length === 0 ? (
            <p className={styles.emptyText}>Nenhuma notificação por aqui.</p>
          ) : (
            <ul className={styles.notifList}>
              {notifications.slice(0, 5).map((notification) => (
                <li key={notification.id}>
                  <span className={styles.notifIcon}>
                    {NOTIFICATION_ICONS[notification.type]}
                  </span>
                  <div className={styles.notifBody}>
                    <span className={styles.notifTitle}>{notification.title}</span>
                    {notification.message && (
                      <span className={styles.notifMsg}>{notification.message}</span>
                    )}
                    <span className={styles.notifTime}>
                      {timeAgo(notification.created_at)}
                    </span>
                  </div>
                  {!notification.read && <span className={styles.dot} />}
                </li>
              ))}
            </ul>
          )}

          <Link to="/notificacoes" className={styles.seeAll}>
            Ver todas as notificações
          </Link>
        </Card>
      </div>

      <div className={styles.lowerGrid}>
        <Card title="Produtos por mês">
          {products.length === 0 ? (
            <p className={styles.emptyText}>
              Cadastre seus primeiros produtos para ver o gráfico de atividades.
            </p>
          ) : (
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
          )}
        </Card>

        <Card
          title="Meus produtos"
          className={styles.productsCard}
        >
          {products.length === 0 ? (
            <div className={styles.emptyProducts}>
              <p className={styles.emptyText}>
                Você ainda não publicou nenhum produto.
              </p>
              <Button to="/cadastrar-produto" variant="outline" size="sm">
                <FiPlusCircle /> Publicar agora
              </Button>
            </div>
          ) : (
            <ul className={styles.productList}>
              {products.slice(0, 5).map((product) => (
                <li key={product.id} className={styles.productRow}>
                  <span className={styles.productName}>{product.product}</span>
                  <span className={styles.productQty}>
                    {formatNumber(product.quantities)} {product.unit}
                  </span>
                  <span className={styles.productPrice}>
                    {formatCurrency(product.price)}
                  </span>
                  <Badge
                    variant={
                      product.status === "active"
                        ? "success"
                        : product.status === "sold"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {product.status === "active"
                      ? "Ativo"
                      : product.status === "sold"
                        ? "Vendido"
                        : "Inativo"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
