import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import usuarioApi from '@/servicios/apiUsuarios';

import PrincipalSaga from '@/componentesSaga/PrincipalSaga';
import PrincipalWarmaster from '@/componentesWarmaster/PrincipalWarmaster';
import PrincipalFow from '@/componentesFow/PrincipalFow';
import PrincipalEpic from '@/componentesEpic/PrincipalEpic';
import PrincipalDracula from '@/componentesDracula/PrincipalDracula';

import Footer from '@/paginas/Footer.jsx'

import vikingo from '../assets/vikingo.png';

import '../estilos/principal.css';
import '../estilos/novedades.css'

const TORNEOS_POR_PAGINA = 5;

function Principal({ onOpenLogin }) {
    const [juegoActivo, setJuegoActivo] = useState('todos');
    const [subPestana, setSubPestana] = useState('proximos'); // 'proximos' | 'jugados'
    const [torneos, setTorneos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarTorneos = async () => {
            try {
                setCargando(true);
                setError(null);
                const data = await usuarioApi.obtenerTodosTorneos();
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

    // Resetear página al cambiar subpestaña
    useEffect(() => {
        setPaginaActual(1);
    }, [subPestana]);

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha no disponible';
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fecha).toLocaleDateString('es-ES', opciones);
    };

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

    const crearTorneoSaga = () => {
        navigate('/crearTorneo/saga');
    }

      const crearTorneoDracula = () => {
        navigate('/crearTorneo/dracula');
    }

    const navegarATorneo = (torneo) => {
        const rutas = {
            SAGA: `/torneosSaga/${torneo.id}/detalles`,
            WARMASTER: `/torneosWarmaster/${torneo.id}/detalles`,
            FOW: `/torneosFow/${torneo.id}/detalles`,
            EPIC: `/torneosEpic/${torneo.id}/detalles`,
            DRACULA: `/torneosDracula/${torneo.id}/detalles`,
        };
        const ruta = rutas[torneo.sistema];
        if (ruta) navigate(ruta);
    };

    // Filtrar según subpestaña
    const torneosFiltrados = useMemo(() => {
        if (subPestana === 'proximos') {
            return torneos.filter(t => t.estado === 'pendiente' || t.estado === 'en_curso');
        }
        return torneos.filter(t => t.estado === 'finalizado' || t.estado === 'cancelado');
    }, [torneos, subPestana]);

    // Paginación
    const totalPaginas = Math.ceil(torneosFiltrados.length / TORNEOS_POR_PAGINA);
    const torneosPagina = torneosFiltrados.slice(
        (paginaActual - 1) * TORNEOS_POR_PAGINA,
        paginaActual * TORNEOS_POR_PAGINA
    );

    return (
        <div>      
            <section className="imagenes-principales">
                <img src={vikingo} alt="logo de Web" />
                <div>
                    <h2>Bienvenido a la página principal de gestión de torneos de WARGAMES</h2>
                    <p>Aquí podrás crear, gestionar y seguir tus torneos de WARGAMES favoritos de manera sencilla y eficiente.</p>
                </div>
                <img src={vikingo} alt="logo de Web" />
            </section>

            {/* 🆕 NOVEDAD: SISTEMA GAKIS */}
            <section className="seccion-novedad">
                <span className="novedad-badge">PROXIMAMENTE...</span>
                <div className="novedad-banner">
                    <div className="novedad-contenido">
                        <h3>⚔️ SISTEMA GESTIÓN ESCENARIOS</h3>
                        <p>
                            Tienes escenarios personalizados para tus torneos SAGA? Ahora puedes añadirlos a tus torneos y que los organizadores puedan seleccionarlos al crear los torneos. En poco tiempo estará disponible esta sección.
                        </p>
                    </div>
                    <div className="novedad-contenido">
                        <h3>⚔️ TRADUCCIÓN AL INGLES</h3>
                        <p>
                            Se podrá disfrutar de la aplicación, en ingles y en castellano. Hagamos que el Hobby crezca
                        </p>
                    </div>
                </div>
            </section>

            {/* 🆕 NOVEDAD: SISTEMA GAKIS */}
            <section className="seccion-novedad">
                <span className="novedad-badge">🆕 NOVEDADES</span>
                <div className="novedad-banner">
                    <div className="novedad-contenido">
                        <h3>⚔️ Sistema Gakis para torneos SAGA</h3>
                        <p>
                            Ya puedes crear torneos SAGA con el <strong>SISTEMA GAKIS</strong>
                        </p>
                        <p>
                              Un nuevo modo de juego con reglas especiales para los modelos Gakis. Actívalo al crear tu torneo desde la configuración avanzada. Con el podrás añadir opciones extras a tus torneos SAGA, tales como:
                              <table>
                                <li><strong>Unidades legendarias exclusivas</strong></li>
                                <p>Poder usar a tus heroes legendarios en las batallas de SAGA</p>
                                <li><strong>Utilizar los Puntos de Torneo</strong></li>
                                <p>
                                    Ahora el modelo estandar de torneo SAGA, usa el formato normal, los puntos de las partidas y si ganas por 3 o más eres el vencedor, seleccionando puntos de torneo se usará el sistema de puntación
                                    instaurado en el libro de Torneo.
                                </p>
                                <li><strong>Matar el warlord de PV</strong></li>
                                <p>
                                    Quieres que matar el walord valga para algo, usa este sistema y por cada warlord se añadirá 1 PV al resultado de la tabla clasificatoria.
                                </p>
                                <li><strong>Uso de misiones Secundarias</strong></li>
                                <p>
                                    Ahora se pueden añadir misiones secundarias en tus torneos, cumplirlas te podria dar hasta 1 PV para la clasificacion final.
                                </p>
                              </table>
                        </p>
                    </div>
                    <button 
                        className="btn-ver-saga"
                        onClick={() => crearTorneoSaga()}
                    >
                        Crear Torneo SAGA →
                    </button>
                    <div className="novedad-banner">
                        <div className="novedad-contenido">
                            <h3>⚔️ Nuevo sistema de Juego DRACULAS AMERICA</h3>
                            <p>
                                Ya puedes crear torneos del WARGAME DRACULAS AMERICA, 
                            </p>
                        </div>
                        <button 
                            className="btn-ver-saga"
                            onClick={() => crearTorneoDracula()}
                        >
                            Crear Torneo DRACULAS AMERICA →
                        </button>
                    </div>
                </div>
            </section>

            {/* RANKING */}
            <section className="seccion-ranking-destacada">
                <div className="ranking-hero">
                    <div className="ranking-hero-contenido">
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
                                    document.getElementById('info-ranking')?.scrollIntoView({ behavior: 'smooth' });
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

            {/* NAVEGACIÓN JUEGOS */}
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
                <button 
                    className={juegoActivo === 'epic' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('epic')}
                >
                    EPIC ARMAGEDON
                </button>
                <button 
                    className={juegoActivo === 'dracula' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('dracula')}
                >
                    DRACULA´S AMÉRICA
                </button>
            </nav>

            {/* CARTELES TORNEOS */}
            {juegoActivo === 'todos' && (
                <section className="seccion-torneos-principales">
                    <div className="header-torneos">
                        <h2>🎯 Todos los Torneos</h2>

                        {/* 🆕 SUB-PESTAÑAS */}
                        <div className="sub-pestanas-torneos">
                            <button
                                className={`sub-pestana ${subPestana === 'proximos' ? 'activa' : ''}`}
                                onClick={() => setSubPestana('proximos')}
                            >
                                🗓️ Próximos Torneos
                            </button>
                            <button
                                className={`sub-pestana ${subPestana === 'jugados' ? 'activa' : ''}`}
                                onClick={() => setSubPestana('jugados')}
                            >
                                ✅ Torneos Jugados
                            </button>
                        </div>

                        <p>
                            {torneosFiltrados.length === 0
                                ? 'No hay torneos disponibles'
                                : `${torneosFiltrados.length} torneo${torneosFiltrados.length !== 1 ? 's' : ''}`
                            }
                        </p>
                    </div>

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
                    ) : torneosFiltrados.length === 0 && !error ? (
                        <div className="sin-torneos">
                            <p>
                                {subPestana === 'proximos'
                                    ? '📅 No hay torneos próximos ni en curso'
                                    : '📚 No hay torneos finalizados todavía'
                                }
                            </p>
                        </div>
                    ) : !error ? (
                        <>
                            <div className="grid-torneos">
                                {torneosPagina.map((torneo) => (
                                    <div 
                                        key={torneo.id} 
                                        className="card-torneo"
                                        onClick={() => navegarATorneo(torneo)}
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

                            {/* 🆕 PAGINACIÓN */}
                            {totalPaginas > 1 && (
                                <div className="paginacion-torneos">
                                    <button
                                        className="btn-pagina"
                                        onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                        disabled={paginaActual === 1}
                                    >
                                        ← Anterior
                                    </button>

                                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                        <button
                                            key={num}
                                            className={`btn-pagina ${paginaActual === num ? 'activa' : ''}`}
                                            onClick={() => setPaginaActual(num)}
                                        >
                                            {num}
                                        </button>
                                    ))}

                                    <button
                                        className="btn-pagina"
                                        onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                        disabled={paginaActual === totalPaginas}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}
                </section>
            )}

            {juegoActivo === 'saga' && <PrincipalSaga onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'warmaster' && <PrincipalWarmaster onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'fow' && <PrincipalFow onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'epic' && <PrincipalEpic onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'dracula' && <PrincipalDracula onOpenLogin={onOpenLogin} />}

            {/* INFO RANKING */}
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
