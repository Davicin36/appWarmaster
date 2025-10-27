import { useNavigate } from "react-router-dom";
import React, { useState } from "react";


import '../estilos/crearTorneo.css';

function CrearTorneo() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Estados para TODOS los campos del formulario
    const [nombreTorneo, setNombreTorneo] = useState("");
    const [rondasMax, setRondasMax] = useState(3);
    const [epoca, setEpoca] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [puntosBanda, setPuntosBanda] = useState(6);
    const [partidaRonda1, setPartidaRonda1] = useState("");
    const [partidaRonda2, setPartidaRonda2] = useState("");
    const [partidaRonda3, setPartidaRonda3] = useState("");
    const [partidaRonda4, setPartidaRonda4] = useState("");
    const [partidaRonda5, setPartidaRonda5] = useState("");

    const epocaTorneo = [
        "Antigüedad",
        "Hannibal",
        "Vikingos",
        "Invasiones",
        "Cruzadas",
        "Caballeria",
        "Edad de la Magia",
        "Antigüedad/Hanibal",
        "Vikingos/Invasiones",
        "Cruzadas/Caballería",
    ];

    const tiposPartida = [
        "Choque de Bandas",
        "Conquista",
        "Avance",
        "Desacralización",
        "Captura"
    ];

    // Función para crear torneo
    const crearTorneo = async (torneoData) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return {
                    success: false,
                    error: 'No hay sesión activa'
                };
            }
            
            const response = await fetch('http://localhost:5000/api/torneos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(torneoData)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || 'Error al crear el torneo'
                };
            }

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error('Error en crearTorneo:', error);
            return {
                success: false,
                error: 'Error de conexión con el servidor'
            };
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validaciones del cliente
    if (!nombreTorneo.trim()) {
        setError("El nombre del torneo es obligatorio");
        setLoading(false);
        return;
    }

    if (!epoca) {
        setError("Debes seleccionar una época");
        setLoading(false);
        return;
    }

    if (!partidaRonda1 || !partidaRonda2 || !partidaRonda3) {
        setError("Debes seleccionar escenarios para las primeras 3 rondas");
        setLoading(false);
        return;
    }

    if (rondasMax >= 4 && !partidaRonda4) {
        setError("Debes seleccionar el escenario para la ronda 4");
        setLoading(false);
        return;
    }

    if (rondasMax >= 5 && !partidaRonda5) {
        setError("Debes seleccionar el escenario para la ronda 5");
        setLoading(false);
        return;
    }
    
    console.log("Iniciando creación del torneo...");
    
    try {
        // ✅ ELIMINAR LA CONVERSIÓN - El backend lo hace automáticamente
        const torneoData = {
            nombre_torneo: nombreTorneo,
            rondas_max: parseInt(rondasMax),
            epoca_torneo: epoca,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin || null,
            ubicacion: ubicacion || null,
            puntos_banda: parseInt(puntosBanda),
            partida_ronda_1: partidaRonda1,
            partida_ronda_2: partidaRonda2,
            partida_ronda_3: partidaRonda3,
            partida_ronda_4: rondasMax >= 4 ? partidaRonda4 : null,
            partida_ronda_5: rondasMax >= 5 ? partidaRonda5 : null
        };
        
        console.log("📤 Enviando datos del torneo:", torneoData);
        
        const result = await crearTorneo(torneoData);
        
        if (result.success) {
            console.log("✅ Torneo creado con éxito");
            alert(`¡Torneo "${nombreTorneo}" creado exitosamente!\nAhora eres un organizador.`);
            navigate("/");
        } else {
            setError(result.error || "Error al crear el Torneo");
        }
    } catch (err) {
        setError("Error de conexión. Intenta nuevamente.");
        console.error("Error:", err);
    } finally {
        setLoading(false);
    }
};

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div className="crear-torneo-container">
            <h1>Crear Torneo SAGA</h1>
            
            {error && (
                <div className="error-message" style={{
                    backgroundColor: '#fee',
                    color: '#c33',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '15px',
                    border: '1px solid #c33'
                }}>
                    ⚠️ {error}
                </div>
            )}
            
            <form className="torneo-form" onSubmit={handleSubmit}>
                {/* INFORMACIÓN BÁSICA */}
                <fieldset>
                    <legend>📋 Información Básica</legend>
                    
                    <label htmlFor="nombreTorneo">Nombre del Torneo:*</label>
                    <input 
                        name="nombreTorneo" 
                        id="nombreTorneo" 
                        type="text"
                        value={nombreTorneo}
                        onChange={(e) => setNombreTorneo(e.target.value)}
                        placeholder="Ej: Copa de Primavera SAGA 2025"
                        required
                        disabled={loading}
                    />
                    
                    <label htmlFor="epoca">Época del torneo:*</label>
                    <select
                        name="epoca"
                        id="epoca"
                        value={epoca}
                        onChange={(e) => setEpoca(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Selecciona una época</option>
                        {epocaTorneo.map((ep) => (
                            <option key={ep} value={ep}>
                                {ep}
                            </option>
                        ))}
                    </select>
                    
                    <label htmlFor="rondasMax">Número de Rondas:*</label>
                    <select
                        name="rondasMax"
                        id="rondasMax"
                        value={rondasMax}
                        onChange={(e) => setRondasMax(parseInt(e.target.value))}
                        required
                        disabled={loading}
                    >
                        <option value="3">3 Rondas</option>
                        <option value="4">4 Rondas</option>
                        <option value="5">5 Rondas</option>
                    </select>

                    <label htmlFor="puntosBanda">Puntos de Banda:*</label>
                    <input 
                        name="puntosBanda" 
                        id="puntosBanda" 
                        type="number"
                        min="4"
                        max="8"
                        value={puntosBanda}
                        onChange={(e) => setPuntosBanda(e.target.value)}
                        required
                        disabled={loading}
                    />
                </fieldset>

                {/* FECHAS Y UBICACIÓN */}
                <fieldset>
                    <legend>📅 Fechas y Ubicación</legend>
                    
                    <label htmlFor="fechaInicio">Fecha de Inicio:*</label>
                    <input 
                        name="fechaInicio" 
                        id="fechaInicio" 
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        disabled={loading}
                    />

                    <label htmlFor="fechaFin">Fecha de Fin:</label>
                    <input 
                        name="fechaFin" 
                        id="fechaFin" 
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        min={fechaInicio || new Date().toISOString().split('T')[0]}
                        disabled={loading}
                    />

                    <label htmlFor="ubicacion">Ubicación:</label>
                    <input 
                        name="ubicacion" 
                        id="ubicacion" 
                        type="text"
                        value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                        placeholder="Ciudad, Local, etc."
                        disabled={loading}
                    />
                </fieldset>

                {/* ESCENARIOS POR RONDA */}
                <fieldset>
                    <legend>🎲 Escenarios por Ronda</legend>

                    <label htmlFor="partidaRonda1">Ronda 1:*</label>
                    <select
                        name="partidaRonda1"
                        id="partidaRonda1"
                        value={partidaRonda1}
                        onChange={(e) => setPartidaRonda1(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Selecciona escenario</option>
                        {tiposPartida.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>

                    <label htmlFor="partidaRonda2">Ronda 2:*</label>
                    <select
                        name="partidaRonda2"
                        id="partidaRonda2"
                        value={partidaRonda2}
                        onChange={(e) => setPartidaRonda2(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Selecciona escenario</option>
                        {tiposPartida.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>

                    <label htmlFor="partidaRonda3">Ronda 3:*</label>
                    <select
                        name="partidaRonda3"
                        id="partidaRonda3"
                        value={partidaRonda3}
                        onChange={(e) => setPartidaRonda3(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Selecciona escenario</option>
                        {tiposPartida.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>

                    {rondasMax >= 4 && (
                        <>
                            <label htmlFor="partidaRonda4">Ronda 4:*</label>
                            <select
                                name="partidaRonda4"
                                id="partidaRonda4"
                                value={partidaRonda4}
                                onChange={(e) => setPartidaRonda4(e.target.value)}
                                required={rondasMax >= 4}
                                disabled={loading}
                            >
                                <option value="">Selecciona escenario</option>
                                {tiposPartida.map((tipo) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {rondasMax >= 5 && (
                        <>
                            <label htmlFor="partidaRonda5">Ronda 5:*</label>
                            <select
                                name="partidaRonda5"
                                id="partidaRonda5"
                                value={partidaRonda5}
                                onChange={(e) => setPartidaRonda5(e.target.value)}
                                required={rondasMax >= 5}
                                disabled={loading}
                            >
                                <option value="">Selecciona escenario</option>
                                {tiposPartida.map((tipo) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </>
                    )}
                </fieldset>

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? "⏳ Creando..." : "✅ Crear Torneo"}
                    </button>
                    
                    <button type="button" onClick={volverInicio} disabled={loading} className="btn-secondary">
                        ← Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CrearTorneo;