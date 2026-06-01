import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

import { politicaPrivacidadContent }    from '@/documentosLegales/politicaPrivacidad.js';
import { politicaPrivacidadContent_en } from '@/documentosLegales/politicaPrivacidad_en.js';

import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

export default function PoliticaPrivacidad() {
    const { i18n } = useTranslation();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = i18n.language === 'en'
            ? 'Privacy Policy - Gestiona Tus Torneos'
            : 'Política de Privacidad - Gestiona Tus Torneos';
    }, [i18n.language]);

    const contenido = i18n.language === 'en'
        ? politicaPrivacidadContent_en
        : politicaPrivacidadContent;

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