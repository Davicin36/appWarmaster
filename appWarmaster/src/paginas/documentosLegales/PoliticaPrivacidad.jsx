import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { politicaPrivacidadContent } from '@/documentosLegales/politicaPrivacidad.js'
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function PoliticaPrivacidad() {

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Política de Privacidad - Gestiona Tus Torneos';

  }, []);

  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <ReactMarkdown>{politicaPrivacidadContent}</ReactMarkdown>
        </div>
      </div>
      <Footer />
    </>
  );
}