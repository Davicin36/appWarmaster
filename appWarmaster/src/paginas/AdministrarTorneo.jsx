import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import usuarioApi from "../servicios/apiUsuarios";

import torneosSagaApi from "@/servicios/apiSaga";
import torneosWarmasterApi from "@/servicios/apiWarmaster";
import torneosFowApi from "../servicios/apiFow";
import torneosEpicApi from "../servicios/apiEpic";
import torneosDraculaApi from "../servicios/apiDracula";

import VistaJugadores from '@/componente/vistasAdministrarTorneos/VistaJugadores';
import VistaClasificacion from '@/componente/vistasAdministrarTorneos/VistaClasificacion';
import VistaEmparejamientos from '@/componente/vistasAdministrarTorneos/VistaEmparejamientos';
import VistaGeneral from '@/componente/vistasAdministrarTorneos/VistaGeneral';
import VistaEnviarCorreos from '@/componente/vistasAdministrarTorneos/VistaEnviarCorreos';

import Footer from '@/paginas/Footer.jsx';
import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const { torneoId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [torneo, setTorneo] = useState(null);
    const [vistaActiva, setVistaActiva] = useState('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => { cargarTorneo(); }, [torneoId]);

    const cargarTorneo = async () => {
        try {
            setLoading(true);
            const { sistema } = await usuarioApi.obtenerSistema(torneoId);
            const APIS_POR_SISTEMA = {
                'SAGA':     torneosSagaApi,
                'WARMASTER':torneosWarmasterApi,
                'FOW':      torneosFowApi,
                'EPIC':     torneosEpicApi,
                'DRACULA':  torneosDraculaApi
            };
            const api = APIS_POR_SISTEMA[sistema];
            if (!api) throw new Error(`Sistema ${sistema} no soportado`);
            const response = await api.obtenerTorneo(torneoId);
            setTorneo(response.data?.torneo || response);
        } catch (error) {
            console.error('Error al cargar torneo:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-message">⏳ {t('adm_torneo.cargando')}</div>
        </div>
    );

    if (!torneo) return (
        <div className="error-container">
            <div className="error-message-box">
                <h2>⚠️ {t('adm_torneo.error_titulo')}</h2>
                <p>{t('adm_torneo.error_no_encontrado')}</p>
            </div>
        </div>
    );

    const tipoJuego = torneo.sistema;

    if (!tipoJuego) return (
        <div className="error-container">
            <div className="error-message-box">
                <h2>⚠️ {t('adm_torneo.error_config')}</h2>
                <p>{t('adm_torneo.error_sistema')}</p>
                <small>Torneo ID: {torneoId}</small>
            </div>
        </div>
    );

    return (
        <div className="administrar-torneo-container">
            <header className="torneo-header">
                <h1>{torneo.nombre_torneo}</h1>
                <div className="torneo-info">
                    <span className="info-item">⚔️ {tipoJuego}</span>
                    <span className={`estado-badge estado-${torneo.estado}`}>
                        {torneo.estado === 'pendiente'  && t('estado.pendiente')}
                        {torneo.estado === 'en_curso'   && t('estado.en_curso')}
                        {torneo.estado === 'finalizado' && t('estado.finalizado')}
                    </span>
                </div>
            </header>

            <nav className="vista-nav">
                <button className={vistaActiva === 'general'          ? 'active' : ''} onClick={() => setVistaActiva('general')}>
                    ℹ️ {t('adm_torneo.nav_general')}
                </button>
                <button className={vistaActiva === 'correos'          ? 'active' : ''} onClick={() => setVistaActiva('correos')}>
                    📧 {t('adm_torneo.nav_correos')}
                </button>
                <button className={vistaActiva === 'jugadores'        ? 'active' : ''} onClick={() => setVistaActiva('jugadores')}>
                    {torneo.tipo_torneo === 'Por equipos'
                        ? `👥 ${t('adm_torneo.nav_equipos')}`
                        : `👤 ${t('adm_torneo.nav_jugadores')}`
                    }
                </button>
                <button className={vistaActiva === 'emparejamientos'  ? 'active' : ''} onClick={() => setVistaActiva('emparejamientos')}>
                    🎯 {t('adm_torneo.nav_emparejamientos')}
                </button>
                <button className={vistaActiva === 'clasificacion'    ? 'active' : ''} onClick={() => setVistaActiva('clasificacion')}>
                    🏆 {t('adm_torneo.nav_clasificacion')}
                </button>
            </nav>

            <main className="contenido-principal">
                {vistaActiva === 'general' && (
                    <VistaGeneral tipoJuego={tipoJuego} torneoId={torneoId} onUpdate={cargarTorneo} />
                )}
                {vistaActiva === 'correos' && (
                    <VistaEnviarCorreos tipoJuego={tipoJuego} torneoId={torneoId} torneo={torneo} />
                )}
                {vistaActiva === 'jugadores' && (
                    <VistaJugadores tipoJuego={tipoJuego} torneoId={torneoId} torneo={torneo} tipoTorneo={torneo.tipo_torneo} onUpdate={cargarTorneo} />
                )}
                {vistaActiva === 'emparejamientos' && (
                    <VistaEmparejamientos tipoJuego={tipoJuego} torneoId={torneoId} torneo={torneo} onUpdate={cargarTorneo} />
                )}
                {vistaActiva === 'clasificacion' && (
                    <VistaClasificacion tipoJuego={tipoJuego} torneoId={torneoId} torneo={torneo} />
                )}
            </main>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate('/')} className="btn-atras">
                    ⬅️ {t('adm_torneo.volver_inicio')}
                </button>
            </footer>
            <Footer />
        </div>
    );
}

export default AdministrarTorneo;