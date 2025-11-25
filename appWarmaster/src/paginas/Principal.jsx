import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../servicios/AuthContext';
import torneosSagaApi from '../servicios/apiSaga';

// ✅ Importar la función para formatear épocas
import { formatearEpocas } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import '../estilos/principal.css';

function Principal() {
    const navigate = useNavigate();
    const { isAuthenticated, user} = useAuth();

    const userId = user?.id || null;
    
    const [torneosSaga, setTorneosSaga] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const obtenerTorneosSaga = async () => {
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

            const data = await torneosSagaApi.obtenerTorneos();
            
            if (data.data && data.data.torneosSaga) {
                setTorneosSaga(data.data.torneosSaga);
            } else {
                console.warn('⚠️ Estructura de respuesta inesperada:', data);
                setTorneosSaga([]);
            }

        } catch (err) {
            console.error('❌ Error al obtener torneos:', err);
            setError(err.message || 'Error al cargar torneos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerTorneosSaga();
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
            navigate('/login');
            return;
        }
        navigate(`/inscripcion/${torneoId}`);
    };

    return (
        <div>      
            <section className="imagenes-principales">
                 <img src="src/assets/vikingo.png" alt="logo de Web"  />
                 <div>
                    <h2>Bienvenido a la página principal de gestión de torneos de WARGAMES</h2>
                    <p>Aquí podrás crear, gestionar y seguir tus torneos de WARGAMES de manera sencilla y eficiente.</p>
                </div>
                <img src="src/assets/vikingo.png" alt="logo de Web"  />
            </section>

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                    <button 
                        onClick={obtenerTorneosSaga} 
                        className="btn-secondary"
                    >
                        🔄 Reintentar
                    </button>
                </div>
            )}

            <section>
                <img src="src/assets/logoSaga.webp" alt="logo de SAGA"  />
                <p>Consulta los torneos de SAGA en la Península.</p>

                {loading ? (
                    <p className="loading-message">⏳ Cargando torneos...</p>
                ) : torneosSaga.length === 0 ? (
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
                                    <th>Época(s)</th>
                                    <th>Fecha Inicio</th>
                                    <th>Ubicación</th>
                                    <th>Organizador</th>
                                    <th>Participantes/Equipos</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {torneosSaga.map((torneo, index) => (
                                    <tr key={torneo.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>{torneo.nombre_torneo}</strong>
                                        </td>
                                        <td>
                                            <strong>{torneo.tipo_torneo}</strong>
                                            {torneo.tipo_torneo === 'Por equipos' && (
                                                <small className="torneo-info-extra">
                                                    ({torneo.equipos_max} equipos / {torneo.num_jugadores_equipo} jugadores)  
                                                </small>
                                            )}
                                            {torneo.tipo_torneo === 'Individual' && (
                                                <small className="torneo-info-extra">
                                                    ({torneo.participantes_max} participantes)  
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <span className="epocas-cell">
                                                {formatearEpocas(torneo.epocas_disponibles)}
                                            </span>
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
                                                {torneo.tipo_torneo === 'Por equipos' 
                                                    ? (torneo.total_equipos_inscritos || 0)
                                                    : (torneo.total_participantes || 0)
                                                }
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
                                                            navigate(`/torneosSaga/${torneo.id}/editar-inscripcion`);
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
                                                onClick={() => navigate(`/torneosSaga/${torneo.id}/detalles`)}
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

            <section>
                <img src="src/assets/logoWarmaster.webp" alt="logo de WARMASTER"  />
                <p>Consulta los torneos de WARMASTER en la Península.</p>
                <strong><p>PROXIMAMENTE</p></strong>

                {loading ? (
                    <p className="loading-message">⏳ Cargando torneos...</p>
                ) : (
                    <p className="no-data-message">
                        No hay torneos de WARMASTER registrados todavía.
                    </p>
                )}
            </section>

             <section>
                <img src="src/assets/logoFow.webp" alt="logo de Flames of War"  />
                <p>Consulta los torneos de Flames of War en la Península.</p>
                <strong><p>PROXIMAMENTE</p></strong>

                {loading ? (
                    <p className="loading-message">⏳ Cargando torneos...</p>
                ) : (
                    <p className="no-data-message">
                        No hay torneos de Flames of war registrados todavía.
                    </p>
                )}
            </section>
            
            <footer>
                <Link to="/ayudaCrearTorneo">
                    Como Crear Un Torneo y gestionarlo
                </Link>
            </footer>
        </div>
    );
}

export default Principal;