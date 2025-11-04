import React from 'react';

function VistaGeneral({ 
    torneo, 
    jugadores,
    modoEdicion,
    setModoEdicion,
    datosEdicion,
    loadingEdicion,
    errorEdicion,
    archivoPDF,
    eliminarPDF,
    handleSetEliminarPDF,
    handleGuardarCambios,
    handleCancelarEdicion,
    handleEdicionChange,
    handleArchivoPDF,
    descargarBases,
    cambiarEstadoTorneo,
    eliminarTorneo,
    epocaTorneo,
    tiposPartida,
    estadosTorneo
}) {
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