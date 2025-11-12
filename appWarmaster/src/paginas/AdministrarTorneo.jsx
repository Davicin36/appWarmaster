import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import torneosSagaApi from '../servicios/apiSaga.js';

import VistaJugadores from '../componente/vistas/VistaJugadores';
import VistaClasificacion from '../componente/vistas/VistaClasificacion';
import VistaEmparejamientos from '../componente/vistas/VistaEmparejamientos';
import VistaGeneral from '../componente/vistas/VistaGeneral';

import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const navigate = useNavigate();
    const { torneoId } = useParams();
    
    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
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
            
            try {
                const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
            } catch (err) {
                console.log('No hay jugadores todavía', err);
                setJugadores([]);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setError(`Error al cargar los datos del torneo: ${error.message}`);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '1.5em',
                color: '#4a7c2e'
            }}>
                ⏳ Cargando datos del torneo...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                maxWidth: '600px', 
                margin: '100px auto', 
                padding: '40px', 
                textAlign: 'center',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>⚠️ Error</h2>
                <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>{error}</p>
                <button onClick={() => navigate('/')} className="btn-secondary">
                    ⬅️ Volver al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="administrar-torneo-container">
            {/* HEADER */}
            <header className="torneo-header">
                <h1>⚔️ {torneo?.nombre_torneo || 'Torneo'}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge ${torneo?.estado || 'pendiente'}`}>
                        {torneo?.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                    <span>📅 {torneo?.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                    <span>👥 {jugadores.length} / {torneo?.participantes_max || 0} jugadores</span>
                </div>
            </header>

            {/* NAVEGACIÓN */}
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
                    👥 Jugadores ({jugadores.length})
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

            {/* CONTENIDO - Cada vista se encarga de todo */}
            <div className="contenido-principal">
                {vistaActual === 'general' && <VistaGeneral torneoId={torneoId} onUpdate={cargarDatosTorneo} />}
                {vistaActual === 'jugadores' && <VistaJugadores torneoId={torneoId} />}
                {vistaActual === 'emparejamientos' && <VistaEmparejamientos torneoId={torneoId} />}
                {vistaActual === 'clasificacion' && <VistaClasificacion torneoId={torneoId} />}
            </div>

            {/* FOOTER */}
            <footer className="footer-controles">
                <button type="button" onClick={() => navigate('/')} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default AdministrarTorneo;