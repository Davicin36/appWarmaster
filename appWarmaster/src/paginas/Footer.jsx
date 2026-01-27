import React from 'react';
import { Link } from 'react-router-dom';
import '@/estilos/footer.css';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <nav className="legal-links">
          <Link to="/aviso-legal">Aviso Legal</Link>
          <Link to="/politica-privacidad">Política de Privacidad</Link>
          <Link to="/terminos-condiciones">Términos y Condiciones</Link>
          <Link to="/politica-cookies">Política de Cokies</Link>
        </nav>
        <div className="footer-divider"></div>
        <p className="copyright">© 2026 Gestiona Tus Torneos - David Álvarez Roca</p>
      </div>
    </footer>
  );
}