import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../servicios/AuthContext';

import torneosWarmasterApi from '../servicios/apiWarmaster';

import logoWarmaster from '../assets/logoWarmaster.webp'

import '../estilos/principal.css';

function PrincipalWarmaster({ onOpenLogin }) {
    const navigate = useNavigate();
    const { isAuthenticated, user} = useAuth();

    const userId = user?.id || null;
    const [torneosWarmaster, setTorneosWarmaster] = useState([])

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
 
    
    const obtenerTorneosWarmaster = async () => {
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

            const data = await torneosWarmasterApi.obtenerTorneos()
            
            if (data.data && data.data.torneosWarmaster) {
                setTorneosWarmaster(data.data.torneosWarmaster);
            } else {
                console.warn('⚠️ Estructura de respuesta inesperada:', data);
                setTorneosWarmaster([]);
            }

        } catch (err) {
            console.error('❌ Error al obtener torneos:', err);
            setError(err.message || 'Error al cargar torneos');
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        obtenerTorneosWarmaster();
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
                        onClick={obtenerTorneosWarmaster} 
                        className="btn-secondary"
                    >
                        🔄 Reintentar
                    </button>
                </div>
            )}

            <section>
                <img src={logoWarmaster} alt="logo de WARMASTER"  />
                <p>Consulta los torneos de WARMASTER en la Península.</p>
                
                {loading ? (
                    <p className="loading-message">⏳ Cargando torneos...</p>
                ) : torneosWarmaster.length === 0 ? (
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
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {torneosWarmaster.map((torneo, index) => (
                                    <tr key={torneo.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>{torneo.nombre_torneo}</strong>
                                        </td>
                                        <td>
                                            <strong>{torneo.tipo_torneo}</strong>
                                            <small className="torneo-info-extra">
                                                ({torneo.participantes_max} participantes)  
                                            </small>
                                        </td>
                                        <td>
                                            {torneo.puntos_ejercito}
                                        </td>
                                        <td>{formatearFecha(torneo.fecha_inicio)}</td>
                                        <td>{torneo.ubicacion || 'Por determinar'}</td>
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
                                        <td>
                                            <span className="participantes-badge">
                                                {torneo.total_participantes || 0}
                                            </span>
                                        </td>
                                        <td className="acciones-cell">
                                            {torneo.created_by === userId && (
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
                                                            navigate(`/torneosWarmaster/${torneo.id}/editar-inscripcion`);
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
                                                onClick={() => navigate(`/torneosWarmaster/${torneo.id}/detalles`)}
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

export default PrincipalWarmaster;