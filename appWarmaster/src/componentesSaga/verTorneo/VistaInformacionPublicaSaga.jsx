import React from 'react';
import { obtenerConfiguracionBanda, obtenerOpcionesWarlordLegendario } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

// ==========================================
// ✅ FUNCIÓN HELPER: CALCULAR PUNTOS TOTALES
// ==========================================
const calcularPuntosTotales = (composicion, banda) => {
    if (!composicion || Object.keys(composicion).length === 0) return 0;

    const config = banda ? obtenerConfiguracionBanda(banda) : null;

    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        let total = 0;
        Object.keys(composicion.tiposTropaPersonalizados).forEach(idTropa => {
            const cantidad = composicion.tiposTropaPersonalizados[idTropa];
            const tipoConfig = config.tiposTropaPersonalizados.find(t => t.id === idTropa);
            if (tipoConfig) {
                total += cantidad * tipoConfig.puntos;
            }
        });
        return total;
    }

    let total = 0;
    total += parseFloat(composicion.guardias || 0);
    total += parseFloat(composicion.guerreros || 0);
    total += parseFloat(composicion.levas || 0);
    total += parseFloat(composicion.mercenarios || 0);
    total += parseFloat(composicion.elefantes || 0);
    total += parseFloat(composicion.carros || 0);
    total += parseFloat(composicion.tambor || 0);
    total += parseFloat(composicion.curaids || 0);
    total += parseFloat(composicion.perros || 0);
    total += parseFloat(composicion.berserkers || 0);
    total += parseFloat(composicion.cerdos || 0);
    
    if (composicion.unidadesEspeciales) {
        Object.values(composicion.unidadesEspeciales).forEach(valor => {
            total += parseFloat(valor || 0);
        });
    }
    
    return total;
};

// ==========================================
// ✅ FUNCIÓN: CALCULAR PUNTOS TOTALES INCLUYENDO WARLORD
// ==========================================
const calcularPuntosTotalesConWarlord = (composicion, banda) => {
    const puntosEjercito = calcularPuntosTotales(composicion, banda);
    const costeWarlord = composicion.warlordLegendario?.costePuntos || 0;
    return puntosEjercito + costeWarlord;
};

