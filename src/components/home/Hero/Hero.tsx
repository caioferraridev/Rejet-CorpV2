import styles from "./Hero.module.css";

import LoginCard from "../../auth/LoginCard";

import { FiCheckCircle } from "react-icons/fi";

interface HeroProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Hero({
  onLogin,
  onRegister,
}: HeroProps) {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span>🌱</span>
          <span>Plataforma sustentável para empresas</span>
        </div>

        <h1>
          Transformamos resíduos empresariais em oportunidades de negócio
        </h1>

        <p>
          A Rejec Corp é uma plataforma marketplace voltada exclusivamente para
          empresas, conectando organizações que desejam vender, reaproveitar e
          dar destino inteligente aos seus restos produtivos com mais controle,
          clareza e sustentabilidade.
        </p>

        <div className={styles.heroPoints}>
          <div className={styles.heroPoint}>
            <FiCheckCircle />
            <span>Foco em economia circular</span>
          </div>

          <div className={styles.heroPoint}>
            <FiCheckCircle />
            <span>Negociação entre empresas</span>
          </div>

          <div className={styles.heroPoint}>
            <FiCheckCircle />
            <span>Gestão mais sustentável de descartes</span>
          </div>
        </div>
      </div>

      <LoginCard
        onLogin={onLogin}
        onRegister={onRegister}
      />
    </section>
  );
}