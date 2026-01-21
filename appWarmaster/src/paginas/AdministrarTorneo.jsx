import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import torneosSagaApi from '@/servicios/apiSaga';

import VistaJugadores from '@/componente/vistasAdministrarTorneos/VistaJugadores';
import VistaClasificacion from '@/componente/vistasAdministrarTorneos/VistaClasificacion';
import VistaEmparejamientos from '@/componente/vistasAdministrarTorneos/VistaEmparejamientos';
import VistaGeneral from '@/componente/vistasAdministrarTorneos/VistaGeneral';
import VistaEnviarCorreos from '@/componente/vistasAdministrarTorneos/VistaEnviarCorreos';

import Footer from '@/paginas/Footer.jsx'

import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const { torneoId } = useParams();
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [vistaActiva, setVistaActiva] = useState('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarTorneo();
    }, [torneoId]);

    const cargarTorneo = async () => {
        try {
            setLoading(true);
            
            const response = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response;

            setTorneo(dataTorneo);
        } catch (error) {
            console.error('Error al cargar torneo:', error);
        } finally {
            setLoading(false);
        }
    };

    // CHECK 1: Loading
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-message">⏳ Cargando torneo...</div>
            </div>
        );
    }

    // CHECK 2: Torneo existe
    if (!torneo) {
        return (
            <div className="error-container">
                <div className="error-message-box">
                    <h2>⚠️ Error</h2>
                    <p>No se encontró el torneo</p>
                </div>
            </div>
        );
    }

    // CHECK 3: Sistema existe
    const tipoJuego = torneo.sistema;

    // CHECK 4: VALIDACIÓN EXTRA
    if (!tipoJuego) {
        return (
            <div className="error-container">
                <div className="error-message-box">
                    <h2>⚠️ Error de Configuración</h2>
                    <p>El torneo no tiene un sistema de juego definido</p>
                    <small>Torneo ID: {torneoId}</small>
                </div>
            </div>
        );
    }

    return (
        <div className="administrar-torneo-container">
            <header className="torneo-header">
                <h1>{torneo.nombre_torneo}</h1>
                <div className="torneo-info">
                    <span className="info-item">
                        ⚔️ {tipoJuego}
                    </span>
                    <span className={`estado-badge estado-${torneo.estado}`}>
                        {torneo.estado === 'pendiente' && '⏸️ Pendiente'}
                        {torneo.estado === 'en_curso' && '▶️ En Curso'}
                        {torneo.estado === 'finalizado' && '🏁 Finalizado'}
                    </span>
                </div>
            </header>

            <nav className="vista-nav">
                <button 
                    className={vistaActiva === 'general' ? 'active' : ''} 
                    onClick={() => setVistaActiva('general')}
                >
                    ℹ️ General
                </button>
                <button 
                    className={vistaActiva === 'correos' ? 'active' : ''} 
                    onClick={() => setVistaActiva('correos')}
                >
                    📧 Correos
                </button>
                <button 
                    className={vistaActiva === 'jugadores' ? 'active' : ''} 
                    onClick={() => setVistaActiva('jugadores')}
                >
                    {torneo.tipo_torneo === 'Por equipos' ? '👥 Equipos' : '👤 Jugadores'}
                </button>
                <button 
                    className={vistaActiva === 'emparejamientos' ? 'active' : ''} 
                    onClick={() => setVistaActiva('emparejamientos')}
                >
                    🎯 Emparejamientos
                </button>
                <button 
                    className={vistaActiva === 'clasificacion' ? 'active' : ''} 
                    onClick={() => setVistaActiva('clasificacion')}
                >
                    🏆 Clasificación
                </button>
            </nav>

            <main className="contenido-principal">
                {vistaActiva === 'general' && (
                    <VistaGeneral 
                        tipoJuego={tipoJuego}
                        torneoId={torneoId} 
                        onUpdate={cargarTorneo} 
                    />
                )}

                {vistaActiva === 'correos' && (
                    <VistaEnviarCorreos 
                        tipoJuego={tipoJuego}
                        torneoId={torneoId}
                        torneo={torneo}
                    />
                )}
        
                {vistaActiva === 'jugadores' && (
                    <VistaJugadores 
                        tipoJuego={tipoJuego}
                        torneoId={torneoId}
                        torneo={torneo}
                        tipoTorneo={torneo.tipo_torneo}
                        onUpdate={cargarTorneo} 
                    />
                )}
                
                {vistaActiva === 'emparejamientos' && (
                    <VistaEmparejamientos 
                        tipoJuego={tipoJuego}
                        torneoId={torneoId}
                        torneo={torneo}
                        onUpdate={cargarTorneo} 
                    />
                )}
                
                {vistaActiva === 'clasificacion' && (
                    <VistaClasificacion 
                        tipoJuego={tipoJuego}
                        torneoId={torneoId}
                        torneo={torneo}
                    />
                )}
            </main>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate('/')} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
            <Footer />
        </div>
    );
}

export default AdministrarTorneo;