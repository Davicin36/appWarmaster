import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import torneosSagaApi from '@/servicios/apiSaga';

import VistaJugadores from '@/componente/vistasAdministrarTorneos/VistaJugadores';
import VistaClasificacion from '@/componente/vistasAdministrarTorneos/VistaClasificacion';
import VistaEmparejamientos from '@/componente/vistasAdministrarTorneos/VistaEmparejamientos';
import VistaGeneral from '@/componente/vistasAdministrarTorneos/VistaGeneral';

import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const navigate = useNavigate();
    const { torneoId } = useParams();
    
    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [vistaActual, setVistaActual] = useState('general');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!torneoId) {
            setError('No se especificó un ID de torneo');
            setLoading(false);
            return;
        }
        cargarDatosTorneo();
    }, [torneoId]);

    const cargarDatosTorneo = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            
            // Cargar según tipo de torneo
            if (dataTorneo.tipo_torneo === 'Individual') {
                await cargarJugadores();
            } else if (dataTorneo.tipo_torneo === 'Por equipos') {
                await cargarEquipos();
                await cargarJugadores();
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setError(`Error al cargar los datos del torneo: ${error.message}`);
            setLoading(false);
        }
    };

    const cargarJugadores = async () => {
        try {
            const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
            setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
        } catch (err) {
            console.log('No hay jugadores todavía', err);
            setJugadores([]);
        }
    };

    const cargarEquipos = async () => {
        try {
            const dataEquipos = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
            setEquipos(Array.isArray(dataEquipos) ? dataEquipos : dataEquipos.data || []);
        } catch (err) {
            console.log('No hay equipos todavía', err);
            setEquipos([]);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-message">
                    ⏳ Cargando datos del torneo...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message-box">
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')} className="btn-secondary">
                        ⬅️ Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const esTorneoEquipos = torneo?.tipo_torneo === 'Por equipos';
    const totalJugadores = jugadores.length;
    const totalEquipos = equipos.length;

    return (
        <div className="administrar-torneo-container">
            <header className="torneo-header">
                <h1>⚔️ {torneo?.nombre_torneo || 'Torneo'}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge estado-${torneo?.estado || 'pendiente'}`}>
                        {(torneo?.estado || 'pendiente').toUpperCase()}
                    </span>
                    <span className="info-item">
                        {esTorneoEquipos ? '👥 Por Equipos' : '🎯 Individual'}
                    </span>
                </div>
            </header>

            <nav className="vista-nav">
                <button 
                    className={vistaActual === 'general' ? 'active' : ''} 
                    onClick={() => setVistaActual('general')}
                >
                    📊 General
                </button>
                <button 
                    className={vistaActual === 'jugadores' ? 'active' : ''} 
                    onClick={() => setVistaActual('jugadores')}
                >
                    {esTorneoEquipos ? '👥 Equipos' : '👥 Jugadores'}{' '}
                    ({esTorneoEquipos ? totalEquipos : totalJugadores})
                </button>
                <button 
                    className={vistaActual === 'emparejamientos' ? 'active' : ''} 
                    onClick={() => setVistaActual('emparejamientos')}
                >
                    🎲 Emparejamientos
                </button>
                <button 
                    className={vistaActual === 'clasificacion' ? 'active' : ''} 
                    onClick={() => setVistaActual('clasificacion')}
                >
                    🏆 Clasificación
                </button>
            </nav>

            <div className="contenido-principal">
                {vistaActual === 'general' && (
                    <VistaGeneral 
                        torneoId={torneoId} 
                        onUpdate={cargarDatosTorneo}
                        estadoTorneo={torneo?.estado}
                    />
                )}
                {vistaActual === 'jugadores' && (
                    <VistaJugadores 
                        torneoId={torneoId}
                        tipoTorneo={torneo?.tipo_torneo}
                        jugadores={jugadores}
                        equipos={equipos}
                        onUpdate={cargarDatosTorneo}
                    />
                )}
                {vistaActual === 'emparejamientos' && (
                    <VistaEmparejamientos 
                        torneoId={torneoId}
                        tipoTorneo={torneo?.tipo_torneo}
                    />
                )}
                {vistaActual === 'clasificacion' && (
                    <VistaClasificacion 
                        torneoId={torneoId}
                        tipoTorneo={torneo?.tipo_torneo}
                    />
                )}
            </div>

            <footer className="footer-controles">
                <button type="button" onClick={() => navigate('/')} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default AdministrarTorneo;