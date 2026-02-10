import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import usuarioApi from '@/servicios/apiUsuarios';

import PrincipalSaga from '@/componentesSaga/PrincipalSaga';
import PrincipalWarmaster from '@/componentesWarmaster/PrincipalWarmaster';
import PrincipalFow from '@/componentesFow/PrincipalFow';
import Footer from '@/paginas/Footer.jsx'

import vikingo from '../assets/vikingo.png';

import '../estilos/principal.css';

function Principal({ onOpenLogin }) {
    const [juegoActivo, setJuegoActivo] = useState('todos');
    const [torneos, setTorneos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate()

    useEffect(() => {
        const cargarTorneos = async () => {
            try {
                setCargando(true);
                setError(null);
                
                // Usar la función de la API
                const data = await usuarioApi.obtenerTodosTorneos();
                
                // Ordenar por fecha de creación (más recientes primero)
                const torneosOrdenados = data.sort((a, b) => 
                    new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
                );
                
                setTorneos(torneosOrdenados);
            } catch (error) {
                console.error('Error al cargar torneos:', error);
                setError('No se pudieron cargar los torneos. Por favor, intenta de nuevo.');
            } finally {
                setCargando(false);
            }
        };

        cargarTorneos();
    }, []);

        // Formatear fecha
    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha no disponible';
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fecha).toLocaleDateString('es-ES', opciones);
    };

    // Función para recargar torneos
    const recargarTorneos = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await usuarioApi.obtenerTodosTorneos();
            const torneosOrdenados = data.sort((a, b) => 
                new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
            );
            setTorneos(torneosOrdenados);
        } catch (error) {
            console.error('Error al recargar torneos:', error);
            setError('No se pudieron cargar los torneos. Por favor, intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    };


    return (
        <div>      
            <section className="imagenes-principales">
                <img src={vikingo} alt="logo de Web" />
                <div>
                    <h2>Bienvenido a la página principal de gestión de torneos de WARGAMES</h2>
                    <p>Aquí podrás crear, gestionar y seguir tus torneos de WARGAMES de manera sencilla y eficiente.</p>
                </div>
                <img src={vikingo} alt="logo de Web" />
            </section>

            {/* NUEVA SECCIÓN DE RANKING */}
            <section className="seccion-ranking-destacada">
                <div className="ranking-hero">
                    <div className="ranking-hero-contenido">
                        <span className="ranking-badge">🏆 Nuevo</span>
                        <h2>Sistema de Ranking ELO</h2>
                        <p>Descubre tu posición en el ranking global y compite por el primer puesto</p>
                        <div className="ranking-hero-botones">
                            <button 
                                className="btn-ver-ranking"
                                onClick={() => navigate('/ranking')}
                            >
                                🏆 Ver Ranking
                            </button>
                            <button 
                                className="btn-info-ranking"
                                onClick={() => {
                                    const elemento = document.getElementById('info-ranking');
                                    elemento?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                ℹ️ ¿Cómo funciona?
                            </button>
                        </div>
                    </div>
                    <div className="ranking-hero-stats">
                        <div className="stat-destacada">
                            <span className="stat-icono">👥</span>
                            <span className="stat-numero">+100</span>
                            <span className="stat-texto">Jugadores</span>
                        </div>
                        <div className="stat-destacada">
                            <span className="stat-icono">🎮</span>
                            <span className="stat-numero">+500</span>
                            <span className="stat-texto">Partidas</span>
                        </div>
                        <div className="stat-destacada">
                            <span className="stat-icono">🎲</span>
                            <span className="stat-numero">3</span>
                            <span className="stat-texto">Sistemas</span>
                        </div>
                    </div>
                </div>
            </section>

            <nav className="navegacion-juegos">
                <button 
                    className={juegoActivo === 'todos' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('todos')}
                >
                    CARTELES TORNEOS
                </button>
                <button 
                    className={juegoActivo === 'saga' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('saga')}
                >
                    SAGA
                </button>
                <button 
                    className={juegoActivo === 'warmaster' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('warmaster')}
                >
                    WARMASTER
                </button>
                <button 
                    className={juegoActivo === 'fow' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('fow')}
                >
                    FLAMES OF WAR
                </button>
                {/*}
                <button 
                    className={juegoActivo === 'bolt' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('bolt')}
                >
                    BOLT ACTION
                </button>
                {*/}
            </nav>

            {/* SECCIÓN DE TODOS LOS TORNEOS - Solo se muestra cuando juegoActivo === 'todos' */}
            {juegoActivo === 'todos' && (
                <section className="seccion-torneos-principales">
                    <div className="header-torneos">
                        <h2>🎯 Todos los Torneos</h2>
                        <p>
                            {torneos.length === 0 
                                ? 'No hay torneos disponibles' 
                                : `${torneos.length} torneo${torneos.length !== 1 ? 's' : ''} disponible${torneos.length !== 1 ? 's' : ''}`
                            }
                        </p>
                    </div>

                    {/* Mostrar error si existe */}
                    {error && (
                        <div className="mensaje-error">
                            <p>{error}</p>
                            <button onClick={recargarTorneos} className="btn-reintentar">
                                🔄 Reintentar
                            </button>
                        </div>
                    )}

                    {cargando ? (
                        <div className="torneos-cargando">
                            <div className="spinner"></div>
                            <p>Cargando torneos...</p>
                        </div>
                    ) : torneos.length === 0 && !error ? (
                        <div className="sin-torneos">
                            <p>📅 No hay torneos todavía</p>
                            <p>¡Sé el primero en crear uno!</p>
                        </div>
                    ) : !error ? (
                        <div className="grid-torneos">
                            {torneos.map((torneo) => (
                                <div 
                                    key={torneo.id} 
                                    className="card-torneo"
                                    onClick={() => {
                                        if (torneo.sistema === 'SAGA') {
                                            navigate(`/torneosSaga/${torneo.id}/detalles`);
                                        } else if (torneo.sistema === 'WARMASTER') {
                                            navigate(`/torneosWarmaster/${torneo.id}/detalles`);
                                        } else if (torneo.sistema === 'FOW') {
                                            navigate(`/torneosFow/${torneo.id}/detalles`);
                                        }
                                    }}
                                >
                                    {/* IMAGEN */}
                                    <div className="card-imagen-wrapper">
                                        {torneo.imagen_url ? (
                                            <img 
                                                src={torneo.imagen_url} 
                                                alt={torneo.nombre}
                                                className="torneo-imagen"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = vikingo;
                                                }}
                                            />
                                        ) : (
                                            <div className="torneo-sin-imagen">
                                                <span className="icono-sin-imagen">🎮</span>
                                                <p>Sin imagen</p>
                                            </div>
                                        )}
                                        <span className="torneo-badge">{torneo.tipo_juego}</span>
                                    </div>

                                    {/* INFO */}
                                    <div className="torneo-info">
                                        <h3>{torneo.nombre}</h3>
                                        {torneo.descripcion && (
                                            <p className="torneo-descripcion">
                                                {torneo.descripcion.length > 150 
                                                    ? torneo.descripcion.substring(0, 150) + '...' 
                                                    : torneo.descripcion}
                                            </p>
                                        )}
                                        <div className="torneo-detalles">
                                            <span className="torneo-detalle">
                                                <strong>{torneo.sistema} - Torneo {torneo.tipo_torneo}</strong>
                                            </span>
                                            <span className="torneo-detalle">📅 {formatearFecha(torneo.fecha_inicio)}</span>
                                            {torneo.ubicacion && (
                                                <span className="torneo-detalle">📍 {torneo.ubicacion}</span>
                                            )}
                                            {torneo.tipo_torneo === 'Por equipos' ? (
                                                <span className="torneo-detalle">
                                                    👥 {torneo.num_participantes || 0} / {torneo.equipos_max} equipos
                                                </span>
                                            ) : (
                                                <span className="torneo-detalle">
                                                    👤 {torneo.num_participantes || 0} / {torneo.participantes_max} participantes
                                                </span>
                                            )}
                                        </div>
                                        <div className="torneo-footer">
                                            <span className={`estado-badge ${torneo.estado?.toLowerCase()}`}>
                                                {torneo.estado === 'pendiente' && '⏳ Pendiente'}
                                                {torneo.estado === 'en_curso' && '▶️ En Curso'}
                                                {torneo.estado === 'finalizado' && '✅ Finalizado'}
                                                {torneo.estado === 'cancelado' && '❌ Cancelado'}
                                            </span>
                                            {torneo.creador_nombre && (
                                                <span className="torneo-creador">Por: {torneo.creador_nombre}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </section>
            )}

            {juegoActivo === 'saga' && <PrincipalSaga onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'warmaster' && <PrincipalWarmaster onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'fow' && <PrincipalFow onOpenLogin={onOpenLogin} />}

            {/* NUEVA SECCIÓN: INFORMACIÓN DEL RANKING */}
            <section id="info-ranking" className="seccion-info-ranking">
                <h2>¿Cómo funciona el Sistema de Ranking ELO?</h2>
                <div className="info-ranking-grid">
                    <div className="info-card">
                        <span className="info-icono">📊</span>
                        <h3>Sistema ELO</h3>
                        <p>Utiliza el sistema ELO estándar para calcular tu puntuación basándose en victorias, derrotas y el nivel de tus oponentes.</p>
                    </div>
                    <div className="info-card">
                        <span className="info-icono">🎯</span>
                        <h3>Categorías</h3>
                        <p>Sube de categoría desde Novato hasta Gran Maestro según tu puntuación ELO.</p>
                    </div>
                    <div className="info-card">
                        <span className="info-icono">🔄</span>
                        <h3>Temporadas</h3>
                        <p>Cada año comienza una nueva temporada. ¡Compite para llegar al top!</p>
                    </div>
                    <div className="info-card">
                        <span className="info-icono">🎮</span>
                        <h3>Multi-juego</h3>
                        <p>Rankings independientes para SAGA, Warmaster y Flames of War.</p>
                    </div>
                </div>
                <div className="categorias-elo">
                    <h3>Categorías de Jugadores</h3>
                    <div className="categorias-grid">
                        <div className="categoria-item gran-maestro">
                            <span className="categoria-icono">👑</span>
                            <span className="categoria-nombre">Gran Maestro</span>
                            <span className="categoria-rango">≥2400 ELO</span>
                        </div>
                        <div className="categoria-item maestro">
                            <span className="categoria-icono">🥇</span>
                            <span className="categoria-nombre">Maestro</span>
                            <span className="categoria-rango">≥2200 ELO</span>
                        </div>
                        <div className="categoria-item experto">
                            <span className="categoria-icono">🥈</span>
                            <span className="categoria-nombre">Experto</span>
                            <span className="categoria-rango">≥2000 ELO</span>
                        </div>
                        <div className="categoria-item avanzado">
                            <span className="categoria-icono">🥉</span>
                            <span className="categoria-nombre">Avanzado</span>
                            <span className="categoria-rango">≥1800 ELO</span>
                        </div>
                        <div className="categoria-item intermedio">
                            <span className="categoria-icono">⭐</span>
                            <span className="categoria-nombre">Intermedio</span>
                            <span className="categoria-rango">≥1600 ELO</span>
                        </div>
                        <div className="categoria-item principiante">
                            <span className="categoria-icono">📚</span>
                            <span className="categoria-nombre">Principiante</span>
                            <span className="categoria-rango">≥1400 ELO</span>
                        </div>
                        <div className="categoria-item novato">
                            <span className="categoria-icono">🌱</span>
                            <span className="categoria-nombre">Novato</span>
                            <span className="categoria-rango">&lt;1400 ELO</span>
                        </div>
                    </div>
                </div>
            </section>
            
            <Footer />
        </div>
    );
}

export default Principal;