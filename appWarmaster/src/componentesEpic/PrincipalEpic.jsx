import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../servicios/AuthContext';

import torneosEpicApi from '@/servicios/apiEpic';

import logoEpic from '../assets/logoEpic.webp'

import '../estilos/principal.css';

function PrincipalEpic({ onOpenLogin }) {
    const navigate = useNavigate();
    const { isAuthenticated, user} = useAuth();

    const userId = user?.id || null;
    const [torneosEpic, setTorneosEpic] = useState([])

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
 
    
    const obtenerTorneosEpic = async () => {
        try {
            setLoading(true);
            setError('');

           const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const data = await torneosEpicApi.obtenerTorneos()
            
            if (data.data && data.data.torneosEpic) {
                setTorneosEpic(data.data.torneosEpic);
            } else {
                console.warn('⚠️ Estructura de respuesta inesperada:', data);
                setTorneosEpic([]);
            }

        } catch (err) {
            console.error('❌ Error al obtener torneos:', err);
            setError(err.message || 'Error al cargar torneos');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        obtenerTorneosEpic();
    }, []);

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const apuntarseATorneo = (torneoId) => {
        if (!isAuthenticated) {
            alert('Debes iniciar sesión para apuntarte a un torneo');
            onOpenLogin()
            return;
        }
        navigate(`/inscripcion/${torneoId}`);
    };

    return (
        <div>     
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                    <button 
                        onClick={obtenerTorneosEpic} 
                        className="btn-secondary"
                    >
                        🔄 Reintentar
                    </button>
                </div>
            )}

            <section>
                <img src={logoEpic} alt="logo de EPIC"  />
                <p>Consulta los torneos de EPIC en la Península.</p>
                
                {loading ? (
                    <p className="loading-message">⏳ Cargando torneos...</p>
                ) : torneosEpic.length === 0 ? (
                    <p className="no-data-message">
                        No hay torneos registrados todavía. ¡Sé el primero en crear uno!
                    </p>
                ) : (
                    <div className="tabla-container">
                        <table className="tabla-torneos">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nombre del torneo</th>
                                    <th>Tipo torneo</th>
                                    <th>Puntos del Torneo</th>
                                    <th>Fecha Inicio</th>
                                    <th>Ubicación</th>
                                    <th>Organizador</th>
                                    <th>Participantes</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {torneosEpic.map((torneo, index) => (
                                    <tr key={torneo.id}>
                                        <td data-label="#">{index + 1}</td>
                                        <td data-label="Torneo">
                                            <strong>{torneo.nombre_torneo}</strong>
                                        </td>
                                        <td data-label="Tipo">
                                            <strong>{torneo.tipo_torneo}</strong>
                                            <small className="torneo-info-extra">
                                                ({torneo.participantes_max} participantes)  
                                            </small>
                                        </td>
                                        <td data-label="Puntos del Torneo">
                                            {torneo.puntos_ejercito}
                                        </td>
                                        <td data-label="Fecha Inicio">{formatearFecha(torneo.fecha_inicio)}</td>
                                        <td data-label="Ubicación">{torneo.ubicacion || 'Por determinar'}</td>
                                        <td>
                                            {torneo.creador_nombre && torneo.creador_apellidos 
                                                ? `${torneo.creador_nombre} ${torneo.creador_apellidos}`
                                                : 'N/A'
                                            }
                                            {torneo.creador_club && (
                                                <small className="club-info">
                                                    📍 {torneo.creador_club}
                                                </small>
                                            )}
                                        </td>
                                        <td data-label="Participantes">
                                            <span className="participantes-badge">
                                                {torneo.total_participantes || 0}/{torneo.participantes_max}
                                            </span>
                                        </td>
                                        <td data-label="Estado">{torneo.estado}</td>
                                        <td className="acciones-cell">
                                            {torneo.created_by === userId || torneo.es_coorganizador && (
                                                <button 
                                                    className="btn-administrar"
                                                    onClick={() => navigate(`/administrarTorneo/${torneo.id}`)}
                                                >
                                                    🔧 Administrar
                                                </button>
                                            )}
                                            
                                            {torneo.estado === 'pendiente' && (
                                                <button 
                                                    className={torneo.usuario_inscrito ? "btn-inscrito" : "btn-apuntarse"}
                                                    onClick={() => {
                                                        if (torneo.usuario_inscrito) {
                                                            navigate(`/torneosEpic/${torneo.id}/editar-inscripcion`);
                                                        } else {
                                                            apuntarseATorneo(torneo.id);
                                                        }
                                                    }}
                                                >
                                                    {torneo.usuario_inscrito ? '✏️ Administrar Inscripción' : '✅ Inscribirse'}
                                                </button>
                                            )}

                                            <button 
                                                className="btn-ver-detalles"
                                                onClick={() => navigate(`/torneosEpic/${torneo.id}/detalles`)}
                                            >   
                                                👁️ Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PrincipalEpic;