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
    <section className={styles["hero-section"]}>
      <div className={styles["hero-content"]}>
        <div className={styles["hero-badge"]}>
          <span>🌱</span>
          <span>Plataforma sustentável para empresas</span>
        </div>

        <h1>
          Transformamos resíduos empresariais em oportunidades de negócio
        </h1>

        <p>
          A Rejet Corp é uma plataforma marketplace voltada exclusivamente para
          empresas, conectando organizações que desejam vender, reaproveitar e
          dar destino inteligente aos seus restos produtivos com mais controle,
          clareza e sustentabilidade.
        </p>

        <div className={styles["hero-points"]}>
          <div className={styles["hero-point"]}>
            <FiCheckCircle />
            <span>Foco em economia circular</span>
          </div>

          <div className={styles["hero-point"]}>
            <FiCheckCircle />
            <span>Negociação entre empresas</span>
          </div>

          <div className={styles["hero-point"]}>
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
