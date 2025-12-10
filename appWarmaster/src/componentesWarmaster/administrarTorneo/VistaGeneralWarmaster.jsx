import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import torneosWarmasterApi from '@/servicios/apiWarmaster';

import '@/estilos/vistasTorneos/vistaGeneral.css';

import {
    TIPOS_PARTIDA_WARMASTER,
    ESTADOS_TORNEO_WARMASTER,
    RONDAS_DISPONIBLES,
    PUNTOS_EJERCITO_WARMASTER,
    PARTICIPANTES_RANGO
} from '@/componentesWarmaster/funcionesWarmaster/constantesFuncionesWarmaster.js';

function VistaGeneralWarmaster({ torneoId: propTorneoId, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({
        nombre_torneo: '',
        tipo_torneo: '',
        rondas_max: RONDAS_DISPONIBLES[0].valor,
        puntos_ejercito: PUNTOS_EJERCITO_WARMASTER.default,
        participantes_max: PARTICIPANTES_RANGO.default,
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
    const [archivoPDF, setArchivoPDF] = useState(null);
    const [eliminarPDF, setEliminarPDF] = useState(false);

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

    useEffect(() => {
        if (torneo) {
           
            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '',
                tipo_torneo: torneo.tipoTorneo,
                rondas_max: torneo.rondas_max || RONDAS_DISPONIBLES[0].valor,
                puntos_ejercito: torneo.puntos_ejercito || PUNTOS_EJERCITO_WARMASTER.default,
                participantes_max: torneo.participantes_max || PARTICIPANTES_RANGO.default,
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

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            const response = await torneosWarmasterApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            
            // Cargar jugadores
            try {
                const dataJugadores = await torneosWarmasterApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
            } catch (err) {
                console.log('No hay jugadores todavía', err);
                setJugadores([]);
            }
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({ ...prev, [name]: value }));
        if (errorEdicion) setErrorEdicion('');
    };

    const handleGuardarCambios = async (e) => {
        e.preventDefault();
        
        if (!datosEdicion.nombre_torneo.trim()) {
            setErrorEdicion('El nombre del torneo es obligatorio');
            return;
        }

        if (datosEdicion.participantes_max < jugadores.length) {
            setErrorEdicion(`No puedes reducir el número de participantes a menos de ${jugadores.length}`);
            return;
        }

        if (!window.confirm('¿Deseas guardar los cambios en el torneo?')) return;

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
                if (archivoPDF) dataToSend.append('bases_pdf', archivoPDF);
                if (eliminarPDF) dataToSend.append('eliminar_pdf', 'true');
            } else {
                dataToSend = {...datosEdicion};
            }

            await torneosWarmasterApi.actualizarTorneo(torneoId, dataToSend);
            
            alert('✅ Torneo actualizado correctamente');
            setModoEdicion(false);
            setArchivoPDF(null);
            setEliminarPDF(false);
            await cargarDatos();
            if (onUpdate) onUpdate();
            
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
                tipo_torneo: torneo.tipoTorneo,
                rondas_max: torneo.rondas_max || RONDAS_DISPONIBLES[0].valor,
                puntos_ejercito: torneo.puntos_ejercito || PUNTOS_EJERCITO_WARMASTER.default,
                participantes_max: torneo.participantes_max || PARTICIPANTES_RANGO.default,
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

    const cambiarEstadoTorneo = async (nuevoEstado) => {
        if (torneo.estado === 'finalizado') {
            alert('⚠️ No se puede cambiar el estado de un torneo FINALIZADO.');
            return;
        }

        // ✅ VALIDAR PAGOS SI SE INTENTA INICIAR EL TORNEO
        if (nuevoEstado === 'en_curso') {
            try {
                const response = await torneosWarmasterApi.verificarPagos(torneoId);

                const todosPagados = response.mensaje.todosPagados;
                const total = response.mensaje.total || 0;
                const pagados = response.mensaje.pagados || 0;
                const pendientes = response.mensaje.pendientes || 0;

                if ( pendientes > 0 || todosPagados === false ) {
                    alert(
                        `❌ NO SE PUEDE INICIAR EL TORNEO\n\n` +
                        `Total de participantes: ${total}\n` +
                        `✅ Pagados: ${pagados}\n` +
                        `⏰ Pendientes: ${pendientes}\n\n` +
                        `Todos los participantes deben estar marcados como PAGADOS antes de iniciar el torneo.`
                    );
                    return;
                }

                // Si todos están pagados, mostrar confirmación
                if (!window.confirm(
                    `▶️ ¿Iniciar el torneo?\n\n` +
                    `✅ Todos los ${total} participantes están pagados.\n` +
                    `¿Deseas continuar?`
                )) {
                    return;
                }

            } catch (error) {
                console.error('Error al verificar pagos:', error);
                alert('❌ Error al verificar los pagos. Intenta de nuevo.');
                return;
            }
        }

        // Mensajes de confirmación para otros estados
        const mensajes = {
            'pendiente': '⏸️ ¿Marcar torneo como PENDIENTE?',
            'finalizado': '🏁 ¿Finalizar el torneo?\n\n⚠️ Esta acción es DEFINITIVA.'
        };

        // Confirmación normal para otros estados
        if (nuevoEstado !== 'en_curso' && mensajes[nuevoEstado]) {
            if (!window.confirm(mensajes[nuevoEstado])) return;
        }

        // Confirmación extra para finalizar
        if (nuevoEstado === 'finalizado') {
            if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN:\n¿Estás completamente seguro?')) return;
        }

        try {
            await torneosWarmasterApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert('✅ Estado actualizado correctamente');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al cambiar el estado');
        }
    };

        const eliminarTorneo = async () => {
        if (jugadores.length > 0) {
            alert(`⚠️ No se puede eliminar el torneo porque tiene ${jugadores.length} jugador(es) inscrito(s).`);
            return;
        }

        if (!window.confirm(`⚠️ ¿ESTÁS SEGURO de eliminar "${torneo.nombre_torneo}"?`)) return;
        if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN')) return;

        try {
            await torneosWarmasterApi.eliminarTorneo(torneoId);
            alert('✅ Torneo eliminado correctamente');
            navigate('/');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el torneo');
        }
    };

    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 16 * 1024 * 1024) {
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
            await torneosWarmasterApi.descargarBasesPDF(torneoId);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al descargar las bases');
        }
    };

    if (loading) {
        return (
            <div className="vista-general">
                <div className="empty-message">
                    ⏳ Cargando información del torneo...
                </div>
            </div>
        );
    }

    if (!torneo) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ No se pudo cargar la información del torneo
                </div>
            </div>
        );
    }

    const totalJugadores = jugadores.length;

    return (
        <div className="vista-general">
            {errorEdicion && (
                <div className="error-message">
                    ⚠️ {errorEdicion}
                </div>
            )}

            {modoEdicion ? (
                <form onSubmit={handleGuardarCambios} className="formulario-edicion">
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

                        <label htmlFor="tipo_torneo">Tipo de torneo:*</label>
                        <input 
                            id="tipo_torneo"
                            name="tipo_torneo"
                            value={datosEdicion.tipo_torneo}
                            onChange={handleEdicionChange}
                            required
                            disabled={loadingEdicion}
                        />

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
                                    {RONDAS_DISPONIBLES.map(ronda => (
                                        <option key={ronda.valor} value={ronda.valor}>
                                            {ronda.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="puntos_ejercito">Puntos Ejercito:*</label>
                                <input
                                    type="number"
                                    id="puntos_ejercito"
                                    name="puntos_ejercito"
                                    value={datosEdicion.puntos_ejercito}
                                    onChange={handleEdicionChange}
                                    min={PUNTOS_EJERCITO_WARMASTER.min}
                                    max={PUNTOS_EJERCITO_WARMASTER.max}
                                    required
                                    disabled={loadingEdicion}
                                />
                                <small>{PUNTOS_EJERCITO_WARMASTER.min}-{PUNTOS_EJERCITO_WARMASTER.max} pts</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="participantes_max">Participantes:*</label>
                                <input
                                    type="number"
                                    id="participantes_max"
                                    name="participantes_max"
                                    value={datosEdicion.participantes_max}
                                    onChange={handleEdicionChange}
                                    min={PARTICIPANTES_RANGO.min}
                                    max={PARTICIPANTES_RANGO.max}
                                    required
                                    disabled={loadingEdicion}
                                />
                                <small>{PARTICIPANTES_RANGO.min}-${PARTICIPANTES_RANGO.max}`</small>
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
                            {ESTADOS_TORNEO_WARMASTER.map(estado => (
                                <option key={estado.valor} value={estado.valor}>
                                    {estado.emoji} {estado.nombre}
                                </option>
                            ))}
                        </select>
                    </fieldset>

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

                    <fieldset>
                        <legend>🎲 Escenarios por Ronda</legend>

                        {[1, 2, 3, 4, 5].map(ronda => {
                            if (ronda > 2 && ronda > datosEdicion.rondas_max) return null;
                            
                            return (
                                <div key={ronda}>
                                    <label htmlFor={`partida_ronda_${ronda}`}>
                                        Ronda {ronda}:{ronda <= 2 ? '*' : ''}
                                    </label>
                                    <select
                                        id={`partida_ronda_${ronda}`}
                                        name={`partida_ronda_${ronda}`}
                                        value={datosEdicion[`partida_ronda_${ronda}`]}
                                        onChange={handleEdicionChange}
                                        required={ronda <= 2}
                                        disabled={loadingEdicion}
                                    >
                                        <option value="">Selecciona escenario</option>
                                        {TIPOS_PARTIDA_WARMASTER.map(tipo => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </fieldset>

                    <fieldset>
                        <legend>📄 Bases del Torneo</legend>

                        {torneo.bases_nombre && !eliminarPDF && (
                            <div className="pdf-actual">
                                <p>📎 Archivo actual: <strong>{torneo.bases_nombre}</strong></p>
                                <button
                                    type="button"
                                    onClick={() => setEliminarPDF(true)}
                                    className="btn-danger mt-10"
                                >
                                    🗑️ Eliminar PDF actual
                                </button>
                            </div>
                        )}

                        {eliminarPDF && (
                            <div className="advertencia-finalizado mb-20">
                                <p>⚠️ El PDF actual se eliminará al guardar</p>
                                <button
                                    type="button"
                                    onClick={() => setEliminarPDF(false)}
                                    className="btn-secondary mt-10"
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
                            <p className="success-message mt-10">
                                ✅ Nuevo archivo: {archivoPDF.name} ({(archivoPDF.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </fieldset>

                    <div className="button-group">
                        <button type="submit" className="btn-primary" disabled={loadingEdicion}>
                            {loadingEdicion ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={handleCancelarEdicion} disabled={loadingEdicion}>
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <section className="seccion-info-torneo">
                        <div className="section-header-inline">
                            <h2>ℹ️ Información del Torneo</h2>
                            
                            <div className="botones-accion-grupo">
                                {torneo.estado !== 'finalizado' && (
                                    <>
                                        {torneo.estado === 'pendiente' && (
                                            <button onClick={() => cambiarEstadoTorneo('en_curso')} className="btn-success">
                                                ▶️ Iniciar Torneo
                                            </button>
                                        )}
                                        
                                        {torneo.estado === 'en_curso' && (
                                            <>
                                                <button onClick={() => cambiarEstadoTorneo('pendiente')} className="btn-secondary">
                                                    ⏸️ Volver a Pendiente
                                                </button>
                                                <button onClick={() => cambiarEstadoTorneo('finalizado')} className="btn-warning">
                                                    🏁 Finalizar Torneo
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                
                                {/* SOLO MOSTRAR EDITAR SI ESTÁ PENDIENTE */}
                                {torneo.estado === 'pendiente' && (
                                    <button className="btn-primary" onClick={() => setModoEdicion(true)}>
                                        ✏️ Editar Torneo
                                    </button>
                                )}

                                {/* SOLO ELIMINAR SI ESTÁ PENDIENTE */}
                                {torneo.estado === 'pendiente' && (
                                    <button onClick={eliminarTorneo} className="btn-danger">
                                        🗑️ Eliminar Torneo
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* MENSAJE PARA TORNEO FINALIZADO */}
                        {torneo.estado === 'finalizado' && (
                            <div className="advertencia-finalizado">
                                <strong>🏁 Torneo FINALIZADO</strong>
                                <p>El estado del torneo es permanente y no se puede modificar.</p>
                            </div>
                        )}

                        {/* MENSAJE PARA TORNEO EN CURSO */}
                        {torneo.estado === 'en_curso' && (
                            <div className="advertencia-no-editable">
                                <strong>▶️ Torneo EN CURSO</strong>
                                <p>Para editar la configuración del torneo, primero debe volverse a estado PENDIENTE.</p>
                            </div>
                        )}

                        <div className="info-torneo-grid">
                            <div className="info-item">
                                <label>Tipo de Torneo:</label>
                                <span>{torneo.tipo_torneo}</span>
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
                                    <span className="info-item-destacado">
                                        👤 {totalJugadores} / {torneo?.participantes_max || 0} Jugadores
                                    </span>
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

                   <section className="seccion-rondas">
                        <h2>🎮 Escenarios del Torneo</h2>
                        <div className="rondas-list">
                                {[1, 2, 3, 4, 5].map(ronda => {
                                    if (ronda > torneo.rondas_max) return null;
                                    const partidasStr = torneo[`partida_ronda_${ronda}`];
                                    if (!partidasStr) return null;
                                    
                                    return (
                                        <div key={ronda} className="ronda-item">
                                            <span className="ronda-numero">Ronda {ronda}:</span>
                                            <div className="partidas-container">
                                                <span className="ronda-escenario">
                                                    {partidasStr}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>
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
                            <p>ℹ️ Este torneo no tiene bases cargadas. Usa el botón "Editar Torneo" para subir un PDF.</p>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default VistaGeneralWarmaster;