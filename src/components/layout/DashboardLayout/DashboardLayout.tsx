import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiHome,
  FiSearch,
  FiPlusCircle,
  FiShoppingBag,
  FiShoppingCart,
  FiDollarSign,
  FiStar,
  FiUser,
  FiSettings,
} from "react-icons/fi";

import styles from "./DashboardLayout.module.css";

import Footer from "../Footer";
import { signOut } from "../../../services/auth/authService";

interface DashboardLayoutProps {
  children: ReactNode;
  active?: "inicio" | "produtos" | "cadastrar";
}

export default function DashboardLayout({
  children,
  active,
}: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    if (!search.trim()) {
      alert("Digite algo para pesquisar.");
      return;
    }

    alert("Você pesquisou por: " + search.trim());
  }

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.menuIcon} ${menuOpen ? styles.open : ""}`}
        onClick={() => setMenuOpen((value) => !value)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/dashboard" className={styles.navLogo}>
            <div className={styles.logoMark}>R</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Rejec Corp</span>
              <span className={styles.logoSubtitle}>Economia Circular B2B</span>
            </div>
          </Link>

          <nav className={styles.navMenu}>
            <Link
              to="/dashboard"
              className={`${styles.navLink} ${active === "inicio" ? styles.active : ""}`}
            >
              <FiHome /> Início
            </Link>

            <Link
              to="/produtos"
              className={`${styles.navLink} ${active === "produtos" ? styles.active : ""}`}
            >
              <FiShoppingBag /> Produtos
            </Link>

            <Link
              to="/cadastrar-produto"
              className={`${styles.navLink} ${active === "cadastrar" ? styles.active : ""}`}
            >
              <FiPlusCircle /> Cadastrar
            </Link>
          </nav>

          <form
            className={styles.navSearch}
            onSubmit={handleSearch}
          >
            <input
              type="search"
              placeholder="Pesquisar..."
              aria-label="Pesquisar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" className={styles.navSearchBtn} aria-label="Buscar">
              <FiSearch />
            </button>
          </form>

          <div className={styles.navActions}>
            <Link to="/" className={styles.navBtnOutline}>
              Login
            </Link>

            <button
              className={styles.navBtn}
              type="button"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`${styles.menu} ${menuOpen ? styles.open : ""}`}
      >
        <Link to="/produtos" className={styles.categoria} onClick={closeMenu}>
          Produtos
        </Link>

        <Link to="/produtos" className={styles.submenu} onClick={closeMenu}>
          <FiDollarSign /> Produtos para Vendas
        </Link>

        <Link to="/produtos" className={styles.submenu} onClick={closeMenu}>
          <FiShoppingCart /> Produtos para Compras
        </Link>

        <span className={styles.categoria}>Destaques</span>

        <Link to="#" className={styles.submenu} onClick={closeMenu}>
          <FiStar /> Melhores avaliados
        </Link>

        <Link to="#" className={styles.submenu} onClick={closeMenu}>
          <FiShoppingBag /> Maior número de vendas
        </Link>

        <Link to="#" className={styles.submenu} onClick={closeMenu}>
          <FiSearch /> Mais procurados
        </Link>

        <span className={styles.categoria}>Ajuda</span>

        <Link to="/" className={styles.submenu} onClick={closeMenu}>
          <FiUser /> Conta
        </Link>

        <Link to="/config" className={styles.submenu} onClick={closeMenu}>
          <FiSettings /> Configurações
        </Link>
      </aside>

      {children}

      <Footer />
    </>
  );
}
