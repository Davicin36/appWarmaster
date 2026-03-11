import React, { useState } from 'react';
import torneosEpicApi from '@/servicios/apiEpic';
import '@/estilos/modalPartidas.css';

const CONDICIONES_VICTORIA = [
    { id: '1', label: 'Incursion', descripcion: 'Capturar el objetivo del área del enemigo' },
    { id: '2', label: 'Romper su espíritu', descripcion: 'Destruir la formación más valiosa del enemigo' },
    { id: '3', label: 'Defender la bandera', descripcion: 'Controlar los tres objetivos de tu mitad de la mesa' },
    { id: '4', label: 'Ocupar y Mantener', descripcion: 'Controlar dos objetivos de la mitad del enemigo' },
    { id: '5', label: 'No pasarán', descripcion: 'No hay formaciones enemigas no desmoralizadas en tu mitad' },
];

function ModalRegistroPartidaEpic({ partida, onClose, onGuardar, esOrganizador = false }) {
    const resultadoConfirmado = partida.resultado_confirmado || false;
    const esBye = !partida.jugador2_id || partida.es_bye;

    const [resultado, setResultado] = useState({
        puntos_masacre_j1: partida.puntos_masacre_j1 || 0,
        puntos_masacre_j2: partida.puntos_masacre_j2 || 0,
        condiciones_j1: { 1: false, 2: false, 3: false, 4: false, 5: false },
        condiciones_j2: { 1: false, 2: false, 3: false, 4: false, 5: false },
    });

    const [guardando, setGuardando] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (campo, valor) => {
        setResultado(prev => ({ ...prev, [campo]: parseInt(valor) || 0 }));
    };

    const handleCondicionChange = (jugador, condicion, checked) => {
        setResultado(prev => ({
            ...prev,
            [`condiciones_${jugador}`]: {
                ...prev[`condiciones_${jugador}`],
                [condicion]: checked,
            }
        }));
    };

    const contarCondiciones = (jugador) => {
        return Object.values(resultado[`condiciones_${jugador}`]).filter(Boolean).length;
    };

    const getResultadoPreview = () => {
        const pmJ1 = parseInt(resultado.puntos_masacre_j1) || 0;
        const pmJ2 = parseInt(resultado.puntos_masacre_j2) || 0;
        const objJ1 = contarCondiciones('j1');
        const objJ2 = contarCondiciones('j2');

        if (objJ1 > objJ2) return `🏆 Victoria de ${partida.jugador1_nombre} (${objJ1}-${objJ2} objetivos)`;
        if (objJ2 > objJ1) return `🏆 Victoria de ${partida.jugador2_nombre} (${objJ2}-${objJ1} objetivos)`;

        return `🤝 Empate (${objJ1}-${objJ2} objetivos, ${pmJ1}-${pmJ2} PM)`;
    };

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setError(null);

            const pmJ1 = parseInt(resultado.puntos_masacre_j1) || 0;
            const pmJ2 = parseInt(resultado.puntos_masacre_j2) || 0;
            const objJ1 = contarCondiciones('j1');
            const objJ2 = contarCondiciones('j2');

            if (pmJ1 === 0 && pmJ2 === 0) {
                throw new Error('Debes introducir al menos algunos puntos de masacre');
            }

            await torneosEpicApi.registrarPartida(partida.torneo_id, partida.id, {
                puntos_masacre_j1: pmJ1,
                puntos_masacre_j2: pmJ2,
                objetivos_cumplidos_j1: objJ1,
                objetivos_cumplidos_j2: objJ2,
            });

            alert(`✅ Resultado guardado correctamente\n\n⚠️ Pendiente de confirmación del organizador\n\n${getResultadoPreview()}`);

            if (onGuardar) onGuardar();
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
            if (!window.confirm(mensaje)) return;

            await torneosEpicApi.confirmarResultado(partida.torneo_id, partida.id, confirmar);
            alert(confirmar ? '✅ Resultado confirmado' : '⚠️ Resultado desconfirmado');
            if (onGuardar) onGuardar();
            onClose();
        } catch (err) {
            console.error('❌ Error:', err);
            alert(`❌ Error: ${err.message}`);
        } finally {
            setConfirmando(false);
        }
    };

    // ─── BYE ───────────────────────────────────────────────────────────────────
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
                            <p className="puntos-bye">500 Puntos de Masacre</p>
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
                                {confirmando ? '⏳ Procesando...' : (resultadoConfirmado ? '🔓 Desconfirmar' : '✅ Confirmar Victoria BYE')}
                            </button>
                        )}
                        <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── CONFIRMADO (solo lectura) ─────────────────────────────────────────────
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
                        <div className="resultados-grid">
                            <div className="jugador-stats">
                                <h4>{partida.jugador1_nombre}</h4>
                                <p><strong>Puntos Victoria:</strong> {partida.puntos_victoria_j1}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j1}</p>
                                <p><strong>Objetivos:</strong> {partida.objetivos_cumplidos_j1 ?? '-'}</p>
                            </div>
                            <div className="vs-divider">VS</div>
                            <div className="jugador-stats">
                                <h4>{partida.jugador2_nombre}</h4>
                                <p><strong>Puntos Victoria:</strong> {partida.puntos_victoria_j2}</p>
                                <p><strong>Puntos Masacre:</strong> {partida.puntos_masacre_j2}</p>
                                <p><strong>Objetivos:</strong> {partida.objetivos_cumplidos_j2 ?? '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        {esOrganizador && (
                            <button onClick={() => handleConfirmar(false)} disabled={confirmando} className="btn-desconfirmar">
                                {confirmando ? '⏳ Procesando...' : '🔓 Desconfirmar Resultado'}
                            </button>
                        )}
                        <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── MODO EDICIÓN ──────────────────────────────────────────────────────────
    const objJ1 = contarCondiciones('j1');
    const objJ2 = contarCondiciones('j2');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-edicion" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📝 Registrar Resultado - Mesa {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="alerta-pendiente">
                        <p>⚠️ Pendiente de confirmación del organizador</p>
                    </div>

                    {error && <div className="error-message"><p>❌ {error}</p></div>}

                    <div className="partida-info">
                        <p><strong>Ronda:</strong> {partida.ronda}</p>
                        <p className="tipo-escenario">🎯 Victoria por objetivos cumplidos · Desempate por PM</p>
                    </div>

                    <div className="formulario-grid">
                        {/* ── JUGADOR 1 ── */}
                        <div className="jugador-resultado">
                            <h4>{partida.jugador1_nombre}</h4>

                            <div className="form-group">
                                <label>Puntos de Masacre: *</label>
                                <input
                                    type="number" min="0" max="9999"
                                    value={resultado.puntos_masacre_j1}
                                    onChange={(e) => handleChange('puntos_masacre_j1', e.target.value)}
                                    disabled={guardando}
                                />
                            </div>

                            <div className="form-group condiciones-group">
                                <label className="condiciones-titulo">
                                    🎯 Condiciones de victoria
                                    <span className="condiciones-contador">{objJ1}/5</span>
                                </label>
                                {CONDICIONES_VICTORIA.map(({ id, label, descripcion }) => (
                                    <label key={id} className="checkbox-label" title={descripcion}>
                                        <input
                                            type="checkbox"
                                            checked={resultado.condiciones_j1[id]}
                                            onChange={(e) => handleCondicionChange('j1', id, e.target.checked)}
                                            disabled={guardando}
                                        />
                                        <span>✅ {label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="vs-divider">VS</div>

                        {/* ── JUGADOR 2 ── */}
                        <div className="jugador-resultado">
                            <h4>{partida.jugador2_nombre}</h4>

                            <div className="form-group">
                                <label>Puntos de Masacre: *</label>
                                <input
                                    type="number" min="0" max="9999"
                                    value={resultado.puntos_masacre_j2}
                                    onChange={(e) => handleChange('puntos_masacre_j2', e.target.value)}
                                    disabled={guardando}
                                />
                            </div>

                            <div className="form-group condiciones-group">
                                <label className="condiciones-titulo">
                                    🎯 Condiciones de victoria
                                    <span className="condiciones-contador">{objJ2}/5</span>
                                </label>
                                {CONDICIONES_VICTORIA.map(({ id, label, descripcion }) => (
                                    <label key={id} className="checkbox-label" title={descripcion}>
                                        <input
                                            type="checkbox"
                                            checked={resultado.condiciones_j2[id]}
                                            onChange={(e) => handleCondicionChange('j2', id, e.target.checked)}
                                            disabled={guardando}
                                        />
                                        <span>✅ {label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="resultado-preview">
                        <h4>Resultado:</h4>
                        <div className="resultado-badge">{getResultadoPreview()}</div>
                        <p className="nota-calculo">
                            💡 Gana quien cumpla más condiciones 
                        </p>
                    </div>
                    {/* LEYENDA DE CONDICIONES */}
                    <div className="leyenda-condiciones">
                        <h4>📖 Condiciones de victoria</h4>
                        <div className="leyenda-grid">
                            {CONDICIONES_VICTORIA.map(({ id, label, descripcion }) => (
                                <div key={id} className="leyenda-item">
                                    <span className="leyenda-numero">{id}</span>
                                    <div className="leyenda-texto">
                                        <strong>{label}</strong>
                                        <p>{descripcion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
                    <button onClick={handleGuardar} disabled={guardando} className="btn-guardar">
                        {guardando ? '⏳ Guardando...' : '💾 Guardar Resultado'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalRegistroPartidaEpic;