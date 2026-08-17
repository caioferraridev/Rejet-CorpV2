import { useEffect, useState, type FormEvent } from "react";
import {
  FiUser,
  FiLock,
  FiMail,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

import styles from "./AuthModal.module.css";

import { resetPassword, signIn, signUp } from "../../../services/auth/authService";
import { useToast } from "../../ui";
import { formatCNPJInput, isValidCNPJ } from "../../../utils/cnpj";

interface Props {
  open: boolean;
  onClose: () => void;
  mode?: "login" | "register";
}

type View = "login" | "register" | "forgot";

export default function AuthModal({ open, onClose, mode = "login" }: Props) {
  const { success, info } = useToast();

  const [view, setView] = useState<View>(mode === "register" ? "register" : "login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setView(mode === "register" ? "register" : "login");
      setFormError(null);
      setSent(false);
    }
  }, [open, mode]);

  if (!open) return null;

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!loginEmail || !loginPassword) {
      setFormError("Preencha e-mail e senha.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signInError } = await signIn(loginEmail, loginPassword);

      if (signInError) {
        setFormError(messageForError(signInError.message));
        return;
      }

      if (!data.user) {
        setFormError("Não foi possível autenticar. Tente novamente.");
        return;
      }

      success("Login realizado com sucesso!");
      onClose();
      setLoginEmail("");
      setLoginPassword("");
      navigate("/dashboard");
    } catch {
      setFormError("Erro inesperado ao fazer login. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const cnpjLimpo = cnpj.replace(/\D/g, "");

    if (!companyName.trim() || !cnpjLimpo || !registerEmail || !registerPassword) {
      setFormError("Preencha todos os campos.");
      return;
    }
    if (!isValidCNPJ(cnpjLimpo)) {
      setFormError("CNPJ inválido. Verifique os dígitos.");
      return;
    }
    if (registerPassword.length < 8) {
      setFormError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (registerPassword !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: signUpError, profileCreated } = await signUp({
        company_name: companyName.trim(),
        cnpj: cnpjLimpo,
        email: registerEmail,
        password: registerPassword,
      });

      if (signUpError) {
        setFormError(messageForError(signUpError.message));
        return;
      }

      if (profileCreated) {
        success("Cadastro realizado com sucesso!");
        setCompanyName("");
        setCnpj("");
        setRegisterEmail("");
        setRegisterPassword("");
        setConfirmPassword("");
        setView("login");
        onClose();
        navigate("/dashboard");
      } else {
        info("Cadastro criado! Verifique seu e-mail para confirmar e ativar a conta.");
      }
    } catch {
      setFormError("Erro inesperado ao registrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!forgotEmail) {
      setFormError("Informe seu e-mail corporativo.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: resetError } = await resetPassword(forgotEmail);
      if (resetError) {
        setFormError("Falha ao enviar o link: " + resetError.message);
        return;
      }
      setSent(true);
    } catch {
      setFormError("Erro inesperado ao enviar o link.");
    } finally {
      setSubmitting(false);
    }
  }

  function messageForError(raw: string) {
    const lower = raw.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }
    if (lower.includes("already registered")) {
      return "Este e-mail já está cadastrado.";
    }
    if (lower.includes("password should be")) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }
    if (lower.includes("rate limit") || lower.includes("too many")) {
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
    }
    if (lower.includes("email not confirmed")) {
      return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
    }
    if (lower.includes("user not found")) {
      return "Nenhuma conta encontrada para este e-mail.";
    }
    return raw;
  }

  function switchView(next: View) {
    setFormError(null);
    setSent(false);
    setView(next);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} type="button" aria-label="Fechar">
          <FiX />
        </button>

        <div className={styles.header}>
          <span>ACESSO SEGURO</span>

          <h2>
            {view === "login" && "Entrar na plataforma"}
            {view === "register" && "Registrar empresa"}
            {view === "forgot" && "Recuperar senha"}
          </h2>

          <p>
            {view === "login" && "Use seu acesso corporativo para entrar no sistema."}
            {view === "register" && "Cadastre sua empresa na Rejec Corp."}
            {view === "forgot" && "Enviaremos um link de redefinição para o seu e-mail."}
          </p>
        </div>

        {formError && (
          <div className={styles.formError} role="alert">
            <FiAlertCircle />
            <span>{formError}</span>
          </div>
        )}

        {view === "login" && (
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

            <button className={styles.button} disabled={submitting} type="submit">
              {submitting ? "Entrando..." : "Entrar"}
            </button>

            <div className={styles.forgot}>
              <span onClick={() => switchView("forgot")}>Esqueci minha senha</span>
            </div>

            <div className={styles.switch}>
              <p>
                Não possui conta?{" "}
                <span onClick={() => switchView("register")}>Registrar-se</span>
              </p>
            </div>
          </form>
        )}

        {view === "register" && (
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
                inputMode="numeric"
                value={cnpj}
                onChange={(event) => setCnpj(formatCNPJInput(event.target.value))}
              />
              <HiOutlineDocumentText />
            </div>

            <div className={styles.input}>
              <input
                type="email"
                placeholder="E-mail corporativo"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
              />
              <FiMail />
            </div>

            <div className={styles.input}>
              <input
                type="password"
                placeholder="Senha (mín. 8 caracteres)"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
              />
              <FiLock />
            </div>

            <div className={styles.input}>
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <FiLock />
            </div>

            <button className={styles.button} disabled={submitting} type="submit">
              {submitting ? "Registrando..." : "Registrar Empresa"}
            </button>

            <div className={styles.switch}>
              <p>
                Já possui conta?{" "}
                <span onClick={() => switchView("login")}>Entrar</span>
              </p>
            </div>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgot}>
            <div className={styles.input}>
              <input
                type="email"
                placeholder="E-mail corporativo"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
              />
              <FiMail />
            </div>

            {sent ? (
              <div className={styles.sentBox}>
                <FiCheckCircle />
                <span>
                  Link enviado! Verifique sua caixa de entrada (e o spam) para redefinir a senha.
                </span>
              </div>
            ) : (
              <button className={styles.button} disabled={submitting} type="submit">
                {submitting ? "Enviando..." : "Enviar link"}
              </button>
            )}

            <div className={styles.switch}>
              <p>
                Lembrou a senha?{" "}
                <span onClick={() => switchView("login")}>Entrar</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