// ==========================================
// ✅ COMPONENTE: MOSTRAR COMPOSICIÓN
// ==========================================
const MostrarComposicion = ({ composicion, torneo, inscrito, banda, mostrarWarlord = false }) => {
    if (!composicion || Object.keys(composicion).length === 0) {
        return <p className="sin-composicion">Sin composición definida</p>;
    }

    const warlord = composicion.warlordLegendario || null;

    const bandaFinal = warlord?.bandaDesbloqueada || banda;

    const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
    const puntosEjercito = calcularPuntosTotales(composicion, bandaFinal);
    const totalPuntosConWarlord = calcularPuntosTotalesConWarlord(composicion, bandaFinal);

    // ✅ EDAD DE LA MAGIA
    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        return (
            <div className="composicion-banda">
                {mostrarWarlord && warlord && (
                    <div className="warlord-destacado">
                        <div className="warlord-titulo">⚔️ HÉROE LEGENDARIO</div>
                        <div className="warlord-nombre">{warlord.nombre}</div>
                        {warlord.costePuntos > 0 && (
                            <div className="warlord-coste">
                                Coste: {warlord.costePuntos} {warlord.costePuntos === 1 ? 'punto' : 'puntos'}
                            </div>
                        )}
                        {warlord.bandaDesbloqueada && (
                            <div className="warlord-banda-desbloqueada">
                                ✨ Desbloquea: <strong>{warlord.bandaDesbloqueada}</strong>
                            </div>
                        )}
                    </div>
                )}

                <h5>📜 Composición del Ejército:</h5>
                <div className="puntos-total-box">
                    <div className="puntos-total-principal">
                        <strong>Total: {totalPuntosConWarlord.toFixed(1)} pts</strong>
                    </div>
                    {warlord?.costePuntos > 0 && (
                        <div className="puntos-desglose">
                            Ejército: {puntosEjercito.toFixed(1)} pts + Warlord: {warlord.costePuntos} pt
                        </div>
                    )}
                </div>
                <ul>
                    {config.tiposTropaPersonalizados.map(tipo => {
                        const cantidad = composicion.tiposTropaPersonalizados[tipo.id] || 0;
                        if (cantidad > 0) {
                            return (
                                <li key={tipo.id}>
                                    {tipo.label}: {cantidad} ({(cantidad * tipo.puntos).toFixed(1)} pts)
                                </li>
                            );
                        }
                        return null;
                    })}
                </ul>
                {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                    <div className="opciones-banda-detalle">
                        <h6>⚙️ Configuración:</h6>
                        <ul>
                            {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                                const opcion = config?.opcionesBanda?.find(o => o.id === key);
                                const label = opcion?.label || key;
                                return <li key={key}>{label}: {value}</li>;
                            })}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // ✅ BANDAS NORMALES
    return (
        <div className="composicion-banda">
            <h5>📜 Composición del Ejército:</h5>
            <div className="puntos-total-box">
                <div className="puntos-total-principal">
                </div>
                {warlord?.costePuntos >= 0 && (
                    <div className="puntos-desglose">
                        ⭐{warlord.nombre} ({warlord.costePuntos} punto)
                    </div>
                )}
            </div>
            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                <div className="opciones-banda-detalle">
                    <h6></h6>
                        {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                            const label = "AMBICIÓN DEL WARLORD";
                            return <p key={key}><strong>{label}:</strong> {value}</p>;
                        })}
                </div>
            )}
            <ul>
                {composicion.guardias > 0 && <li>Guardias: {parseFloat(composicion.guardias)}</li>}
                {composicion.berserkers > 0 && (
                    <li className="unidad-berserkers">Berserkers: {parseFloat(composicion.berserkers)}</li>
                )}
                {composicion.elefantes > 0 && <li>Elefantes: {parseFloat(composicion.elefantes)}</li>}
                {composicion.carros > 0 && <li>Carros: {parseFloat(composicion.carros)}</li>}
                {composicion.tambor > 0 && <li> Tambor: {parseFloat(composicion.tambor)}</li>}
                {composicion.curaids > 0 && <li>Curaids: {parseFloat(composicion.curaids)}</li>}
                {composicion.perros > 0 && <li> Perros de Guerra: {parseFloat(composicion.perros)}</li>}
                
                {composicion.cerdos > 0 && (
                    <li className="unidad-cerdos">
                         Cerdos Incendiarios: {parseFloat(composicion.cerdos)} 
                    </li>
                )}
                
                {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                    if (value > 0) {
                        // ✅ Buscar primero en unidades base
                        let unidad = config?.unidadesEspeciales?.find(u => u.nombre === key);

                        // ✅ Si no se encuentra y hay warlord, buscar en unidades desbloqueadas
                                                if (!unidad && warlord) {
                            const epocaTorneo = torneo?.epocas_disponibles || inscrito?.epoca;

                            if (epocaTorneo) {
                                const opcionesWarlord = obtenerOpcionesWarlordLegendario(epocaTorneo, banda);
                            
                                if (opcionesWarlord) {
                                    const opcionWarlordActual = opcionesWarlord.opciones.find(o => o.valor === warlord.valor);
                            
                                    if (opcionWarlordActual?.unidadesEspecialesDesbloqueadas) {
                                        unidad = opcionWarlordActual.unidadesEspecialesDesbloqueadas.find(u => u.valor === key);
                                    }
                                }
                            }
                        }
                        
                        const nombre = unidad?.nombre || key;
                        const esLegendaria = unidad?.puntos >= 2;
                        
                        return (
                            <li key={key} className={esLegendaria ? 'unidad-legendaria' : ''}>
                                {esLegendaria && '⭐ '}
                                {nombre}: {parseFloat(value)}
                            </li>
                        );
                    }
                    return null;
                })}
                
                {composicion.guerreros > 0 && <li>Guerreros: {parseFloat(composicion.guerreros)}</li>}
                {composicion.levas > 0 && <li>Levas: {parseFloat(composicion.levas)}</li>}
                {composicion.mercenarios > 0 && <li>Mercenarios: {parseFloat(composicion.mercenarios)}</li>}
                
                {composicion.detalleMercenarios && (
                    <li className="detalle-mercenarios">🧾 {composicion.detalleMercenarios}</li>
                )}
            </ul>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
