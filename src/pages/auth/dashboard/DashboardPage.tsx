import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBarChart2,
  FiBriefcase,
  FiEye,
  FiHeart,
  FiMapPin,
  FiMessageSquare,
  FiPackage,
  FiPercent,
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
import { listNegotiations } from "../../../services/negotiations/negotiationService";
import { listUserActivities, getActivityLabel } from "../../../services/activity/activityService";
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
import type { Negotiation, NegotiationStatus } from "../../../types/negotiation";
import type { ActivityLog } from "../../../types/activity";

const STATUS_VARIANT: Record<NegotiationStatus, "primary" | "secondary" | "success" | "danger" | "neutral"> = {
  interesse: "secondary",
  em_negociacao: "primary",
  aceito: "success",
  recusado: "danger",
  cancelado: "danger",
  finalizado: "neutral",
};

const STATUS_LABEL: Record<NegotiationStatus, string> = {
  interesse: "Interesse",
  em_negociacao: "Em negociação",
  aceito: "Aceito",
  recusado: "Recusado",
  cancelado: "Cancelado",
  finalizado: "Finalizado",
};

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { notifications, unreadCount } = useNotifications();

  const companyId = profile?.id ?? user?.id ?? null;
  const currentUserId = companyId;

  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentNegotiations, setRecentNegotiations] = useState<Negotiation[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
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
      const [companyStats, myProducts, negotiations, userActivities] = await Promise.all([
        getCompanyStats(companyId),
        listMyProducts(companyId),
        listNegotiations(companyId),
        listUserActivities(companyId, 8),
      ]);
      setStats(companyStats);
      setProducts(myProducts);
      setRecentNegotiations(negotiations);
      setActivities(userActivities);
    } catch {
      setStats(null);
      setProducts([]);
      setRecentNegotiations([]);
      setActivities([]);
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

  const publishedCount = useMemo(
    () => products.filter((p) => p.status === "active" || p.status === "sold").length,
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

  const negotiationsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      interesse: 0,
      em_negociacao: 0,
      aceito: 0,
      recusado: 0,
      finalizado: 0,
    };
    recentNegotiations.forEach((n) => {
      counts[n.status] = (counts[n.status] ?? 0) + 1;
    });
    return counts;
  }, [recentNegotiations]);

  const profileCompleteness = useMemo(() => {
    if (!profile) return 0;
    const fields = [
      profile.company_name,
      profile.cnpj,
      profile.email,
      profile.phone,
      profile.city,
      profile.state,
      profile.segment,
      profile.description,
      profile.logo_url,
    ];
    const filled = fields.filter((f) => f && f.trim && f.trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === "active").slice(0, 5),
    [products]
  );

  if (loading) {
    return <Loader text="Carregando seu painel..." fullPage />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.greeting}>
            Olá, {profile?.company_name?.split(" ")[0] ?? "empresa"} 👋
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
            <FiPackage />
          </span>
          <div>
            <strong>{formatNumber(stats?.activeProducts)}</strong>
            <span>Produtos ativos</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FiShoppingBag />
          </span>
          <div>
            <strong>{formatNumber(publishedCount)}</strong>
            <span>Publicados</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconOrange}`}>
            <FiBriefcase />
          </span>
          <div>
            <strong>{formatNumber(stats?.pendingNegotiations)}</strong>
            <span>Em andamento</span>
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
            <strong>{formatNumber(stats?.totalViews ?? totalViews)}</strong>
            <span>Visualizações</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconRed}`}>
            <FiHeart />
          </span>
          <div>
            <strong>{formatNumber(stats?.favoritesReceived)}</strong>
            <span>Favoritos recebidos</span>
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

            <div className={styles.completeness}>
              <div className={styles.completenessHeader}>
                <FiPercent size={14} />
                <span>Perfil completo</span>
                <strong>{profileCompleteness}%</strong>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
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

          <Card title="Negociações por status">
            {recentNegotiations.length === 0 ? (
              <p className={styles.emptyText}>Sem negociações ainda.</p>
            ) : (
              <div className={styles.statusBars}>
                {(["interesse", "em_negociacao", "aceito", "finalizado", "recusado"] as NegotiationStatus[]).map(
                  (status) => {
                    const count = negotiationsByStatus[status] ?? 0;
                    const maxCount = Math.max(1, ...Object.values(negotiationsByStatus));
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={status} className={styles.statusBar}>
                        <div className={styles.statusBarLabel}>
                          <span>{STATUS_LABEL[status]}</span>
                          <strong>{count}</strong>
                        </div>
                        <div className={styles.statusBarTrack}>
                          <div
                            className={`${styles.statusBarFill} ${styles[`fill${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}
                            style={{ width: `${count > 0 ? pct : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
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
                <FiMessageSquare /> Mensagens
              </Link>
              <Link to="/relatorios" className={styles.shortcut}>
                <FiBarChart2 /> Relatórios
              </Link>
            </div>
          </Card>
        </div>

        <div className={styles.mainColumn}>
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

          <Card title="Negociações recentes">
            {recentNegotiations.length === 0 ? (
              <p className={styles.emptyText}>Nenhuma negociação ainda.</p>
            ) : (
              <ul className={styles.negoList}>
                {recentNegotiations.slice(0, 5).map((negotiation) => (
                  <li key={negotiation.id}>
                    <Link to={`/negociacoes/${negotiation.id}`} className={styles.negoItem}>
                      <Avatar
                        src={(currentUserId && negotiation.buyer_id === currentUserId
                          ? negotiation.seller?.logo_url
                          : negotiation.buyer?.logo_url) ?? null}
                        name={(currentUserId && negotiation.buyer_id === currentUserId
                          ? negotiation.seller?.company_name
                          : negotiation.buyer?.company_name) ?? "Empresa"}
                        size="sm"
                      />
                      <div className={styles.negoInfo}>
                        <div className={styles.negoTop}>
                          <strong>{negotiation.product?.product ?? "Produto"}</strong>
                          <Badge variant={STATUS_VARIANT[negotiation.status]}>
                            {STATUS_LABEL[negotiation.status]}
                          </Badge>
                        </div>
                        <span className={styles.negoMeta}>
                          {formatCurrency(negotiation.offered_price)} · {timeAgo(negotiation.updated_at)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {recentNegotiations.length > 0 && (
              <Link to="/negociacoes" className={styles.seeAll}>
                Ver todas as negociações
              </Link>
            )}
          </Card>

          <Card title="Atividades recentes">
            {activities.length === 0 ? (
              <p className={styles.emptyText}>Nenhuma atividade registrada.</p>
            ) : (
              <ul className={styles.activityList}>
                {activities.map((activity) => (
                  <li key={activity.id} className={styles.activityItem}>
                    <span className={styles.activityDot} />
                    <div className={styles.activityContent}>
                      <strong>{getActivityLabel(activity.action)}</strong>
                      {activity.details && (
                        <span className={styles.activityDetails}>{activity.details}</span>
                      )}
                      <span className={styles.activityTime}>
                        {timeAgo(activity.created_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
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

        <Card title="Meus produtos" className={styles.productsCard}>
          {publishedProducts.length === 0 ? (
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
              {publishedProducts.map((product) => (
                <li key={product.id} className={styles.productRow}>
                  <Link to={`/produto/${product.id}`} className={styles.productLink}>
                    <div className={styles.productThumb}>
                      {product.main_image ? (
                        <img
                          src={product.main_image}
                          alt={product.product}
                        />
                      ) : (
                        <FiPackage size={16} />
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <span className={styles.productName}>{product.product}</span>
                      <span className={styles.productMeta}>
                        {formatNumber(product.quantities)} {product.unit} · <FiEye size={11} /> {product.views ?? 0}
                      </span>
                    </div>
                  </Link>
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
          {products.length > 5 && (
            <Link to="/produtos" className={styles.seeAll}>
              Ver todos os produtos
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
