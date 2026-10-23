import "./Navbar.css";

interface NavbarProps {
  onLogin?: () => void;
  onRegister?: () => void;
}

export default function Navbar({
  onLogin,
  onRegister,
}: NavbarProps) {
  return (
    <header className="navbar">
      <div className="nav-container">

        <a href="/" className="nav-logo">

          <div className="logo-mark">
            R
          </div>

          <div className="logo-text">
            <span className="logo-title">
              Rejet Corp
            </span>

            <span className="logo-subtitle">
              Economia Circular B2B
            </span>
          </div>

        </a>

        <nav className="nav-menu">

          <a href="#" className="nav-link active">
            Início
          </a>

          <a href="#empresa" className="nav-link">
            Empresa
          </a>

          <a href="#footer" className="nav-link">
            Contato
          </a>

        </nav>

        <div className="nav-actions">

          <button
            className="nav-btn-outline"
            onClick={onRegister}
          >
            Registrar-se
          </button>

          <button
            className="nav-btn"
            onClick={onLogin}
          >
            Entrar
          </button>

        </div>

      </div>
    </header>
  );
}