function VistaInformacionSaga({ inscritos, equipos, tipoTorneo, torneo, listasOcultas}) {
    const tieneUnidadesLegendarias = torneo?.unidades_legendarias === 1;

    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-inscritos">
                <h2>👤 Jugadores Inscritos ({inscritos.length})</h2>
                {inscritos.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 Aún no hay jugadores inscritos en este torneo.</p>
                    </div>
                ) : (
                    <div className="grid-inscritos">
                        {inscritos.map((inscrito) => {
                            let composicion = {};
                            if (inscrito.composicion_ejercito) {
                                try {
                                    composicion = typeof inscrito.composicion_ejercito === 'string'
                                        ? JSON.parse(inscrito.composicion_ejercito)
                                        : inscrito.composicion_ejercito;
                                } catch (e) {
                                    console.error('Error al parsear composición:', e);
                                }
                            }

                            const warlord = composicion.warlordLegendario;
                            const bandaFinal = warlord?.bandaDesbloqueada || inscrito.faccion;
                            const totalPuntos = calcularPuntosTotalesConWarlord(composicion, bandaFinal);

                            return (
                                <div key={inscrito.id} className="card-inscrito">
                                    <div className="jugador-info">
                                        <h3>
                                            👤 {inscrito.jugador_nombre || 'Sin nombre'} {inscrito.jugador_apellidos || ''}
                                        </h3>
                                        {inscrito.nombre_alias && (
                                            <h4 className="alias">"{inscrito.nombre_alias}"</h4>
                                        )}
                                        {inscrito.club && <p className="club">🏛️ {inscrito.club}</p>}
                                        {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                    </div>

                                    <div className="banda-info">
                                        <p><strong>Época:</strong> {inscrito.epoca || "Sin definir"}</p>
                                        {!listasOcultas ? (
                                            <>
                                                <p>
                                                    <strong>Facción:</strong> {inscrito.faccion || "Sin definir"}
                                                    {warlord?.bandaDesbloqueada && (
                                                        <span className="banda-desbloqueada-small">
                                                            ✨ {warlord.bandaDesbloqueada}
                                                        </span>
                                                    )}
                                                </p>
                                            </>
                                        ): (
                                            <p><strong>Facción:</strong> {'-'}</p>
                                        )}           
                                        <p><strong>Puntos Totales:</strong> {totalPuntos.toFixed(1)} pts</p>
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

    // VISTA DE EQUIPOS
    return (
        <div className="vista-inscritos">
            <h2>👥 Equipos Inscritos ({equipos.length})</h2>
            {equipos.length === 0 ? (
                <div className="empty-message">
                    <p>📭 Aún no hay equipos inscritos en este torneo.</p>
                </div>
            ) : (
                <div className="grid-equipos">
                    {equipos.map((equipo) => (
                        <div key={equipo.id} className="card-equipo">
                            <div className="equipo-header">
                                <h3>🏆 {equipo.nombre_equipo || 'Sin nombre'}</h3>
                                <span className="badge-capitan">
                                    👑 Capitán: <br />
                                    {equipo.capitan_nombre} {equipo.capitan_apellidos} {equipo.capitan_alias && `(${equipo.capitan_alias})`}
                                </span>
                            </div>

                            <div className="equipo-miembros">
                                <h4>Miembros ({(equipo.miembros || []).length}):</h4>
                                {(equipo.miembros || []).length > 0 ? (
                                    <ul className="lista-miembros">
                                        {equipo.miembros.map((miembro, idx) => {
                                            let composicion = {};
                                            if (miembro.composicion) {
                                                try {
                                                    composicion = typeof miembro.composicion === 'string'
                                                        ? JSON.parse(miembro.composicion)
                                                        : miembro.composicion;
                                                } catch (e) {
                                                    console.error('Error al parsear composición del miembro:', e);
                                                }
                                            }

                                            const warlord = composicion.warlordLegendario;
                                            const bandaFinal = warlord?.bandaDesbloqueada || miembro.faccion;
                                            const puntosEjercito = calcularPuntosTotales(composicion, bandaFinal);
                                            const totalPuntos = calcularPuntosTotalesConWarlord(composicion, bandaFinal);

                                            return (
                                                <li key={idx} className="miembro-item">
                                                    <div className="miembro-header">
                                                        <span className="miembro-nombre">
                                                           {miembro.es_capitan && '👑 '}
                                                            {miembro.nombre} {miembro.alias && `(${miembro.alias})`}
                                                        </span>
                                                        <span className="miembro-epoca-banda">
                                                            {miembro.epoca || 'Sin época'}
                                                            {!listasOcultas && (
                                                                <> - {miembro.faccion || 'Sin banda'}
                                                                {warlord?.bandaDesbloqueada && (
                                                                    <span className="banda-desbloqueada-inline">
                                                                        ✨ {warlord.bandaDesbloqueada}
                                                                    </span>
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
                                                                            {warlord.costePuntos} {warlord.costePuntos === 1 ? 'punto' : 'puntos'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="puntos-total-mini">
                                                                <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                                                                {warlord?.costePuntos > 0 && (
                                                                    <div className="puntos-desglose-mini">
                                                                        Ejército: {puntosEjercito.toFixed(1)} + Warlord: {warlord.costePuntos}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {composicion.tiposTropaPersonalizados ? (
                                                                <div className="puntos-detalle">
                                                                    {(() => {
                                                                        const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
                                                                        if (!config?.tiposTropaPersonalizados) return null;
                                                                        
                                                                        return config.tiposTropaPersonalizados.map(tipo => {
                                                                            const cantidad = composicion.tiposTropaPersonalizados[tipo.id] || 0;
                                                                            if (cantidad > 0) {
                                                                                return (
                                                                                    <span key={tipo.id}>
                                                                                        {tipo.label}: {cantidad}
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        });
                                                                    })()}
                                                                </div>
                                                            ) : (
                                                                <div className="puntos-detalle">
                                                                    {composicion.guardias > 0 && <span>Guardias: {parseFloat(composicion.guardias)}</span>}
                                                                    {composicion.berserkers > 0 && (
                                                                        <span className="unidad-berserkers-inline">
                                                                             Berserkers: {parseFloat(composicion.berserkers)}
                                                                        </span>
                                                                    )}
                                                                    {composicion.elefantes > 0 && <span> Elefantes: {parseFloat(composicion.elefantes)}</span>}
                                                                    {composicion.carros > 0 && <span>Carros: {parseFloat(composicion.carros)}</span>}
                                                                    {composicion.tambor > 0 && <span>Tambor: {parseFloat(composicion.tambor)}</span>}
                                                                    {composicion.curaids > 0 && <span>Curaids: {parseFloat(composicion.curaids)}</span>}
                                                                    {composicion.perros > 0 && <span> Perros de Guerra: {parseFloat(composicion.perros)}</span>}
                                                                    
                                                                    {composicion.cerdos > 0 && (
                                                                        <span className="unidad-cerdos-inline">
                                                                            Cerdos: {parseFloat(composicion.cerdos)} 
                                                                        </span>
                                                                    )}
                                                                    
                                                                    {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                                                                        if (value > 0) {
                                                                            const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
                                                                            const unidad = config?.unidadesEspeciales?.find(u => u.nombre === key);
                                                                            const label = unidad?.label || key;
                                                                            const esLegendaria = unidad?.puntos >= 2;
                                                                            
                                                                            return (
                                                                                <span 
                                                                                    key={key}
                                                                                    className={esLegendaria ? 'unidad-legendaria-inline' : ''}
                                                                                >
                                                                                    {esLegendaria && '⭐ '}
                                                                                    {label}: {parseFloat(value)}
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })}
                                                                    
                                                                    {composicion.guerreros > 0 && <span>Guerreros: {parseFloat(composicion.guerreros)}</span>}
                                                                    {composicion.levas > 0 && <span>Levas: {parseFloat(composicion.levas)}</span>}
                                                                    {composicion.mercenarios > 0 && <span>Mercenarios: {parseFloat(composicion.mercenarios)}</span>}
                                                                </div>
                                                            )}
                                                            
                                                            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                                                                <div className="opciones-banda-mini">
                                                                    {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                                                                        const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
                                                                        const opcion = config?.opcionesBanda?.find(o => o.id === key);
                                                                        const label = opcion?.label || key;
                                                                        return (
                                                                            <span key={key} className="badge-opcion-mini">
                                                                                {label}: {value}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            
                                                            {composicion.detalleMercenarios && (
                                                                <div className="detalle-mercenarios-mini">
                                                                    🧾 {composicion.detalleMercenarios}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="sin-miembros">Sin miembros</p>
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