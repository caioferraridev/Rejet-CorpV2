import styles from "./Highlight.module.css";

export default function Highlight() {
  return (
    <section className={styles["highlight-section"]}>
      <div className={styles["highlight-box"]}>
        <span className={styles["section-tag"]}>
          PROPÓSITO
        </span>

        <h2>
          Sustentabilidade com visão empresarial
        </h2>

        <p>
          Mais do que descartar corretamente, ajudamos empresas a transformar
          excedentes, resíduos e sobras em ativos negociáveis dentro de uma
          lógica moderna de mercado.
        </p>

        <button
          className={styles["highlight-btn"]}
          type="button"
        >
          Acessar plataforma
        </button>
      </div>
    </section>
  );
}