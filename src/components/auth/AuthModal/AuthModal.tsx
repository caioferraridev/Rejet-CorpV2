import { useEffect, useState, type FormEvent } from "react";
import { FiUser, FiLock, FiMail, FiX } from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

import styles from "./AuthModal.module.css";

import { signIn, signUp } from "../../../services/auth/authService";

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: "login" | "register";
}

export default function AuthModal({ open, onClose, mode = "login" }: Props) {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (open) setIsLogin(mode === "login");
  }, [open, mode]);

  if (!open) return null;

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        alert("Erro no login: " + error.message);
        return;
      }

      alert("Login realizado com sucesso!");
      onClose();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Erro inesperado ao fazer login.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();

    const cnpjLimpo = cnpj.replace(/\D/g, "");

    if (!companyName || !cnpjLimpo || !registerEmail || !registerPassword) {
      alert("Preencha todos os campos.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await signUp({
        company_name: companyName,
        cnpj: cnpjLimpo,
        email: registerEmail,
        password: registerPassword,
      });

      if (error) {
        alert("Erro no cadastro: " + error.message);
        return;
      }

      alert("Cadastro realizado com sucesso!");
      setCompanyName("");
      setCnpj("");
      setRegisterEmail("");
      setRegisterPassword("");
      setIsLogin(true);
    } catch (err) {
      console.error(err);
      alert("Erro inesperado ao registrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <button
          className={styles.close}
          onClick={onClose}
          type="button"
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
          <form onSubmit={handleLogin}>

            <div className={styles.input}>
              <input
                type="email"
                placeholder="E-mail corporativo"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
              <FiUser />
            </div>

            <div className={styles.input}>
              <input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
              <FiLock />
            </div>

            <button
              className={styles.button}
              disabled={submitting}
            >
              {submitting ? "Entrando..." : "Entrar"}
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
          <form onSubmit={handleRegister}>

            <div className={styles.input}>
              <input
                placeholder="Nome da empresa"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
              <BsBuildings />
            </div>

            <div className={styles.input}>
              <input
                placeholder="CNPJ"
                value={cnpj}
                onChange={(event) => setCnpj(event.target.value)}
              />
              <HiOutlineDocumentText />
            </div>

            <div className={styles.input}>
              <input
                placeholder="E-mail corporativo"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
              />
              <FiMail />
            </div>

            <div className={styles.input}>
              <input
                type="password"
                placeholder="Senha"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
              />
              <FiLock />
            </div>

            <button
              className={styles.button}
              disabled={submitting}
            >
              {submitting ? "Registrando..." : "Registrar Empresa"}
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
