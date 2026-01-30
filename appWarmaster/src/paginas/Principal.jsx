import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import PrincipalSaga from '@/componentesSaga/PrincipalSaga';
import PrincipalWarmaster from '@/componentesWarmaster/PrincipalWarmaster';
import PrincipalFow from '@/componentesFow/PrincipalFow';
import Footer from '@/paginas/Footer.jsx'

import vikingo from '../assets/vikingo.png';

import '../estilos/principal.css';

function Principal({ onOpenLogin }) {
    const [juegoActivo, setJuegoActivo] = useState('saga');
    const navigate = useNavigate()

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