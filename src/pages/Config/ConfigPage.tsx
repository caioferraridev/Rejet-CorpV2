import styles from "./ConfigPage.module.css";

export default function ConfigPage() {
  return (
    <>
      <img
        src="https://picsum.photos/id/1015/1920/1080"
        alt=""
        className={styles.bgSite}
      />
      <div className={styles.bgOverlay}></div>

      <div className={styles.container}>
        <div className={styles.sidebar}>
          <h2>⚙️ Config</h2>

          <button type="button" className={`${styles.menuBtn} ${styles.active}`}>
            Conta
          </button>

          <button type="button" className={styles.menuBtn}>
            Aparência
          </button>

          <button type="button" className={styles.menuBtn}>
            Notificações
          </button>

          <button type="button" className={styles.menuBtn}>
            Preferências
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h3>Conta</h3>
            <label>Nome</label>
            <input type="text" />
            <label>Email</label>
            <input type="email" />
          </div>

          <div className={styles.card}>
            <h3>Aparência</h3>
            <label>Tema</label>
            <select>
              <option>Claro</option>
              <option>Escuro</option>
            </select>

            <div className={styles.toggle}>
              <span>Modo escuro</span>
              <label className={styles.switch}>
                <input type="checkbox" />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Notificações</h3>
            <div className={styles.toggle}>
              <span>Ativar</span>
              <label className={styles.switch}>
                <input type="checkbox" />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Preferências</h3>
            <label>Idioma</label>
            <select>
              <option>Português</option>
              <option>English</option>
            </select>
          </div>

          <button type="button" className={styles.btn}>
            Salvar alterações
          </button>
        </div>
      </div>
    </>
  );
}
