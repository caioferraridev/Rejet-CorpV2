import { useEffect, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import styles from "./ui.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export function Modal({ open, onClose, title, subtitle, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${size === "lg" ? styles.modalLg : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">
          <FiX />
        </button>

        {(title || subtitle) && (
          <div className={styles.modalHeader}>
            {title && <h2 className={styles.modalTitle}>{title}</h2>}
            {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
