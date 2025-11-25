import React, { useState } from 'react';
import torneosSagaApi from '../servicios/apiSaga';
import '@/estilos/modalPartidas.css';

function ModalRegistroPartida({ partida, onClose, onGuardar, esOrganizador = false }) {
    const resultadoConfirmado = partida.resultado_confirmado || false;
    const esBye = !partida.jugador2_id || partida.resultado_ps === 'victoria_j1';
    
    const [resultado, setResultado] = useState({
        puntos_partida_j1: partida.puntos_partida_j1 || 0,
        puntos_partida_j2: partida.puntos_partida_j2 || 0,
        puntos_masacre_j1: partida.puntos_masacre_j1 || 0,
        puntos_masacre_j2: partida.puntos_masacre_j2 || 0,
        warlord_muerto_j1: partida.warlord_muerto_j1 || false,
        warlord_muerto_j2: partida.warlord_muerto_j2 || false,
        primer_jugador: partida.primer_jugador || null
    });
    
    const [guardando, setGuardando] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (campo, valor) => {
        setResultado(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setError(null);

            if (!resultado.primer_jugador) {
                throw new Error('Debes asignar quién fue el primer jugador antes de guardar');
            }

            if (resultado.puntos_partida_j1 === 0 && resultado.puntos_partida_j2 === 0) {
                throw new Error('Debes introducir al menos algunos puntos de partida');
            }

            const datosPartida = {
                puntos_partida_j1: parseInt(resultado.puntos_partida_j1) || 0,
                puntos_partida_j2: parseInt(resultado.puntos_partida_j2) || 0,
                puntos_masacre_j1: parseInt(resultado.puntos_masacre_j1) || 0,
                puntos_masacre_j2: parseInt(resultado.puntos_masacre_j2) || 0,
                warlord_muerto_j1: resultado.warlord_muerto_j1,
                warlord_muerto_j2: resultado.warlord_muerto_j2,
                primer_jugador: resultado.primer_jugador
            };

            const response = await torneosSagaApi.registrarPartida(
                partida.torneo_id,
                partida.id,
                datosPartida
            );

            const mensaje = response.data 
                ? `✅ Resultado guardado correctamente\n\n` +
                  `⚠️ Pendiente de confirmación del organizador\n\n` +
                  `Resultado: ${response.data.resultado}\n` +
                  `Puntos Torneo J1: ${response.data.puntosTorneo?.jugador1 || 0}\n` +
                  `Puntos Torneo J2: ${response.data.puntosTorneo?.jugador2 || 0}`
                : '✅ Resultado guardado correctamente (pendiente de confirmación)';

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
        
        if (ppJ1 > ppJ2) {
            return `🏆 Victoria de ${partida.jugador1_nombre || partida.jugador1?.nombre}`;
        }
        if (ppJ2 > ppJ1) {
            return `🏆 Victoria de ${partida.jugador2_nombre || partida.jugador2?.nombre}`;
        }
        return '🤝 Empate';
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
                            <p><strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong></p>
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
                            <p><strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong></p>
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
                                <h4>{partida.jugador1_nombre}</h4>
                                <p><strong>Puntos Partida:</strong> {partida.puntos_partida_j1}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j1}</p>
                                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j1}</p>
                                <p><strong>Warlord Eliminado:</strong> {partida.warlord_muerto_j1 ? 'Sí' : 'No'}</p>
                            </div>

                            <div className="vs-divider">VS</div>

                            <div className="jugador-stats">
                                <h4>{partida.jugador2_nombre}</h4>
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
                    </div>

                    <div className="seccion-primer-jugador">
                        <h4>🎲 Primer Jugador</h4>
                        {resultado.primer_jugador ? (
                            <div className="primer-jugador-seleccionado">
                                <p>
                                    ✅ <strong>
                                        {resultado.primer_jugador === partida.jugador1_id 
                                            ? (partida.jugador1_nombre || partida.jugador1?.nombre)
                                            : (partida.jugador2_nombre || partida.jugador2?.nombre)}
                                    </strong> fue el primer jugador
                                </p>
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
                                        {partida.jugador1_nombre || partida.jugador1?.nombre}
                                    </button>
                                    <button
                                        onClick={() => setResultado(prev => ({ 
                                            ...prev, 
                                            primer_jugador: partida.jugador2_id 
                                        }))}
                                        className="btn-seleccionar-jugador"
                                    >
                                        {partida.jugador2_nombre || partida.jugador2?.nombre}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="formulario-grid">
                        <div className="jugador-resultado">
                            <h4>{partida.jugador1_nombre || partida.jugador1?.nombre}</h4>
                            
                            <div className="form-group">
                                <label>Puntos de Partida:*</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_partida_j1}
                                    onChange={(e) => handleChange('puntos_partida_j1', e.target.value)}
                                    disabled={guardando}
                                />
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
                            <h4>{partida.jugador2_nombre || partida.jugador2?.nombre}</h4>
                            
                            <div className="form-group">
                                <label>Puntos de Partida:*</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_partida_j2}
                                    onChange={(e) => handleChange('puntos_partida_j2', e.target.value)}
                                    disabled={guardando}
                                />
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

                    <div className="resultado-preview">
                        <h4>Resultado:</h4>
                        <div className="resultado-badge">
                            {getResultadoPreview()}
                        </div>
                        <p className="nota-calculo">
                            💡 Los puntos de victoria y torneo se calcularán automáticamente
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