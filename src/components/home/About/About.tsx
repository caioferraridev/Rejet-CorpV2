import {
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";

import styles from "./About.module.css";

export default function About() {
  return (
    <section
      className={styles["about-section"]}
      id="empresa"
    >
      <div className={styles["section-header"]}>
        <span className={styles["section-tag"]}>
          SOBRE A EMPRESA
        </span>

        <h2>
          Uma solução limpa, objetiva e voltada para impacto real
        </h2>

        <p>
          Nossa proposta é ajudar empresas a enxergarem valor onde antes havia
          apenas descarte. Atuamos como ponte entre geração de resíduos e
          reaproveitamento inteligente, promovendo sustentabilidade, redução de
          desperdício e novas possibilidades de comercialização.
        </p>
      </div>

      <div className={styles["about-grid"]}>
        <article className={styles["about-card"]}>
          <FiRefreshCw />

          <h3>Economia circular</h3>

          <p>
            Incentivamos o reaproveitamento de materiais e a circulação
            inteligente de recursos entre empresas.
          </p>
        </article>

        <article className={styles["about-card"]}>
          <FiShoppingBag />

          <h3>Marketplace B2B</h3>

          <p>
            A plataforma conecta empresas interessadas em vender ou adquirir
            restos produtivos com segurança e praticidade.
          </p>
        </article>

        <article className={styles["about-card"]}>
          <FiTrendingUp />

          <h3>Gestão sustentável</h3>

          <p>
            Organizamos o processo de direcionamento de descartes com foco em
            eficiência, responsabilidade ambiental e valor de negócio.
          </p>
        </article>
      </div>
    </section>
  );
}