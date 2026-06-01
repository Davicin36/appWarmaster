import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

import { politicaCokiesContent }    from '@/documentosLegales/politicaCokies.js';
import { politicaCokiesContent_en } from '@/documentosLegales/politicaCokies_en.js';

import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function PoliticaCookies() {
    const { i18n } = useTranslation();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = i18n.language === 'en'
            ? 'Cookie Policy - Gestiona Tus Torneos'
            : 'Política de Cookies - Gestiona Tus Torneos';
    }, [i18n.language]);

    const contenido = i18n.language === 'en'
        ? politicaCokiesContent_en
        : politicaCokiesContent;

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