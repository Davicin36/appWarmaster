import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import torneosSagaApi from '../../servicios/apiSaga';

function VistaGeneral({ torneoId: propTorneoId, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados de edición
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
    const [archivoPDF, setArchivoPDF] = useState(null);
    const [eliminarPDF, setEliminarPDF] = useState(false);

    // Listas de opciones
    const epocaTorneo = [
        "Alejandro", "Ánibal", "Vikingos", "Invasiones",
        "Cruzadas", "Caballeria", "Edad de la Magia",
        "Alejandro/Ánibal", "Vikingos/Invasiones", "Cruzadas/Caballeria",
    ];

    const tiposPartida = [
        "Choque de Bandas", "Conquista", "Avance",
        "Desacralización", "Captura"
    ];

    const estadosTorneo = [
        { valor: 'pendiente', nombre: 'Pendiente' },
        { valor: 'en_curso', nombre: 'En Curso' },
        { valor: 'finalizado', nombre: 'Finalizado' }
    ];

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

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

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            const response = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            
            try {
                const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
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
                dataToSend = datosEdicion;
            }

            await torneosSagaApi.actualizarTorneo(torneoId, dataToSend);
            
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

    const cambiarEstadoTorneo = async (nuevoEstado) => {
        if (torneo.estado === 'finalizado') {
            alert('⚠️ No se puede cambiar el estado de un torneo FINALIZADO.');
            return;
        }

        const mensajes = {
            'pendiente': '⏸️ ¿Marcar torneo como PENDIENTE?',
            'en_curso': '▶️ ¿Iniciar el torneo?',
            'finalizado': '🏁 ¿Finalizar el torneo?\n\n⚠️ Esta acción es DEFINITIVA.'
        };

        if (!window.confirm(mensajes[nuevoEstado])) return;

        if (nuevoEstado === 'finalizado') {
            if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN:\n¿Estás completamente seguro?')) return;
        }

        try {
            await torneosSagaApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
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
            await torneosSagaApi.eliminarTorneo(torneoId);
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

    const handleSetEliminarPDF = (valor) => {
        setEliminarPDF(valor);
    };

    if (loading) {
        return (
            <div className="vista-general">
                <div style={{ textAlign: 'center', padding: '40px' }}>
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

    return (
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
                                    onClick={() => handleSetEliminarPDF(true)}
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
                                    onClick={() => handleSetEliminarPDF(false)}
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
                    {/* INFORMACIÓN DEL TORNEO CON BOTONES INTEGRADOS */}
                    <section className="seccion-info-torneo">
                        <div className="section-header-inline">
                            <h2>ℹ️ Información del Torneo</h2>
                            
                            {/* BOTONES DE ACCIÓN AGRUPADOS */}
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
    );
}

export default VistaGeneral;