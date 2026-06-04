import React from 'react';
import { useTranslation } from 'react-i18next';
import { obtenerConfiguracionBanda, obtenerOpcionesWarlordLegendario, useSagaI18n } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

// ── Helpers de puntos (sin cambio, no afecta i18n) ───────────────────────────

const calcularPuntosTotales = (composicion, banda) => {
    if (!composicion || Object.keys(composicion).length === 0) return 0;
    const config = banda ? obtenerConfiguracionBanda(banda) : null;
    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        let total = 0;
        Object.keys(composicion.tiposTropaPersonalizados).forEach(id => {
            const cant  = composicion.tiposTropaPersonalizados[id];
            const tcfg  = config.tiposTropaPersonalizados.find(t => t.id === id);
            if (tcfg) total += cant * tcfg.puntos;
        });
        return total;
    }
    let total = 0;
    ['guardias','guerreros','levas','mercenarios','elefantes','carros','tambor','curaids','perros','berserkers','cerdos']
        .forEach(k => { total += parseFloat(composicion[k] || 0); });
    if (composicion.unidadesEspeciales)
        Object.values(composicion.unidadesEspeciales).forEach(v => { total += parseFloat(v || 0); });
    return total;
};

const calcularPuntosTotalesConWarlord = (composicion, banda) =>
    calcularPuntosTotales(composicion, banda) + (composicion.warlordLegendario?.costePuntos || 0);

// ── MostrarComposicion ────────────────────────────────────────────────────────

