import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import '../estilos/seleccionJuegos.css';

import logoSaga     from '../assets/logoSaga.webp';
import logoWarmaster from '../assets/logoWarmaster.webp';
import logoFow      from '../assets/logoFow.webp';
import logoBolt     from '../assets/logoBolt.webp';
import logoEpic     from '../assets/logoEpic.webp';
import logoDracula  from '../assets/logoDraculas.webp';

import Footer from '@/paginas/Footer.jsx';

function SeleccionJuego() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [juegoSeleccionado, setJuegoSeleccionado] = useState(null);
    const [error, setError] = useState('');

    // Se recalcula en cada render → se traduce automáticamente al cambiar idioma
    const tiposJuego = [
        {
            id: 1,
            nombre: 'Warmaster',
            descripcion: t('seleccion_juego.desc_warmaster'),
            imagen: logoWarmaster,
            ruta: '/crearTorneo/warmaster',
            activo: true
        },
        {
            id: 2,
            nombre: 'SAGA',
            descripcion: t('seleccion_juego.desc_saga'),
            imagen: logoSaga,
            ruta: '/crearTorneo/saga',
            activo: true
        },
        {
            id: 3,
            nombre: 'Flames of War',
            descripcion: t('seleccion_juego.desc_fow'),
            imagen: logoFow,
            ruta: '/crearTorneo/fow',
            activo: true
        },
        {
            id: 4,
            nombre: 'Bolt Action',
            descripcion: t('seleccion_juego.desc_bolt'),
            imagen: logoBolt,
            ruta: '/crearTorneo/bolt',
            activo: false
        },
        {
            id: 5,
            nombre: 'Epic Armageddon',
            descripcion: t('seleccion_juego.desc_epic'),
            imagen: logoEpic,
            ruta: '/crearTorneo/epic',
            activo: true
        },
        {
            id: 6,
            nombre: "Dracula's America",
            descripcion: t('seleccion_juego.desc_dracula'),
            imagen: logoDracula,
            ruta: '/crearTorneo/dracula',
            activo: true
        }
    ];

    const handleSeleccionarJuego = (juego) => {
        setJuegoSeleccionado(juegoSeleccionado?.id === juego.id ? null : juego);
        setError('');
    };

    const handleCrearTorneo = () => {
        if (!juegoSeleccionado) {
            setError(t('seleccion_juego.error_sin_seleccion'));
            return;
        }
        navigate(juegoSeleccionado.ruta, {
            state: { nombreJuego: juegoSeleccionado.nombre }
        });
    };

    return (
        <div className="seleccion-juego-container">
            <header className="seleccion-header">
                <h1>🎮 {t('seleccion_juego.titulo')}</h1>
                <p className="subtitle">{t('seleccion_juego.subtitulo')}</p>
            </header>

            {error && <div className="error-banner">⚠️ {error}</div>}

            <section className="seccion-paso">
                <div className="paso-header">
                    <h2>{t('seleccion_juego.paso1')}</h2>
                </div>

                <div className="juegos-grid">
                    {tiposJuego.filter(j => j.activo).map((juego) => (
                        <div
                            key={juego.id}
                            className={`juego-card ${juegoSeleccionado?.id === juego.id ? 'selected' : ''}`}
                            onClick={() => handleSeleccionarJuego(juego)}
                        >
                            <div className="juego-icon">
                                <img src={juego.imagen} alt={`logo ${juego.nombre}`} />
                            </div>
                            <h3>{juego.nombre}</h3>
                            <p>{juego.descripcion}</p>
                            {juegoSeleccionado?.id === juego.id && (
                                <div className="check-selected">✓</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {juegoSeleccionado && (
                <div className="acciones-container">
                    <div className="juego-seleccionado-info">
                        <div className="info-item">
                            <span className="info-icon">🎮</span>
                            <span className="info-text">
                                {t('seleccion_juego.juego_label')}: <strong>{juegoSeleccionado.nombre}</strong>
                            </span>
                        </div>
                    </div>
                    <button className="btn-crear-torneo" onClick={handleCrearTorneo}>
                        {t('seleccion_juego.btn_crear')}
                    </button>
                </div>
            )}

            <Footer />
        </div>
    );
}

export default SeleccionJuego;