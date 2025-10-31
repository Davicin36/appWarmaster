import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import torneosSagaApi from '../servicios/apiSaga.js';
import '../estilos/crearTorneo.css';

function CrearTorneo() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // 🆕 CAMBIO 1: Agregado estado para participantes_max y archivo PDF
    const [nombreTorneo, setNombreTorneo] = useState("");
    const [rondasMax, setRondasMax] = useState(3);
    const [epoca, setEpoca] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [puntosBanda, setPuntosBanda] = useState(6);
    const [participantesMax, setParticipantesMax] = useState(16); // 🆕 NUEVO
    const [archivoPDF, setArchivoPDF] = useState(null); // 🆕 NUEVO
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

    // 🆕 CAMBIO 2: Función para manejar la selección de archivo PDF
    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar que sea PDF
            if (file.type !== 'application/pdf') {
                setError('Solo se permiten archivos PDF');
                e.target.value = '';
                return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('El archivo PDF no puede superar los 5MB');
                e.target.value = '';
                return;
            }
            
            setArchivoPDF(file);
            setError(''); // Limpiar error si había
            console.log('📄 PDF seleccionado:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
        }
    };

    // 🆕 CAMBIO 3: Actualizada la función handleSubmit para usar FormData y torneosSagaApi
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

        if (!fechaInicio) {
            setError("La fecha de inicio es obligatoria");
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

        if (participantesMax < 4 || participantesMax > 100) {
            setError("El número de participantes debe estar entre 4 y 100");
            setLoading(false);
            return;
        }
        
        console.log("📤 Iniciando creación del torneo...");
        
        try {
            // 🔧 CAMBIO 4: Usar FormData cuando hay PDF, JSON cuando no hay
            let torneoData;
            
            if (archivoPDF) {
                // Si hay PDF, usar FormData
                console.log("📄 Preparando FormData con PDF...");
                torneoData = new FormData();
                torneoData.append('nombre_torneo', nombreTorneo);
                torneoData.append('rondas_max', parseInt(rondasMax));
                torneoData.append('epoca_torneo', epoca);
                torneoData.append('fecha_inicio', fechaInicio);
                torneoData.append('fecha_fin', fechaFin || '');
                torneoData.append('ubicacion', ubicacion || '');
                torneoData.append('puntos_banda', parseInt(puntosBanda));
                torneoData.append('participantes_max', parseInt(participantesMax));
                torneoData.append('partida_ronda_1', partidaRonda1);
                torneoData.append('partida_ronda_2', partidaRonda2);
                torneoData.append('partida_ronda_3', partidaRonda3);
                torneoData.append('partida_ronda_4', rondasMax >= 4 ? partidaRonda4 : '');
                torneoData.append('partida_ronda_5', rondasMax >= 5 ? partidaRonda5 : '');
                torneoData.append('bases_pdf', archivoPDF);
            } else {
                // Si no hay PDF, usar JSON normal
                console.log("📝 Preparando datos JSON sin PDF...");
                torneoData = {
                    nombre_torneo: nombreTorneo,
                    rondas_max: parseInt(rondasMax),
                    epoca_torneo: epoca,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin || null,
                    ubicacion: ubicacion || null,
                    puntos_banda: parseInt(puntosBanda),
                    participantes_max: parseInt(participantesMax),
                    partida_ronda_1: partidaRonda1,
                    partida_ronda_2: partidaRonda2,
                    partida_ronda_3: partidaRonda3,
                    partida_ronda_4: rondasMax >= 4 ? partidaRonda4 : null,
                    partida_ronda_5: rondasMax >= 5 ? partidaRonda5 : null
                };
            }
            
            console.log("📤 Enviando datos del torneo...");
            
            // 🔧 CAMBIO 5: Usar torneosSagaApi en lugar de fetch directo
            const result = await torneosSagaApi.createTorneo(torneoData);
            
            console.log("✅ Respuesta del servidor:", result);
            
            if (result.success || result.data) {
                console.log("✅ Torneo creado con éxito");
                alert(`¡Torneo "${nombreTorneo}" creado exitosamente!\n${archivoPDF ? 'Bases PDF subidas correctamente.\n' : ''}Ahora eres un organizador.`);
                navigate("/");
            } else {
                setError(result.error || "Error al crear el Torneo");
            }
        } catch (err) {
            console.error("❌ Error completo:", err);
            setError(err.message || "Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div className="crear-torneo-container">
            <h1>⚔️ Crear Torneo SAGA</h1>
            
            {error && (
                <div className="error-message" style={{
                    backgroundColor: '#fee',
                    color: '#c33',
                    padding: '15px',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    border: '1px solid #c33',
                    fontWeight: 'bold'
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

                    {/* 🆕 CAMBIO 6: Nuevo campo para participantes máximos */}
                    <label htmlFor="participantesMax">Participantes Máximos:*</label>
                    <input 
                        name="participantesMax" 
                        id="participantesMax" 
                        type="number"
                        min="4"
                        max="100"
                        value={participantesMax}
                        onChange={(e) => setParticipantesMax(e.target.value)}
                        placeholder="Ej: 16, 24, 32"
                        required
                        disabled={loading}
                    />
                    <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginTop: '-10px' }}>
                        Mínimo 4, máximo 100 participantes
                    </small>
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

                {/* 🆕 CAMBIO 7: Nueva sección para bases PDF */}
                <fieldset>
                    <legend>📄 Bases del Torneo (Opcional)</legend>
                    
                    <label htmlFor="basesPDF">Subir Bases en PDF:</label>
                    <input 
                        name="basesPDF" 
                        id="basesPDF" 
                        type="file"
                        accept=".pdf"
                        onChange={handleArchivoPDF}
                        disabled={loading}
                        style={{
                            padding: '10px',
                            border: '2px dashed #4a7c2e',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            backgroundColor: '#f9f9f9'
                        }}
                    />
                    <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginTop: '5px' }}>
                        📎 Formato: PDF | Tamaño máximo: 5MB
                    </small>
                    
                    {archivoPDF && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px',
                            background: '#e8f5e9',
                            border: '1px solid #4caf50',
                            borderRadius: '5px',
                            color: '#2e7d32'
                        }}>
                            ✅ Archivo seleccionado: <strong>{archivoPDF.name}</strong> 
                            ({(archivoPDF.size / 1024).toFixed(2)} KB)
                        </div>
                    )}
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