const MostrarComposicion = ({ composicion, torneo, inscrito, banda, mostrarWarlord = false }) => {
    const { t } = useTranslation();
    const { getTropa, getWarlordType } = useSagaI18n();

    if (!composicion || Object.keys(composicion).length === 0)
        return <p className="sin-composicion">{t('vista_info_saga.sin_composicion')}</p>;

    const warlord = composicion.warlordLegendario || null;
    const bandaFinal = warlord?.bandaDesbloqueada || banda;
    const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
    const puntosEjercito = calcularPuntosTotales(composicion, bandaFinal);
    const totalPuntosConWarlord  = calcularPuntosTotalesConWarlord(composicion, bandaFinal);

    // ── Age of Magic (tiposTropaPersonalizados) ───────────────────────────────
    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        return (
            <div className="composicion-banda">
                {mostrarWarlord && warlord && (
                    <div className="warlord-destacado">
                        <div className="warlord-titulo">⚔️ {t('vista_info_saga.heroe_legendario')}</div>
                        <div className="warlord-nombre">{warlord.nombre}</div>
                        {warlord.costePuntos > 0 && (
                            <div className="warlord-coste">
                                {t('insc_equipo.warlord_coste')}: {warlord.costePuntos} {warlord.costePuntos === 1 ? t('insc_equipo.punto') : t('insc_equipo.puntos')}
                            </div>
                        )}
                        {warlord.bandaDesbloqueada && (
                            <div className="warlord-banda-desbloqueada">
                                ✨ {t('vista_info_saga.desbloquea')}: <strong>{warlord.bandaDesbloqueada}</strong>
                            </div>
                        )}
                    </div>
                )}

                <h5>📜 {t('vista_info_saga.composicion')}:</h5>
                <div className="puntos-total-box">
                    <div className="puntos-total-principal">
                        <strong>{t('vista_info_saga.total')}: {totalPuntosConWarlord.toFixed(1)} pts</strong>
                    </div>
                    {warlord?.costePuntos > 0 && (
                        <div className="puntos-desglose">
                            {t('vista_info_saga.ejercito')}: {puntosEjercito.toFixed(1)} pts + {t('vista_info_saga.warlord_label')}: {warlord.costePuntos} pt
                        </div>
                    )}
                </div>
                <ul>
                    {config.tiposTropaPersonalizados.map(tipo => {
                        const cantidad = composicion.tiposTropaPersonalizados[tipo.id] || 0;
                        if (cantidad <= 0) return null;
                        return (
                            <li key={tipo.id}>
                                {getTropa(tipo.id)}: {cantidad} ({(cantidad * tipo.puntos).toFixed(1)} pts)
                            </li>
                        );
                    })}
                </ul>
                {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                    <div className="opciones-banda-detalle">
                        <h6>⚙️ {t('insc_equipo.config_banda')}:</h6>
                        <ul>
                            {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                                const opcion = config?.opcionesBanda?.find(o => o.id === key);
                                const label  = opcion?.label || key;
                                return <li key={key}>{label}: {getWarlordType(value)}</li>;
                            })}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // ── Bandas normales ───────────────────────────────────────────────────────
    return (
        <div className="composicion-banda">
            <h5>📜 {t('vista_info_saga.composicion')}:</h5>
            <div className="puntos-total-box">
                <div className="puntos-total-principal" />
                {warlord?.costePuntos >= 0 && (
                    <div className="puntos-desglose">
                        ⭐{warlord.nombre} ({warlord.costePuntos} {t('insc_equipo.punto')})
                    </div>
                )}
            </div>

            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                <div className="opciones-banda-detalle">
                    <h6 />
                    {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                        const opcion = config?.opcionesBanda?.find(o => o.id === key);
                        const label  = opcion?.label || t('vista_info_saga.ambicion_warlord');
                        return <p key={key}><strong>{label}:</strong> {getWarlordType(value)}</p>;
                    })}
                </div>
            )}

            <ul>
                {composicion.guardias > 0 && <li>{getTropa('guardias')}: {parseFloat(composicion.guardias)}</li>}
                {composicion.berserkers > 0 && <li className="unidad-berserkers">{getTropa('berserkers')}: {parseFloat(composicion.berserkers)}</li>}
                {composicion.elefantes > 0 && <li>{getTropa('elefantes')}: {parseFloat(composicion.elefantes)}</li>}
                {composicion.carros > 0 && <li>{getTropa('carros')}: {parseFloat(composicion.carros)}</li>}
                {composicion.tambor > 0 && <li>{getTropa('tambor')}: {parseFloat(composicion.tambor)}</li>}
                {composicion.curaids > 0 && <li>{getTropa('curaids')}: {parseFloat(composicion.curaids)}</li>}
                {composicion.perros > 0 && <li>{getTropa('perros')}: {parseFloat(composicion.perros)}</li>}
                {composicion.cerdos > 0 && <li className="unidad-cerdos">{t('insc_equipo.cerdos_incendiarios')}: {parseFloat(composicion.cerdos)}</li>}

                {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                    if (value <= 0) return null;
                    let unidad = config?.unidadesEspeciales?.find(u => u.nombre === key);
                    if (!unidad && warlord) {
                        const epocaTorneo = torneo?.epocas_disponibles || inscrito?.epoca;
                        if (epocaTorneo) {
                            const ow = obtenerOpcionesWarlordLegendario(epocaTorneo, banda);
                            if (ow) {
                                const owActual = ow.opciones.find(o => o.valor === warlord.valor);
                                if (owActual?.unidadesEspecialesDesbloqueadas)
                                    unidad = owActual.unidadesEspecialesDesbloqueadas.find(u => u.valor === key);
                            }
                        }
                    }
                    const nombre = getTropa(key) !== key ? getTropa(key) : (unidad?.label || unidad?.nombre || key);
                    const esLegendaria= (unidad?.puntos || 0) >= 2;
                    return (
                        <li key={key} className={esLegendaria ? 'unidad-legendaria' : ''}>
                            {esLegendaria && '⭐ '}{nombre}: {parseFloat(value)}
                        </li>
                    );
                })}

                {composicion.guerreros > 0 && <li>{getTropa('guerreros')}: {parseFloat(composicion.guerreros)}</li>}
                {composicion.levas > 0 && <li>{getTropa('levas')}: {parseFloat(composicion.levas)}</li>}
                {composicion.mercenarios > 0 && <li>{getTropa('mercenarios')}: {parseFloat(composicion.mercenarios)}</li>}
                {composicion.detalleMercenarios && <li className="detalle-mercenarios">🧾 {composicion.detalleMercenarios}</li>}
            </ul>
        </div>
    );
};

// ── VistaInformacionSaga ──────────────────────────────────────────────────────

