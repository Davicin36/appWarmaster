import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

import { avisoLegalContent }    from '@/documentosLegales/avisoLegal.js';
import { avisoLegalContent_en } from '@/documentosLegales/avisoLegal_en.js';

import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function AvisoLegal() {
    const { i18n } = useTranslation();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = i18n.language === 'en'
            ? 'Legal Notice - Gestiona Tus Torneos'
            : 'Aviso Legal - Gestiona Tus Torneos';
    }, [i18n.language]);

    const contenido = i18n.language === 'en'
        ? avisoLegalContent_en
        : avisoLegalContent;

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