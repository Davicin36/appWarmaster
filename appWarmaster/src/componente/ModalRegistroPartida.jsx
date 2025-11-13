import React, { useState } from 'react';
import torneosSagaApi from '../servicios/apiSaga';

function ModalRegistroPartida({ partida, onClose, onGuardar, esOrganizador = false }) {
    // ✅ Verificar si el resultado está confirmado
    const resultadoConfirmado = partida.resultado_confirmado || false;
    const esBye = !partida.jugador2_id || partida.resultado_ps === 'victoria_j1';
    
    // ✅ Estado inicial con los datos de la partida
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

            // Validaciones
            if (!resultado.primer_jugador) {
                throw new Error('Debes asignar quién fue el primer jugador antes de guardar');
            }

            if (resultado.puntos_partida_j1 === 0 && resultado.puntos_partida_j2 === 0) {
                throw new Error('Debes introducir al menos algunos puntos de partida');
            }

            // Formatear datos
            const datosPartida = {
                puntos_partida_j1: parseInt(resultado.puntos_partida_j1) || 0,
                puntos_partida_j2: parseInt(resultado.puntos_partida_j2) || 0,
                puntos_masacre_j1: parseInt(resultado.puntos_masacre_j1) || 0,
                puntos_masacre_j2: parseInt(resultado.puntos_masacre_j2) || 0,
                warlord_muerto_j1: resultado.warlord_muerto_j1,
                warlord_muerto_j2: resultado.warlord_muerto_j2,
                primer_jugador: resultado.primer_jugador
            };

            console.log('📤 Enviando datos:', datosPartida);

            const response = await torneosSagaApi.registrarPartida(
                partida.torneo_id,
                partida.id,
                datosPartida
            );

            console.log('✅ Respuesta:', response);

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

    // ✅ CONFIRMAR/DESCONFIRMAR RESULTADO (solo organizador)
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

    // Calcular quién gana para mostrar preview
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

    // ✅ SI ES BYE
if (esBye) {
    // ✅ SI YA ESTÁ CONFIRMADO
    if (resultadoConfirmado) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header" style={{
                        background: '#4caf50',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '8px 8px 0 0'
                    }}>
                        <h3>✅ Partida BYE Confirmada - Mesa {partida.mesa}</h3>
                        <button className="btn-close" onClick={onClose} style={{
                            background: 'white',
                            color: '#4caf50'
                        }}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div style={{
                            background: '#e8f5e9',
                            border: '2px solid #4caf50',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#2e7d32' }}>
                                ✅ Esta victoria BYE ha sido confirmada por el organizador
                            </p>
                        </div>

                        <div className="bye-info" style={{
                            background: '#fff3cd',
                            padding: '20px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>⭐ Victoria Automática</h3>
                            <p style={{ margin: '10px 0' }}>
                                <strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong>
                            </p>
                            <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#f59e0b' }}>
                                10 Puntos de Torneo
                            </p>
                            <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                                Ronda: {partida.ronda}
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer" style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'space-between',
                        padding: '15px'
                    }}>
                        {/* ✅ SOLO EL ORGANIZADOR PUEDE DESCONFIRMAR */}
                        {esOrganizador && (
                            <button 
                                onClick={() => handleConfirmar(false)}
                                disabled={confirmando}
                                style={{
                                    padding: '10px 20px',
                                    background: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: confirmando ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {confirmando ? '⏳ Procesando...' : '🔓 Desconfirmar Victoria'}
                            </button>
                        )}
                        
                        <button 
                            className="btn-primary" 
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ SI NO ESTÁ CONFIRMADO (PENDIENTE)
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚠️ Partida BYE - Mesa {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* ✅ ALERTA DE RESULTADO NO CONFIRMADO */}
                    <div style={{
                        background: '#fff3e0',
                        border: '2px solid #ff9800',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#f57c00' }}>
                            ⚠️ Esta victoria BYE está pendiente de confirmación del organizador
                        </p>
                    </div>

                    <div className="bye-info" style={{
                        background: '#fff3cd',
                        padding: '20px',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>⭐ Victoria Automática</h3>
                        <p style={{ margin: '10px 0' }}>
                            <strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong>
                        </p>
                        <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#f59e0b' }}>
                            10 Puntos de Torneo
                        </p>
                        <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                            Ronda: {partida.ronda}
                        </p>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#e3f2fd',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, fontSize: '0.95em', color: '#1976d2' }}>
                            💡 Las partidas BYE otorgan automáticamente 10 puntos de torneo al jugador presente.
                        </p>
                        {esOrganizador && (
                            <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                                Como organizador, debes confirmar esta victoria para que sea definitiva.
                            </p>
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'space-between',
                    padding: '15px'
                }}>
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                        disabled={confirmando}
                        style={{
                            padding: '10px 20px',
                            background: '#ccc',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: confirmando ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cerrar
                    </button>
                    
                    {/* ✅ SOLO EL ORGANIZADOR PUEDE CONFIRMAR */}
                    {esOrganizador && (
                        <button 
                            onClick={() => handleConfirmar(true)}
                            disabled={confirmando}
                            style={{
                                padding: '10px 20px',
                                background: confirmando ? '#ccc' : '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: confirmando ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {confirmando ? '⏳ Confirmando...' : '✅ Confirmar Victoria BYE'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

    // ✅ SI EL RESULTADO ESTÁ CONFIRMADO (SOLO LECTURA)
    if (resultadoConfirmado) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header" style={{
                        background: '#4caf50',
                        color: 'white',
                        padding: '15px',
                        borderRadius: '8px 8px 0 0'
                    }}>
                        <h3>✅ Resultado Confirmado - Mesa {partida.mesa}</h3>
                        <button className="btn-close" onClick={onClose} style={{
                            background: 'white',
                            color: '#4caf50'
                        }}>✕</button>
                    </div>

                    <div className="modal-body">
                        <div style={{
                            background: '#e8f5e9',
                            border: '2px solid #4caf50',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#2e7d32' }}>
                                ✅ Este resultado ha sido confirmado por el organizador
                            </p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                                Los datos ya no se pueden modificar
                            </p>
                        </div>

                        <div className="partida-info" style={{
                            background: '#f5f5f5',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Escenario:</strong> {partida.nombre_partida || 'Por definir'}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Ronda:</strong> {partida.ronda}
                            </p>
                            <p style={{ margin: '5px 0' }}>
                                <strong>Resultado:</strong> {getResultadoPreview()}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px' }}>
                            {/* JUGADOR 1 */}
                            <div style={{
                                background: '#f5f5f5',
                                padding: '15px',
                                borderRadius: '8px'
                            }}>
                                <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    {partida.jugador1_nombre}
                                </h4>
                                <p><strong>Puntos Partida:</strong> {partida.puntos_partida_j1}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j1}</p>
                                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j1}</p>
                                <p><strong>Warlord Eliminado:</strong> {partida.warlord_muerto_j1 ? 'Sí' : 'No'}</p>
                            </div>

                            <div style={{
                                fontSize: '1.5em',
                                fontWeight: 'bold',
                                color: '#666',
                                alignSelf: 'center'
                            }}>
                                VS
                            </div>

                            {/* JUGADOR 2 */}
                            <div style={{
                                background: '#f5f5f5',
                                padding: '15px',
                                borderRadius: '8px'
                            }}>
                                <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    {partida.jugador2_nombre}
                                </h4>
                                <p><strong>Puntos Partida:</strong> {partida.puntos_partida_j2}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j2}</p>
                                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j2}</p>
                                <p><strong>Warlord Eliminado:</strong> {partida.warlord_muerto_j2 ? 'Sí' : 'No'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'space-between',
                        padding: '15px'
                    }}>
                        {/* ✅ SOLO EL ORGANIZADOR PUEDE DESCONFIRMAR */}
                        {esOrganizador && (
                            <button 
                                onClick={() => handleConfirmar(false)}
                                disabled={confirmando}
                                style={{
                                    padding: '10px 20px',
                                    background: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: confirmando ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {confirmando ? '⏳ Procesando...' : '🔓 Desconfirmar Resultado'}
                            </button>
                        )}
                        
                        <button 
                            className="btn-primary" 
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ MODO EDICIÓN (resultado no confirmado)
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="modal-header">
                    <h3>📝 Registrar Resultado - Mesa {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* ✅ ALERTA DE RESULTADO NO CONFIRMADO */}
                    <div style={{
                        background: '#fff3e0',
                        border: '2px solid #ff9800',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, fontSize: '0.9em', color: '#f57c00' }}>
                            ⚠️ Este resultado está pendiente de confirmación del organizador
                        </p>
                    </div>

                    {error && (
                        <div className="error-message" style={{
                            background: '#fee',
                            border: '1px solid #fcc',
                            padding: '10px',
                            borderRadius: '5px',
                            marginBottom: '15px',
                            color: '#c33'
                        }}>
                            <p>❌ {error}</p>
                        </div>
                    )}

                    <div className="partida-info" style={{
                        background: '#f5f5f5',
                        padding: '10px',
                        borderRadius: '5px',
                        marginBottom: '20px'
                    }}>
                        <p style={{ margin: '5px 0' }}>
                            <strong>Escenario:</strong> {partida.nombre_partida || partida.escenario || 'Por definir'}
                        </p>
                        <p style={{ margin: '5px 0' }}>
                            <strong>Ronda:</strong> {partida.ronda}
                        </p>
                    </div>

                    {/* ASIGNAR PRIMER JUGADOR */}
                    <div style={{
                        background: '#e3f2fd',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>🎲 Primer Jugador</h4>
                        {resultado.primer_jugador ? (
                            <div style={{
                                background: '#4caf50',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '5px',
                                textAlign: 'center'
                            }}>
                                <p style={{ margin: 0 }}>
                                    ✅ <strong>
                                        {resultado.primer_jugador === partida.jugador1_id 
                                            ? (partida.jugador1_nombre || partida.jugador1?.nombre)
                                            : (partida.jugador2_nombre || partida.jugador2?.nombre)}
                                    </strong> fue el primer jugador
                                </p>
                            </div>
                        ) : (
                            <>
                                <p style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>
                                    ⚠️ Selecciona quién fue el primer jugador:
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setResultado(prev => ({ 
                                            ...prev, 
                                            primer_jugador: partida.jugador1_id 
                                        }))}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#2196f3',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {partida.jugador1_nombre || partida.jugador1?.nombre}
                                    </button>
                                    <button
                                        onClick={() => setResultado(prev => ({ 
                                            ...prev, 
                                            primer_jugador: partida.jugador2_id 
                                        }))}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#2196f3',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {partida.jugador2_nombre || partida.jugador2?.nombre}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'start' }}>
                        {/* JUGADOR 1 */}
                        <div className="jugador-resultado">
                            <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>
                                {partida.jugador1_nombre || partida.jugador1?.nombre}
                            </h4>
                            
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Puntos de Partida:*
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_partida_j1}
                                    onChange={(e) => handleChange('puntos_partida_j1', e.target.value)}
                                    disabled={guardando}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        fontSize: '1em'
                                    }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Puntos de Masacre:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_masacre_j1}
                                    onChange={(e) => handleChange('puntos_masacre_j1', e.target.value)}
                                    disabled={guardando}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        fontSize: '1em'
                                    }}
                                />
                            </div>

                            <div className="form-group checkbox" style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                        <div className="vs-divider" style={{
                            fontSize: '1.5em',
                            fontWeight: 'bold',
                            color: '#666',
                            alignSelf: 'center'
                        }}>
                            VS
                        </div>

                        {/* JUGADOR 2 */}
                        <div className="jugador-resultado">
                            <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>
                                {partida.jugador2_nombre || partida.jugador2?.nombre}
                            </h4>
                            
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Puntos de Partida:*
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_partida_j2}
                                    onChange={(e) => handleChange('puntos_partida_j2', e.target.value)}
                                    disabled={guardando}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        fontSize: '1em'
                                    }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Puntos de Masacre:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={resultado.puntos_masacre_j2}
                                    onChange={(e) => handleChange('puntos_masacre_j2', e.target.value)}
                                    disabled={guardando}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        fontSize: '1em'
                                    }}
                                />
                            </div>

                            <div className="form-group checkbox" style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                    {/* Resultado Preview */}
                    <div className="resultado-preview" style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: '#f0f8f0',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Resultado:</h4>
                        <div className="resultado-badge" style={{
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                            color: '#2e7d32',
                            margin: '10px 0'
                        }}>
                            {getResultadoPreview()}
                        </div>
                        <p className="nota-calculo" style={{
                            fontSize: '0.9em',
                            color: '#666',
                            margin: '10px 0 0 0'
                        }}>
                            💡 Los puntos de victoria y torneo se calcularán automáticamente
                        </p>
                    </div>
                </div>

                <div className="modal-footer" style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'space-between',
                    padding: '15px',
                    borderTop: '1px solid #ddd'
                }}>
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                        disabled={guardando}
                        style={{
                            padding: '10px 20px',
                            background: '#ccc',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: guardando ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* ✅ BOTÓN CONFIRMAR (solo organizador) */}
                        {esOrganizador && partida.puntos_partida_j1 > 0 && (
                            <button 
                                onClick={() => handleConfirmar(true)}
                                disabled={guardando || confirmando || !resultado.primer_jugador}
                                style={{
                                    padding: '10px 20px',
                                    background: guardando || confirmando || !resultado.primer_jugador ? '#ccc' : '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: guardando || confirmando || !resultado.primer_jugador ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {confirmando ? '⏳ Confirmando...' : '✅ Confirmar Definitivamente'}
                            </button>
                        )}
                        
                        <button 
                            onClick={handleGuardar}
                            disabled={guardando || !resultado.primer_jugador}
                            style={{
                                padding: '10px 20px',
                                background: guardando || !resultado.primer_jugador ? '#ccc' : '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: guardando || !resultado.primer_jugador ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
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