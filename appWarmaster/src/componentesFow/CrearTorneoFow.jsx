import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useAuth } from "../servicios/AuthContext.jsx";

import torneosFowApi from '../servicios/apiFow.js';

import {
    EPOCAS_HISTORICA,
    PUNTOS_EJERCITO_FOW,
    TIPOS_PARTIDA_FOW,
    RONDAS_DISPONIBLES,
    PARTICIPANTES_RANGO,
} from '@/componentesFow/funcionesFow/constantesFuncionesFow.js';
import Footer from '@/paginas/Footer.jsx';

import '../estilos/crearTorneo.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const nuevoFrenteVacio = (rondasMax) => ({
    nombre: "",
    escenarios: Object.fromEntries(
        Array.from({ length: rondasMax }, (_, i) => [i + 1, ""])
    ),
});

// ─────────────────────────────────────────────────────────────────────────────

function CrearTorneofow() {
    const navigate = useNavigate();
    const { refrescarUsuario } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");

    // ── Campos básicos ────────────────────────────────────────────
    const [nombreTorneo,      setNombreTorneo]      = useState("");
    const tipoTorneo = "Individual";
    const [rondasMax,         setRondasMax]          = useState(RONDAS_DISPONIBLES[0].valor);
    const [epocaSeleccionada, setEpocaSeleccionada]  = useState("");
    const [duracionTorneo,    setDuracionTorneo]     = useState("1");
    const [fechaInicio,       setFechaInicio]        = useState("");
    const [fechaFin,          setFechaFin]           = useState("");
    const [ubicacion,         setUbicacion]          = useState("");
    const [puntosEjercito,    setPuntosEjercito]     = useState(PUNTOS_EJERCITO_FOW.default);
    const [participantesMax,  setParticipantesMax]   = useState(PARTICIPANTES_RANGO.default);

    // ── Archivos ──────────────────────────────────────────────────
    const [imagenCartel, setImagenCartel] = useState(null);
    const [vistaPrevia,  setVistaPrevia]  = useState(null);
    const [archivoPDF,   setArchivoPDF]   = useState(null);

    // ── Escenarios sin frentes ────────────────────────────────────
    const [partidaRonda1, setPartidaRonda1] = useState("");
    const [partidaRonda2, setPartidaRonda2] = useState("");
    const [partidaRonda3, setPartidaRonda3] = useState("");
    const [partidaRonda4, setPartidaRonda4] = useState("");
    const [partidaRonda5, setPartidaRonda5] = useState("");

    // ── Organizadores ─────────────────────────────────────────────
    const [organizadoresAdicionales, setOrganizadoresAdicionales] = useState([]);
    const [emailOrganizador,         setEmailOrganizador]          = useState("");

    // ── Frentes ───────────────────────────────────────────────────
    const [usaFrentes, setUsaFrentes] = useState(false);
    const [frentes,    setFrentes]    = useState([nuevoFrenteVacio(RONDAS_DISPONIBLES[0].valor)]);

    // ─────────────────────────────────────────────────────────────
    // Handlers: rondas (sincroniza frentes al cambiar)
    // ─────────────────────────────────────────────────────────────
    const handleRondasMax = (valor) => {
        const num = parseInt(valor);
        setRondasMax(num);
        setFrentes(prev =>
            prev.map(f => ({
                ...f,
                escenarios: Object.fromEntries(
                    Array.from({ length: num }, (_, i) => [i + 1, f.escenarios[i + 1] || ""])
                ),
            }))
        );
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: toggle frentes
    // ─────────────────────────────────────────────────────────────
    const handleToggleFrentes = (e) => {
        const activo = e.target.checked;
        setUsaFrentes(activo);
        if (activo && frentes.length === 0) {
            setFrentes([nuevoFrenteVacio(rondasMax)]);
        }
    };

    const handleAddFrente = () => {
        if (frentes.length >= 6) {
            mostrarError("Máximo 6 frentes por torneo"); return;
        }
        setFrentes(prev => [...prev, nuevoFrenteVacio(rondasMax)]);
    };

    const handleRemoveFrente = (idx) => {
        setFrentes(prev => prev.filter((_, i) => i !== idx));
    };

    const handleNombreFrente = (idx, valor) => {
        setFrentes(prev =>
            prev.map((f, i) => i === idx ? { ...f, nombre: valor } : f)
        );
    };

    const handleEscenarioFrente = (idx, ronda, valor) => {
        setFrentes(prev =>
            prev.map((f, i) =>
                i === idx ? { ...f, escenarios: { ...f.escenarios, [ronda]: valor } } : f
            )
        );
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: imagen
    // ─────────────────────────────────────────────────────────────
    const handleImagenCartel = (e) => {
        const file = e.target.files[0];
        if (!file) { setImagenCartel(null); setVistaPrevia(null); return; }

        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            mostrarError('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
            e.target.value = ''; setImagenCartel(null); setVistaPrevia(null); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            mostrarError('La imagen supera el tamaño máximo de 5MB.');
            e.target.value = ''; setImagenCartel(null); setVistaPrevia(null); return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setVistaPrevia(reader.result);
        reader.readAsDataURL(file);
        setImagenCartel(file);
    };

    const handleEliminarImagen = () => {
        setImagenCartel(null); setVistaPrevia(null);
        const fi = document.getElementById('imagenCartel');
        if (fi) fi.value = '';
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: PDF
    // ─────────────────────────────────────────────────────────────
    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (!file) { setArchivoPDF(null); return; }
        if (file.type !== 'application/pdf') {
            mostrarError('Solo se permiten archivos PDF');
            e.target.value = ''; setArchivoPDF(null); return;
        }
        if (file.size > 16 * 1024 * 1024) {
            mostrarError('El PDF supera el tamaño máximo de 16MB.');
            e.target.value = ''; setArchivoPDF(null); return;
        }
        setArchivoPDF(file);
    };

    const handleEliminarPDF = () => {
        setArchivoPDF(null);
        const fi = document.getElementById('basesPDF');
        if (fi) fi.value = '';
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: organizadores
    // ─────────────────────────────────────────────────────────────
    const handleAnadirOrganizador = () => {
        const emailCorto = emailOrganizador.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCorto)) {
            mostrarError("Introduce un email válido"); return;
        }
        if (organizadoresAdicionales.length >= 5) {
            mostrarError("Solo se puede añadir un máximo de 5 organizadores adicionales"); return;
        }
        setOrganizadoresAdicionales(prev => [...prev, emailCorto]);
        setEmailOrganizador("");
    };

    const handleEliminarOrganizador = (email) => {
        setOrganizadoresAdicionales(prev => prev.filter(org => org !== email));
    };

    const handleKeyPressOrganizador = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAnadirOrganizador(); }
    };

    // ─────────────────────────────────────────────────────────────
    // Helper: mostrar error con auto-clear
    // ─────────────────────────────────────────────────────────────
    const mostrarError = (msg, ms = 5000) => {
        setError(msg);
        setTimeout(() => setError(""), ms);
    };

    // ─────────────────────────────────────────────────────────────
    // Validaciones
    // ─────────────────────────────────────────────────────────────
    const validarFormulario = () => {
        if (!nombreTorneo.trim()) {
            mostrarError("El nombre del torneo es obligatorio"); return false;
        }
        if (!fechaInicio) {
            mostrarError("La fecha de inicio es obligatoria"); return false;
        }
        if (!epocaSeleccionada) {
            mostrarError("Debes seleccionar una época"); return false;
        }
        if (participantesMax < PARTICIPANTES_RANGO.min || participantesMax > PARTICIPANTES_RANGO.max) {
            mostrarError(`El número de participantes debe estar entre ${PARTICIPANTES_RANGO.min} y ${PARTICIPANTES_RANGO.max}`);
            return false;
        }
        if (puntosEjercito < PUNTOS_EJERCITO_FOW.min || puntosEjercito > PUNTOS_EJERCITO_FOW.max) {
            mostrarError(`Los puntos de ejército deben estar entre ${PUNTOS_EJERCITO_FOW.min} y ${PUNTOS_EJERCITO_FOW.max}`);
            return false;
        }

        if (!usaFrentes) {
            if (!partidaRonda1 || !partidaRonda2 || !partidaRonda3) {
                mostrarError("Debes seleccionar escenarios para las primeras 3 rondas"); return false;
            }
            if (rondasMax >= 4 && !partidaRonda4) {
                mostrarError("Debes seleccionar el escenario para la ronda 4"); return false;
            }
            if (rondasMax >= 5 && !partidaRonda5) {
                mostrarError("Debes seleccionar el escenario para la ronda 5"); return false;
            }
        } else {
            if (frentes.length === 0) {
                mostrarError("Añade al menos un frente"); return false;
            }
            const nombres = frentes.map(f => f.nombre.trim().toLowerCase());
            if (new Set(nombres).size !== nombres.length) {
                mostrarError("Los nombres de los frentes deben ser únicos"); return false;
            }
            for (let i = 0; i < frentes.length; i++) {
                const f = frentes[i];
                if (!f.nombre.trim()) {
                    mostrarError(`El frente ${i + 1} no tiene nombre`); return false;
                }
                for (let r = 1; r <= rondasMax; r++) {
                    if (!f.escenarios[r]) {
                        mostrarError(`Selecciona el escenario de la ronda ${r} en el frente "${f.nombre}"`);
                        return false;
                    }
                }
            }
        }

        return true;
    };

    // ─────────────────────────────────────────────────────────────
    // Submit
    // ─────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        setLoading(true);
        setError("");

        try {
            let torneoData;

            if (archivoPDF || imagenCartel) {
                // ── FormData (hay archivos) ────────────────────────
                torneoData = new FormData();
                torneoData.append('nombre_torneo',        nombreTorneo);
                torneoData.append('tipo_torneo',          tipoTorneo);
                torneoData.append('rondas_max',           parseInt(rondasMax));
                torneoData.append('fecha_inicio',         fechaInicio);
                torneoData.append('fecha_fin',            fechaFin || '');
                torneoData.append('ubicacion',            ubicacion || '');
                torneoData.append('puntos_ejercito',      parseInt(puntosEjercito));
                torneoData.append('epocas_disponibles',   JSON.stringify([epocaSeleccionada]));
                torneoData.append('participantes_max',    parseInt(participantesMax));
                torneoData.append('usa_frentes',          usaFrentes ? '1' : '0');
                torneoData.append('organizadores_emails', JSON.stringify(organizadoresAdicionales));

                if (usaFrentes) {
                    // Solo enviar frentes; no enviar partida_ronda_X
                    torneoData.append('frentes', JSON.stringify(frentes));
                } else {
                    // Solo enviar partida_ronda_X; no enviar frentes
                    torneoData.append('partida_ronda_1', partidaRonda1);
                    torneoData.append('partida_ronda_2', partidaRonda2);
                    torneoData.append('partida_ronda_3', partidaRonda3);
                    if (rondasMax >= 4) torneoData.append('partida_ronda_4', partidaRonda4);
                    if (rondasMax >= 5) torneoData.append('partida_ronda_5', partidaRonda5);
                }

                if (archivoPDF)   torneoData.append('bases_pdf',     archivoPDF);
                if (imagenCartel) torneoData.append('imagen_cartel', imagenCartel);

            } else {
                // ── JSON (sin archivos) ───────────────────────────
                torneoData = {
                    nombre_torneo: nombreTorneo,
                    tipo_torneo:          tipoTorneo,
                    rondas_max:           parseInt(rondasMax),
                    epocas_disponibles:   [epocaSeleccionada],
                    fecha_inicio:         fechaInicio,
                    fecha_fin:            fechaFin || null,
                    ubicacion:            ubicacion || null,
                    puntos_ejercito:      parseInt(puntosEjercito),
                    participantes_max:    parseInt(participantesMax),
                    usa_frentes:          usaFrentes ? 1 : 0,
                    organizadores_emails: organizadoresAdicionales,
                    ...(usaFrentes
                        ? { frentes }
                        : {
                            partida_ronda_1: partidaRonda1,
                            partida_ronda_2: partidaRonda2,
                            partida_ronda_3: partidaRonda3,
                            ...(rondasMax >= 4 && { partida_ronda_4: partidaRonda4 }),
                            ...(rondasMax >= 5 && { partida_ronda_5: partidaRonda5 }),
                        }
                    ),
                };
            }

            const result = await torneosFowApi.crearTorneo(torneoData);

            if (result.success || result.data) {
                const mensajeExito = [
                    `✅ ¡Torneo "${nombreTorneo}" creado exitosamente!`,
                    usaFrentes    ? `🗺️ ${frentes.length} frente(s) configurados.` : '',
                    archivoPDF    ? '📄 Bases PDF subidas correctamente.'           : '',
                    imagenCartel  ? '🖼️ Cartel subido correctamente.'              : '',
                    '🎉 Ahora eres un organizador.'
                ].filter(Boolean).join('\n');

                alert(mensajeExito);
                await refrescarUsuario();
                navigate("/perfil");
            } else {
                throw new Error(result.error || "Error desconocido al crear el torneo");
            }

        } catch (err) {
            console.error("❌ Error completo:", err);

            let mensajeError = "Error al crear el torneo. Por favor, intenta nuevamente.";
            if (err.message) {
                if      (err.message.includes('max_allowed_packet'))                       mensajeError = "Los archivos son demasiado grandes para el servidor.";
                else if (err.message.includes('LIMIT_FILE_SIZE'))                          mensajeError = "Uno de los archivos excede el tamaño máximo permitido.";
                else if (err.message.includes('Network') || err.message.includes('fetch')) mensajeError = "Error de conexión con el servidor.";
                else if (err.message.includes('timeout'))                                  mensajeError = "La solicitud tardó demasiado.";
                else                                                                       mensajeError = err.message;
            }

            mostrarError(mensajeError, 8000);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Render helper: selector de escenario reutilizable
    // ─────────────────────────────────────────────────────────────
    const SelectorEscenario = ({ id, value, onChange, required = false }) => (
        <select id={id} value={value} onChange={onChange} required={required} disabled={loading}>
            <option value="">Selecciona escenario</option>
            {TIPOS_PARTIDA_FOW.map((tipo) => (
                <option key={tipo.nombre} value={tipo.nombre}>
                    [{tipo.tipo}] {tipo.nombre}
                </option>
            ))}
        </select>
    );

    // ─────────────────────────────────────────────────────────────
    // JSX
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="crear-torneo-container">
            <h1>⚔️ Crear Torneo FLAMES OF WAR</h1>

            {error && <div className="error-message">⚠️ {error}</div>}

            <form className="torneo-form" onSubmit={handleSubmit}>

                {/* ── INFORMACIÓN BÁSICA ── */}
                <fieldset>
                    <legend>📋 Información Básica</legend>

                    <label htmlFor="nombreTorneo">Nombre del Torneo:*</label>
                    <input
                        id="nombreTorneo" type="text" value={nombreTorneo}
                        onChange={(e) => setNombreTorneo(e.target.value)}
                        placeholder="Ej: Copa de Verano FOW 2025"
                        required disabled={loading}
                    />

                    <label>Tipo de Torneo:*</label>
                    <div className="tipo-torneo-container">
                        <label className="tipo-torneo-option"><span>👤 Individual</span></label>
                    </div>

                    <label htmlFor="epocaHistorica">Época Histórica:*</label>
                    <select
                        id="epocaHistorica" value={epocaSeleccionada}
                        onChange={(e) => setEpocaSeleccionada(e.target.value)}
                        required disabled={loading}
                    >
                        <option value="">Selecciona una época</option>
                        {EPOCAS_HISTORICA.map((epoca) => (
                            <option key={epoca} value={epoca}>{epoca}</option>
                        ))}
                    </select>
                    <small className="help-text">🎭 Selecciona la época histórica del torneo</small>

                    <label htmlFor="rondasMax">Número de Rondas:*</label>
                    <select
                        id="rondasMax" value={rondasMax}
                        onChange={(e) => handleRondasMax(e.target.value)}
                        required disabled={loading}
                    >
                        {RONDAS_DISPONIBLES.map(ronda => (
                            <option key={ronda.valor} value={ronda.valor}>{ronda.nombre}</option>
                        ))}
                    </select>

                    <label htmlFor="puntosEjercito">Puntos de Ejército:*</label>
                    <input
                        id="puntosEjercito" type="number"
                        min={PUNTOS_EJERCITO_FOW.min} max={PUNTOS_EJERCITO_FOW.max}
                        value={puntosEjercito} onChange={(e) => setPuntosEjercito(e.target.value)}
                        required disabled={loading}
                    />
                    <small className="help-text">Entre {PUNTOS_EJERCITO_FOW.min} y {PUNTOS_EJERCITO_FOW.max} puntos</small>

                    <label htmlFor="participantesMax">Participantes Máximos:*</label>
                    <input
                        id="participantesMax" type="number"
                        min={PARTICIPANTES_RANGO.min} max={PARTICIPANTES_RANGO.max}
                        value={participantesMax} onChange={(e) => setParticipantesMax(e.target.value)}
                        placeholder="Ej: 16, 24, 32" required disabled={loading}
                    />
                    <small className="help-text">Mínimo {PARTICIPANTES_RANGO.min}, máximo {PARTICIPANTES_RANGO.max} participantes</small>
                </fieldset>

                {/* ── FECHAS Y UBICACIÓN ── */}
                <fieldset>
                    <legend>📅 Fechas y Ubicación</legend>

                    <label>Duración del Torneo:*</label>
                    <div className="duracion-torneo-container">
                        <label className="duracion-option">
                            <input
                                type="radio" name="duracionTorneo" value="1"
                                checked={duracionTorneo === "1"}
                                onChange={(e) => { setDuracionTorneo(e.target.value); setFechaFin(""); }}
                                disabled={loading}
                            />
                            📅 Un día
                        </label>
                        <label className="duracion-option">
                            <input
                                type="radio" name="duracionTorneo" value="2"
                                checked={duracionTorneo === "2"}
                                onChange={(e) => setDuracionTorneo(e.target.value)}
                                disabled={loading}
                            />
                            📅 Dos días o más
                        </label>
                    </div>

                    <label htmlFor="fechaInicio">
                        {duracionTorneo === "1" ? "Fecha del Torneo:*" : "Fecha de Inicio:*"}
                    </label>
                    <input
                        id="fechaInicio" type="date" value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required disabled={loading}
                    />

                    {duracionTorneo === "2" && (
                        <>
                            <label htmlFor="fechaFin">Fecha de Fin:*</label>
                            <input
                                id="fechaFin" type="date" value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                min={fechaInicio || new Date().toISOString().split('T')[0]}
                                required disabled={loading}
                            />
                        </>
                    )}
                    <small className="help-text">
                        🗓️ {duracionTorneo === "1"
                            ? "El torneo se celebrará en un solo día"
                            : "El torneo se celebrará durante 2 o más días"}
                    </small>

                    <label htmlFor="ubicacion">Ubicación:</label>
                    <input
                        id="ubicacion" type="text" value={ubicacion}
                        onChange={(e) => setUbicacion(e.target.value)}
                        placeholder="Ciudad, Local, etc." disabled={loading}
                    />
                </fieldset>

                {/* ── CARTEL ── */}
                <fieldset>
                    <legend>🖼️ Cartel del Torneo (Opcional)</legend>

                    {!imagenCartel ? (
                        <>
                            <label htmlFor="imagenCartel">Subir Imagen del Cartel:</label>
                            <input
                                id="imagenCartel" type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleImagenCartel} disabled={loading}
                            />
                            <small className="help-text-file">🖼️ Formatos: JPG, PNG, GIF, WEBP | Máximo: 5MB</small>
                        </>
                    ) : (
                        <div className="archivo-seleccionado-container">
                            <div className="archivo-info">
                                <p className="archivo-nombre">✅ <strong>Imagen seleccionada:</strong> {imagenCartel.name}</p>
                                <p className="archivo-tamaño">📦 {(imagenCartel.size / 1024).toFixed(2)} KB ({(imagenCartel.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                            {vistaPrevia && (
                                <div className="imagen-preview">
                                    <p className="preview-titulo">Vista previa:</p>
                                    <img src={vistaPrevia} alt="Vista previa del cartel" className="imagen-preview-img" />
                                </div>
                            )}
                            <button type="button" onClick={handleEliminarImagen} className="btn-eliminar-pdf" disabled={loading}>
                                🗑️ Eliminar imagen
                            </button>
                        </div>
                    )}
                </fieldset>

                {/* ── BASES PDF ── */}
                <fieldset>
                    <legend>📄 Bases del Torneo (Opcional)</legend>

                    {!archivoPDF ? (
                        <>
                            <label htmlFor="basesPDF">Subir Bases en PDF:</label>
                            <input
                                id="basesPDF" type="file" accept=".pdf"
                                onChange={handleArchivoPDF} disabled={loading}
                            />
                            <small className="help-text-file">📎 Formato: PDF | Máximo: 16MB</small>
                        </>
                    ) : (
                        <div className="archivo-seleccionado-container">
                            <div className="archivo-info">
                                <p className="archivo-nombre">✅ <strong>Archivo seleccionado:</strong> {archivoPDF.name}</p>
                                <p className="archivo-tamaño">📦 {(archivoPDF.size / 1024).toFixed(2)} KB ({(archivoPDF.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                            <button type="button" onClick={handleEliminarPDF} className="btn-eliminar-pdf" disabled={loading}>
                                🗑️ Eliminar archivo
                            </button>
                        </div>
                    )}
                </fieldset>

                {/* ── ORGANIZADORES ── */}
                <fieldset>
                    <legend>👥 Organizadores Adicionales (Opcional)</legend>

                    <label htmlFor="emailOrganizador">Añadir Organizador por Email:</label>
                    <div className="organizador-input-container">
                        <input
                            id="emailOrganizador" type="email" value={emailOrganizador}
                            onChange={(e) => setEmailOrganizador(e.target.value)}
                            onKeyPress={handleKeyPressOrganizador}
                            placeholder="correo@ejemplo.com" disabled={loading}
                        />
                        <button
                            type="button" onClick={handleAnadirOrganizador}
                            className="btn-añadir-organizador"
                            disabled={loading || !emailOrganizador.trim()}
                        >
                            ➕ Añadir
                        </button>
                    </div>
                    <small className="help-text">Presiona Enter o haz clic en "Añadir". Máximo 5 organizadores.</small>

                    {organizadoresAdicionales.length > 0 && (
                        <div className="organizadores-lista">
                            <p className="organizadores-titulo">
                                <strong>Organizadores añadidos ({organizadoresAdicionales.length}/5):</strong>
                            </p>
                            <ul className="organizadores-items">
                                {organizadoresAdicionales.map((email, idx) => (
                                    <li key={idx} className="organizador-item">
                                        <span className="organizador-email">📧 {email}</span>
                                        <button
                                            type="button" onClick={() => handleEliminarOrganizador(email)}
                                            className="btn-eliminar-organizador" disabled={loading}
                                        >✖️</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </fieldset>

                {/* ── ESCENARIOS / FRENTES ── */}
                <fieldset>
                    <legend>🎲 Escenarios por Ronda</legend>

                    {/* Toggle frentes */}
                    <div className="frentes-toggle-container">
                        <label className="frentes-toggle-label">
                            <input
                                type="checkbox" checked={usaFrentes}
                                onChange={handleToggleFrentes} disabled={loading}
                            />
                            🗺️ Organizar por frentes (Frente del Este, Frente Occidental…)
                        </label>
                        <small className="help-text">
                            Activa esta opción si el torneo divide a los jugadores por frentes, cada uno con sus propios escenarios.
                        </small>
                    </div>

                    {/* ── SIN FRENTES ── */}
                    {!usaFrentes && (
                        <>
                            <label htmlFor="ronda1">Ronda 1:*</label>
                            <SelectorEscenario id="ronda1" value={partidaRonda1} onChange={(e) => setPartidaRonda1(e.target.value)} required />

                            <label htmlFor="ronda2">Ronda 2:*</label>
                            <SelectorEscenario id="ronda2" value={partidaRonda2} onChange={(e) => setPartidaRonda2(e.target.value)} required />

                            <label htmlFor="ronda3">Ronda 3:*</label>
                            <SelectorEscenario id="ronda3" value={partidaRonda3} onChange={(e) => setPartidaRonda3(e.target.value)} required />

                            {rondasMax >= 4 && (
                                <>
                                    <label htmlFor="ronda4">Ronda 4:*</label>
                                    <SelectorEscenario id="ronda4" value={partidaRonda4} onChange={(e) => setPartidaRonda4(e.target.value)} required />
                                </>
                            )}
                            {rondasMax >= 5 && (
                                <>
                                    <label htmlFor="ronda5">Ronda 5:*</label>
                                    <SelectorEscenario id="ronda5" value={partidaRonda5} onChange={(e) => setPartidaRonda5(e.target.value)} required />
                                </>
                            )}
                        </>
                    )}

                    {/* ── CON FRENTES ── */}
                    {usaFrentes && (
                        <div className="frentes-container">
                            {frentes.map((frente, idx) => (
                                <div key={idx} className="frente-card">
                                    <div className="frente-card-header">
                                        <span className="frente-numero">📍 Frente {idx + 1}</span>
                                        {frentes.length > 1 && (
                                            <button
                                                type="button" onClick={() => handleRemoveFrente(idx)}
                                                className="btn-eliminar-organizador" disabled={loading}
                                                title="Eliminar frente"
                                            >🗑️</button>
                                        )}
                                    </div>

                                    <label htmlFor={`frente-nombre-${idx}`}>Nombre del frente:*</label>
                                    <input
                                        id={`frente-nombre-${idx}`} type="text"
                                        value={frente.nombre}
                                        onChange={(e) => handleNombreFrente(idx, e.target.value)}
                                        placeholder="Ej: Frente del Este, Pacífico, Frente Occidental…"
                                        disabled={loading}
                                    />

                                    {Array.from({ length: rondasMax }, (_, i) => i + 1).map((r) => (
                                        <React.Fragment key={r}>
                                            <label htmlFor={`frente-${idx}-ronda-${r}`}>Ronda {r}:*</label>
                                            <SelectorEscenario
                                                id={`frente-${idx}-ronda-${r}`}
                                                value={frente.escenarios[r] || ""}
                                                onChange={(e) => handleEscenarioFrente(idx, r, e.target.value)}
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            ))}

                            {frentes.length < 6 && (
                                <button
                                    type="button" onClick={handleAddFrente}
                                    className="btn-añadir-organizador btn-añadir-frente"
                                    disabled={loading}
                                >
                                    ➕ Añadir frente ({frentes.length}/6)
                                </button>
                            )}
                        </div>
                    )}
                </fieldset>

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? "⏳ Creando..." : "✅ Crear Torneo"}
                    </button>
                    <button type="button" onClick={() => navigate('/')} disabled={loading} className="btn-secondary">
                        ← Cancelar
                    </button>
                </div>
            </form>

            <Footer />
        </div>
    );
}

export default CrearTorneofow;