function VistaInformacionSaga({ inscritos, equipos, tipoTorneo, torneo, listasOcultas }) {
    const { t } = useTranslation();
    const { getTropa, getWarlordType, getBanda, getEpoca } = useSagaI18n();

    const tieneUnidadesLegendarias = torneo?.unidades_legendarias === 1;

    // ── Vista individual ──────────────────────────────────────────────────────
    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-inscritos">
                <h2>👤 {t('vista_info_saga.jugadores_inscritos', { n: inscritos.length })}</h2>
                {inscritos.length === 0 ? (
                    <div className="empty-message"><p>📭 {t('vista_info_saga.sin_jugadores')}</p></div>
                ) : (
                    <div className="grid-inscritos">
                        {inscritos.map(inscrito => {
                            let composicion = {};
                            if (inscrito.composicion_ejercito) {
                                try { composicion = typeof inscrito.composicion_ejercito === 'string' ? JSON.parse(inscrito.composicion_ejercito) : inscrito.composicion_ejercito; }
                                catch (e) { console.error('Error al parsear composición:', e); }
                            }
                            const warlord = composicion.warlordLegendario;
                            const bandaFinal = warlord?.bandaDesbloqueada || inscrito.faccion;
                            const totalPuntos= calcularPuntosTotalesConWarlord(composicion, bandaFinal);

                            return (
                                <div key={inscrito.id} className="card-inscrito">
                                    <div className="jugador-info">
                                        <h3>👤 {inscrito.jugador_nombre || t('vista_info_saga.sin_nombre')} {inscrito.jugador_apellidos || ''}</h3>
                                        {inscrito.nombre_alias && <h4 className="alias">"{inscrito.nombre_alias}"</h4>}
                                        {inscrito.club   && <p className="club">🏛️ {inscrito.club}</p>}
                                        {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                    </div>
                                    <div className="banda-info">
                                        <p><strong>{t('vista_info_saga.epoca')}:</strong> {inscrito.epoca ? getEpoca(inscrito.epoca) : t('vista_info_saga.sin_definir')}</p>
                                        <p><strong>{t('vista_info_saga.faccion')}:</strong>{' '}
                                            {listasOcultas
                                                ? '-'
                                                : inscrito.faccion
                                                    ? <>
                                                        {getBanda(inscrito.faccion)}
                                                        {warlord?.bandaDesbloqueada && (
                                                            <span className="banda-desbloqueada-small">✨ {getBanda(warlord.bandaDesbloqueada)}</span>
                                                        )}
                                                        </>
                                                    : t('vista_info_saga.sin_definir')
                                            }
                                        </p>
                                        <p><strong>{t('vista_info_saga.puntos_totales')}:</strong> {totalPuntos.toFixed(1)} pts</p>
                                    </div>
                                    {!listasOcultas && (
                                        <MostrarComposicion
                                            composicion={composicion}
                                            banda={inscrito.faccion}
                                            mostrarWarlord={tieneUnidadesLegendarias}
                                            torneo={torneo}
                                            inscrito={inscrito}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── Vista equipos ─────────────────────────────────────────────────────────
    return (
        <div className="vista-inscritos">
            <h2>👥 {t('vista_info_saga.equipos_inscritos', { n: equipos.length })}</h2>
            {equipos.length === 0 ? (
                <div className="empty-message"><p>📭 {t('vista_info_saga.sin_equipos')}</p></div>
            ) : (
                <div className="grid-equipos">
                    {equipos.map(equipo => (
                        <div key={equipo.id} className="card-equipo">
                            <div className="equipo-header">
                                <h3>🏆 {equipo.nombre_equipo || t('vista_info_saga.sin_nombre')}</h3>
                                <span className="badge-capitan">
                                    👑 {t('insc_equipo.capitan')}: <br />
                                    {equipo.capitan_nombre} {equipo.capitan_apellidos} {equipo.capitan_alias && `(${equipo.capitan_alias})`}
                                </span>
                            </div>
                            <div className="equipo-miembros">
                                <h4>{t('vista_info_saga.miembros', { n: (equipo.miembros || []).length })}:</h4>
                                {(equipo.miembros || []).length > 0 ? (
                                    <ul className="lista-miembros">
                                        {equipo.miembros.map((miembro, idx) => {
                                            let composicion = {};
                                            if (miembro.composicion) {
                                                try { composicion = typeof miembro.composicion === 'string' ? JSON.parse(miembro.composicion) : miembro.composicion; }
                                                catch (e) { console.error('Error al parsear composición del miembro:', e); }
                                            }
                                            const warlord = composicion.warlordLegendario;
                                            const bandaFinal = warlord?.bandaDesbloqueada || miembro.faccion;
                                            const puntosEjercito = calcularPuntosTotales(composicion, bandaFinal);
                                            const totalPuntos = calcularPuntosTotalesConWarlord(composicion, bandaFinal);

                                            return (
                                                <li key={idx} className="miembro-item">
                                                    <div className="miembro-header">
                                                        <span className="miembro-nombre">
                                                            {miembro.es_capitan && '👑 '}{miembro.nombre} {miembro.alias && `(${miembro.alias})`}
                                                        </span>
                                                        <span className="miembro-epoca-banda">
                                                            {miembro.epoca ? getEpoca(miembro.epoca) : t('vista_info_saga.sin_epoca')}
                                                            {!listasOcultas && (
                                                                <> -{miembro.faccion ? getBanda(miembro.faccion) : t('vista_info_saga.sin_banda')}
                                                                {warlord?.bandaDesbloqueada && (
                                                                    <span className="banda-desbloqueada-inline">✨ {warlord.bandaDesbloqueada}</span>
                                                                )}</>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {Object.keys(composicion).length > 0 && !listasOcultas && (
                                                        <div className="miembro-composicion">
                                                            {tieneUnidadesLegendarias && warlord && (
                                                                <div className="warlord-mini">
                                                                    <div className="warlord-mini-nombre">⚔️ {warlord.nombre}</div>
                                                                    {warlord.costePuntos > 0 && (
                                                                        <div className="warlord-mini-coste">
                                                                            {warlord.costePuntos} {warlord.costePuntos === 1 ? t('insc_equipo.punto') : t('insc_equipo.puntos')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="puntos-total-mini">
                                                                <strong>{t('vista_info_saga.total')}: {totalPuntos.toFixed(1)} pts</strong>
                                                                {warlord?.costePuntos > 0 && (
                                                                    <div className="puntos-desglose-mini">
                                                                        {t('vista_info_saga.ejercito')}: {puntosEjercito.toFixed(1)} + {t('vista_info_saga.warlord_label')}: {warlord.costePuntos}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {composicion.tiposTropaPersonalizados ? (
                                                                <div className="puntos-detalle">
                                                                    {(() => {
                                                                        const cfg = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
                                                                        if (!cfg?.tiposTropaPersonalizados) return null;
                                                                        return cfg.tiposTropaPersonalizados.map(tipo => {
                                                                            const cant = composicion.tiposTropaPersonalizados[tipo.id] || 0;
                                                                            if (cant <= 0) return null;
                                                                            return <span key={tipo.id}>{getTropa(tipo.id)}: {cant}</span>;
                                                                        });
                                                                    })()}
                                                                </div>
                                                            ) : (
                                                                <div className="puntos-detalle">
                                                                    {composicion.guardias    > 0 && <span>{getTropa('guardias')}: {parseFloat(composicion.guardias)}</span>}
                                                                    {composicion.berserkers  > 0 && <span className="unidad-berserkers-inline">{getTropa('berserkers')}: {parseFloat(composicion.berserkers)}</span>}
                                                                    {composicion.elefantes   > 0 && <span>{getTropa('elefantes')}: {parseFloat(composicion.elefantes)}</span>}
                                                                    {composicion.carros      > 0 && <span>{getTropa('carros')}: {parseFloat(composicion.carros)}</span>}
                                                                    {composicion.tambor      > 0 && <span>{getTropa('tambor')}: {parseFloat(composicion.tambor)}</span>}
                                                                    {composicion.curaids     > 0 && <span>{getTropa('curaids')}: {parseFloat(composicion.curaids)}</span>}
                                                                    {composicion.perros      > 0 && <span>{getTropa('perros')}: {parseFloat(composicion.perros)}</span>}
                                                                    {composicion.cerdos      > 0 && <span className="unidad-cerdos-inline">{t('insc_equipo.cerdos_incendiarios')}: {parseFloat(composicion.cerdos)}</span>}
                                                                    {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                                                                        if (value <= 0) return null;
                                                                        const cfg2  = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
                                                                        const unidad= cfg2?.unidadesEspeciales?.find(u => u.nombre === key);
                                                                        const label = getTropa(key) !== key ? getTropa(key) : (unidad?.label || key);
                                                                        const esLeg = (unidad?.puntos || 0) >= 2;
                                                                        return (
                                                                            <span key={key} className={esLeg ? 'unidad-legendaria-inline' : ''}>
                                                                                {esLeg && '⭐ '}{label}: {parseFloat(value)}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                    {composicion.guerreros   > 0 && <span>{getTropa('guerreros')}: {parseFloat(composicion.guerreros)}</span>}
                                                                    {composicion.levas       > 0 && <span>{getTropa('levas')}: {parseFloat(composicion.levas)}</span>}
                                                                    {composicion.mercenarios > 0 && <span>{getTropa('mercenarios')}: {parseFloat(composicion.mercenarios)}</span>}
                                                                </div>
                                                            )}

                                                            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                                                                <div className="opciones-banda-mini">
                                                                    {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                                                                        const cfg3  = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
                                                                        const opcion= cfg3?.opcionesBanda?.find(o => o.id === key);
                                                                        const label = opcion?.label || key;
                                                                        return (
                                                                            <span key={key} className="badge-opcion-mini">
                                                                                {label}: {getWarlordType(value)}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {composicion.detalleMercenarios && (
                                                                <div className="detalle-mercenarios-mini">🧾 {composicion.detalleMercenarios}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="sin-miembros">{t('vista_info_saga.sin_miembros')}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VistaInformacionSaga;
