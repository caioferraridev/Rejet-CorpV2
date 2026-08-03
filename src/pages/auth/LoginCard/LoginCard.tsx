import styles from "./LoginCard.module.css";

import { FiUser, FiLock } from "react-icons/fi";

export default function LoginCard() {
  return (
    <section className={styles.wrapper}>
      <form>
        <h2>Entrar na plataforma</h2>

        <p className={styles.subtitle}>
          Acesse o ambiente empresarial da Rejec Corp.
        </p>

        <div className={styles["input-box"]}>
          <input
            type="text"
            placeholder="Nome ou e-mail corporativo"
            required
          />

          <FiUser />
        </div>

        <div className={styles["input-box"]}>
          <input
            type="password"
            placeholder="Senha"
            required
          />

          <FiLock />
        </div>

        <div className={styles["remember-forgot"]}>
          <label>
            <input type="checkbox" />
            Lembrar-me
          </label>

          <a href="#">Recuperar senha</a>
        </div>

        <button className={styles.btn}>
          Entrar
        </button>

        <div className={styles["register-link"]}>
          <p>
            Ainda não tem conta?

            <a href="#">
              Registrar-se
            </a>
          </p>
        </div>
      </form>
    </section>
  );
}