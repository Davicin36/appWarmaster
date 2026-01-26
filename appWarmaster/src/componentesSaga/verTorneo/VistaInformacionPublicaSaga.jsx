import React from 'react';
import { obtenerConfiguracionBanda } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

// ==========================================
// ✅ FUNCIÓN HELPER: CALCULAR PUNTOS TOTALES
// ==========================================
const calcularPuntosTotales = (composicion, banda) => {
    if (!composicion || Object.keys(composicion).length === 0) return 0;

    const config = banda ? obtenerConfiguracionBanda(banda) : null;

    // Si usa tipos personalizados (Edad de la Magia)
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

    // Bandas normales
    let total = 0;
    
    // Tipos estándar
    total += parseFloat(composicion.guardias || 0);
    total += parseFloat(composicion.guerreros || 0);
    total += parseFloat(composicion.levas || 0);
    total += parseFloat(composicion.mercenarios || 0);
    
    // Características especiales
    total += parseFloat(composicion.elefantes || 0);
    total += parseFloat(composicion.carros || 0);
    total += parseFloat(composicion.tambor || 0);
    total += parseFloat(composicion.curaids || 0);
    total += parseFloat(composicion.perros || 0);
    total += parseFloat(composicion.berserkers || 0);
    
    // Unidades especiales
    if (composicion.unidadesEspeciales) {
        Object.values(composicion.unidadesEspeciales).forEach(valor => {
            total += parseFloat(valor || 0);
        });
    }
    
    return total;
};

