import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { terminosCondicionesContent } from '@/documentosLegales/terminosCondiciones.js'
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function TerminosCondiciones() {

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Términos y Condiciones - Gestiona Tus Torneos';
  }, []);

  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <ReactMarkdown>{terminosCondicionesContent}</ReactMarkdown>
        </div>
      </div>
      <Footer />
    </>
  );
}