import React, { useState } from 'react';
import torneosSagaApi from '../servicios/apiSaga';

function ModalRegistroPartida({ partida, onClose, onGuardar }) {
    const [resultado, setResultado] = useState({
        puntos_partida_j1: partida.puntos_partida_j1 || 0,
        puntos_partida_j2: partida.puntos_victoria_j2 || 0,
        puntos_masacre_j1: partida.puntos_masacre_j1 || 0,
        puntos_masacre_j2: partida.puntos_masacre_j2 || 0,
        warlord_muerto_j1: partida.warlord_muerto_j1 || false,
        warlord_muerto_j2: partida.warlord_muerto_j2 || false,
        primer_jugador: partida.primer_jugador || false
    });
    
    const [guardando, setGuardando] = useState(false);
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

            // Validar que los puntos de victoria estén entre 0-1
            if (resultado.puntos_victoria_j1 > 1 || resultado.puntos_victoria_j2 > 1) {
                throw new Error('Los puntos de victoria deben ser 0 o 1');
            }

            // Solo enviar los datos básicos, el backend calcula todo
            const datosPartida = {
                nombre_partida: partida.nombre_partida || partida.escenario,
                jugador1_id: partida.jugador1.id || partida.jugador1_id,
                jugador2_id: partida.jugador2.id || partida.jugador2_id,
                puntos_victoria_j1: parseInt(resultado.puntos_victoria_j1) || 0,
                puntos_victoria_j2: parseInt(resultado.puntos_victoria_j2) || 0,
                puntos_masacre_j1: parseInt(resultado.puntos_masacre_j1) || 0,
                puntos_masacre_j2: parseInt(resultado.puntos_masacre_j2) || 0,
                warlord_muerto_j1: resultado.warlord_muerto_j1,
                warlord_muerto_j2: resultado.warlord_muerto_j2,
                ronda: partida.ronda,
                primer_jugador: resultado.primer_jugador
            };

            let response;
            if (partida.id) {
                // Actualizar partida existente
                response = await torneosSagaApi.actualizarPartida(
                    partida.torneo_id,
                    partida.id,
                    datosPartida
                );
            } else {
                // Crear nueva partida
                response = await torneosSagaApi.registrarPartida(
                    partida.torneo_id,
                    datosPartida
                );
            }

            if (response.exito) {
                // El backend devuelve los puntos calculados
                alert(`✅ Resultado guardado\n` +
                      `${partida.jugador1.nombre}: ${response.data.puntosTorneo.jugador1} PT\n` +
                      `${partida.jugador2.nombre}: ${response.data.puntosTorneo.jugador2} PT`);
                onGuardar(response.data);
                onClose();
            } else {
                throw new Error(response.mensaje || 'Error al guardar');
            }

        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    // Calcular quién gana para mostrar preview
    const getResultadoPreview = () => {
        const pvJ1 = parseInt(resultado.puntos_victoria_j1) || 0;
        const pvJ2 = parseInt(resultado.puntos_victoria_j2) || 0;
        
        if (pvJ1 > pvJ2) return `🏆 Victoria de ${partida.jugador1.nombre}`;
        if (pvJ2 > pvJ1) return `🏆 Victoria de ${partida.jugador2.nombre}`;
        return '🤝 Empate';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📝 Registrar Resultado - Mesa {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="error-message">
                            <p>❌ {error}</p>
                        </div>
                    )}

                    <div className="partida-info">
                        <p><strong>Escenario:</strong> {partida.nombre_partida || partida.escenario}</p>
                        <p><strong>Ronda:</strong> {partida.ronda}</p>
                    </div>

                    {/* JUGADOR 1 */}
                    <div className="jugador-resultado">
                        <h4>{partida.jugador1.nombre} ({partida.jugador1.ejercito})</h4>
                        
                        <div className="form-group">
                            <label>Puntos de Victoria (0-1)</label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                value={resultado.puntos_victoria_j1}
                                onChange={(e) => handleChange('puntos_victoria_j1', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Puntos de Masacre</label>
                            <input
                                type="number"
                                min="0"
                                value={resultado.puntos_masacre_j1}
                                onChange={(e) => handleChange('puntos_masacre_j1', e.target.value)}
                            />
                        </div>

                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={resultado.warlord_muerto_j1}
                                    onChange={(e) => handleChange('warlord_muerto_j1', e.target.checked)}
                                />
                                Warlord Muerto
                            </label>
                        </div>
                    </div>

                    <div className="vs-divider">VS</div>

                    {/* JUGADOR 2 */}
                    <div className="jugador-resultado">
                        <h4>{partida.jugador2.nombre} ({partida.jugador2.ejercito})</h4>
                        
                        <div className="form-group">
                            <label>Puntos de Victoria (0-1)</label>
                            <input
                                type="number"
                                min="0"
                                max="1"
                                value={resultado.puntos_victoria_j2}
                                onChange={(e) => handleChange('puntos_victoria_j2', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Puntos de Masacre</label>
                            <input
                                type="number"
                                min="0"
                                value={resultado.puntos_masacre_j2}
                                onChange={(e) => handleChange('puntos_masacre_j2', e.target.value)}
                            />
                        </div>

                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={resultado.warlord_muerto_j2}
                                    onChange={(e) => handleChange('warlord_muerto_j2', e.target.checked)}
                                />
                                Warlord Muerto
                            </label>
                        </div>
                    </div>

                    {/* Primer Jugador */}
                    <div className="form-group checkbox primer-jugador">
                        <label>
                            <input
                                type="checkbox"
                                checked={resultado.primer_jugador}
                                onChange={(e) => handleChange('primer_jugador', e.target.checked)}
                            />
                            ⭐ {partida.jugador1.nombre} fue el primer jugador
                        </label>
                        <small className="help-text">
                            (Solo importante en caso de empate 0-0)
                        </small>
                    </div>

                    {/* Resultado Preview */}
                    <div className="resultado-preview">
                        <h4>Resultado:</h4>
                        <div className="resultado-badge">
                            {getResultadoPreview()}
                        </div>
                        <p className="nota-calculo">
                            💡 Los puntos de torneo se calcularán automáticamente según la diferencia de masacre
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
                    <button 
                        className="btn-primary" 
                        onClick={handleGuardar}
                        disabled={guardando}
                    >
                        {guardando ? '⏳ Guardando...' : '💾 Guardar Resultado'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalRegistroPartida;