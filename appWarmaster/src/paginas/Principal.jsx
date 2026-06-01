import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import usuarioApi from '@/servicios/apiUsuarios';

import PrincipalSaga from '@/componentesSaga/PrincipalSaga';
import PrincipalWarmaster from '@/componentesWarmaster/PrincipalWarmaster';
import PrincipalFow from '@/componentesFow/PrincipalFow';
import PrincipalEpic from '@/componentesEpic/PrincipalEpic';
import PrincipalDracula from '@/componentesDracula/PrincipalDracula';

import Footer from '@/paginas/Footer.jsx';
import vikingo from '../assets/vikingo.png';

import '../estilos/principal.css';
import '../estilos/novedades.css';

const TORNEOS_POR_PAGINA = 5;

function Principal({ onOpenLogin }) {
    const { t, i18n } = useTranslation();

    const [juegoActivo, setJuegoActivo] = useState('todos');
    const [subPestana, setSubPestana] = useState('proximos');
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
                setTorneos(data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)));
            } catch (error) {
                console.error('Error al cargar torneos:', error);
                setError(t('errores.cargar_torneos'));
            } finally {
                setCargando(false);
            }
        };
        cargarTorneos();
    }, []);

    useEffect(() => { setPaginaActual(1); }, [subPestana]);

    const formatearFecha = (fecha) => {
        if (!fecha) return t('torneos.fecha_no_disponible');
        const locale = i18n.language === 'es' ? 'es-ES' : 'en-GB';
        return new Date(fecha).toLocaleDateString(locale, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const recargarTorneos = async () => {
        try {
            setCargando(true);
            setError(null);
            const data = await usuarioApi.obtenerTodosTorneos();
            setTorneos(data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)));
        } catch (error) {
            console.error('Error:', error);
            setError(t('errores.cargar_torneos'));
        } finally {
            setCargando(false);
        }
    };

    const traducirTipoTorneo = (tipo) => {
        const mapa = {
            'Individual':  t('torneos.tipo_individual'),
            'Por equipos': t('torneos.tipo_equipos'),
        };
        return mapa[tipo] || tipo;
    };

    const navegarATorneo = (torneo) => {
        const rutas = {
            SAGA: `/torneosSaga/${torneo.id}/detalles`,
            WARMASTER:`/torneosWarmaster/${torneo.id}/detalles`,
            FOW: `/torneosFow/${torneo.id}/detalles`,
            EPIC: `/torneosEpic/${torneo.id}/detalles`,
            DRACULA: `/torneosDracula/${torneo.id}/detalles`,
        };
        if (rutas[torneo.sistema]) navigate(rutas[torneo.sistema]);
    };

    const torneosFiltrados = useMemo(() => {
        if (subPestana === 'proximos') return torneos.filter(t => t.estado === 'pendiente' || t.estado === 'en_curso');
        return torneos.filter(t => t.estado === 'finalizado' || t.estado === 'cancelado');
    }, [torneos, subPestana]);

    const totalPaginas = Math.ceil(torneosFiltrados.length / TORNEOS_POR_PAGINA);
    const torneosPagina = torneosFiltrados.slice(
        (paginaActual - 1) * TORNEOS_POR_PAGINA,
        paginaActual * TORNEOS_POR_PAGINA
    );

    return (
        <div>
            {/* CABECERA */}
            <section className="imagenes-principales">
                <img src={vikingo} alt="logo de Web" />
                <div>
                    <h2>{t('principal.titulo')}</h2>
                    <p>{t('principal.subtitulo')}</p>
                </div>
                <img src={vikingo} alt="logo de Web" />
            </section>

            {/* PRÓXIMAMENTE */}
            <section className="seccion-novedad">
                <span className="novedad-badge">{t('novedades.proximamente_label')}</span>
                <div className="novedad-banner">
                    <div className="novedad-contenido">
                        <h3>{t('novedades.escenarios_titulo')}</h3>
                        <p>{t('novedades.escenarios_texto')}</p>
                    </div>
                    <div className="novedad-contenido">
                        <h3>📕 TRADUCCIÓN AL INGLES</h3>
                        <p>
                            Se podrá disfrutar de la aplicación, en ingles y en castellano. Hagamos que el Hobby crezca
                        </p>
                    </div>
                </div>
            </section>

            {/* NOVEDAD: SISTEMA GAKIS + DRACULAS */}
            <section className="seccion-novedad">
                <span className="novedad-badge">{t('novedades.nuevo_label')}</span>
                <div className="novedad-banner">
                    <div className="novedad-banner">
                            <div className="novedad-contenido">
                            <h3>{t('novedades.escenarios_titulo2')}</h3>
                            <p>{t('novedades.escenarios_texto2')}</p>
                        </div>
                    </div>
                    
                    <div className="novedad-banner">
                        <div className="novedad-contenido">
                            <h3>{t('novedades.gakis_titulo')}</h3>
                            <p><strong>{t('novedades.gakis_subtitulo')}</strong></p>
                            <p>{t('novedades.gakis_intro')}</p>
                            <ul className="gakis-features">
                                <li>
                                    <strong>{t('novedades.gakis_f1_titulo')}</strong>
                                    <p>{t('novedades.gakis_f1_texto')}</p>
                                </li>
                                <li>
                                    <strong>{t('novedades.gakis_f2_titulo')}</strong>
                                    <p>{t('novedades.gakis_f2_texto')}</p>
                                </li>
                                <li>
                                    <strong>{t('novedades.gakis_f3_titulo')}</strong>
                                    <p>{t('novedades.gakis_f3_texto')}</p>
                                </li>
                                <li>
                                    <strong>{t('novedades.gakis_f4_titulo')}</strong>
                                    <p>{t('novedades.gakis_f4_texto')}</p>
                                </li>
                            </ul>
                        </div>
                        <button className="btn-ver-saga" onClick={() => navigate('/crearTorneo/saga')}>
                            {t('novedades.gakis_boton')}
                        </button>
                        </div>

                        <div className="novedad-banner">
                            <div className="novedad-contenido">
                                <h3>{t('novedades.dracula_titulo')}</h3>
                                <p>{t('novedades.dracula_texto')}</p>
                            </div>
                            <button className="btn-ver-saga" onClick={() => navigate('/crearTorneo/dracula')}>
                                    {t('novedades.dracula_boton')}
                            </button>
                        </div>
                </div>
            </section>

            {/* RANKING */}
            <section className="seccion-ranking-destacada">
                <div className="ranking-hero">
                    <div className="ranking-hero-contenido">
                        <h2>{t('ranking.titulo')}</h2>
                        <p>{t('ranking.subtitulo')}</p>
                        <div className="ranking-hero-botones">
                            <button className="btn-ver-ranking" onClick={() => navigate('/ranking')}>
                                {t('ranking.ver')}
                            </button>
                            <button className="btn-info-ranking" onClick={() => document.getElementById('info-ranking')?.scrollIntoView({ behavior: 'smooth' })}>
                                {t('ranking.como_funciona')}
                            </button>
                        </div>
                    </div>
                    <div className="ranking-hero-stats">
                        <div className="stat-destacada">
                            <span className="stat-icono">👥</span>
                            <span className="stat-numero">+100</span>
                            <span className="stat-texto">{t('ranking.jugadores')}</span>
                        </div>
                        <div className="stat-destacada">
                            <span className="stat-icono">🎮</span>
                            <span className="stat-numero">+500</span>
                            <span className="stat-texto">{t('ranking.partidas')}</span>
                        </div>
                        <div className="stat-destacada">
                            <span className="stat-icono">🎲</span>
                            <span className="stat-numero">3</span>
                            <span className="stat-texto">{t('ranking.sistemas')}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* NAVEGACIÓN */}
            <nav className="navegacion-juegos">
                <button className={juegoActivo === 'todos' ? 'activo' : ''} onClick={() => setJuegoActivo('todos')} >{t('nav.carteles')}</button>
                <button className={juegoActivo === 'saga' ? 'activo' : ''} onClick={() => setJuegoActivo('saga')} >{t('nav.saga')}</button>
                <button className={juegoActivo === 'warmaster' ? 'activo' : ''} onClick={() => setJuegoActivo('warmaster')}>{t('nav.warmaster')}</button>
                <button className={juegoActivo === 'fow' ? 'activo' : ''} onClick={() => setJuegoActivo('fow')} >{t('nav.fow')}</button>
                <button className={juegoActivo === 'epic' ? 'activo' : ''} onClick={() => setJuegoActivo('epic')} >{t('nav.epic')}</button>
                <button className={juegoActivo === 'dracula' ? 'activo' : ''} onClick={() => setJuegoActivo('dracula')} >{t('nav.dracula')}</button>
            </nav>

            {/* CARTELES TORNEOS */}
            {juegoActivo === 'todos' && (
                <section className="seccion-torneos-principales">
                    <div className="header-torneos">
                        <h2>{t('torneos.titulo')}</h2>
                        <div className="sub-pestanas-torneos">
                            <button className={`sub-pestana ${subPestana === 'proximos' ? 'activa' : ''}`} onClick={() => setSubPestana('proximos')}>
                                {t('torneos.proximos')}
                            </button>
                            <button className={`sub-pestana ${subPestana === 'jugados' ? 'activa' : ''}`} onClick={() => setSubPestana('jugados')}>
                                {t('torneos.jugados')}
                            </button>
                        </div>
                        <p>
                            {torneosFiltrados.length === 0
                                ? t('torneos.ninguno')
                                : t('torneos.conteo', { count: torneosFiltrados.length })
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="mensaje-error">
                            <p>{error}</p>
                            <button onClick={recargarTorneos} className="btn-reintentar">{t('botones.reintentar')}</button>
                        </div>
                    )}

                    {cargando ? (
                        <div className="torneos-cargando">
                            <div className="spinner"></div>
                            <p>{t('torneos.cargando')}</p>
                        </div>
                    ) : torneosFiltrados.length === 0 && !error ? (
                        <div className="sin-torneos">
                            <p>{subPestana === 'proximos' ? t('torneos.sin_proximos') : t('torneos.sin_jugados')}</p>
                        </div>
                    ) : !error ? (
                        <>
                            <div className="grid-torneos">
                                {torneosPagina.map((torneo) => (
                                    <div key={torneo.id} className="card-torneo" onClick={() => navegarATorneo(torneo)}>
                                        <div className="card-imagen-wrapper">
                                            {torneo.imagen_url ? (
                                                <img src={torneo.imagen_url} alt={torneo.nombre} className="torneo-imagen"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = vikingo; }} />
                                            ) : (
                                                <div className="torneo-sin-imagen">
                                                    <span className="icono-sin-imagen">🎮</span>
                                                    <p>{t('torneos.sin_imagen')}</p>
                                                </div>
                                            )}
                                            <span className="torneo-badge">{torneo.tipo_juego}</span>
                                        </div>
                                        <div className="torneo-info">
                                            <h3>{torneo.nombre}</h3>
                                            {torneo.descripcion && (
                                                <p className="torneo-descripcion">
                                                    {torneo.descripcion.length > 150 ? torneo.descripcion.substring(0, 150) + '...' : torneo.descripcion}
                                                </p>
                                            )}
                                            <div className="torneo-detalles">
                                                <span className="torneo-detalle"><strong>{torneo.sistema} - {traducirTipoTorneo(torneo.tipo_torneo)}</strong></span>
                                                <span className="torneo-detalle">🎲 {torneo.nombre_torneo}</span>
                                                <span className="torneo-detalle">📅 {formatearFecha(torneo.fecha_inicio)}</span>
                                                {torneo.ubicacion && <span className="torneo-detalle">📍 {torneo.ubicacion}</span>}
                                                {torneo.tipo_torneo === 'Por equipos' ? (
                                                    <span className="torneo-detalle">
                                                        {t('torneos.equipos', { inscritos: torneo.num_participantes || 0, max: torneo.equipos_max })}
                                                    </span>
                                                ) : (
                                                    <span className="torneo-detalle">
                                                        {t('torneos.participantes', { inscritos: torneo.num_participantes || 0, max: torneo.participantes_max })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="torneo-footer">
                                                <span className={`estado-badge ${torneo.estado?.toLowerCase()}`}>
                                                    {torneo.estado === 'pendiente'  && t('estado.pendiente')}
                                                    {torneo.estado === 'en_curso'   && t('estado.en_curso')}
                                                    {torneo.estado === 'finalizado' && t('estado.finalizado')}
                                                    {torneo.estado === 'cancelado'  && t('estado.cancelado')}
                                                </span>
                                                {torneo.creador_nombre && (
                                                    <span className="torneo-creador">{t('torneos.por')} {torneo.creador_nombre}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPaginas > 1 && (
                                <div className="paginacion-torneos">
                                    <button className="btn-pagina" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1}>
                                        {t('paginacion.anterior')}
                                    </button>
                                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                                        <button key={num} className={`btn-pagina ${paginaActual === num ? 'activa' : ''}`} onClick={() => setPaginaActual(num)}>
                                            {num}
                                        </button>
                                    ))}
                                    <button className="btn-pagina" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}>
                                        {t('paginacion.siguiente')}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}
                </section>
            )}

            {juegoActivo === 'saga' && <PrincipalSaga onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'warmaster' && <PrincipalWarmaster  onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'fow' && <PrincipalFow  onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'epic' && <PrincipalEpic onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'dracula' && <PrincipalDracula onOpenLogin={onOpenLogin} />}

            {/* INFO RANKING */}
            <section id="info-ranking" className="seccion-info-ranking">
                <h2>{t('ranking.info_titulo')}</h2>
                <div className="info-ranking-grid">
                    <div className="info-card"><span className="info-icono">📊</span><h3>{t('ranking.elo_titulo')}</h3><p>{t('ranking.elo_texto')}</p></div>
                    <div className="info-card"><span className="info-icono">🎯</span><h3>{t('ranking.cat_info_titulo')}</h3><p>{t('ranking.cat_info_texto')}</p></div>
                    <div className="info-card"><span className="info-icono">🔄</span><h3>{t('ranking.temp_titulo')}</h3><p>{t('ranking.temp_texto')}</p></div>
                    <div className="info-card"><span className="info-icono">🎮</span><h3>{t('ranking.multi_titulo')}</h3><p>{t('ranking.multi_texto')}</p></div>
                </div>
                <div className="categorias-elo">
                    <h3>{t('ranking.categorias_titulo')}</h3>
                    <div className="categorias-grid">
                        <div className="categoria-item gran-maestro"><span className="categoria-icono">👑</span><span className="categoria-nombre">{t('ranking.cat.gran_maestro')}</span><span className="categoria-rango">≥2400 ELO</span></div>
                        <div className="categoria-item maestro"><span className="categoria-icono">🥇</span><span className="categoria-nombre">{t('ranking.cat.maestro')}</span><span className="categoria-rango">≥2200 ELO</span></div>
                        <div className="categoria-item experto"><span className="categoria-icono">🥈</span><span className="categoria-nombre">{t('ranking.cat.experto')}</span><span className="categoria-rango">≥2000 ELO</span></div>
                        <div className="categoria-item avanzado"><span className="categoria-icono">🥉</span><span className="categoria-nombre">{t('ranking.cat.avanzado')}</span><span className="categoria-rango">≥1800 ELO</span></div>
                        <div className="categoria-item intermedio"><span className="categoria-icono">⭐</span><span className="categoria-nombre">{t('ranking.cat.intermedio')}</span><span className="categoria-rango">≥1600 ELO</span></div>
                        <div className="categoria-item principiante"><span className="categoria-icono">📚</span><span className="categoria-nombre">{t('ranking.cat.principiante')}</span><span className="categoria-rango">≥1400 ELO</span></div>
                        <div className="categoria-item novato"><span className="categoria-icono">🌱</span><span className="categoria-nombre">{t('ranking.cat.novato')}</span><span className="categoria-rango">&lt;1400 ELO</span></div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default Principal;
