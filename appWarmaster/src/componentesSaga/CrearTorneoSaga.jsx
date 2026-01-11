import { useNavigate } from "react-router-dom";
import React, { useState, useEffect} from "react";
import { useAuth } from "../servicios/AuthContext.jsx";

import torneosSagaApi from '../servicios/apiSaga.js';

import {
    EPOCAS_SAGA,
    TIPOS_PARTIDA_SAGA,
    RONDAS_DISPONIBLES,
    PUNTOS_BANDA_RANGO,
    PARTICIPANTES_RANGO,
    EQUIPOS_RANGO,
    JUGADORES_EQUIPO_RANGO
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga.js';
import Footer from '@/paginas/Footer.jsx'

import '../estilos/crearTorneo.css';

function CrearTorneoSaga() {
    const navigate = useNavigate();
    const {refrescarUsuario} = useAuth()

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [nombreTorneo, setNombreTorneo] = useState("");
    const [tipoTorneo, settipoTorneo] = useState("Individual");
   const [numJugadoresEquipo, setNumJugadoresEquipo] = useState(JUGADORES_EQUIPO_RANGO.default);
    const [rondasMax, setRondasMax] = useState(RONDAS_DISPONIBLES[0].valor);
    const [epocasSeleccionadas, setEpocasSeleccionadas] = useState([]); 
    const [fechaInicio, setFechaInicio] = useState("");
    const [duracionTorneo, setDuracionTorneo] = useState("1");
    const [fechaFin, setFechaFin] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    const [puntosBanda, setPuntosBanda] = useState(PUNTOS_BANDA_RANGO.default);
    const [participantesMax, setParticipantesMax] = useState(PARTICIPANTES_RANGO.default); 
    const [equiposMax, setEquiposMax] = useState(EQUIPOS_RANGO.default);
    const [archivoPDF, setArchivoPDF] = useState(null); 
    const [partidaRonda1, setPartidaRonda1] = useState("");
    const [partidaRonda2, setPartidaRonda2] = useState("");
    const [partidaRonda3, setPartidaRonda3] = useState("");
    const [partidaRonda4, setPartidaRonda4] = useState("");
    const [partidaRonda5, setPartidaRonda5] = useState("");

    //ESTADOS PARA LOS ORGANIZADORES DEL TORNEO
    const [organizadorAdicional, setOrganizadorAdicional] = useState("");
    const [emailOrganizador, setEmailOrganizador] = useState("");


    useEffect(() => {
    if (tipoTorneo === "Por equipos") {
        setParticipantesMax(equiposMax * numJugadoresEquipo);
    }
}, [equiposMax, numJugadoresEquipo, tipoTorneo]);

    const handleEpocaSeleccion = (epoca) => {
        if (tipoTorneo === "Individual") {
            // Modo individual: solo una época (radio button behavior)
            setEpocasSeleccionadas([epoca]);
        } else {
            // Modo por equipos: múltiples épocas (checkboxes)
            if (epocasSeleccionadas.includes(epoca)) {
                // Si ya está seleccionada, la quitamos
                setEpocasSeleccionadas(epocasSeleccionadas.filter(e => e !== epoca));
            } else {
                // Si no está, verificamos el límite
                if (epocasSeleccionadas.length < numJugadoresEquipo) {
                    setEpocasSeleccionadas([...epocasSeleccionadas, epoca]);
                } else {
                    setError(`Solo puedes seleccionar ${numJugadoresEquipo} épocas (una por jugador)`);
                    setTimeout(() => setError(""), 3000);
                }
            }
        }
    };

    const handleReseteaEpocas = (tipo) => {
        settipoTorneo(tipo);
        setEpocasSeleccionadas([]); // Resetear épocas al cambiar tipo
    };

    const handleAnadirOrganizador = () => {
        
        const emailCorto = emailOrganizador.trim().toLowerCase()

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(emailCorto)){
            setError("Introduce un email valido")
            setTimeout(() => setError(""), 3000);
            return
        }

        if (organizadorAdicional.length >= 5) {
            setError("Solo se puede añadir un máximo de 5 organizadores adicionales por torneo")
            setTimeout(() => setError(""), 3000);
            return
        }

        setOrganizadorAdicional([...organizadorAdicional, emailCorto]);
        setEmailOrganizador("");
        setError("")
    };

     const handleEliminarOrganizador = (email) => {
        setOrganizadorAdicional(organizadorAdicional.filter(org => org !== email));
    };

    // 🆕 MANEJAR ENTER EN EL INPUT
    const handleKeyPressOrganizador = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAnadirOrganizador();
        }
    }

    // Función para manejar la selección de archivo PDF
   const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            setArchivoPDF(null);
            return;
        }
        
        // Validar que sea PDF
        if (file.type !== 'application/pdf') {
            setError('⚠️ Solo se permiten archivos PDF');
            e.target.value = '';
            setArchivoPDF(null);
            setTimeout(() => setError(''), 4000);
            return;
        }
        
        // Validar tamaño (máximo 5MB)
        const maxSize =16 * 1024 * 1024; // 16MB en bytes
        if (file.size > maxSize) {
            const tamañoMB = (file.size / 1024 / 1024).toFixed(2);
            setError(`⚠️ El archivo PDF (${tamañoMB}MB) supera el tamaño máximo de 5MB. Por favor, comprime el PDF o sube uno más pequeño.`);
            e.target.value = '';
            setArchivoPDF(null);
            setTimeout(() => setError(''), 5000);
            return;
        }
        
        setArchivoPDF(file);
        setError('');
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

        if (epocasSeleccionadas.length === 0) {
            setError("Debes seleccionar al menos una época");
            setLoading(false);
            return;
        }

        if (tipoTorneo === "Individual" && epocasSeleccionadas.length !== 1) {
            setError("Debes seleccionar exactamente una época para torneo individual");
            setLoading(false);
            return;
        }

        if (tipoTorneo === "Por equipos") {
            if (epocasSeleccionadas.length < numJugadoresEquipo) {
                setError(`Debes seleccionar al menos ${numJugadoresEquipo} épocas para ${numJugadoresEquipo} jugadores por equipo`);
                setLoading(false);
                return;
            }
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

        if (participantesMax < PARTICIPANTES_RANGO.min || participantesMax > PARTICIPANTES_RANGO.max) {
            setError(`El número de participantes debe estar entre ${PARTICIPANTES_RANGO.min} y ${PARTICIPANTES_RANGO.max}`);
            setLoading(false);
            return;
        }

        if (equiposMax < EQUIPOS_RANGO.min || equiposMax > EQUIPOS_RANGO.max) {
            setError(`El número de equipos debe estar entre ${EQUIPOS_RANGO.min} y ${EQUIPOS_RANGO.max}`);
            setLoading(false);
            return;
        }
               
        try {
            let torneoData;
            
            //AÑADIENDO BASES PDF AL FORMDATA
            if (archivoPDF) {
                torneoData = new FormData();
                torneoData.append('nombre_torneo', nombreTorneo);
                torneoData.append('tipo_torneo', tipoTorneo);
                if (tipoTorneo === "Por equipos") {
                    torneoData.append('num_jugadores_equipo', parseInt(numJugadoresEquipo));
                }
                torneoData.append('rondas_max', parseInt(rondasMax));
                torneoData.append('epocas_disponibles', JSON.stringify(epocasSeleccionadas));
                torneoData.append('fecha_inicio', fechaInicio);
                torneoData.append('fecha_fin', fechaFin || '');
                torneoData.append('ubicacion', ubicacion || '');
                torneoData.append('puntos_banda', parseInt(puntosBanda));
                torneoData.append('participantes_max', parseInt(participantesMax));
                torneoData.append('equipos_max', parseInt(equiposMax));
                torneoData.append('partida_ronda_1', partidaRonda1);
                torneoData.append('partida_ronda_2', partidaRonda2);
                torneoData.append('partida_ronda_3', partidaRonda3);
                torneoData.append('partida_ronda_4', rondasMax >= 4 ? partidaRonda4 : '');
                torneoData.append('partida_ronda_5', rondasMax >= 5 ? partidaRonda5 : '');
                torneoData.append('bases_pdf', archivoPDF);
                torneoData.append('organizadores_adicionales', JSON.stringify(organizadorAdicional))
                
            } else {
                //CUANDO NO SE AÑADEN BASES PDF
                torneoData = {
                    nombre_torneo: nombreTorneo,
                    tipo_torneo: tipoTorneo,
                    num_jugadores_equipo: tipoTorneo === "Por equipos" ? parseInt(numJugadoresEquipo) : null,
                    rondas_max: parseInt(rondasMax),
                    epocas_disponibles: epocasSeleccionadas,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin || null,
                    ubicacion: ubicacion || null,
                    puntos_banda: parseInt(puntosBanda),
                    participantes_max: parseInt(participantesMax),
                    equipos_max: parseInt(equiposMax),
                    partida_ronda_1: partidaRonda1,
                    partida_ronda_2: partidaRonda2,
                    partida_ronda_3: partidaRonda3,
                    partida_ronda_4: rondasMax >= 4 ? partidaRonda4 : null,
                    partida_ronda_5: rondasMax >= 5 ? partidaRonda5 : null,
                    organizadores_emails: organizadorAdicional
                };
            }

            const result = await torneosSagaApi.crearTorneo(torneoData);
            
            if (result.success || result.data) {
                const mensajeOrganizadores = organizadorAdicional.length > 0 
                    ? `\n👥 ${organizadorAdicional.length} organizador(es) adicional(es) añadido(s).`
                    : '';
                    
                alert(`✅ ¡Torneo "${nombreTorneo}" creado exitosamente!${archivoPDF ? '\n📄 Bases PDF subidas correctamente.' : ''}${mensajeOrganizadores}\n🎉 Ahora eres un organizador.`);
                navigate("/");
                await refrescarUsuario()
                navigate("/perfil")
            } else {
                throw new Error(result.error || "Error desconocido al crear el torneo");
            }
            
        } catch (err) {
            console.error("❌ Error completo:", err);
            
            let mensajeError = "Error al crear el torneo. Por favor, intenta nuevamente.";
            
            if (err.message) {
                if (err.message.includes('max_allowed_packet')) {
                    mensajeError = "⚠️ El archivo PDF es demasiado grande para el servidor. Por favor, comprime el PDF o contacta al administrador.";
                } else if (err.message.includes('LIMIT_FILE_SIZE')) {
                    mensajeError = "⚠️ El archivo PDF excede el tamaño máximo permitido (16MB). Por favor, comprime el archivo.";
                } else if (err.message.includes('Network') || err.message.includes('fetch')) {
                    mensajeError = "⚠️ Error de conexión con el servidor. Verifica tu conexión a internet.";
                } else if (err.message.includes('timeout')) {
                    mensajeError = "⚠️ La solicitud tardó demasiado. El archivo puede ser muy grande o el servidor está lento.";
                } else {
                    mensajeError = `⚠️ ${err.message}`;
                }
            }
            
            setError(mensajeError);
            setTimeout(() => {
                setError('');
            }, 8000);
            
        } finally {
            setLoading(false);
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    const handleEliminarPDF = () => {
        setArchivoPDF(null);
        // Limpiar el input file
        const fileInput = document.getElementById('basesPDF');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <div className="crear-torneo-container">
            <h1>⚔️ Crear Torneo SAGA</h1>
            
            {error && (
                <div className="error-message">
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

                    <label>Tipo de Torneo:*</label>
                    <div className="tipo-torneo-container">
                        <label className="tipo-torneo-option">
                            <input
                                type="radio"
                                name="tipoTorneo"
                                value="Individual"
                                checked={tipoTorneo === "Individual"}
                                onChange={(e) => handleReseteaEpocas(e.target.value)}
                                disabled={loading}
                            />
                            👤 Individual
                        </label>
                        <label className="tipo-torneo-option">
                            <input
                                type="radio"
                                name="tipoTorneo"
                                value="Por equipos"
                                checked={tipoTorneo === "Por equipos"}
                                onChange={(e) => handleReseteaEpocas(e.target.value)}
                                disabled={loading}
                            />
                            👥 Por Equipos
                        </label>
                    </div>

                    {tipoTorneo === "Por equipos" && (
                        <>
                            <label htmlFor="numJugadoresEquipo">Jugadores por Equipo:*</label>
                            <select
                                name="numJugadoresEquipo"
                                id="numJugadoresEquipo"
                                value={numJugadoresEquipo}
                                onChange={(e) => {
                                    const nuevoValor = parseInt(e.target.value);
                                    setNumJugadoresEquipo(nuevoValor);
                                    setEpocasSeleccionadas([]); // reset épocas
                                }}
                                required
                                disabled={loading}
                            >
                                {Array.from(
                                    { length: JUGADORES_EQUIPO_RANGO.max - JUGADORES_EQUIPO_RANGO.min + 1 },
                                    (_, i) => JUGADORES_EQUIPO_RANGO.min + i
                                ).map((num) => (
                                    <option key={num} value={num}>
                                        {num} Jugadores
                                    </option>
                                ))}
                            </select>
                            <small className="help-text">
                                Cada jugador del equipo jugará una época diferente
                            </small>
                        </>
                    )}
                    
                    
                    <label>
                        {tipoTorneo === "Individual" ? "Época del Torneo:*" : "Épocas Disponibles:*"}
                        {tipoTorneo === "Por equipos" && (
                            <small className="label-hint">
                                (Selecciona {numJugadoresEquipo} épocas)
                            </small>
                        )}
                    </label>
                    <div className="epocas-grid">
                        {EPOCAS_SAGA.map((epoca) => (
                            <label key={epoca} className="epoca-option">
                                <input
                                    type={tipoTorneo === "Individual" ? "radio" : "checkbox"}
                                    name={tipoTorneo === "Individual" ? "epocaIndividual" : undefined}
                                    checked={epocasSeleccionadas.includes(epoca)}
                                    onChange={() => handleEpocaSeleccion(epoca)}
                                    disabled={loading}
                                />
                                {epoca}
                            </label>
                        ))}
                    </div>
                    {epocasSeleccionadas.length > 0 && (
                        <div className="epocas-seleccionadas">
                            {tipoTorneo === "Individual" ? (
                                <>✅ Época seleccionada: <strong>{epocasSeleccionadas[0]}</strong></>
                            ) : (
                                <>
                                    ✅ {epocasSeleccionadas.length}/{numJugadoresEquipo} época(s) seleccionada(s): 
                                    <strong> {epocasSeleccionadas.join(', ')}</strong>
                                </>
                            )}
                        </div>
                    )}
                    
                    <label htmlFor="rondasMax">Número de Rondas:*</label>
                    <select
                        name="rondasMax"
                        id="rondasMax"
                        value={rondasMax}
                        onChange={(e) => setRondasMax(parseInt(e.target.value))}
                        required
                        disabled={loading}
                    >
                        {RONDAS_DISPONIBLES.map(ronda => (
                            <option key={ronda.valor} value={ronda.valor}>
                                {ronda.nombre}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="puntosBanda">Puntos de Banda:*</label>
                    <input 
                        name="puntosBanda" 
                        id="puntosBanda" 
                        type="number"
                        min={PUNTOS_BANDA_RANGO.min}
                        max={PUNTOS_BANDA_RANGO.max}
                        value={puntosBanda}
                        onChange={(e) => setPuntosBanda(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <small className="help-text">
                        Entre {PUNTOS_BANDA_RANGO.min} y {PUNTOS_BANDA_RANGO.max} puntos
                    </small>

                    <label htmlFor="participantesMax">Participantes Máximos:*</label>
                    <input 
                        name="participantesMax" 
                        id="participantesMax" 
                        type="number"
                        min={PARTICIPANTES_RANGO.min}
                        max={PARTICIPANTES_RANGO.max}
                         value={participantesMax}
                        onChange={(e) => setParticipantesMax(e.target.value)}
                        placeholder="Ej: 16, 24, 32"
                        required
                        disabled={tipoTorneo === "Por equipos" || loading}
                    />
                    <small className="help-text">
                        Mínimo {PARTICIPANTES_RANGO.min}, máximo {PARTICIPANTES_RANGO.max} participantes
                    </small>
                    
                    {tipoTorneo === "Por equipos" && (
                        <>
                            <label htmlFor="equiposMax">Equipos Máximos:*</label>
                            <input
                                name="equiposMax"
                                id="equiposMax"
                                type="number"
                                min={EQUIPOS_RANGO.min }
                                max={EQUIPOS_RANGO.max }
                                value={equiposMax}
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setEquiposMax(value);

                                    if (tipoTorneo === "Por equipos") {
                                        setParticipantesMax(value * numJugadoresEquipo);
                                    }
                                }}
                                placeholder="Ej: 4, 10, 20"
                                required = {tipoTorneo === "Por equipos"}
                                disabled={loading}
                            />
                            <small className="help-text">
                                Mínimo {EQUIPOS_RANGO.min}, máximo {EQUIPOS_RANGO.max} equipos
                            </small>
                        </>
                    )}
                </fieldset>

                {/* FECHAS Y UBICACIÓN */}
                <fieldset>
                    <legend>📅 Fechas y Ubicación</legend>
                    
                    <label>Duración del Torneo:*</label>
                    <div className="duracion-torneo-container">
                        <label className="duracion-option">
                            <input
                                type="radio"
                                name="duracionTorneo"
                                value="1"
                                checked={duracionTorneo === "1"}
                                onChange={(e) => {
                                    setDuracionTorneo(e.target.value);
                                    setFechaFin(""); // Limpiar fecha fin
                                }}
                                disabled={loading}
                            />
                            📅 Un día
                        </label>
                        <label className="duracion-option">
                            <input
                                type="radio"
                                name="duracionTorneo"
                                value="2"
                                checked={duracionTorneo === "2"}
                                onChange={(e) => setDuracionTorneo(e.target.value)}
                                disabled={loading}
                            />
                            📅 Dos días o más días
                        </label>
                    </div>

                    {duracionTorneo === "1" ? (
                        <>
                            <label htmlFor="fechaInicio">Fecha del Torneo:*</label>
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
                            <small className="help-text">
                                🗓️ El torneo se celebrará en un solo día
                            </small>
                        </>
                    ) : (
                        <>
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

                            <label htmlFor="fechaFin">Fecha de Fin:*</label>
                            <input 
                                name="fechaFin" 
                                id="fechaFin" 
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                min={fechaInicio || new Date().toISOString().split('T')[0]}
                                required
                                disabled={loading}
                            />
                            <small className="help-text">
                                🗓️ El torneo se celebrará durante 2 o más días.
                            </small>
                        </>
                    )}

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

                {/* BASES PDF */}
                <fieldset>
                    <legend>📄 Bases del Torneo (Opcional)</legend>
                    
                    {!archivoPDF ? (
                        <>
                            <label htmlFor="basesPDF">Subir Bases en PDF:</label>
                            <input 
                                name="basesPDF" 
                                id="basesPDF" 
                                type="file"
                                accept=".pdf"
                                onChange={handleArchivoPDF}
                                disabled={loading}
                            />
                            <small className="help-text-file">
                                📎 Formato: PDF | Tamaño máximo: 16MB
                            </small>
                        </>
                    ) : (
                        <div className="archivo-seleccionado-container">
                            <div className="archivo-info">
                                <p className="archivo-nombre">
                                    ✅ <strong>Archivo seleccionado:</strong> {archivoPDF.name}
                                </p>
                                <p className="archivo-tamaño">
                                    📦 Tamaño: {(archivoPDF.size / 1024).toFixed(2)} KB 
                                    ({(archivoPDF.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleEliminarPDF}
                                className="btn-eliminar-pdf"
                                disabled={loading}
                            >
                                🗑️ Eliminar archivo
                            </button>
                        </div>
                    )}
                </fieldset>

                {/* 🆕 SECCIÓN DE ORGANIZADORES ADICIONALES */}
                <fieldset>
                    <legend>👥 Organizadores Adicionales (Opcional)</legend>
                    
                    <label htmlFor="emailOrganizador">Añadir Organizador por Email:</label>
                    <div className="organizador-input-container">
                        <input 
                            name="emailOrganizador" 
                            id="emailOrganizador" 
                            type="email"
                            value={emailOrganizador}
                            onChange={(e) => setEmailOrganizador(e.target.value)}
                            onKeyPress={handleKeyPressOrganizador}
                            placeholder="correo@ejemplo.com"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={handleAnadirOrganizador}
                            className="btn-añadir-organizador"
                            disabled={loading || !emailOrganizador.trim()}
                        >
                            ➕ Añadir
                        </button>
                    </div>
                    <small className="help-text">
                        Presiona Enter o haz clic en "Añadir" para agregar un organizador. Máximo 5 organizadores adicionales.
                    </small>

                    {/* LISTA DE ORGANIZADORES */}
                    {organizadorAdicional.length > 0 && (
                        <div className="organizadores-lista">
                            <p className="organizadores-titulo">
                                <strong>Organizadores añadidos ({organizadorAdicional.length}/5):</strong>
                            </p>
                            <ul className="organizadores-items">
                                {organizadorAdicional.map((email, index) => (
                                    <li key={index} className="organizador-item">
                                        <span className="organizador-email">📧 {email}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarOrganizador(email)}
                                            className="btn-eliminar-organizador"
                                            disabled={loading}
                                            title="Eliminar organizador"
                                        >
                                            ✖️
                                        </button>
                                    </li>
                                ))}
                            </ul>
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
                        {TIPOS_PARTIDA_SAGA.map((tipo) => (
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
                        {TIPOS_PARTIDA_SAGA.map((tipo) => (
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
                        {TIPOS_PARTIDA_SAGA.map((tipo) => (
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
                                {TIPOS_PARTIDA_SAGA.map((tipo) => (
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
                                {TIPOS_PARTIDA_SAGA.map((tipo) => (
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
            <Footer /> 
        </div>
    );
}

export default CrearTorneoSaga;