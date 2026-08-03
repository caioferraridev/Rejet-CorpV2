import { useState } from "react";
import { FiUser, FiLock, FiMail, FiX } from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { HiOutlineDocumentText } from "react-icons/hi2";

import styles from "./AuthModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  const [isLogin, setIsLogin] = useState(true);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <button
          className={styles.close}
          onClick={onClose}
        >
          <FiX />
        </button>

        <div className={styles.header}>
          <span>ACESSO SEGURO</span>

          <h2>
            {isLogin ? "Entrar na plataforma" : "Registrar empresa"}
          </h2>

          <p>
            {isLogin
              ? "Use seu acesso corporativo para entrar no sistema."
              : "Cadastre sua empresa na Rejec Corp."}
          </p>
        </div>

        {isLogin ? (
          <form>

            <div className={styles.input}>
              <input
                type="email"
                placeholder="E-mail corporativo"
              />
              <FiUser />
            </div>

            <div className={styles.input}>
              <input
                type="password"
                placeholder="Senha"
              />
              <FiLock />
            </div>

            <button className={styles.button}>
              Entrar
            </button>

            <div className={styles.switch}>
              <p>

                Não possui conta?

                <span
                  onClick={() => setIsLogin(false)}
                >
                  Registrar-se
                </span>

              </p>
            </div>

          </form>
        ) : (
          <form>

            <div className={styles.input}>
              <input placeholder="Nome da empresa" />
              <BsBuildings />
            </div>

            <div className={styles.input}>
              <input placeholder="CNPJ" />
              <HiOutlineDocumentText />
            </div>

            <div className={styles.input}>
              <input placeholder="E-mail corporativo" />
              <FiMail />
            </div>

            <div className={styles.input}>
              <input
                type="password"
                placeholder="Senha"
              />
              <FiLock />
            </div>

            <button className={styles.button}>
              Registrar Empresa
            </button>

            <div className={styles.switch}>
              <p>

                Já possui conta?

                <span
                  onClick={() => setIsLogin(true)}
                >
                  Entrar
                </span>

              </p>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}