import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../servicios/AuthContext';

import torneosSagaApi from '../servicios/apiSaga';  

import '../estilos/principal.css';


function Principal() {
    const navigate = useNavigate();
    const { isAuthenticated, user} = useAuth();

     // Obtener el ID del usuario actual
    const userId = user?.id || null;
    
    const [torneosSaga, setTorneosSaga] = useState([]);
    //const [torneosWarmaster, setTorneosWarmaster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const obtenerTorneosSaga = async () => {

        try {
            setLoading(true);
            setError('');

            console.log('🔍 Intentando obtener torneos...');

            // ✅ Enviar token si está autenticado
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const data = await torneosSagaApi.obtenerTorneos()
            
            console.log('✅ Datos recibidos:', data);
            
            if (data.data && data.data.torneosSaga) {
                setTorneosSaga(data.data.torneosSaga);
                console.log(`✅ ${data.data.torneosSaga.length} torneos cargados`);
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
        // Redirigir a la página de inscripción con el ID del torneo
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
                        style={{ 
                            marginLeft: '10px', 
                            padding: '5px 10px',
                            fontSize: '0.9rem'
                        }}
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
                                    <th>Época</th>
                                    <th>Fecha Inicio</th>
                                    <th>Ubicación</th>
                                    <th>Organizador</th>
                                    <th>Participantes</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {torneosSaga.map((torneo, index) => (
                                    <tr key={torneo.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>{torneo.nombre_torneo}</strong>
                                            <small style={{ display: 'block', color: '#8d6e63' }}>
                                                {torneo.rondas_max} rondas • {torneo.puntos_banda} pts
                                            </small>
                                        </td>
                                        <td>{torneo.epoca_torneo}</td>
                                        <td>{formatearFecha(torneo.fecha_inicio)}</td>
                                        <td>{torneo.ubicacion || 'Por determinar'}</td>
                                        <td>
                                            {torneo.creador_nombre && torneo.creador_apellidos 
                                                ? `${torneo.creador_nombre} ${torneo.creador_apellidos}`
                                                : 'N/A'
                                            }
                                            {torneo.creador_club && (
                                                <small style={{ display: 'block', color: '#8d6e63' }}>
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
                                            {/* Mostrar botón Administrar SOLO si es el creador */}
                                            {torneo.created_by === userId && (
                                                <button 
                                                    className="btn-administrar"
                                                    onClick={() => navigate(`/administrarTorneo/${torneo.id}`)}
                                                >
                                                    🔧 Administrar
                                                </button>
                                            )}
                                            {/* ✅ Mostrar botón SOLO en fase de inscripción */}
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
                <Link 
                    to="/ayudaCrearTorneo"
                >
                    Como Crear Un Torneo y gestionarlo
                </Link>
            </footer>
        </div>
    );
}

export default Principal;