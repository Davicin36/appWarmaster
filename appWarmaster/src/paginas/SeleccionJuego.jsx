import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import '../estilos/seleccionJuegos.css';

/**
 * Componente para seleccionar tipo de juego y modalidad antes de crear un torneo
 * Navega a rutas específicas según el juego y modalidad seleccionados
 */
function SeleccionJuego() {
    const navigate = useNavigate();

    const logoSaga = <img src="src/assets/logoSaga.webp" alt="logo de SAGA"  />
    const logoFow = <img src="src/assets/logoFow.webp" alt="logo de Flames of War"  />
    const logoWarmaster = <img src="src/assets/logoWarmaster.webp" alt="logo de WARMASTER"  />

    // Estados
    const [tiposJuego, setTiposJuego] = useState([]);
    const [juegoSeleccionado, setJuegoSeleccionado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ==========================================
    // CARGAR TIPOS DE JUEGO
    // ==========================================
    useEffect(() => {
        cargarTiposJuego();
    }, []);

    const cargarTiposJuego = () => {
        try {
            setLoading(true);
            setError('');
            
            // Configuración de juegos con rutas específicas
            const juegosDisponibles = [
                {
                    id: 1,
                    nombre: 'Warmaster',
                    descripcion: 'Juego de estrategia con miniaturas a escala 10mm',
                    imagen:  logoWarmaster,
                    soportaIndividual: true,
                    soportaEquipos: false,
                    ruta: '/crearTorneo/warmaster',
                    activo: true
                },
                {
                    id: 2,
                    nombre: 'SAGA',
                    descripcion: 'Juego de bandas ambientado en las diferentes épocas de la historia',
                    imagen:  logoSaga,
                    soportaIndividual: true,
                    soportaEquipos: true,
                    ruta: '/crearTorneo/saga',
                    activo: true
                },
                {
                    id: 3,
                    nombre: 'Flames of War',
                    descripcion: 'Juego de batallas de la II Guerra Mundial con miniaturas a escala 15mm',
                    imagen: logoFow,
                    soportaIndividual: true,
                    soportaEquipos: false,
                    ruta: '/crearTorneo/fow',
                    activo: true
                }
            ];
            
            setTiposJuego(juegosDisponibles);
            
        } catch (err) {
            console.error('Error al cargar tipos de juego:', err);
            setError('Error al cargar los tipos de juego');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // HANDLERS
    // ==========================================

    const handleSeleccionarJuego = (juego) => {
        // Si ya está seleccionado, deseleccionar
        if (juegoSeleccionado?.id === juego.id) {
            setJuegoSeleccionado(null);
        } else {
            setJuegoSeleccionado(juego);
        }
        setError('');
    };

    const handleCrearTorneo = () => {
        if (!juegoSeleccionado) {
            setError('Debes seleccionar un tipo de juego');
            return;
        }

        // Navegar a la ruta específica del juego con la modalidad como state
        navigate(juegoSeleccionado.ruta, {
            state: {
                nombreJuego: juegoSeleccionado.nombre
            }
        });
    };

    // ==========================================
    // RENDER
    // ==========================================

    if (loading) {
        return (
            <div className="seleccion-juego-container">
                <div className="loading">Cargando tipos de juego...</div>
            </div>
        );
    }

    return (
        <div className="seleccion-juego-container">
            <header className="seleccion-header">
                <h1>🎮 Crear Nuevo Torneo</h1>
                <p className="subtitle">Selecciona el tipo de juego para tu torneo</p>
            </header>

            {error && (
                <div className="error-banner">
                    ⚠️ {error}
                </div>
            )}

            {/* SELECCIÓN DE TIPO DE JUEGO */}
            <section className="seccion-paso">
                <div className="paso-header">
                    <h2>1. Selecciona el Tipo de Juego</h2>
                </div>

                <div className="juegos-grid">
                    {tiposJuego.filter(juego => juego.activo).map((juego) => (
                        <div
                            key={juego.id}
                            className={`juego-card ${juegoSeleccionado?.id === juego.id ? 'selected' : ''}`}
                            onClick={() => handleSeleccionarJuego(juego)}
                        >
                            <div className="juego-icon">{juego.imagen}</div>
                            <h3>{juego.nombre}</h3>
                            <p>{juego.descripcion}</p>

                            {juegoSeleccionado?.id === juego.id && (
                                <div className="check-selected">✓</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>


            {/* RESUMEN Y BOTÓN CREAR TORNEO */}
            {juegoSeleccionado  && (
                <div className="acciones-container">
                    <div className="juego-seleccionado-info">
                        <div className="info-item">
                            <span className="info-icon">🎮</span>
                            <span className="info-text">
                                Juego: <strong>{juegoSeleccionado.nombre}</strong>
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        className="btn-crear-torneo"
                        onClick={handleCrearTorneo}
                    >
                        Crear Torneo →
                    </button>
                </div>
            )}
        </div>
    );
}

export default SeleccionJuego;