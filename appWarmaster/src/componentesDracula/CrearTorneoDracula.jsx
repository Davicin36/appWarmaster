import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useAuth } from "../servicios/AuthContext.jsx";

import torneosDraculaApi from '../servicios/apiDracula.js';

import {
    PUNTOS_BANDA_DRACULA,
    RONDAS_DISPONIBLES,
    PARTICIPANTES_RANGO,
} from '@/componentesDracula/funcionesDracula/constantesFuncionesDracula.js';
import Footer from '@/paginas/Footer.jsx'

import '../estilos/crearTorneo.css';

function CrearTorneoDracula() {
    const navigate = useNavigate();
    const { refrescarUsuario } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [nombreTorneo, setNombreTorneo] = useState("");
    const tipoTorneo = "Individual";
    const [rondasMax, setRondasMax] = useState(RONDAS_DISPONIBLES[0].valor);
    const [fechaInicio, setFechaInicio] = useState("");
    const [duracionTorneo, setDuracionTorneo] = useState("1");
    const [fechaFin, setFechaFin] = useState("");
    const [ubicacion, setUbicacion] = useState("");
    
    const [imagenCartel, setImagenCartel] = useState(null);
    const [vistaPrevia, setVistaPrevia] = useState(null);

    const [puntosBanda, setPuntosBanda] = useState(PUNTOS_BANDA_DRACULA.default);
    const [participantesMax, setParticipantesMax] = useState(PARTICIPANTES_RANGO.default); 
    const [archivoPDF, setArchivoPDF] = useState(null); 

    // Estados para los organizadores del torneo
    const [organizadorAdicional, setOrganizadorAdicional] = useState([]);
    const [emailOrganizador, setEmailOrganizador] = useState("");

    const handleImagenCartel = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            setImagenCartel(null);
            setVistaPrevia(null);
            return;
        }
        
        // Validar que sea imagen
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            setError('⚠️ Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
            e.target.value = '';
            setImagenCartel(null);
            setVistaPrevia(null);
            setTimeout(() => setError(''), 4000);
            return;
        }
        
        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            const tamañoMB = (file.size / 1024 / 1024).toFixed(2);
            setError(`⚠️ La imagen (${tamañoMB}MB) supera el tamaño máximo de 5MB. Por favor, comprime la imagen.`);
            e.target.value = '';
            setImagenCartel(null);
            setVistaPrevia(null);
            setTimeout(() => setError(''), 5000);
            return;
        }
        
        // Crear vista previa
        const reader = new FileReader();
        reader.onloadend = () => {
            setVistaPrevia(reader.result);
        };
        reader.readAsDataURL(file);
        
        setImagenCartel(file);
        setError('');
    };

    const handleEliminarImagen = () => {
        setImagenCartel(null);
        setVistaPrevia(null);
        const fileInput = document.getElementById('imagenCartel');
        if (fileInput) {
            fileInput.value = '';
        }
    };

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
        
        // Validar tamaño (máximo 16MB)
        const maxSize = 16 * 1024 * 1024;
        if (file.size > maxSize) {
            const tamañoMB = (file.size / 1024 / 1024).toFixed(2);
            setError(`⚠️ El archivo PDF (${tamañoMB}MB) supera el tamaño máximo de 16MB. Por favor, comprime el PDF o sube uno más pequeño.`);
            e.target.value = '';
            setArchivoPDF(null);
            setTimeout(() => setError(''), 5000);
            return;
        }
        
        setArchivoPDF(file);
        setError('');
    };

    const handleAnadirOrganizador = () => {
        const emailCorto = emailOrganizador.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailCorto)) {
            setError("Introduce un email válido");
            setTimeout(() => setError(""), 3000);
            return;
        }

        if (organizadorAdicional.length >= 5) {
            setError("Solo se puede añadir un máximo de 5 organizadores adicionales por torneo");
            setTimeout(() => setError(""), 3000);
            return;
        }

        setOrganizadorAdicional([...organizadorAdicional, emailCorto]);
        setEmailOrganizador("");
        setError("");
    };

    const handleEliminarOrganizador = (email) => {
        setOrganizadorAdicional(organizadorAdicional.filter(org => org !== email));
    };

    const handleKeyPressOrganizador = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAnadirOrganizador();
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

        if (!fechaInicio) {
            setError("La fecha de inicio es obligatoria");
            setLoading(false);
            return;
        }

        if (participantesMax < PARTICIPANTES_RANGO.min || participantesMax > PARTICIPANTES_RANGO.max) {
            setError(`El número de participantes debe estar entre ${PARTICIPANTES_RANGO.min} y ${PARTICIPANTES_RANGO.max}`);
            setLoading(false);
            return;
        }
            
        try {
            let torneoData;
            
            // Crear FormData si hay PDF O IMAGEN
            if (archivoPDF || imagenCartel) {
                console.log('📤 Preparando FormData con archivos...');
                torneoData = new FormData();
                
                torneoData.append('nombre_torneo', nombreTorneo);
                torneoData.append('tipo_torneo', tipoTorneo);
                torneoData.append('rondas_max', parseInt(rondasMax));
                torneoData.append('fecha_inicio', fechaInicio);
                torneoData.append('fecha_fin', fechaFin || '');
                torneoData.append('ubicacion', ubicacion || '');
                torneoData.append('puntos_ejercito', parseInt(puntosBanda));
                torneoData.append('participantes_max', parseInt(participantesMax));
                torneoData.append('organizadores_adicionales', JSON.stringify(organizadorAdicional));

                // Añadir PDF si existe
                if (archivoPDF) {
                    torneoData.append('bases_pdf', archivoPDF);
                    console.log('📄 PDF añadido:', archivoPDF.name);
                }
                
                // Añadir IMAGEN si existe
                if (imagenCartel) {
                    torneoData.append('imagen_cartel', imagenCartel);
                    console.log('🖼️ Imagen añadida:', imagenCartel.name, imagenCartel.size, 'bytes');
                }
                
            } else {
                // Sin archivos, usar JSON
                torneoData = {
                    nombre_torneo: nombreTorneo,
                    tipo_torneo: tipoTorneo,
                    rondas_max: parseInt(rondasMax),
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin || null,
                    ubicacion: ubicacion || null,
                    puntos_banda: parseInt(puntosBanda),
                    participantes_max: parseInt(participantesMax),
                    organizadores_emails: organizadorAdicional
                };
            }

            const result = await torneosDraculaApi.crearTorneo(torneoData);
            
            if (result.success || result.data) {
                const mensajeExito = [
                    `✅ ¡Torneo "${nombreTorneo}" creado exitosamente!`,
                    archivoPDF ? '📄 Bases PDF subidas correctamente.' : '',
                    imagenCartel ? '🖼️ Cartel subido correctamente.' : '',
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
                if (err.message.includes('max_allowed_packet')) {
                    mensajeError = "⚠️ Los archivos son demasiado grandes para el servidor.";
                } else if (err.message.includes('LIMIT_FILE_SIZE')) {
                    mensajeError = "⚠️ Uno de los archivos excede el tamaño máximo permitido.";
                } else if (err.message.includes('Network') || err.message.includes('fetch')) {
                    mensajeError = "⚠️ Error de conexión con el servidor.";
                } else if (err.message.includes('timeout')) {
                    mensajeError = "⚠️ La solicitud tardó demasiado.";
                } else {
                    mensajeError = `⚠️ ${err.message}`;
                }
            }
            
            setError(mensajeError);
            setTimeout(() => setError(''), 8000);
            
        } finally {
            setLoading(false);
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    const handleEliminarPDF = () => {
        setArchivoPDF(null);
        const fileInput = document.getElementById('basesPDF');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <div className="crear-torneo-container">
            <h1>⚔️ Crear Torneo EPIC ARMAGEDDON</h1>
            
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
                        placeholder="Ej: Copa de Primavera Warmaster 2025"
                        required
                        disabled={loading}
                    />

                    <label>Tipo de Torneo:*</label>
                    <div className="tipo-torneo-container">
                        <label className="tipo-torneo-option">
                           <span>👤 Individual</span>   
                        </label>
                    </div>                    
                    
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

                    <label htmlFor="puntosEjercito">Puntos de la Banda:*</label>
                    <input 
                        name="puntosEjercito" 
                        id="puntosEjercito" 
                        type="number"
                        min={PUNTOS_BANDA_DRACULA.min}
                        max={PUNTOS_BANDA_DRACULA.max}
                        value={puntosBanda}
                        onChange={(e) => setPuntosBanda(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <small className="help-text">
                        Entre {PUNTOS_BANDA_DRACULA.min} y {PUNTOS_BANDA_DRACULA.max} puntos
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
                        disabled={loading}
                    />
                    <small className="help-text">
                        Mínimo {PARTICIPANTES_RANGO.min}, máximo {PARTICIPANTES_RANGO.max} participantes
                    </small>
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
                                    setFechaFin("");
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
                            📅 Dos días o más
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
                                🗓️ El torneo se celebrará durante 2 o más días
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

                {/* CARTEL DEL TORNEO */}
                <fieldset>
                    <legend>🖼️ Cartel del Torneo (Opcional)</legend>
                    
                    {!imagenCartel ? (
                        <>
                            <label htmlFor="imagenCartel">Subir Imagen del Cartel:</label>
                            <input 
                                name="imagenCartel" 
                                id="imagenCartel" 
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleImagenCartel}
                                disabled={loading}
                            />
                            <small className="help-text-file">
                                🖼️ Formatos: JPG, PNG, GIF, WEBP | Tamaño máximo: 5MB
                            </small>
                        </>
                    ) : (
                        <div className="archivo-seleccionado-container">
                            <div className="archivo-info">
                                <p className="archivo-nombre">
                                    ✅ <strong>Imagen seleccionada:</strong> {imagenCartel.name}
                                </p>
                                <p className="archivo-tamaño">
                                    📦 Tamaño: {(imagenCartel.size / 1024).toFixed(2)} KB 
                                    ({(imagenCartel.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>
                            
                            {vistaPrevia && (
                                <div className="imagen-preview">
                                    <p className="preview-titulo">Vista previa:</p>
                                    <img 
                                        src={vistaPrevia} 
                                        alt="Vista previa del cartel" 
                                        className="imagen-preview-img"
                                    />
                                </div>
                            )}
                            
                            <button
                                type="button"
                                onClick={handleEliminarImagen}
                                className="btn-eliminar-pdf"
                                disabled={loading}
                            >
                                🗑️ Eliminar imagen
                            </button>
                        </div>
                    )}
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

                {/* ORGANIZADORES ADICIONALES */}
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

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? "⏳ Creando..." : "✅ Crear Torneo"}
                    </button>
                    
                    <button type="button" onClick={volverInicio} disabled={loading} className="btn-secondary">
                        ← Cancelar
                    </button>
                </div>
            </form>
            <Footer/>
        </div>
    );
}

export default CrearTorneoDracula;