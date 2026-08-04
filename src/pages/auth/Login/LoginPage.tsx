import { useState } from "react";

import Navbar from "../../../components/layout/Navbar";
import LandingLayout from "../../../components/layout/LandingLayout";
import Hero from "../../../components/home/Hero";
import About from "../../../components/home/About";
import Highlight from "../../../components/home/Highlight";
import Footer from "../../../components/layout/Footer";
import AuthModal from "../../../components/auth/AuthModal/AuthModal";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AuthMode>("login");

  function openModal(mode: AuthMode) {
    setModalMode(mode);
    setModalOpen(true);
  }

  return (
    <>
      <Navbar
        onRegister={() => openModal("register")}
        onLogin={() => openModal("login")}
      />

      <LandingLayout>
        <Hero
          onLogin={() => openModal("login")}
          onRegister={() => openModal("register")}
        />

        <About />

        <Highlight onLogin={() => openModal("login")} />
      </LandingLayout>

      <Footer />

      <AuthModal
        open={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
