import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { avisoLegalContent } from '@/documentosLegales/avisoLegal.js'
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function AvisoLegal() {

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Aviso Legal - Gestiona Tus Torneos';

  }, []);

  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <ReactMarkdown>{avisoLegalContent}</ReactMarkdown>
        </div>
      </div>
      <Footer />
    </>
  );
}