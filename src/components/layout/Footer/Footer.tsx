import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className={styles["footer-container"]}>
        <div className={styles["footer-brand"]}>
          <div className={styles["footer-logo"]}>
            <div className={styles["logo-mark"]}>R</div>

            <div className={styles["logo-text"]}>
              <span className={styles["logo-title"]}>
                Rejet Corp
              </span>

              <span className={styles["logo-subtitle"]}>
                Marketplace sustentável para empresas
              </span>
            </div>
          </div>

          <p>
            Plataforma B2B voltada à comercialização inteligente de restos
            produtivos, promovendo sustentabilidade, clareza operacional e
            economia circular.
          </p>
        </div>

        <div className={styles["footer-links"]}>
          <div className={styles["footer-column"]}>
            <h4>Navegação</h4>

            <a href="#">Início</a>
            <a href="#empresa">Empresa</a>
            <a href="#footer">Contato</a>
          </div>

          <div className={styles["footer-column"]}>
            <h4>Plataforma</h4>

            <a href="#">Empresas</a>
            <a href="#">Soluções</a>
            <a href="#">Suporte</a>
          </div>

          <div className={styles["footer-column"]}>
            <h4>Contato</h4>

            <a href="#">contato@rejet.com</a>
            <a href="#">Atendimento corporativo</a>
            <a href="#">Brasil</a>
          </div>
        </div>
      </div>

      <div className={styles["footer-bottom"]}>
        <p>
          © 2026 Rejet Corp. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}