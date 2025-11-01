import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import torneosSagaApi from '../servicios/apiSaga.js';
import { generarEmparejamientosSuizo } from "../funciones/emparejamientos.js";

import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const navigate = useNavigate();
    const { torneoId } = useParams();
    
    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [clasificacion, setClasificacion] = useState([]);
    
    // Estado para edición del torneo
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({
        nombre_torneo: '',
        epoca_torneo: '',
        rondas_max: 3,
        puntos_banda: 6,
        participantes_max: 16,
        fecha_inicio: '',
        fecha_fin: '',
        ubicacion: '',
        estado: 'pendiente',
        partida_ronda_1: '',
        partida_ronda_2: '',
        partida_ronda_3: '',
        partida_ronda_4: '',
        partida_ronda_5: ''
    });
    const [loadingEdicion, setLoadingEdicion] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState('');
    
    // Estado para gestión de bases PDF
    const [archivoPDF, setArchivoPDF] = useState(null);
    const [eliminarPDF, setEliminarPDF] = useState(false);

    // Estados generales
    const [vistaActual, setVistaActual] = useState('general');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [emparejamientos, setEmparejamientos] = useState([]);

    // Listas de opciones
    const epocaTorneo = [
        "Alejandro",
        "Ánibal",
        "Vikingos",
        "Invasiones",
        "Cruzadas",
        "Caballeria",
        "Edad de la Magia",
        "Alejandro/Ánibal",
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

    const estadosTorneo = [
        { valor: 'pendiente', nombre: 'Pendiente' },
        { valor: 'en_curso', nombre: 'En Curso' },
        { valor: 'finalizado', nombre: 'Finalizado' }
    ];

    useEffect(() => {
        if (!torneoId) {
            setError('No se especificó un ID de torneo');
            setLoading(false);
            return;
        }
        cargarDatosTorneo();
    }, [torneoId]);

    // Sincronizar datos del torneo cuando se carga
    useEffect(() => {
        if (torneo) {
            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '',
                epoca_torneo: torneo.epoca_torneo || '',
                rondas_max: torneo.rondas_max || 3,
                puntos_banda: torneo.puntos_banda || 6,
                participantes_max: torneo.participantes_max || 16,
                fecha_inicio: torneo.fecha_inicio?.split('T')[0] || '',
                fecha_fin: torneo.fecha_fin?.split('T')[0] || '',
                ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '',
                partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '',
                partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || ''
            });
        }
    }, [torneo]);

    const cargarDatosTorneo = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await torneosSagaApi.getTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            
            try {
                const dataJugadores = await torneosSagaApi.getJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
            } catch (err) {
                console.log('No hay jugadores todavía', err);
                setJugadores([]);
            }
            
            try {
                const dataClasificacion = await torneosSagaApi.getClasificacionTorneo(torneoId);
                setClasificacion(Array.isArray(dataClasificacion) ? dataClasificacion : dataClasificacion.data || []);
            } catch (err) {
                console.log('No hay clasificación todavía', err);
                setClasificacion([]);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setError(`Error al cargar los datos del torneo: ${error.message}`);
            setLoading(false);
        }
    };

    // ==========================================
    // FUNCIONES DE EDICIÓN DEL TORNEO
    // ==========================================
    
    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({
            ...prev,
            [name]: value
        }));
        if (errorEdicion) setErrorEdicion('');
    };

    const handleGuardarCambios = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!datosEdicion.nombre_torneo.trim()) {
            setErrorEdicion('El nombre del torneo es obligatorio');
            return;
        }

        if (datosEdicion.participantes_max < jugadores.length) {
            setErrorEdicion(`No puedes reducir el número de participantes a menos de ${jugadores.length} (jugadores ya inscritos)`);
            return;
        }

        if (!window.confirm('¿Deseas guardar los cambios en el torneo?')) {
            return;
        }

        try {
            setLoadingEdicion(true);
            setErrorEdicion('');

            let dataToSend;
            
            if (archivoPDF || eliminarPDF) {
                dataToSend = new FormData();
                
                Object.keys(datosEdicion).forEach(key => {
                    if (datosEdicion[key] !== null && datosEdicion[key] !== '') {
                        dataToSend.append(key, datosEdicion[key]);
                    }
                });
                
                if (archivoPDF) {
                    dataToSend.append('bases_pdf', archivoPDF);
                }
                
                if (eliminarPDF) {
                    dataToSend.append('eliminar_pdf', 'true');
                }
            } else {
                dataToSend = datosEdicion;
            }

            await torneosSagaApi.updateTorneo(torneoId, dataToSend);
            
            alert('✅ Torneo actualizado correctamente');
            setModoEdicion(false);
            setArchivoPDF(null);
            setEliminarPDF(false);
            await cargarDatosTorneo();
            
        } catch (error) {
            console.error('Error:', error);
            setErrorEdicion(error.message || 'Error al actualizar el torneo');
        } finally {
            setLoadingEdicion(false);
        }
    };

    const handleCancelarEdicion = () => {
        setModoEdicion(false);
        setErrorEdicion('');
        setArchivoPDF(null);
        setEliminarPDF(false);
        if (torneo) {
            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '',
                epoca_torneo: torneo.epoca_torneo || '',
                rondas_max: torneo.rondas_max || 3,
                puntos_banda: torneo.puntos_banda || 6,
                participantes_max: torneo.participantes_max || 16,
                fecha_inicio: torneo.fecha_inicio?.split('T')[0] || '',
                fecha_fin: torneo.fecha_fin?.split('T')[0] || '',
                ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '',
                partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '',
                partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || ''
            });
        }
    };

    // ==========================================
    // FUNCIONES DE GESTIÓN DE ESTADO
    // ==========================================
    
    const cambiarEstadoTorneo = async (nuevoEstado) => {
        // 🔒 BLOQUEAR si el torneo ya está finalizado
        if (torneo.estado === 'finalizado') {
            alert('⚠️ No se puede cambiar el estado de un torneo FINALIZADO.\n\nUna vez finalizado, el estado es permanente.');
            return;
        }

        const mensajes = {
            'pendiente': '⏸️ ¿Marcar torneo como PENDIENTE?',
            'en_curso': '▶️ ¿Iniciar el torneo? (Cambiará a EN CURSO)',
            'finalizado': '🏁 ¿Finalizar el torneo?\n\n⚠️ Esta acción es DEFINITIVA y NO se puede revertir.'
        };

        if (!window.confirm(mensajes[nuevoEstado])) {
            return;
        }

        // Confirmación extra para finalizar
        if (nuevoEstado === 'finalizado') {
            if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN:\n¿Estás completamente seguro de finalizar el torneo?\n\nNo podrás cambiarlo después.')) {
                return;
            }
        }

        try {
            await torneosSagaApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert('✅ Estado actualizado correctamente');
            await cargarDatosTorneo();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al cambiar el estado');
        }
    };

    // ==========================================
    // FUNCIONES DE ELIMINACIÓN
    // ==========================================
    
    const eliminarTorneo = async () => {
        console.log('🗑️ Intentando eliminar torneo ID:', torneoId);

        if (jugadores.length > 0) {
            alert(`⚠️ No se puede eliminar el torneo porque tiene ${jugadores.length} jugador(es) inscrito(s).\n\nPrimero elimina todos los jugadores.`);
            return;
        }

        if (!window.confirm(`⚠️ ¿ESTÁS SEGURO de eliminar el torneo "${torneo.nombre_torneo}"?\n\nEsta acción NO se puede deshacer.`)) {
            return;
        }

        if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN: ¿Realmente quieres ELIMINAR este torneo permanentemente?')) {
            return;
        }

        try {
            console.log('📞 Llamando a deleteTorneo...');
            await torneosSagaApi.deleteTorneo(torneoId);
            
            alert('✅ Torneo eliminado correctamente');
            navigate('/');
        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            alert(error.message || 'Error al eliminar el torneo');
        }
    };

    const eliminarJugador = async (jugadorId, nombreJugador) => {
        if (!window.confirm(`¿Estás seguro de eliminar a ${nombreJugador} del torneo?`)) {
            return;
        }

        try {
            await torneosSagaApi.deleteParticipante(torneoId, jugadorId);
            alert(`✅ ${nombreJugador} eliminado correctamente del torneo`);
            await cargarDatosTorneo();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el jugador');
        }
    };

    // ==========================================
    // FUNCIONES DE GESTIÓN DE PDF
    // ==========================================
    
    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Máximo 5MB');
                return;
            }
            setArchivoPDF(file);
            setEliminarPDF(false);
        } else {
            alert('Solo se permiten archivos PDF');
        }
    };

    const descargarBases = async () => {
        try {
            await torneosSagaApi.descargarBasesPDF(torneoId);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al descargar las bases');
        }
    };

    const handleGenerarEmparejamientos = () => {
        const nuevosEmparejamientos = generarEmparejamientosSuizo();
        setEmparejamientos(nuevosEmparejamientos);
    };

    const volverInicio = () => {
        navigate('/');
    };

    // ==========================================
    // PANTALLAS DE CARGA Y ERROR
    // ==========================================

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '1.5em',
                color: '#4a7c2e'
            }}>
                ⏳ Cargando datos del torneo...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                maxWidth: '600px', 
                margin: '100px auto', 
                padding: '40px', 
                textAlign: 'center',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>⚠️ Error</h2>
                <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>{error}</p>
                <button 
                    onClick={volverInicio}
                    className="btn-secondary"
                >
                    ⬅️ Volver al Inicio
                </button>
            </div>
        );
    }

    // ==========================================
    // RENDER PRINCIPAL
    // ==========================================

    return (
        <div className="administrar-torneo-container">
            {/* ==================== HEADER ==================== */}
            <header className="torneo-header">
                <h1>⚔️ {torneo?.nombre_torneo || 'Torneo'}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge ${torneo?.estado || 'pendiente'}`}>
                        {torneo?.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                    <span>📅 {torneo?.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                    <span>👥 {jugadores.length} / {torneo?.participantes_max || 0} jugadores</span>
                </div>
            </header>

            {/* ==================== NAVEGACIÓN ==================== */}
            <nav className="vista-nav">
                <button 
                    className={vistaActual === 'general' ? 'active' : ''}
                    onClick={() => setVistaActual('general')}
                >
                    📊 General
                </button>
                <button 
                    className={vistaActual === 'jugadores' ? 'active' : ''}
                    onClick={() => setVistaActual('jugadores')}
                >
                    👥 Jugadores ({jugadores.length})
                </button>
                <button 
                    className={vistaActual === 'emparejamientos' ? 'active' : ''}
                    onClick={() => setVistaActual('emparejamientos')}
                >
                    🎲 Emparejamientos
                </button>
                <button 
                    className={vistaActual === 'clasificacion' ? 'active' : ''}
                    onClick={() => setVistaActual('clasificacion')}
                >
                    🏆 Clasificación
                </button>
            </nav>

            {/* ==================== CONTENIDO PRINCIPAL ==================== */}
            <div className="contenido-principal">
                
                {/* ==================== VISTA GENERAL ==================== */}
                {/* ==================== VISTA GENERAL ==================== */}
{vistaActual === 'general' && (
    <div className="vista-general">
        {/* Mensajes de error */}
        {errorEdicion && (
            <div className="error-message">
                ⚠️ {errorEdicion}
            </div>
        )}

        {modoEdicion ? (
            /* ========== FORMULARIO DE EDICIÓN ========== */
            <form onSubmit={handleGuardarCambios} className="formulario-edicion">
                {/* INFORMACIÓN BÁSICA */}
                <fieldset>
                    <legend>📋 Información Básica</legend>
                    
                    <label htmlFor="nombre_torneo">Nombre del Torneo:*</label>
                    <input
                        type="text"
                        id="nombre_torneo"
                        name="nombre_torneo"
                        value={datosEdicion.nombre_torneo}
                        onChange={handleEdicionChange}
                        required
                        disabled={loadingEdicion}
                    />

                    <label htmlFor="epoca_torneo">Época:*</label>
                    <select
                        id="epoca_torneo"
                        name="epoca_torneo"
                        value={datosEdicion.epoca_torneo}
                        onChange={handleEdicionChange}
                        required
                        disabled={loadingEdicion}
                    >
                        <option value="">Selecciona época</option>
                        {epocaTorneo.map(epoca => (
                            <option key={epoca} value={epoca}>{epoca}</option>
                        ))}
                    </select>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="rondas_max">Rondas:*</label>
                            <select
                                id="rondas_max"
                                name="rondas_max"
                                value={datosEdicion.rondas_max}
                                onChange={handleEdicionChange}
                                required
                                disabled={loadingEdicion}
                            >
                                <option value="3">3 Rondas</option>
                                <option value="4">4 Rondas</option>
                                <option value="5">5 Rondas</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="puntos_banda">Puntos Banda:*</label>
                            <input
                                type="number"
                                id="puntos_banda"
                                name="puntos_banda"
                                value={datosEdicion.puntos_banda}
                                onChange={handleEdicionChange}
                                min="4"
                                max="8"
                                required
                                disabled={loadingEdicion}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="participantes_max">Participantes:*</label>
                            <input
                                type="number"
                                id="participantes_max"
                                name="participantes_max"
                                value={datosEdicion.participantes_max}
                                onChange={handleEdicionChange}
                                min={jugadores.length}
                                max="100"
                                required
                                disabled={loadingEdicion}
                            />
                        </div>
                    </div>

                    <label htmlFor="estado">Estado del Torneo:*</label>
                    <select
                        id="estado"
                        name="estado"
                        value={datosEdicion.estado}
                        onChange={handleEdicionChange}
                        required
                        disabled={loadingEdicion}
                    >
                        {estadosTorneo.map(estado => (
                            <option key={estado.valor} value={estado.valor}>
                                {estado.nombre}
                            </option>
                        ))}
                    </select>
                </fieldset>

                {/* FECHAS Y UBICACIÓN */}
                <fieldset>
                    <legend>📅 Fechas y Ubicación</legend>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fecha_inicio">Fecha Inicio:*</label>
                            <input
                                type="date"
                                id="fecha_inicio"
                                name="fecha_inicio"
                                value={datosEdicion.fecha_inicio}
                                onChange={handleEdicionChange}
                                required
                                disabled={loadingEdicion}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="fecha_fin">Fecha Fin:</label>
                            <input
                                type="date"
                                id="fecha_fin"
                                name="fecha_fin"
                                value={datosEdicion.fecha_fin}
                                onChange={handleEdicionChange}
                                min={datosEdicion.fecha_inicio}
                                disabled={loadingEdicion}
                            />
                        </div>
                    </div>

                    <label htmlFor="ubicacion">Ubicación:</label>
                    <input
                        type="text"
                        id="ubicacion"
                        name="ubicacion"
                        value={datosEdicion.ubicacion}
                        onChange={handleEdicionChange}
                        placeholder="Ciudad, Local, etc."
                        disabled={loadingEdicion}
                    />
                </fieldset>

                {/* ESCENARIOS POR RONDA */}
                <fieldset>
                    <legend>🎲 Escenarios por Ronda</legend>

                    <label htmlFor="partida_ronda_1">Ronda 1:*</label>
                    <select
                        id="partida_ronda_1"
                        name="partida_ronda_1"
                        value={datosEdicion.partida_ronda_1}
                        onChange={handleEdicionChange}
                        required
                        disabled={loadingEdicion}
                    >
                        <option value="">Selecciona escenario</option>
                        {tiposPartida.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>

                    <label htmlFor="partida_ronda_2">Ronda 2:*</label>
                    <select
                        id="partida_ronda_2"
                        name="partida_ronda_2"
                        value={datosEdicion.partida_ronda_2}
                        onChange={handleEdicionChange}
                        required
                        disabled={loadingEdicion}
                    >
                        <option value="">Selecciona escenario</option>
                        {tiposPartida.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>

                    <label htmlFor="partida_ronda_3">Ronda 3:*</label>
                    <select
                        id="partida_ronda_3"
                        name="partida_ronda_3"
                        value={datosEdicion.partida_ronda_3}
                        onChange={handleEdicionChange}
                        required
                        disabled={loadingEdicion}
                    >
                        <option value="">Selecciona escenario</option>
                        {tiposPartida.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>

                    {datosEdicion.rondas_max >= 4 && (
                        <>
                            <label htmlFor="partida_ronda_4">Ronda 4:</label>
                            <select
                                id="partida_ronda_4"
                                name="partida_ronda_4"
                                value={datosEdicion.partida_ronda_4}
                                onChange={handleEdicionChange}
                                disabled={loadingEdicion}
                            >
                                <option value="">Selecciona escenario</option>
                                {tiposPartida.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {datosEdicion.rondas_max >= 5 && (
                        <>
                            <label htmlFor="partida_ronda_5">Ronda 5:</label>
                            <select
                                id="partida_ronda_5"
                                name="partida_ronda_5"
                                value={datosEdicion.partida_ronda_5}
                                onChange={handleEdicionChange}
                                disabled={loadingEdicion}
                            >
                                <option value="">Selecciona escenario</option>
                                {tiposPartida.map(tipo => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </>
                    )}
                </fieldset>

                {/* BASES PDF */}
                <fieldset>
                    <legend>📄 Bases del Torneo</legend>

                    {torneo.bases_nombre && !eliminarPDF && (
                        <div className="pdf-actual">
                            <p>📎 Archivo actual: <strong>{torneo.bases_nombre}</strong></p>
                            <button
                                type="button"
                                onClick={() => setEliminarPDF(true)}
                                className="btn-danger"
                                style={{ marginTop: '10px' }}
                            >
                                🗑️ Eliminar PDF actual
                            </button>
                        </div>
                    )}

                    {eliminarPDF && (
                        <div style={{
                            background: '#fff3cd',
                            padding: '15px',
                            borderRadius: '5px',
                            marginBottom: '15px'
                        }}>
                            <p>⚠️ El PDF actual se eliminará al guardar</p>
                            <button
                                type="button"
                                onClick={() => setEliminarPDF(false)}
                                className="btn-secondary"
                                style={{ marginTop: '10px' }}
                            >
                                ↩️ Mantener PDF actual
                            </button>
                        </div>
                    )}

                    <label htmlFor="bases_pdf">
                        {torneo.bases_nombre && !eliminarPDF ? 'Reemplazar PDF de bases:' : 'Subir PDF de bases:'}
                    </label>
                    <input
                        type="file"
                        id="bases_pdf"
                        accept=".pdf"
                        onChange={handleArchivoPDF}
                        disabled={loadingEdicion}
                        className="input-file-pdf"
                    />

                    {archivoPDF && (
                        <p style={{ color: '#4caf50', marginTop: '10px' }}>
                            ✅ Nuevo archivo: {archivoPDF.name} ({(archivoPDF.size / 1024).toFixed(2)} KB)
                        </p>
                    )}
                </fieldset>

                <div className="button-group">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loadingEdicion}
                    >
                        {loadingEdicion ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancelarEdicion}
                        disabled={loadingEdicion}
                    >
                        ❌ Cancelar
                    </button>
                </div>
            </form>
        ) : (
            /* ========== VISTA DE SOLO LECTURA ========== */
            <>
                {/* 🆕 INFORMACIÓN DEL TORNEO CON BOTONES INTEGRADOS */}
                <section className="seccion-info-torneo">
                    <div className="section-header-inline">
                        <h2>ℹ️ Información del Torneo</h2>
                        
                        {/* 🆕 BOTONES DE ACCIÓN AGRUPADOS */}
                        <div className="botones-accion-grupo">
                            {/* Botones de estado solo si NO está finalizado */}
                            {torneo.estado !== 'finalizado' && (
                                <>
                                    {torneo.estado === 'pendiente' && (
                                        <button 
                                            onClick={() => cambiarEstadoTorneo('en_curso')}
                                            className="btn-success"
                                        >
                                            ▶️ Iniciar Torneo
                                        </button>
                                    )}
                                    
                                    {torneo.estado === 'en_curso' && (
                                        <>
                                            <button 
                                                onClick={() => cambiarEstadoTorneo('pendiente')}
                                                className="btn-secondary"
                                            >
                                                ⏸️ Volver a Pendiente
                                            </button>
                                            <button 
                                                onClick={() => cambiarEstadoTorneo('finalizado')}
                                                className="btn-warning"
                                            >
                                                🏁 Finalizar Torneo
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                            
                            {/* Botón Editar */}
                            <button 
                                className="btn-primary"
                                onClick={() => setModoEdicion(true)}
                            >
                                ✏️ Editar Torneo
                            </button>

                            {/* Botón Eliminar */}
                            <button 
                                onClick={eliminarTorneo}
                                className="btn-danger"
                            >
                                🗑️ Eliminar Torneo
                            </button>
                        </div>
                    </div>

                    {/* Advertencia si está finalizado */}
                    {torneo.estado === 'finalizado' && (
                        <div className="advertencia-finalizado">
                            <strong>🏁 Torneo FINALIZADO</strong>
                            <p>El estado del torneo es permanente y no se puede modificar.</p>
                        </div>
                    )}

                    {/* Grid de información */}
                    <div className="info-torneo-grid">
                        <div className="info-item">
                            <label>🎭 Época:</label>
                            <p>{torneo.epoca_torneo}</p>
                        </div>
                        <div className="info-item">
                            <label>🎲 Número de Rondas:</label>
                            <p>{torneo.rondas_max} rondas</p>
                        </div>
                        <div className="info-item">
                            <label>⚔️ Puntos de Banda:</label>
                            <p>{torneo.puntos_banda} puntos</p>
                        </div>
                        <div className="info-item">
                            <label>👥 Participantes:</label>
                            <p>{jugadores.length} / {torneo.participantes_max}</p>
                        </div>
                        {torneo.ubicacion && (
                            <div className="info-item">
                                <label>📍 Ubicación:</label>
                                <p>{torneo.ubicacion}</p>
                            </div>
                        )}
                        {torneo.fecha_fin && (
                            <div className="info-item">
                                <label>📅 Fecha Fin:</label>
                                <p>{new Date(torneo.fecha_fin).toLocaleDateString('es-ES')}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ESCENARIOS POR RONDA */}
                <section className="seccion-rondas">
                    <h2>🎮 Escenarios por Ronda</h2>
                    <div className="rondas-list">
                        <div className="ronda-item">
                            <span className="ronda-numero">Ronda 1:</span>
                            <span className="ronda-escenario">{torneo.partida_ronda_1}</span>
                        </div>
                        <div className="ronda-item">
                            <span className="ronda-numero">Ronda 2:</span>
                            <span className="ronda-escenario">{torneo.partida_ronda_2}</span>
                        </div>
                        <div className="ronda-item">
                            <span className="ronda-numero">Ronda 3:</span>
                            <span className="ronda-escenario">{torneo.partida_ronda_3}</span>
                        </div>
                        {torneo.rondas_max >= 4 && torneo.partida_ronda_4 && (
                            <div className="ronda-item">
                                <span className="ronda-numero">Ronda 4:</span>
                                <span className="ronda-escenario">{torneo.partida_ronda_4}</span>
                            </div>
                        )}
                        {torneo.rondas_max >= 5 && torneo.partida_ronda_5 && (
                            <div className="ronda-item">
                                <span className="ronda-numero">Ronda 5:</span>
                                <span className="ronda-escenario">{torneo.partida_ronda_5}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* BASES DEL TORNEO */}
                <section className="seccion-bases">
                    <h2>📄 Bases del Torneo</h2>
                    {torneo.bases_nombre ? (
                        <div className="bases-existentes">
                            <p>📎 Archivo: <strong>{torneo.bases_nombre}</strong> 
                            {torneo.base_tamaño && ` (${(torneo.base_tamaño / 1024).toFixed(2)} KB)`}</p>
                            <button onClick={descargarBases} className="btn-primary">
                                ⬇️ Descargar Bases
                            </button>
                        </div>
                    ) : (
                        <p style={{ color: '#666' }}>
                            ℹ️ Este torneo no tiene bases cargadas. Usa el botón "Editar Torneo" para subir un PDF.
                        </p>
                    )}
                </section>
            </>
        )}
    </div>
)}

                {/* ==================== VISTA JUGADORES ==================== */}
                {vistaActual === 'jugadores' && (
                    <div className="vista-jugadores">
                        <h2>👥 Jugadores Inscritos ({jugadores.length} / {torneo?.participantes_max || 0})</h2>
                        {jugadores.length === 0 ? (
                            <div className="empty-message">
                                <p>No hay jugadores inscritos todavía</p>
                            </div>
                        ) : (
                            <div className="tabla-jugadores-container">
                                <table className="tabla-jugadores-detalle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Nombre</th>
                                            <th>Club</th>
                                            <th>Facción</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jugadores.map((jugador, index) => (
                                            <tr key={jugador.id}>
                                                <td>{index + 1}</td>
                                                <td className="nombre-jugador-completo">
                                                    <strong>{jugador.nombre}</strong>
                                                </td>
                                                <td>{jugador.club || '-'}</td>
                                                <td>{jugador.ejercito || '-'}</td>
                                                <td>
                                                    <button
                                                        onClick={() => eliminarJugador(jugador.id, jugador.nombre)}
                                                        className="btn-danger-small"
                                                        style={{
                                                            background: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9em'
                                                        }}
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== VISTA EMPAREJAMIENTOS ==================== */}
                {vistaActual === 'emparejamientos' && (
                    <div className="vista-emparejamientos">
                        <div className="section-header">
                            <h2>🎲 Emparejamientos Ronda 1</h2>
                            <button 
                                onClick={handleGenerarEmparejamientos}
                                className="btn-primary"
                                disabled={jugadores.length < 2}
                            >
                                🔄 Generar Emparejamientos Aleatorios
                            </button>
                        </div>

                        {jugadores.length < 2 ? (
                            <div className="empty-message">
                                <p>⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos</p>
                            </div>
                        ) : emparejamientos.length === 0 ? (
                            <div className="empty-message">
                                <p>Haz clic en "Generar Emparejamientos" para crear los enfrentamientos de la primera ronda</p>
                            </div>
                        ) : (
                            <div className="emparejamientos-grid">
                                {emparejamientos.map((emparejamiento) => (
                                    <div key={emparejamiento.mesa} className="emparejamiento-card">
                                        <div className="mesa-numero">
                                            Mesa {emparejamiento.mesa}
                                        </div>
                                        <div className="enfrentamiento">
                                            <div className="jugador">
                                                <span className="jugador-nombre">{emparejamiento.jugador1.nombre}</span>
                                                <span className="jugador-faccion">{emparejamiento.jugador1.ejercito || 'Sin facción'}</span>
                                            </div>
                                            <div className="vs">VS</div>
                                            {emparejamiento.jugador2 ? (
                                                <div className="jugador">
                                                    <span className="jugador-nombre">{emparejamiento.jugador2.nombre}</span>
                                                    <span className="jugador-faccion">{emparejamiento.jugador2.ejercito || 'Sin facción'}</span>
                                                </div>
                                            ) : (
                                                <div className="jugador bye">
                                                    <span className="jugador-nombre">⭐ BYE</span>
                                                    <span className="jugador-faccion">Victoria automática</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="escenario">
                                            📋 Escenario: {torneo.partida_ronda_1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== VISTA CLASIFICACIÓN ==================== */}
                {vistaActual === 'clasificacion' && (
                    <div className="vista-clasificacion">
                        <h2>🏆 Clasificación del Torneo</h2>
                        {clasificacion.length === 0 ? (
                            <div className="empty-message">
                                <p>📊 No hay clasificación disponible todavía</p>
                            </div>
                        ) : (
                            <table className="tabla-clasificacion">
                                <thead>
                                    <tr>
                                        <th>Pos</th>
                                        <th>Jugador</th>
                                        <th>Club</th>
                                        <th>Facción</th>
                                        <th>Pts Masacre</th>
                                        <th>Pts Torneo</th>
                                        <th>Pts Victoria</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clasificacion.map((jugador, index) => (
                                        <tr key={jugador.jugador_id} className={index < 3 ? `top-${index + 1}` : ''}>
                                            <td className="posicion">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && index + 1}
                                            </td>
                                            <td className="nombre-jugador">{jugador.nombre_completo || jugador.nombre}</td>
                                            <td>{jugador.club || '-'}</td>
                                            <td>{jugador.faccion || '-'}</td>
                                            <td>{jugador.puntos_masacre || 0}</td>
                                            <td >{jugador.puntos_torneo || 0}</td>
                                            <td className="puntos-destacado">{jugador.puntos_victoria || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* ==================== FOOTER ==================== */}
            <footer className="footer-controles">
                <button type="button" onClick={volverInicio} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default AdministrarTorneo;