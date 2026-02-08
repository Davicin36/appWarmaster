import React, { useState } from 'react';
import torneosWarmasterApi from '@/servicios/apiWarmaster';
import '@/estilos/modalPartidas.css';

function ModalRegistroPartidaWarmaster({ partida, onClose, onGuardar, esOrganizador = false }) {
    const resultadoConfirmado = partida.resultado_confirmado || false;
    const esBye = !partida.jugador2_id || partida.es_bye;
    
    // Detectar si es Batalla Campal
    const nombrePartida = partida.nombre_partida || '';
    const esBatallaCampal = nombrePartida.toLowerCase().includes('batalla campal');
    
    const [resultado, setResultado] = useState({
        puntos_masacre_j1: partida.puntos_masacre_j1 || 0,
        puntos_masacre_j2: partida.puntos_masacre_j2 || 0,
        puntos_torneo_j1: partida.puntos_victoria_j1 || 0,
        puntos_torneo_j2: partida.puntos_victoria_j2 || 0,
        general_muerto_j1: partida.general_muerto_j1 || false,  // ✅ NUEVO
        general_muerto_j2: partida.general_muerto_j2 || false,  // ✅ NUEVO
    });
    
    const [guardando, setGuardando] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (campo, valor) => {
        setResultado(prev => ({
            ...prev,
            [campo]: parseInt(valor) || 0
        }));
    };

    // ✅ NUEVO - Handler para checkboxes
    const handleCheckboxChange = (campo, checked) => {
        setResultado(prev => ({
            ...prev,
            [campo]: checked
        }));
    };

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setError(null);

            const pmJ1 = parseInt(resultado.puntos_masacre_j1) || 0;
            const pmJ2 = parseInt(resultado.puntos_masacre_j2) || 0;

            if (pmJ1 === 0 && pmJ2 === 0) {
                throw new Error('Debes introducir al menos algunos puntos de masacre');
            }

            const datosPartida = {
                puntos_masacre_j1: pmJ1,
                puntos_masacre_j2: pmJ2,
                general_muerto_j1: resultado.general_muerto_j1,  // ✅ NUEVO
                general_muerto_j2: resultado.general_muerto_j2,  // ✅ NUEVO
            };

            // Si NO es batalla campal, enviar puntos de torneo
            if (!esBatallaCampal) {
                datosPartida.puntos_torneo_j1 = parseInt(resultado.puntos_torneo_j1) || 0;
                datosPartida.puntos_torneo_j2 = parseInt(resultado.puntos_torneo_j2) || 0;
            }

             await torneosWarmasterApi.registrarPartida(
                partida.torneo_id,
                partida.id,
                datosPartida
             );

            // Calcular resultado para mostrar
            const resultadoTexto = getResultadoTexto();

            alert(`✅ Resultado guardado correctamente\n\n` +
                  `⚠️ Pendiente de confirmación del organizador\n\n` +
                  `${resultadoTexto}\n` +
                  `PM: ${pmJ1} - ${pmJ2}`);
            
            if (onGuardar) {
                onGuardar();
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
                ? '¿Confirmar este resultado definitivamente?\n\nLos puntos se sumarán a la clasificación.'
                : '¿Desconfirmar este resultado?\n\nLos puntos se restarán de la clasificación.';
            
            if (!window.confirm(mensaje)) {
                return;
            }

            await torneosWarmasterApi.confirmarResultado(
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

    const getResultadoTexto = () => {
        const pmJ1 = parseInt(resultado.puntos_masacre_j1) || 0;
        const pmJ2 = parseInt(resultado.puntos_masacre_j2) || 0;
        
        if (esBatallaCampal) {
            const diferencia = Math.abs(pmJ1 - pmJ2);
            if (diferencia <= 150) {
                return 'Empate (1-1)';
            } else if (pmJ1 > pmJ2) {
                return `Victoria de ${partida.jugador1_nombre} (3-0)`;
            } else {
                return `Victoria de ${partida.jugador2_nombre} (0-3)`;
            }
        } else {
            const ptJ1 = parseInt(resultado.puntos_torneo_j1) || 0;
            const ptJ2 = parseInt(resultado.puntos_torneo_j2) || 0;
            
            if (ptJ1 > ptJ2) {
                return `Victoria de ${partida.jugador1_nombre} (${ptJ1}-${ptJ2})`;
            } else if (ptJ2 > ptJ1) {
                return `Victoria de ${partida.jugador2_nombre} (${ptJ1}-${ptJ2})`;
            } else {
                return `Empate (${ptJ1}-${ptJ2})`;
            }
        }
    };

    const getResultadoPreview = () => {
        const pmJ1 = parseInt(resultado.puntos_masacre_j1) || 0;
        const pmJ2 = parseInt(resultado.puntos_masacre_j2) || 0;
        
        if (esBatallaCampal) {
            const diferencia = Math.abs(pmJ1 - pmJ2);
            if (diferencia <= 150) {
                return '🤝 Empate (1-1)';
            } else if (pmJ1 > pmJ2) {
                return `🏆 Victoria de ${partida.jugador1_nombre} (3-0)`;
            } else {
                return `🏆 Victoria de ${partida.jugador2_nombre} (0-3)`;
            }
        } else {
            const ptJ1 = parseInt(resultado.puntos_torneo_j1) || 0;
            const ptJ2 = parseInt(resultado.puntos_torneo_j2) || 0;
            
            if (ptJ1 > ptJ2) {
                return `🏆 Victoria de ${partida.jugador1_nombre} (${ptJ1}-${ptJ2})`;
            } else if (ptJ2 > ptJ1) {
                return `🏆 Victoria de ${partida.jugador2_nombre} (${ptJ1}-${ptJ2})`;
            } else {
                return `🤝 Empate (${ptJ1}-${ptJ2})`;
            }
        }
    };

    // SI ES BYE
    if (esBye) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className={`modal-header ${resultadoConfirmado ? 'confirmado' : ''}`}>
                        <h3>{resultadoConfirmado ? '✅' : '⚠️'} Partida BYE - Mesa {partida.mesa}</h3>
                        <button className="btn-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div className={resultadoConfirmado ? 'alerta-confirmado' : 'alerta-pendiente'}>
                            <p>{resultadoConfirmado 
                                ? '✅ Esta victoria BYE ha sido confirmada por el organizador'
                                : '⚠️ Esta victoria BYE está pendiente de confirmación del organizador'
                            }</p>
                        </div>

                        <div className="bye-info">
                            <h3>⭐ Victoria Automática</h3>
                            <p><strong>{partida.jugador1_nombre}</strong></p>
                            <p className="puntos-bye">3 Puntos de Victoria</p>
                            <p className="puntos-bye">150 Puntos de Masacre</p>
                            <p className="ronda-info">Ronda: {partida.ronda}</p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {esOrganizador && (
                            <button 
                                onClick={() => handleConfirmar(!resultadoConfirmado)}
                                disabled={confirmando}
                                className={resultadoConfirmado ? 'btn-desconfirmar' : 'btn-confirmar-bye'}
                            >
                                {confirmando 
                                    ? '⏳ Procesando...' 
                                    : (resultadoConfirmado ? '🔓 Desconfirmar' : '✅ Confirmar Victoria BYE')
                                }
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
                            {esBatallaCampal && (
                                <p className="tipo-escenario">⚔️ Batalla Campal (Empate si diferencia ≤ 150 PM)</p>
                            )}
                        </div>

                        <div className="resultados-grid">
                            <div className="jugador-stats">
                                <h4>{partida.jugador1_nombre}</h4>
                                {partida.jugador1?.ejercito && (
                                    <p><strong>Ejército:</strong> {partida.jugador1.ejercito}</p>
                                )}
                                <p><strong>Puntos Victoria:</strong> {partida.puntos_victoria_j1}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j1}</p>
                                {/* ✅ NUEVO - Mostrar general muerto */}
                                {partida.general_muerto_j1 && (
                                    <p className="general-muerto">💀 General enemigo eliminado (+1 PV)</p>
                                )}
                            </div>

                            <div className="vs-divider">VS</div>

                            <div className="jugador-stats">
                                <h4>{partida.jugador2_nombre}</h4>
                                {partida.jugador2?.ejercito && (
                                    <p><strong>Ejército:</strong> {partida.jugador2.ejercito}</p>
                                )}
                                <p><strong>Puntos Victoria:</strong> {partida.puntos_victoria_j2}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j2}</p>
                                {/* ✅ NUEVO - Mostrar general muerto */}
                                {partida.general_muerto_j2 && (
                                    <p className="general-muerto">💀 General enemigo eliminado (+1 PV)</p>
                                )}
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
                        <p><strong>Escenario:</strong> {partida.nombre_partida || 'Por definir'}</p>
                        <p><strong>Ronda:</strong> {partida.ronda}</p>
                        {esBatallaCampal && (
                            <p className="tipo-escenario">⚔️ <strong>Batalla Campal</strong> - Empate si diferencia ≤ 150 PM</p>
                        )}
                    </div>

                    <div className="formulario-grid">
                        {/* ========== JUGADOR 1 ========== */}
                        <div className="jugador-resultado">
                            <h4>{partida.jugador1_nombre}</h4>
                            {partida.jugador1?.ejercito && (
                                <p className="info-extra">⚔️ {partida.jugador1.ejercito}</p>
                            )}
                            
                            <div className="form-group">
                                <label>Puntos de Masacre:*</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9999"
                                    value={resultado.puntos_masacre_j1}
                                    onChange={(e) => handleChange('puntos_masacre_j1', e.target.value)}
                                    disabled={guardando}
                                />
                                <small>💡 Puntos de ejército destruido</small>
                            </div>

                            {!esBatallaCampal && (
                                <div className="form-group">
                                    <label>Puntos de Torneo:*</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={resultado.puntos_torneo_j1}
                                        onChange={(e) => handleChange('puntos_torneo_j1', e.target.value)}
                                        disabled={guardando}
                                    />
                                    <small>💡 Puntos según escenario</small>
                                </div>
                            )}

                            {/* ✅✅✅ NUEVO - CHECKBOX GENERAL MUERTO ✅✅✅ */}
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={resultado.general_muerto_j1}
                                        onChange={(e) => handleCheckboxChange('general_muerto_j1', e.target.checked)}
                                        disabled={guardando}
                                    />
                                    <span>💀 Eliminó el general enemigo (+1 PV)</span>
                                </label>
                            </div>
                        </div>

                        <div className="vs-divider">VS</div>

                        {/* ========== JUGADOR 2 ========== */}
                        <div className="jugador-resultado">
                            <h4>{partida.jugador2_nombre}</h4>
                            {partida.jugador2?.ejercito && (
                                <p className="info-extra">⚔️ {partida.jugador2.ejercito}</p>
                            )}
                            
                            <div className="form-group">
                                <label>Puntos de Masacre:*</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="9999"
                                    value={resultado.puntos_masacre_j2}
                                    onChange={(e) => handleChange('puntos_masacre_j2', e.target.value)}
                                    disabled={guardando}
                                />
                                <small>💡 Puntos de ejército destruido</small>
                            </div>

                            {!esBatallaCampal && (
                                <div className="form-group">
                                    <label>Puntos de Torneo:*</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={resultado.puntos_torneo_j2}
                                        onChange={(e) => handleChange('puntos_torneo_j2', e.target.value)}
                                        disabled={guardando}
                                    />
                                    <small>💡 Puntos según escenario</small>
                                </div>
                            )}

                            {/* ✅✅✅ NUEVO - CHECKBOX GENERAL MUERTO ✅✅✅ */}
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={resultado.general_muerto_j2}
                                        onChange={(e) => handleCheckboxChange('general_muerto_j2', e.target.checked)}
                                        disabled={guardando}
                                    />
                                    <span>💀 Eliminó el general enemigo (+1 PV)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="resultado-preview">
                        <h4>Resultado:</h4>
                        <div className="resultado-badge">
                            {getResultadoPreview()}
                        </div>
                        {esBatallaCampal ? (
                            <p className="nota-calculo">
                                💡 Batalla Campal:<br/>
                                • Diferencia ≤ 150 PM → Empate (1-1)<br/>
                                • Diferencia &gt; 150 PM → Victoria (3-0)<br/>
                                💀 Eliminar general enemigo: +1 punto adicional
                            </p>
                        ) : (
                            <p className="nota-calculo">
                                💡 Introduce los puntos de torneo según las reglas del escenario<br/>
                                💀 Eliminar general enemigo: +1 punto adicional
                            </p>
                        )}
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
                    
                    <button 
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="btn-guardar"
                    >
                        {guardando ? '⏳ Guardando...' : '💾 Guardar Resultado'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalRegistroPartidaWarmaster;