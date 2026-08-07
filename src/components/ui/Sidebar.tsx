import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { FiLogOut } from "react-icons/fi";
import styles from "./ui.module.css";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";

export interface SidebarItem {
  label: string;
  to?: string;
  icon?: ReactNode;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
  section?: string;
}

interface SidebarProps {
  brand: { title: string; subtitle: string };
  items: SidebarItem[];
  open: boolean;
  onClose: () => void;
  user?: { name?: string | null; email?: string | null; logo?: string | null } | null;
  onLogout?: () => void;
  footer?: ReactNode;
}

export function Sidebar({ brand, items, open, onClose, user, onLogout, footer }: SidebarProps) {
  let lastSection: string | undefined;

  const renderedItems = items.map((item, index) => {
    const sectionChanged = item.section !== undefined && item.section !== lastSection;
    if (item.section !== undefined) lastSection = item.section;

    return (
      <div key={index}>
        {sectionChanged && <span className={styles.sidebarCategory}>{item.section}</span>}

        {item.to ? (
          <Link
            to={item.to}
            onClick={onClose}
            className={`${styles.sidebarLink} ${item.active ? styles.sidebarLinkActive : ""}`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge ? (
              <span className={`${styles.badge} ${styles.badgeDanger} ${styles.sidebarBadge}`}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              item.onClick?.();
              onClose();
            }}
            className={`${styles.sidebarLink} ${item.active ? styles.sidebarLinkActive : ""}`}
            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge ? <Badge variant="danger">{item.badge}</Badge> : null}
          </button>
        )}
      </div>
    );
  });

  return (
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarHeader}>
        <Link to="/dashboard" className={styles.logoMark} onClick={onClose}>
          R
        </Link>
        <div>
          <div className={styles.logoTitle}>{brand.title}</div>
          <div className={styles.logoSubtitle}>{brand.subtitle}</div>
        </div>
      </div>

      <nav className={styles.sidebarNav}>{renderedItems}</nav>

      {footer && <div className={styles.sidebarFooter}>{footer}</div>}

      {user && (
        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <Avatar src={user.logo} name={user.name} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className={styles.sidebarUserName}>{user.name ?? "Empresa"}</div>
              <div className={styles.sidebarUserEmail}>{user.email ?? ""}</div>
            </div>
          </div>
          {onLogout && (
            <button
              className={`${styles.sidebarLink} ${styles.sidebarUser}`}
              onClick={onLogout}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
            >
              <FiLogOut /> Sair da conta
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
