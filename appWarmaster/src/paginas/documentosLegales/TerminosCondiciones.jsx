import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

import { terminosCondicionesContent }    from '@/documentosLegales/terminosCondiciones.js';
import { terminosCondicionesContent_en } from '@/documentosLegales/terminosCondiciones_en.js';

import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function TerminosCondiciones() {
    const { i18n } = useTranslation();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = i18n.language === 'en'
            ? 'Terms and Conditions - Gestiona Tus Torneos'
            : 'Términos y Condiciones - Gestiona Tus Torneos';
    }, [i18n.language]);

    const contenido = i18n.language === 'en'
        ? terminosCondicionesContent_en
        : terminosCondicionesContent;

    return (
        <>
            <div className="legal-page">
                <div className="legal-container">
                    <ReactMarkdown>{contenido}</ReactMarkdown>
                </div>
            </div>
            <Footer />
        </>
    );
}