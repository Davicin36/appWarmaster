import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSagaI18n } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import torneosSagaApi from '../servicios/apiSaga';
import '@/estilos/modalPartidas.css';

function ModalRegistroPartida({ partida, torneo, onClose, onGuardar, esOrganizador = false }) {
    const { t } = useTranslation();
    const { getEscenario } = useSagaI18n();

    const usaPuntosTorneo        = torneo.puntosDeTorneo === 1;
    const warlordSumaVictoria    = torneo.warlord_punto_victoria === 1;
    const tienePersonajeExtra    = torneo.personaje_especial === 1;
    const tieneMisionesSecundarias = torneo.misiones_secundarias === 1;
    const resultadoConfirmado    = partida.resultado_confirmado || false;

    const tieneDatos = () => (
        (parseFloat(partida.puntos_partida_j1 || 0) > 0) ||
        (parseFloat(partida.puntos_partida_j2 || 0) > 0) ||
        (parseFloat(partida.puntos_torneo_j1  || 0) > 0) ||
        (parseFloat(partida.puntos_torneo_j2  || 0) > 0)
    );

    const esBye          = (!partida.jugador2_id || partida.es_bye === 1) && !tieneDatos();
    const esTorneoEquipos = !!partida.equipo1_id;

    const [resultado, setResultado] = useState({
        puntos_partida_j1:          partida.puntos_partida_j1          || 0,
        puntos_partida_j2:          partida.puntos_partida_j2          || 0,
        puntos_masacre_j1:          partida.puntos_masacre_j1          || 0,
        puntos_masacre_j2:          partida.puntos_masacre_j2          || 0,
        puntos_bonificacion_j1:     partida.puntos_bonificacion_j1     || 0,
        puntos_bonificacion_j2:     partida.puntos_bonificacion_j2     || 0,
        warlord_muerto_j1:          partida.warlord_muerto_j1          || false,
        warlord_especial_muerto_j1: partida.warlord_especial_muerto_j1 || false,
        misiones_secundarias_j1:    partida.misiones_secundarias_j1    || false,
        warlord_muerto_j2:          partida.warlord_muerto_j2          || false,
        warlord_especial_muerto_j2: partida.warlord_especial_muerto_j2 || false,
        misiones_secundarias_j2:    partida.misiones_secundarias_j2    || false,
        primer_jugador:             partida.primer_jugador             || null
    });

    const elCruce     = partida.nombre_partida?.toLowerCase() === 'el cruce';
    const viejaDisputa = partida.nombre_partida?.toLowerCase() === 'vieja disputa';

    const [guardando,   setGuardando]   = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [error,       setError]       = useState(null);
    const [sinDados,    setSinDados]    = useState({
        activo:  partida.sin_dados         || false,
        ganador: partida.ganador_sin_dados || null
    });

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    const handleChange = (campo, valor) =>
        setResultado(prev => ({ ...prev, [campo]: valor }));

    const getWarlordCount = (jugador) => {
        const principal = resultado[`warlord_muerto_j${jugador}`] ? 1 : 0;
        const especial  = (tienePersonajeExtra || viejaDisputa) && resultado[`warlord_especial_muerto_j${jugador}`] ? 1 : 0;
        return principal + especial;
    };

    const getNombreJugador = (jugadorNum) => {
        if (esTorneoEquipos) return jugadorNum === 1 ? partida.jugador1_nombre : partida.jugador2_nombre;
        return jugadorNum === 1
            ? (partida.jugador1_nombre || partida.jugador1?.nombre)
            : (partida.jugador2_nombre || partida.jugador2?.nombre);
    };

    const meQuedoSinDados = (ganador) => setSinDados({ activo: true, ganador });

    // ─── GUARDAR ─────────────────────────────────────────────────────────────

    const handleGuardar = async () => {
        try {
            setGuardando(true);
            setError(null);

            if (!resultado.primer_jugador)
                throw new Error(t('modal_partida.error_primer_jugador'));

            if (!sinDados.activo && resultado.puntos_partida_j1 === 0 && resultado.puntos_partida_j2 === 0)
                throw new Error(t('modal_partida.error_sin_puntos'));

            const datosPartida = {
                puntos_partida_j1:          parseInt(resultado.puntos_partida_j1)          || 0,
                puntos_partida_j2:          parseInt(resultado.puntos_partida_j2)          || 0,
                puntos_masacre_j1:          parseInt(resultado.puntos_masacre_j1  ?? 0),
                puntos_masacre_j2:          parseInt(resultado.puntos_masacre_j2  ?? 0),
                puntos_bonificacion_j1:     parseInt(resultado.puntos_bonificacion_j1 ?? 0),
                puntos_bonificacion_j2:     parseInt(resultado.puntos_bonificacion_j2 ?? 0),
                misiones_secundarias_j1:    resultado.misiones_secundarias_j1,
                misiones_secundarias_j2:    resultado.misiones_secundarias_j2,
                warlord_muerto_j1:          resultado.warlord_muerto_j1          ? 1 : 0,
                warlord_especial_muerto_j1: resultado.warlord_especial_muerto_j1 ? 1 : 0,
                warlord_muerto_j2:          resultado.warlord_muerto_j2          ? 1 : 0,
                warlord_especial_muerto_j2: resultado.warlord_especial_muerto_j2 ? 1 : 0,
                primer_jugador:  resultado.primer_jugador,
                sin_dados:       sinDados.activo,
                ganador_sin_dados: sinDados.ganador
            };

            const response = await torneosSagaApi.registrarPartida(
                partida.torneo_id, partida.id, datosPartida
            );

            const nombreJ1 = partida.jugador1_nombre || partida.jugador1?.nombre;
            const nombreJ2 = partida.jugador2_nombre || partida.jugador2?.nombre;

            const mensaje = response.data
                ? `✅ ${t('modal_partida.guardado_ok')}\n\n` +
                  `⚠️ ${t('modal_partida.pendiente_confirmacion')}\n\n` +
                  `${t('modal_partida.resultado_label')}: ${response.data.resultado}\n` +
                  `${t('modal_partida.primer_jugador_label')}: ${nombreJ1}\n` +
                  ` * ${t('modal_partida.pp_j1')}: ${datosPartida.puntos_partida_j1}\n` +
                  ` * ${t('modal_partida.pt_j1')}: ${response.data.puntosTorneo?.jugador1 || 0}` + ' - ' +
                  ` * ${t('modal_partida.pm_j1')}: ${response.data.puntosMasacre?.jugador1 || 0}\n` +
                  `${t('modal_partida.segundo_jugador_label')}: ${nombreJ2}\n` +
                  ` * ${t('modal_partida.pp_j2')}: ${datosPartida.puntos_partida_j2}\n` +
                  ` * ${t('modal_partida.pt_j2')}: ${response.data.puntosTorneo?.jugador2 || 0}` + ' - ' +
                  ` * ${t('modal_partida.pm_j2')}: ${response.data.puntosMasacre?.jugador2 || 0}`
                : `✅ ${t('modal_partida.guardado_pendiente')}`;

            alert(mensaje);
            if (onGuardar) onGuardar(response.data);
            onClose();

        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message || t('errores.generico'));
            alert(`❌ ${t('errores.prefijo')}: ${err.message || t('errores.generico')}`);
        } finally {
            setGuardando(false);
        }
    };

    // ─── CONFIRMAR ───────────────────────────────────────────────────────────

    const handleConfirmar = async (confirmar) => {
        try {
            setConfirmando(true);
            const mensaje = confirmar
                ? t('modal_partida.confirm_pregunta')
                : t('modal_partida.desconfirm_pregunta');

            if (!window.confirm(mensaje)) return;

            await torneosSagaApi.confirmarResultado(partida.torneo_id, partida.id, confirmar);
            alert(confirmar ? `✅ ${t('modal_partida.confirmado')}` : `⚠️ ${t('modal_partida.desconfirmado')}`);
            if (onGuardar) onGuardar();
            onClose();

        } catch (err) {
            console.error('❌ Error:', err);
            alert(`❌ ${t('errores.prefijo')}: ${err.message}`);
        } finally {
            setConfirmando(false);
        }
    };

    // ─── PREVIEW ─────────────────────────────────────────────────────────────

    const getResultadoPreview = () => {
        const ppJ1 = parseInt(resultado.puntos_partida_j1) || 0;
        const ppJ2 = parseInt(resultado.puntos_partida_j2) || 0;
        const pbJ1 = parseInt(resultado.puntos_bonificacion_j1) || 0;
        const pbJ2 = parseInt(resultado.puntos_bonificacion_j2) || 0;
        const wJ1  = warlordSumaVictoria ? getWarlordCount(1) : 0;
        const wJ2  = warlordSumaVictoria ? getWarlordCount(2) : 0;
        const mJ1  = tieneMisionesSecundarias && resultado.misiones_secundarias_j1 ? 1 : 0;
        const mJ2  = tieneMisionesSecundarias && resultado.misiones_secundarias_j2 ? 1 : 0;

        if (sinDados.activo && sinDados.ganador) {
            const nombreGanador = sinDados.ganador === 1 ? partida.jugador1_nombre : partida.jugador2_nombre;
            return `🏆 ${t('modal_partida.victoria_sin_dados', { nombre: nombreGanador })}`;
        }

        let ganador = null;
        if (usaPuntosTorneo) {
            if (ppJ1 > ppJ2) ganador = 1;
            else if (ppJ2 > ppJ1) ganador = 2;
            else if (elCruce) {
                if (pbJ1 > pbJ2) ganador = 1;
                else if (pbJ2 > pbJ1) ganador = 2;
            }
        } else {
            const diferencia = Math.abs(ppJ1 - ppJ2);
            if (diferencia >= 3) {
                ganador = ppJ1 > ppJ2 ? 1 : 2;
            } else if (elCruce && diferencia === 0) {
                if (pbJ1 > pbJ2) ganador = 1;
                else if (pbJ2 > pbJ1) ganador = 2;
            }
        }

        const warlordInfo = (warlordSumaVictoria && (wJ1 > 0 || wJ2 > 0)) || (mJ1 > 0 || mJ2 > 0)
            ? ` | ${t('modal_partida.bonus')}: J1 +${wJ1 + mJ1} / J2 +${wJ2 + mJ2}`
            : '';

        if (ganador) return `🏆 ${t('modal_partida.victoria_de', { nombre: getNombreJugador(ganador), pp1: ppJ1, pp2: ppJ2 })}${warlordInfo}`;
        return `🤝 ${t('modal_partida.empate', { pp1: ppJ1, pp2: ppJ2 })}${warlordInfo}`;
    };

    // ─── WARLORD SECTION ─────────────────────────────────────────────────────

    const renderWarlordSection = (jugador) => {
        const count = getWarlordCount(jugador);
        return (
            <div className="form-group warlord-section">
                <label className="warlord-label">
                    <input type="checkbox"
                        checked={resultado[`warlord_muerto_j${jugador}`]}
                        onChange={(e) => handleChange(`warlord_muerto_j${jugador}`, e.target.checked)}
                        disabled={guardando} />
                    ☠️ {t('modal_partida.warlord_eliminado')}{warlordSumaVictoria ? ' (+1 PV)' : ` (${t('modal_partida.no_puntua')})`}
                </label>

                {(tienePersonajeExtra || viejaDisputa) && (
                    <label className="warlord-label">
                        <input type="checkbox"
                            checked={resultado[`warlord_especial_muerto_j${jugador}`]}
                            onChange={(e) => handleChange(`warlord_especial_muerto_j${jugador}`, e.target.checked)}
                            disabled={guardando} />
                        ⭐ {t('modal_partida.personaje_especial')}{warlordSumaVictoria ? ' (+1 PV)' : ` (${t('modal_partida.no_puntua')})`}
                    </label>
                )}

                {warlordSumaVictoria && count > 0 && (
                    <small className="warlord-bonus">
                        +{count} PV {t('modal_partida.por_warlord')}{count > 1 ? 's' : ''}
                    </small>
                )}
            </div>
        );
    };

    // ─── BYE CONFIRMADO ──────────────────────────────────────────────────────

    if (esBye && resultadoConfirmado) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header confirmado">
                    <h3>✅ {t('modal_partida.bye_confirmada')} - {t('modal_partida.mesa')} {partida.mesa}</h3>
                    <button className="btn-close confirmado" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="alerta-confirmado"><p>✅ {t('modal_partida.bye_confirmada_info')}</p></div>
                    <div className="bye-info">
                        <h3>⭐ {t('modal_partida.victoria_automatica')}</h3>
                        {esTorneoEquipos ? (
                            <>
                                <p><strong>{t('modal_partida.equipo')}:</strong> {partida.equipo1_nombre}</p>
                                <p><strong>{t('modal_partida.jugador')}:</strong> {partida.jugador1_nombre} - {partida.jugador1_alias}</p>
                                <p><strong>{t('modal_partida.faccion')}:</strong> {partida.jugador1_faccion}</p>
                            </>
                        ) : (
                            <p><strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong></p>
                        )}
                        <p className="puntos-bye">10 {t('modal_partida.puntos_torneo')}</p>
                        <p className="ronda-info">{t('modal_partida.ronda')}: {partida.ronda}</p>
                    </div>
                </div>
                <div className="modal-footer">
                    {esOrganizador && (
                        <button onClick={() => handleConfirmar(false)} disabled={confirmando} className="btn-desconfirmar">
                            {confirmando ? `⏳ ${t('modal_partida.procesando')}` : `🔓 ${t('modal_partida.desconfirmar_victoria')}`}
                        </button>
                    )}
                    <button className="btn-cerrar" onClick={onClose}>{t('botones.cerrar')}</button>
                </div>
            </div>
        </div>
    );

    // ─── BYE PENDIENTE ───────────────────────────────────────────────────────

    if (esBye) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚠️ {t('modal_partida.bye_pendiente')} - {t('modal_partida.mesa')} {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="alerta-pendiente"><p>⚠️ {t('modal_partida.bye_pendiente_info')}</p></div>
                    <div className="bye-info">
                        <h3>⭐ {t('modal_partida.victoria_automatica')}</h3>
                        {esTorneoEquipos ? (
                            <>
                                <p><strong>{t('modal_partida.equipo')}:</strong> {partida.equipo1_nombre}</p>
                                <p><strong>{t('modal_partida.jugador')}:</strong> {partida.jugador1_nombre} - {partida.jugador1_alias}</p>
                            </>
                        ) : (
                            <p><strong>{partida.jugador1_nombre || partida.jugador1?.nombre}</strong></p>
                        )}
                        <p className="puntos-bye">10 {t('modal_partida.puntos_torneo')}</p>
                        <p className="ronda-info">{t('modal_partida.ronda')}: {partida.ronda}</p>
                    </div>
                    <div className="info-bye-explicacion">
                        <p>💡 {t('modal_partida.bye_explicacion')}</p>
                        {esOrganizador && <p className="nota-organizador">{t('modal_partida.bye_nota_org')}</p>}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={confirmando}>{t('botones.cerrar')}</button>
                    {esOrganizador && (
                        <button onClick={() => handleConfirmar(true)} disabled={confirmando} className="btn-confirmar-bye">
                            {confirmando ? `⏳ ${t('modal_partida.confirmando')}` : `✅ ${t('modal_partida.confirmar_bye')}`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // ─── SOLO LECTURA (CONFIRMADO) ────────────────────────────────────────────

    if (resultadoConfirmado) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header confirmado">
                    <h3>✅ {t('modal_partida.confirmado_titulo')} - {t('modal_partida.mesa')} {partida.mesa}</h3>
                    <button className="btn-close confirmado" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div className="alerta-confirmado">
                        <p>✅ {t('modal_partida.confirmado_info')}</p>
                        <p className="nota-no-editable">{t('modal_partida.no_editable')}</p>
                    </div>
                    <div className="partida-info">
                        <p><strong>{t('modal_partida.escenario')}:</strong> {getEscenario(partida.nombre_partida) || t('modal_partida.por_definir')}</p>
                        <p><strong>{t('modal_partida.ronda')}:</strong> {partida.ronda}</p>
                        <p><strong>{t('modal_partida.resultado_label')}:</strong> {getResultadoPreview()}</p>
                    </div>
                    <div className="resultados-grid">
                        {[1, 2].map(n => (
                            <React.Fragment key={n}>
                                {n === 2 && <div className="vs-divider">VS</div>}
                                <div className="jugador-stats">
                                    {esTorneoEquipos ? (
                                        <>
                                            <h4>{n === 1 ? partida.equipo1_nombre : partida.equipo2_nombre}</h4>
                                            <p className="jugador-equipo"><strong>{t('modal_partida.jugador')}:</strong> {n === 1 ? partida.jugador1_nombre : partida.jugador2_nombre}</p>
                                            {partida[`jugador${n}_faccion`] && <p><strong>{t('modal_partida.faccion')}:</strong> {partida[`jugador${n}_faccion`]}</p>}
                                            {partida[`jugador${n}_epoca`]   && <p><strong>{t('modal_partida.epoca')}:</strong>  {partida[`jugador${n}_epoca`]}</p>}
                                        </>
                                    ) : (
                                        <h4>{n === 1 ? partida.jugador1_nombre : partida.jugador2_nombre}</h4>
                                    )}
                                    <p><strong>{t('modal_partida.pp')}:</strong> {partida[`puntos_partida_j${n}`]}</p>
                                    <p><strong>{t('modal_partida.pm')}:</strong> {partida[`puntos_masacre_j${n}`]}</p>
                                    <p><strong>{t('modal_partida.pt')}:</strong> {partida[`puntos_torneo_j${n}`]}</p>
                                    {warlordSumaVictoria && (
                                        <p><strong>{t('modal_partida.warlords_eliminados')}:</strong> {partida[`warlord_muerto_j${n}`] || 0}
                                            {partida[`warlord_muerto_j${n}`] > 0 && ` (+${partida[`warlord_muerto_j${n}`]} PV)`}
                                        </p>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    {esOrganizador && (
                        <button onClick={() => handleConfirmar(false)} disabled={confirmando} className="btn-desconfirmar">
                            {confirmando ? `⏳ ${t('modal_partida.procesando')}` : `🔓 ${t('modal_partida.desconfirmar_resultado')}`}
                        </button>
                    )}
                    <button className="btn-cerrar" onClick={onClose}>{t('botones.cerrar')}</button>
                </div>
            </div>
        </div>
    );

    // ─── MODO EDICIÓN ────────────────────────────────────────────────────────

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-edicion" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📝 {t('modal_partida.registrar_titulo')} - {t('modal_partida.mesa')} {partida.mesa}</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="alerta-pendiente">
                        <p>⚠️ {t('modal_partida.pendiente_confirmacion')}</p>
                    </div>

                    {error && <div className="error-message"><p>❌ {error}</p></div>}

                    <div className="partida-info">
                        <p><strong>{t('modal_partida.escenario')}:</strong> {getEscenario(partida.nombre_partida) || t('modal_partida.por_definir')}</p>
                        <p><strong>{t('modal_partida.ronda')}:</strong> {partida.ronda}</p>
                        {esTorneoEquipos && (
                            <p className="info-equipos">
                                🛡️ <strong>{t('modal_partida.torneo_equipos')}</strong> — {t('modal_partida.torneo_equipos_info')}
                            </p>
                        )}
                        {usaPuntosTorneo ? (
                            <p className="info-puntos-torneo">📊 <strong>{t('modal_partida.sistema_pt')}</strong> — {t('modal_partida.sistema_pt_info')}</p>
                        ) : (
                            <p className="info-puntos-torneo">📊 <strong>{t('modal_partida.sistema_estandar')}</strong> — {t('modal_partida.sistema_estandar_info')}</p>
                        )}
                    </div>

                    {/* PRIMER JUGADOR */}
                    <div className="seccion-primer-jugador">
                        <h4>🎲 {t('modal_partida.primer_jugador_titulo')}</h4>
                        {resultado.primer_jugador ? (
                            <div className="primer-jugador-seleccionado">
                                <p>✅ <strong>{getNombreJugador(resultado.primer_jugador === partida.jugador1_id ? 1 : 2)}</strong> {t('modal_partida.fue_primer_jugador')}</p>
                                <button type="button" className="btn-limpiar-seleccion"
                                    onClick={() => setResultado(prev => ({ ...prev, primer_jugador: null }))}>
                                    ✕ {t('modal_partida.cambiar_seleccion')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="instruccion">⚠️ {t('modal_partida.selecciona_primer_jugador')}</p>
                                <div className="botones-primer-jugador">
                                    {[1, 2].map(n => (
                                        <button key={n} onClick={() => setResultado(prev => ({ ...prev, primer_jugador: partida[`jugador${n}_id`] }))}
                                            className="btn-seleccionar-jugador">
                                            {getNombreJugador(n)}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* FORMULARIO */}
                    <div className="formulario-grid">
                        {[1, 2].map(n => (
                            <React.Fragment key={n}>
                                {n === 2 && <div className="vs-divider">VS</div>}
                                <div className="jugador-resultado">
                                    {esTorneoEquipos ? (
                                        <>
                                            <h4>{n === 1 ? partida.equipo1_nombre : partida.equipo2_nombre}</h4>
                                            <p className="info-jugador-equipo">
                                                👤 <strong>{n === 1 ? partida.jugador1_nombre : partida.jugador2_nombre} - {n === 1 ? partida.jugador1_alias : partida.jugador2_alias}</strong>
                                            </p>
                                            {partida[`jugador${n}_faccion`] && <p className="info-extra">⚔️ {partida[`jugador${n}_faccion`]}</p>}
                                            {partida[`jugador${n}_epoca`]   && <p className="info-extra">📅 {partida[`jugador${n}_epoca`]}</p>}
                                        </>
                                    ) : (
                                        <h4>{n === 1 ? (partida.jugador1_nombre || partida.jugador1?.nombre) : (partida.jugador2_nombre || partida.jugador2?.nombre)}</h4>
                                    )}

                                    <div className="form-group">
                                        <label>{esTorneoEquipos ? `${t('modal_partida.pp')}:*` : `${t('modal_partida.pp')}:*`}</label>
                                        <input type="number" min="0"
                                            value={resultado[`puntos_partida_j${n}`]}
                                            onChange={(e) => handleChange(`puntos_partida_j${n}`, e.target.value)}
                                            disabled={guardando} />
                                        {esTorneoEquipos && <small className="nota-equipos">💡 {t('modal_partida.nota_equipos_pt')}</small>}
                                    </div>

                                    <div className="form-group">
                                        <label>{t('modal_partida.pm')}:</label>
                                        <input type="number" min="0"
                                            value={resultado[`puntos_masacre_j${n}`]}
                                            onChange={(e) => handleChange(`puntos_masacre_j${n}`, e.target.value)}
                                            disabled={guardando} />
                                    </div>

                                    {elCruce && (
                                        <div className="form-group">
                                            <label>{t('modal_partida.puntos_bonificacion')}:</label>
                                            <input type="number" min="0"
                                                value={resultado[`puntos_bonificacion_j${n}`]}
                                                onChange={(e) => handleChange(`puntos_bonificacion_j${n}`, e.target.value)}
                                                disabled={guardando} />
                                            <small className="nota-equipos">{t('modal_partida.bonificacion_hint')}</small>
                                        </div>
                                    )}

                                    {renderWarlordSection(n)}

                                    {tieneMisionesSecundarias && (
                                        <div className="form-group">
                                            <label className="warlord-label">
                                                <input type="checkbox"
                                                    checked={resultado[`misiones_secundarias_j${n}`]}
                                                    onChange={(e) => handleChange(`misiones_secundarias_j${n}`, e.target.checked)}
                                                    disabled={guardando} />
                                                🎯 {t('modal_partida.mision_secundaria')}
                                                {tieneMisionesSecundarias ? ' (+1 PV)' : ` (${t('modal_partida.no_puntua')})`}
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* SIN DADOS */}
                    <div className="seccion-sin-dados">
                        <h4>
                            {sinDados.activo && sinDados.ganador
                                ? `${getNombreJugador(sinDados.ganador === 1 ? 2 : 1)} ${t('modal_partida.sin_dados_titulo_activo')}`
                                : t('modal_partida.sin_dados_titulo')}
                        </h4>
                        {sinDados.activo ? (
                            <>
                                <div className="info-sin-dados">
                                    <p>🏆 {t('modal_partida.victoria_sin_dados_info', { nombre: getNombreJugador(sinDados.ganador) })}</p>
                                </div>
                                <button type="button" className="btn-limpiar-sin-dados"
                                    onClick={() => setSinDados({ activo: false, ganador: null })}>
                                    ✕ {t('modal_partida.cancelar_sin_dados')}
                                </button>
                            </>
                        ) : (
                            <div className="botones-sin-dados">
                                {[1, 2].map(ganador => (
                                    <button key={ganador} type="button" className="btn-sin-dados"
                                        onClick={() => meQuedoSinDados(ganador)}>
                                        🚫 {getNombreJugador(ganador === 1 ? 2 : 1)} {t('modal_partida.sin_dados_btn')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PREVIEW */}
                    <div className="resultado-preview">
                        <h4>{t('modal_partida.resultado_label')}:</h4>
                        <div className="resultado-badge">{getResultadoPreview()}</div>
                        <p className="nota-calculo">
                            💡 {esTorneoEquipos ? t('modal_partida.nota_calculo_equipos') : t('modal_partida.nota_calculo')}
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={guardando}>{t('botones.cancelar')}</button>
                    <div className="botones-accion">
                        {esOrganizador && partida.puntos_partida_j1 > 0 && (
                            <button onClick={() => handleConfirmar(true)}
                                disabled={guardando || confirmando || !resultado.primer_jugador}
                                className="btn-confirmar-definitivo">
                                {confirmando ? `⏳ ${t('modal_partida.confirmando')}` : `✅ ${t('modal_partida.confirmar_definitivo')}`}
                            </button>
                        )}
                        <button onClick={handleGuardar}
                            disabled={guardando || !resultado.primer_jugador}
                            className="btn-guardar">
                            {guardando ? `⏳ ${t('modal_partida.guardando')}` : `💾 ${t('modal_partida.guardar_resultado')}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalRegistroPartida;