import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles["nav-container"]}>
        <a href="#" className={styles["nav-logo"]}>
          <div className={styles["logo-mark"]}>R</div>

          <div className={styles["logo-text"]}>
            <span className={styles["logo-title"]}>
              Rejec Corp
            </span>

            <span className={styles["logo-subtitle"]}>
              Economia Circular B2B
            </span>
          </div>
        </a>

        <nav className={styles["nav-menu"]}>
          <a href="#" className={`${styles["nav-link"]} ${styles.active}`}>
            Início
          </a>

          <a href="#empresa" className={styles["nav-link"]}>
            Empresa
          </a>

          <a href="#footer" className={styles["nav-link"]}>
            Contato
          </a>
        </nav>

        <div className={styles["nav-actions"]}>
          <button
            className={styles["nav-btn-outline"]}
            type="button"
          >
            Registrar-se
          </button>

          <button
            className={styles["nav-btn"]}
            type="button"
          >
            Entrar
          </button>
        </div>
      </div>
    </header>
  );
}