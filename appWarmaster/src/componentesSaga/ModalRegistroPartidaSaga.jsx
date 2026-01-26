import React, { useState } from 'react';
import torneosSagaApi from '../servicios/apiSaga';
import '@/estilos/modalPartidas.css';

function ModalRegistroPartida({ partida, onClose, onGuardar, esOrganizador = false }) {
    const resultadoConfirmado = partida.resultado_confirmado || false;

    const tieneDatos = () => {
        return (
            (parseFloat(partida.puntos_partida_j1 || 0) > 0) ||
            (parseFloat(partida.puntos_partida_j2 || 0) > 0) ||
            (parseFloat(partida.puntos_torneo_j1 || 0) > 0) ||
            (parseFloat(partida.puntos_torneo_j2 || 0) > 0)
        );
    };

    const esBye = (!partida.jugador2_id || partida.es_bye === 1) && !tieneDatos();

    const esTorneoEquipos = !!partida.equipo1_id; // Detectar si es torneo por equipos
    
    const [resultado, setResultado] = useState({
        puntos_partida_j1: partida.puntos_partida_j1 || 0,
        puntos_partida_j2: partida.puntos_partida_j2 || 0,
        puntos_masacre_j1: partida.puntos_masacre_j1 || 0,
        puntos_masacre_j2: partida.puntos_masacre_j2 || 0,
        puntos_bonificacionj1:  0,
        puntos_bonificacionj2:  0,
        warlord_muerto_j1: partida.warlord_muerto_j1 || false,
        warlord_muerto_j2: partida.warlord_muerto_j2 || false,
        primer_jugador: partida.primer_jugador || null
    });

    const elCruce = partida.nombre_partida?.toLowerCase() === 'el cruce'
    
    const [guardando, setGuardando] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [error, setError] = useState(null);

    const [sinDados, setSinDados] = useState({
        activo: partida.sin_dados || false,
        ganador: partida.ganador_sin_dados || null
    });

    const handleChange = (campo, valor) => {
        setResultado(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const meQuedoSinDados = (ganador) => {
            setSinDados({
            activo: true,
            ganador
        });
    };

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setError(null);

            if (!resultado.primer_jugador) {
                throw new Error('Debes asignar quién fue el primer jugador antes de guardar');
            }

            if (!sinDados.activo && resultado.puntos_partida_j1 === 0 && resultado.puntos_partida_j2 === 0) {
                throw new Error('Debes introducir al menos algunos puntos de partida');
            }

            const datosPartida = {
                puntos_partida_j1: parseInt(resultado.puntos_partida_j1) || 0,
                puntos_partida_j2: parseInt(resultado.puntos_partida_j2) || 0,
                puntos_masacre_j1: parseInt(resultado.puntos_masacre_j1 ?? 0),
                puntos_masacre_j2: parseInt(resultado.puntos_masacre_j2 ?? 0),
                warlord_muerto_j1: resultado.warlord_muerto_j1,
                warlord_muerto_j2: resultado.warlord_muerto_j2,
                primer_jugador: resultado.primer_jugador,
                sin_dados: sinDados.activo,
                ganador_sin_dados: sinDados.ganador
            };

            const response = await torneosSagaApi.registrarPartida(
                partida.torneo_id,
                partida.id,
                datosPartida
            );

            const nombreJ1 = partida.jugador1_nombre || partida.jugador1?.nombre;
            const nombreJ2 = partida.jugador2_nombre || partida.jugador2?.nombre;   

            const mensaje = response.data 
                ?   `✅ Resultado guardado correctamente\n\n` +
                    `⚠️ Pendiente de confirmación del organizador\n\n` +
                    `Resultado: ${response.data.resultado}\n` +
                    `Primer Jugador : ${nombreJ1}\n` +
                    ` * Puntos Torneo J1: ${response.data.puntosTorneo?.jugador1 || 0}` + ' - ' +
                    ` * Puntos Masacre J1: ${response.data.puntosMasacre?.jugador1 || 0}\n` +
                    `Segundo Jugador : ${nombreJ2}\n` + 
                    ` * Puntos Torneo J2: ${response.data.puntosTorneo?.jugador2 || 0}` + ' - ' +
                    ` * Puntos Masacre J2: ${response.data.puntosMasacre?.jugador2 || 0}` 
                :   '✅ Resultado guardado correctamente (pendiente de confirmación)';

            alert(mensaje);
            
            if (onGuardar) {
                onGuardar(response.data);
            }
            onClose();

        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message || 'Error al guardar resultado');
            alert(`❌ Error: ${err.message || 'Error al guardar resultado'}`);
        } finally {
            setGuardando(false);
        }
    };

    const handleConfirmar = async (confirmar) => {
        try {
            setConfirmando(true);
            
            const mensaje = confirmar 
                ? '¿Confirmar este resultado definitivamente?\n\nUna vez confirmado, no se podrá editar.'
                : '¿Desconfirmar este resultado?\n\nPodrá ser editado nuevamente.';
            
            if (!window.confirm(mensaje)) {
                return;
            }

            await torneosSagaApi.confirmarResultado(
                partida.torneo_id,
                partida.id,
                confirmar
            );

            alert(confirmar ? '✅ Resultado confirmado' : '⚠️ Resultado desconfirmado');
            
            if (onGuardar) {
                onGuardar();
            }
            onClose();

        } catch (err) {
            console.error('❌ Error:', err);
            alert(`❌ Error: ${err.message}`);
        } finally {
            setConfirmando(false);
        }
    };

    const getResultadoPreview = () => {
        const ppJ1 = parseInt(resultado.puntos_partida_j1) || 0;
        const ppJ2 = parseInt(resultado.puntos_partida_j2) || 0;
        const pbJ1 = parseInt (resultado.puntos_bonificacionj1) || 0
        const pbJ2 = parseInt (resultado.puntos_bonificacionj2) || 0

        // 🎲 PRIORIDAD: SIN DADOS
        if (sinDados.activo && sinDados.ganador) {
            const nombreGanador = sinDados.ganador === 1 ? partida.jugador1_nombre : partida.jugador2_nombre;
            return `🏆 Victoria de ${nombreGanador} (3–0, sin dados)`;
        }
        
        // 📊 TORNEOS POR EQUIPOS: Victoria si diferencia >= 3
        if (esTorneoEquipos) {
            const diferencia = Math.abs(ppJ1 - ppJ2);
            const umbralDiferencia = 3; 
            
            if (diferencia >= umbralDiferencia) {
                if (ppJ1 > ppJ2) {
                    return `🏆 Victoria de ${partida.jugador1_nombre}`;
                } else {
                    return `🏆 Victoria de ${partida.jugador2_nombre}`;
                }
            } else {
                if (elCruce && ppJ1 === ppJ2) {
                    if (pbJ1 > pbJ2) {
                        return `🏆 Victoria de ${partida.jugador1_nombre} (desempate por bonificación: ${pbJ1}-${pbJ2})`;
                    } else if (pbJ2 > pbJ1) {
                        return `🏆 Victoria de ${partida.jugador2_nombre} (desempate por bonificación: ${pbJ2}-${pbJ1})`;
                    } else {
                        return `🤝 Empate (${ppJ1}-${ppJ2}, bonificación ${pbJ1}-${pbJ2})`;
                    }
                }
                // Diferencia < 3 = EMPATE
                return `🤝 Empate (${ppJ1}-${ppJ2})`;
            }
            
        } else {
            // 📊 TORNEOS INDIVIDUALES: Victoria por más puntos
            if (ppJ1 > ppJ2) {
                return `🏆 Victoria de ${partida.jugador1_nombre}`;
            }
            if (ppJ2 > ppJ1) {
                return `🏆 Victoria de ${partida.jugador2_nombre}`;
            }

            if (elCruce && ppJ1 === ppJ2) {
                if (pbJ1 > pbJ2) {
                    return `🏆 Victoria de ${partida.jugador1_nombre} (desempate por bonificación: ${pbJ1}-${pbJ2})`;
                } else if (pbJ2 > pbJ1) {
                    return `🏆 Victoria de ${partida.jugador2_nombre} (desempate por bonificación: ${pbJ2}-${pbJ1})`;
                } else {
                    return `🤝 Empate (${ppJ1}-${ppJ2}, bonificación ${pbJ1}-${pbJ2})`;
                }
            }
            return `🤝 Empate (${ppJ1}-${ppJ2})`;
        }
    };

    // Función auxiliar para obtener el nombre del jugador
    const getNombreJugador = (jugadorNum) => {
        if (esTorneoEquipos) {
            return jugadorNum === 1 ? partida.jugador1_nombre : partida.jugador2_nombre;
        }
        return jugadorNum === 1 
            ? (partida.jugador1_nombre || partida.jugador1?.nombre)
            : (partida.jugador2_nombre || partida.jugador2?.nombre);
    };

    // SI ES BYE CONFIRMADO
    if (esBye && resultadoConfirmado) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header confirmado">
                        <h3>✅ Partida BYE Confirmada - Mesa {partida.mesa}</h3>
                        <button className="btn-close confirmado" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div className="alerta-confirmado">
                            <p>✅ Esta victoria BYE ha sido confirmada por el organizador</p>
                        </div>

                        <div className="bye-info">
                            <h3>⭐ Victoria Automática</h3>
                            {esTorneoEquipos ? (
                                <>
                                    <p><strong>Equipo:</strong> {partida.equipo1_nombre}</p>
                                    <p><strong>Jugador:</strong> {partida.jugador1_nombre} - {partida.jugador1_alias}</p>
                                    <p><strong>Facción:</strong> {partida.jugador1_faccion}</p>
                                </>
                            ) : (
                                <p><strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong></p>
                            )}
                            <p className="puntos-bye">10 Puntos de Torneo</p>
                            <p className="ronda-info">Ronda: {partida.ronda}</p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {esOrganizador && (
                            <button 
                                onClick={() => handleConfirmar(false)}
                                disabled={confirmando}
                                className="btn-desconfirmar"
                            >
                                {confirmando ? '⏳ Procesando...' : '🔓 Desconfirmar Victoria'}
                            </button>
                        )}
                        
                        <button className="btn-cerrar" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // SI ES BYE PENDIENTE
    if (esBye) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>⚠️ Partida BYE - Mesa {partida.mesa}</h3>
                        <button className="btn-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div className="alerta-pendiente">
                            <p>⚠️ Esta victoria BYE está pendiente de confirmación del organizador</p>
                        </div>

                        <div className="bye-info">
                            <h3>⭐ Victoria Automática</h3>
                            {esTorneoEquipos ? (
                                <>
                                    <p><strong>Equipo:</strong> {partida.equipo1_nombre}</p>
                                    <p><strong>Jugador:</strong> {partida.jugador1_nombre} - {partida.jugador1_alias}</p>
                                </>
                            ) : (
                                <p><strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong></p>
                            )}
                            <p className="puntos-bye">10 Puntos de Torneo</p>
                            <p className="ronda-info">Ronda: {partida.ronda}</p>
                        </div>

                        <div className="info-bye-explicacion">
                            <p>💡 Las partidas BYE otorgan automáticamente 10 puntos de torneo al jugador presente.</p>
                            {esOrganizador && (
                                <p className="nota-organizador">
                                    Como organizador, debes confirmar esta victoria para que sea definitiva.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={onClose} disabled={confirmando}>
                            Cerrar
                        </button>
                        
                        {esOrganizador && (
                            <button 
                                onClick={() => handleConfirmar(true)}
                                disabled={confirmando}
                                className="btn-confirmar-bye"
                            >
                                {confirmando ? '⏳ Confirmando...' : '✅ Confirmar Victoria BYE'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // SI ESTÁ CONFIRMADO (SOLO LECTURA)
    if (resultadoConfirmado) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header confirmado">
                        <h3>✅ Resultado Confirmado - Mesa {partida.mesa}</h3>
                        <button className="btn-close confirmado" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div className="alerta-confirmado">
                            <p>✅ Este resultado ha sido confirmado por el organizador</p>
                            <p className="nota-no-editable">Los datos ya no se pueden modificar</p>
                        </div>

                        <div className="partida-info">
                            <p><strong>Escenario:</strong> {partida.nombre_partida || 'Por definir'}</p>
                            <p><strong>Ronda:</strong> {partida.ronda}</p>
                            <p><strong>Resultado:</strong> {getResultadoPreview()}</p>
                        </div>

                        <div className="resultados-grid">
                            <div className="jugador-stats">
                                {esTorneoEquipos ? (
                                    <>
                                        <h4>{partida.equipo1_nombre}</h4>
                                        <p className="jugador-equipo">
                                            <strong>Jugador:</strong> {partida.jugador1_nombre}
                                        </p>
                                        {partida.jugador1_faccion && (
                                            <p><strong>Facción:</strong> {partida.jugador1_faccion}</p>
                                        )}
                                        {partida.jugador1_epoca && (
                                            <p><strong>Época:</strong> {partida.jugador1_epoca}</p>
                                        )}
                                    </>
                                ) : (
                                    <h4>{partida.jugador1_nombre}</h4>
                                )}
                                <p><strong>Puntos Partida:</strong> {partida.puntos_partida_j1}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j1}</p>
                                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j1}</p>
                                <p><strong>Warlord Eliminado:</strong> {partida.warlord_muerto_j1 ? 'Sí' : 'No'}</p>
                            </div>

                            <div className="vs-divider">VS</div>

                            <div className="jugador-stats">
                                {esTorneoEquipos ? (
                                    <>
                                        <h4>{partida.equipo2_nombre}</h4>
                                        <p className="jugador-equipo">
                                            <strong>Jugador:</strong> {partida.jugador2_nombre}
                                        </p>
                                        {partida.jugador2_faccion && (
                                            <p><strong>Facción:</strong> {partida.jugador2_faccion}</p>
                                        )}
                                        {partida.jugador2_epoca && (
                                            <p><strong>Época:</strong> {partida.jugador2_epoca}</p>
                                        )}
                                    </>
                                ) : (
                                    <h4>{partida.jugador2_nombre}</h4>
                                )}
                                <p><strong>Puntos Partida:</strong> {partida.puntos_partida_j2}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j2}</p>
                                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j2}</p>
                                <p><strong>Warlord Eliminado:</strong> {partida.warlord_muerto_j2 ? 'Sí' : 'No'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {esOrganizador && (
                            <button 
                                onClick={() => handleConfirmar(false)}
                                disabled={confirmando}
                                className="btn-desconfirmar"
                            >
                                {confirmando ? '⏳ Procesando...' : '🔓 Desconfirmar Resultado'}
                            </button>
                        )}
                        
                        <button className="btn-cerrar" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // MODO EDICIÓN
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-edicion" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📝 Registrar Resultado - Mesa {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="alerta-pendiente">
                        <p>⚠️ Este resultado está pendiente de confirmación del organizador</p>
                    </div>

                    {error && (
                        <div className="error-message">
                            <p>❌ {error}</p>
                        </div>
                    )}

                    <div className="partida-info">
                        <p><strong>Escenario:</strong> {partida.nombre_partida || partida.escenario || 'Por definir'}</p>
                        <p><strong>Ronda:</strong> {partida.ronda}</p>
                        {esTorneoEquipos && (
                            <p className="info-equipos">
                                🛡️ <strong>Torneo por Equipos</strong> - Los puntos se suman a la clasificación del equipo
                            </p>
                        )}
                    </div>

                    <div className="seccion-primer-jugador">
                        <h4>🎲 Primer Jugador</h4>
                        {resultado.primer_jugador ? (
                            <div className="primer-jugador-seleccionado">
                                <p>
                                    ✅ <strong>{getNombreJugador(resultado.primer_jugador === partida.jugador1_id ? 1 : 2)}</strong> fue el primer jugador
                                </p>
                                {/* 🆕 Botón para deseleccionar */}
                                <button
                                    type="button"
                                    onClick={() => setResultado(prev => ({ ...prev, primer_jugador: null }))}
                                    className="btn-limpiar-seleccion"
                                >
                                    ✕ Cambiar selección
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="instruccion">⚠️ Selecciona quién fue el primer jugador:</p>
                                <div className="botones-primer-jugador">
                                    <button
                                        onClick={() => setResultado(prev => ({ 
                                            ...prev, 
                                            primer_jugador: partida.jugador1_id 
                                        }))}
                                        className="btn-seleccionar-jugador"
                                    >
                                        {getNombreJugador(1)}
                                    </button>
                                    <button
                                        onClick={() => setResultado(prev => ({ 
                                            ...prev, 
                                            primer_jugador: partida.jugador2_id 
                                        }))}
                                        className="btn-seleccionar-jugador"
                                    >
                                        {getNombreJugador(2)}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="formulario-grid">
                        <div className="jugador-resultado">
                            {esTorneoEquipos ? (
                                <>
                                    <h4>{partida.equipo1_nombre}</h4>
                                    <p className="info-jugador-equipo">
                                        👤 <strong>{partida.jugador1_nombre} - {partida.jugador1_alias}</strong>
                                    </p>
                                    {partida.jugador1_faccion && (
                                        <p className="info-extra">⚔️ {partida.jugador1_faccion}</p>
                                    )}
                                    {partida.jugador1_epoca && (
                                        <p className="info-extra">📅 {partida.jugador1_epoca}</p>
                                    )}
                                </>
                            ) : (
                                <h4>{partida.jugador1_nombre || partida.jugador1?.nombre}</h4>
                            )}
                            
                            <div className="form-group">
                                <label>
                                    {esTorneoEquipos ? 'Puntos de Torneo:*' : 'Puntos de Partida:*'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_partida_j1}
                                    onChange={(e) => handleChange('puntos_partida_j1', e.target.value)}
                                    disabled={guardando}
                                />
                                {esTorneoEquipos && (
                                    <small className="nota-equipos">
                                        💡 Introduce directamente los puntos de torneo
                                    </small>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Puntos de Masacre:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_masacre_j1}
                                    onChange={(e) => handleChange('puntos_masacre_j1', e.target.value)}
                                    disabled={guardando}
                                />
                            </div>
                            {elCruce && (
                                <div className="form-group">
                                    <label>Puntos de bonificación</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={resultado.ountos_bonificacionj1}
                                        onChange={(e) => handleChange('puntos_bonificacionj1', e.target.value)}
                                        disabled={guardando}
                                    />
                                    <small className="nota-equipos">
                                        Se usarán en caso de empate para desempatar.
                                    </small>
                                </div>
                            )}
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={resultado.warlord_muerto_j1}
                                        onChange={(e) => handleChange('warlord_muerto_j1', e.target.checked)}
                                        disabled={guardando}
                                    />
                                    Eliminó al Warlord enemigo
                                </label>
                            </div>
                        </div>

                        <div className="vs-divider">VS</div>

                        <div className="jugador-resultado">
                            {esTorneoEquipos ? (
                                <>
                                    <h4>{partida.equipo2_nombre} </h4>
                                    <p className="info-jugador-equipo">
                                        👤 <strong>{partida.jugador2_nombre} - {partida.jugador2_alias}</strong>
                                    </p>
                                    {partida.jugador2_faccion && (
                                        <p className="info-extra">⚔️ {partida.jugador2_faccion}</p>
                                    )}
                                    {partida.jugador2_epoca && (
                                        <p className="info-extra">📅 {partida.jugador2_epoca}</p>
                                    )}
                                </>
                            ) : (
                                <h4>{partida.jugador2_nombre || partida.jugador2?.nombre}</h4>
                            )}
                            
                            <div className="form-group">
                                <label>
                                    {esTorneoEquipos ? 'Puntos de Torneo:*' : 'Puntos de Partida:*'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_partida_j2}
                                    onChange={(e) => handleChange('puntos_partida_j2', e.target.value)}
                                    disabled={guardando}
                                />
                                {esTorneoEquipos && (
                                    <small className="nota-equipos">
                                        💡 Introduce directamente los puntos de torneo
                                    </small>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Puntos de Masacre:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_masacre_j2}
                                    onChange={(e) => handleChange('puntos_masacre_j2', e.target.value)}
                                    disabled={guardando}
                                />
                            </div>
                             {elCruce && (
                                <div className="form-group">
                                    <label>Puntos de bonificación</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={resultado.ountos_bonificacionj2}
                                        onChange={(e) => handleChange('puntos_bonificacionj2', e.target.value)}
                                        disabled={guardando}
                                    />
                                    <small className="nota-equipos">
                                        Se usarán en caso de empate para desempatar.
                                    </small>
                                </div>
                            )}
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={resultado.warlord_muerto_j2}
                                        onChange={(e) => handleChange('warlord_muerto_j2', e.target.checked)}
                                        disabled={guardando}
                                    />
                                    Eliminó al Warlord enemigo
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="seccion-sin-dados">
                        <h4>Jugador se queda SIN DADOS</h4>

                        {sinDados.activo ? (
                            <>
                                <div className="info-sin-dados">
                                    <p>
                                        🏆 Victoria 3–0 de <strong>{getNombreJugador(sinDados.ganador)}</strong> por quedarse sin dados
                                    </p>
                                </div>
                                {/* 🆕 Botón para deseleccionar */}
                                <button
                                    type="button"
                                    onClick={() => setSinDados({ activo: false, ganador: null })}
                                    className="btn-limpiar-sin-dados"
                                >
                                    ✕ Cancelar victoria sin dados
                                </button>
                            </>
                        ) : (
                            <div className="botones-sin-dados">
                                <button
                                    type="button"
                                    onClick={() => meQuedoSinDados(1)}
                                    className="btn-sin-dados"
                                >
                                    🚫 {getNombreJugador(2)} sin dados
                                </button>

                                <button
                                    type="button"
                                    onClick={() => meQuedoSinDados(2)}
                                    className="btn-sin-dados"
                                >
                                    🚫 {getNombreJugador(1)} sin dados
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="resultado-preview">
                        <h4>Resultado:</h4>
                        <div className="resultado-badge">
                            {getResultadoPreview()}
                        </div>
                        <p className="nota-calculo">
                            {esTorneoEquipos 
                                ? '💡 Los puntos de masacre y victoria se calcularán automáticamente'
                                : '💡 Los puntos de victoria y torneo se calcularán automáticamente'
                            }
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                        disabled={guardando}
                    >
                        Cancelar
                    </button>
                    
                    <div className="botones-accion">
                        {esOrganizador && partida.puntos_partida_j1 > 0 && (
                            <button 
                                onClick={() => handleConfirmar(true)}
                                disabled={guardando || confirmando || !resultado.primer_jugador}
                                className="btn-confirmar-definitivo"
                            >
                                {confirmando ? '⏳ Confirmando...' : '✅ Confirmar Definitivamente'}
                            </button>
                        )}
                        
                        <button 
                            onClick={handleGuardar}
                            disabled={guardando || !resultado.primer_jugador}
                            className="btn-guardar"
                        >
                            {guardando ? '⏳ Guardando...' : '💾 Guardar Resultado'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalRegistroPartida;