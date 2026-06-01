import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@/estilos/footer.css';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="main-footer">
      <div className="footer-content">
        <nav className="legal-links">
          <Link to="/aviso-legal">{t('footer.aviso_legal')}</Link>
          <Link to="/politica-privacidad">{t('footer.privacidad')}</Link>
          <Link to="/terminos-condiciones">{t('footer.terminos')}</Link>
          <Link to="/politica-cookies">{t('footer.cookies')}</Link>
          <Link to="/contacto">{t('footer.contacto')}</Link>
        </nav>
        <div className="footer-divider"></div>
        <p className="copyright">{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}