// ==========================================
// ✅ COMPONENTE: MOSTRAR COMPOSICIÓN
// ==========================================
const MostrarComposicion = ({ composicion, banda }) => {
    if (!composicion || Object.keys(composicion).length === 0) {
        return <p className="sin-composicion">Sin composición definida</p>;
    }

    const config = banda ? obtenerConfiguracionBanda(banda) : null;
    const totalPuntos = calcularPuntosTotales(composicion, banda);

    // ✅ EDAD DE LA MAGIA - Tipos personalizados
    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        return (
            <div className="composicion-banda">
                <h5>📜 Composición:</h5>
                <div className="puntos-total">
                    <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
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
                                return (
                                    <li key={key}>
                                        {label}: {value}
                                    </li>
                                );
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
            <h5>📜 Composición:</h5>
            <div className="puntos-total">
                <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
            </div>
            <ul>
                {/* Tipos estándar */}
                {composicion.guardias > 0 && (
                    <li>Guardias: {parseFloat(composicion.guardias)}</li>
                )}
                {composicion.berserkers > 0 && (
                    <li>Berserkers: {parseFloat(composicion.berserkers)}</li>
                )}
                
                {/* Características especiales */}
                {composicion.elefantes > 0 && (
                    <li>Elefantes : {parseFloat(composicion.elefantes)}</li>
                )}
                {composicion.carros > 0 && (
                    <li>Carros : {parseFloat(composicion.carros)}</li>
                )}
                {composicion.tambor > 0 && (
                    <li>Tambor : {parseFloat(composicion.tambor)}</li>
                )}
                {composicion.curaids > 0 && (
                    <li>Curaids : {parseFloat(composicion.curaids)}</li>
                )}
                {composicion.perros > 0 && (
                    <li>Perros de Guerra: {parseFloat(composicion.perros)}</li>
                )}
                
                {/* Unidades especiales */}
                {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                    if (value > 0) {
                        const unidad = config?.unidadesEspeciales?.find(u => u.nombre === key);
                        const label = unidad?.label || key;
                        return (
                            <li key={key}>
                                {label}: {parseFloat(value)}
                            </li>
                        );
                    }
                    return null;
                })}
                
                {composicion.guerreros > 0 && (
                    <li>Guerreros: {parseFloat(composicion.guerreros)}</li>
                )}
                {composicion.levas > 0 && (
                    <li>Levas: {parseFloat(composicion.levas)}</li>
                )}
                {composicion.mercenarios > 0 && (
                    <li>Mercenarios: {parseFloat(composicion.mercenarios)}</li>
                )}
                
                {/* Detalle mercenarios */}
                {composicion.detalleMercenarios && (
                    <li className="detalle-mercenarios">
                        🧾 {composicion.detalleMercenarios}
                    </li>
                )}
            </ul>
            
            {/* Opciones de banda */}
            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                <div className="opciones-banda-detalle">
                    <h6>⚙️ Configuración:</h6>
                    <ul>
                        {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                            const opcion = config?.opcionesBanda?.find(o => o.id === key);
                            const label = opcion?.label || key;
                            return (
                                <li key={key}>
                                    {label}: {value}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
function VistaInformacionSaga({ inscritos, equipos, tipoTorneo }) {
    // ==========================================
    // VISTA INDIVIDUAL
    // ==========================================
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
                            // Parsear composición si es string
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

                            const totalPuntos = calcularPuntosTotales(composicion, inscrito.faccion);

                            return (
                                <div key={inscrito.id} className="card-inscrito">
                                    <div className="jugador-info">
                                        <h3>
                                            👤 {inscrito.jugador_nombre || 'Sin nombre'} {inscrito.jugador_apellidos || ''}
                                        </h3>
                                        {inscrito.nombre_alias && (
                                            <h4 style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                                                "{inscrito.nombre_alias}"
                                            </h4>
                                        )}
                                        {inscrito.club && <p className="club">🏛️ {inscrito.club}</p>}
                                        {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                    </div>

                                    <div className="banda-info">
                                        <p><strong>Facción:</strong> {inscrito.faccion || "Sin definir"}</p>
                                        <p><strong>Época:</strong> {inscrito.epoca || "Sin definir"}</p>
                                        <p><strong>Puntos:</strong> {totalPuntos.toFixed(1)} pts</p>
                                    </div>

                                    <MostrarComposicion 
                                        composicion={composicion} 
                                        banda={inscrito.faccion}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // VISTA DE EQUIPOS
    // ==========================================
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
                                    👑 Capitán: {equipo.capitan_nombre || 'Sin capitán'} {equipo.capitan_apellidos || ''}
                                </span>
                            </div>

                            <div className="equipo-miembros">
                                <h4>Miembros ({(equipo.miembros || []).length}):</h4>
                                {(equipo.miembros || []).length > 0 ? (
                                    <ul className="lista-miembros">
                                        {equipo.miembros.map((miembro, idx) => {
                                            // Parsear composición si es string
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

                                            const totalPuntos = calcularPuntosTotales(composicion, miembro.faccion);

                                            return (
                                                <li key={idx} className="miembro-item">
                                                    <div className="miembro-header">
                                                        <span className="miembro-nombre">
                                                            {miembro.es_capitan && '👑 '}
                                                            {miembro.nombre || 'Sin nombre'}
                                                            {miembro.nombre_alias && ` "${miembro.nombre_alias}"`}
                                                        </span>
                                                        <span className="miembro-epoca-banda">
                                                            {miembro.epoca || 'Sin época'} - {miembro.faccion || 'Sin banda'}
                                                        </span>
                                                    </div>
                                                    
                                                    {Object.keys(composicion).length > 0 && (
                                                        <div className="miembro-composicion">
                                                            <div className="puntos-total">
                                                                <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                                                            </div>
                                                            
                                                            {/* ✅ EDAD DE LA MAGIA */}
                                                            {composicion.tiposTropaPersonalizados ? (
                                                                <div className="puntos-detalle">
                                                                    {(() => {
                                                                        const config = miembro.faccion ? obtenerConfiguracionBanda(miembro.faccion) : null;
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
                                                                /* ✅ BANDAS NORMALES */
                                                                <div className="puntos-detalle">
                                                                    {composicion.guardias > 0 && (
                                                                        <span>Guardias: {parseFloat(composicion.guardias)}</span>
                                                                    )}
                                                                    {composicion.berserkers > 0 && (
                                                                        <span>Berserkers: {parseFloat(composicion.berserkers)}</span>
                                                                    )}
                                                                    {composicion.elefantes > 0 && (
                                                                        <span>Elefantes : {parseFloat(composicion.elefantes)}</span>
                                                                    )}
                                                                    {composicion.carros > 0 && (
                                                                        <span>Carros : {parseFloat(composicion.carros)}</span>
                                                                    )}
                                                                    {composicion.tambor > 0 && (
                                                                        <span>Tambor : {parseFloat(composicion.tambor)}</span>
                                                                    )}
                                                                    {composicion.curaids > 0 && (
                                                                        <span>Curaids : {parseFloat(composicion.curaids)}</span>
                                                                    )}
                                                                    {composicion.perros > 0 && (
                                                                        <span>Perros de Guerra: {parseFloat(composicion.perros)}</span>
                                                                    )}
                                                                    
                                                                    {/* Unidades especiales */}
                                                                    {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                                                                        if (value > 0) {
                                                                            const config = miembro.faccion ? obtenerConfiguracionBanda(miembro.faccion) : null;
                                                                            const unidad = config?.unidadesEspeciales?.find(u => u.nombre === key);
                                                                            const label = unidad?.label || key;
                                                                            return (
                                                                                <span key={key}>
                                                                                    {label}: {parseFloat(value)}
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })}
                                                                    
                                                                    {composicion.guerreros > 0 && (
                                                                        <span>Guerreros: {parseFloat(composicion.guerreros)}</span>
                                                                    )}
                                                                    {composicion.levas > 0 && (
                                                                        <span>Levas: {parseFloat(composicion.levas)}</span>
                                                                    )}
                                                                    {composicion.mercenarios > 0 && (
                                                                        <span>Mercenarios: {parseFloat(composicion.mercenarios)}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Opciones de banda */}
                                                            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                                                                <div className="opciones-banda-mini">
                                                                    {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                                                                        const config = miembro.faccion ? obtenerConfiguracionBanda(miembro.faccion) : null;
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
                                                            
                                                            {/* Detalle mercenarios */}
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