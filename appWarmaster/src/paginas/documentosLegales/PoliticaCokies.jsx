import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { politicaCokiesContent } from '@/documentosLegales/politicaCokies.js'
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function PoliticaCookies() {

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Política de Cookies - Gestiona Tus Torneos';

  }, []);

  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <ReactMarkdown>{politicaCokiesContent}</ReactMarkdown>
        </div>
      </div>
      <Footer />
    </>
  );
}