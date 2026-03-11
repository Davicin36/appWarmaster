import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';
import AnadirParticipantesTorneos from '@/componente/vistasAdministrarTorneos/AnadirParticipantesTorneos';
import { 
    obtenerConfiguracionBanda,
    obtenerOpcionesWarlordLegendario
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import '@/estilos/vistasTorneos/vistaJugadores.css';

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
    total += parseFloat(composicion.cerdos || 0);
    
    // Unidades especiales
    if (composicion.unidadesEspeciales) {
        Object.values(composicion.unidadesEspeciales).forEach(valor => {
            total += parseFloat(valor || 0);
        });
    }
    
    return total;
};

// ==========================================
// ✅ OBTENER UNIDADES ESPECIALES DESBLOQUEADAS POR WARLORD
// ==========================================
const obtenerUnidadesWarlord = (bandaBase, warlordValor) => {
    if (!warlordValor || !bandaBase) return [];
    
    try {
        // ✅ Obtener la época correcta de la banda
        const configuracionBanda = obtenerConfiguracionBanda(bandaBase);
        const epocaBanda = configuracionBanda.epoca;
        
        if (!epocaBanda) {
            console.warn('⚠️ No se pudo determinar la época de la banda:', bandaBase);
            return [];
        }
        
        const opciones = obtenerOpcionesWarlordLegendario(epocaBanda, bandaBase);
        if (!opciones) return [];
        
        const opcionWarlord = opciones.opciones.find(o => o.valor === warlordValor);
        if (opcionWarlord && opcionWarlord.unidadesEspecialesDesbloqueadas) {
            return opcionWarlord.unidadesEspecialesDesbloqueadas;
        }
    } catch (error) {
        console.error('Error al obtener unidades del warlord:', error);
    }
    
    return [];
};

// ==========================================
// ✅ COMPONENTE: MOSTRAR COMPOSICIÓN (MEJORADO)
// ==========================================
const MostrarComposicion = ({ composicion, banda, mostrarWarlord = true }) => {
    if (!composicion || Object.keys(composicion).length === 0) {
        return <span className="sin-composicion">Sin composición</span>;
    }

    // ✅ Extraer información del warlord
    const warlord = composicion.warlordLegendario || null;
    const bandaFinal = warlord?.bandaDesbloqueada || banda;

    // ✅ Usar bandaFinal para obtener la configuración correcta
    const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
    const totalPuntos = calcularPuntosTotales(composicion, bandaFinal);

    // ✅ Obtener unidades especiales desbloqueadas por warlord
    const unidadesWarlord = warlord && banda 
        ? obtenerUnidadesWarlord(banda, warlord.valor)  // ✅ Solo banda y warlord, la época se obtiene internamente
        : [];

    // ✅ EDAD DE LA MAGIA - Tipos personalizados
    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        return (
            <div className="miembro-composicion-admin">
                {/* ✅ WARLORD LEGENDARIO */}
                {mostrarWarlord && warlord && (
                    <div className="warlord-info-admin">
                        <span className="badge-warlord">
                            ⚔️ {warlord.nombre}
                            {warlord.costePuntos > 0 && ` (${warlord.costePuntos} pts)`}
                        </span>
                        {warlord.bandaDesbloqueada && (
                            <span className="badge-banda-desbloqueada">
                                {warlord.bandaDesbloqueada}
                            </span>
                        )}
                    </div>
                )}

                <div className="puntos-total-admin">
                    <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                    {warlord?.costePuntos > 0 && (
                        <small className="coste-warlord-info">
                            (+{warlord.costePuntos} warlord)
                        </small>
                    )}
                </div>
                <div className="puntos-detalle-admin">
                    {config.tiposTropaPersonalizados.map(tipo => {
                        const cantidad = composicion.tiposTropaPersonalizados[tipo.id] || 0;
                        if (cantidad > 0) {
                            return (
                                <span key={tipo.id}>
                                    {tipo.label}: {cantidad} ({(cantidad * tipo.puntos).toFixed(1)} pts)
                                </span>
                            );
                        }
                        return null;
                    })}
                </div>
                {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                    <div className="opciones-banda-mini-admin">
                        {Object.entries(composicion.opcionesBanda).map(([key, value]) => (
                            <span key={key} className="badge-opcion">
                                {key}: {value}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ✅ BANDAS NORMALES
    return (
        <div className="miembro-composicion-admin">
            {/* ✅ WARLORD LEGENDARIO */}
            {mostrarWarlord && warlord && (
                <div className="warlord-info-admin">
                    <span className="badge-warlord">
                        ⚔️ {warlord.nombre}
                        {warlord.costePuntos > 0 && ` (${warlord.costePuntos} pts)`}
                    </span>
                    {warlord.bandaDesbloqueada && (
                        <span className="badge-banda-desbloqueada">
                            ✨ {warlord.bandaDesbloqueada}
                        </span>
                    )}
                </div>
            )}

            <div className="puntos-total-admin">
                <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                {warlord?.costePuntos > 0 && (
                    <small className="coste-warlord-info">
                        (+{warlord.costePuntos} warlord)
                    </small>
                )}
            </div>
            <div className="puntos-detalle-admin">
                {/* Tipos estándar */}
                {composicion.guardias > 0 && <span>Guardias: {parseFloat(composicion.guardias)}</span>}
                {composicion.berserkers > 0 && (
                    <span className="unidad-especial"> Berserkers: {parseFloat(composicion.berserkers)}</span>
                )}
                
                {/* Características especiales */}
                {composicion.elefantes > 0 && <span> Elefantes: {parseFloat(composicion.elefantes)}</span>}
                {composicion.carros > 0 && <span> Carros: {parseFloat(composicion.carros)}</span>}
                {composicion.tambor > 0 && <span>Tambor: {parseFloat(composicion.tambor)}</span>}
                {composicion.curaids > 0 && <span>Curaids: {parseFloat(composicion.curaids)}</span>}
                {composicion.perros > 0 && <span> Perros de Guerra: {parseFloat(composicion.perros)}</span>}
                
                {/* CERDOS INCENDIARIOS - UNIDAD LEGENDARIA */}
                {composicion.cerdos > 0 && (
                    <span className="unidad-legendaria-especial">
                        Cerdos Incendiarios: {parseFloat(composicion.cerdos)} 
                    </span>
                )}
                
                {/* Unidades especiales */}
                {composicion.unidadesEspeciales && Object.entries(composicion.unidadesEspeciales).map(([key, value]) => {
                    if (value > 0) {
                        const unidad = config?.unidadesEspeciales?.find(u => u.nombre === key);
                        const unidadWarlord = unidadesWarlord.find(u => u.nombre === key);
                        const label = unidad?.label || unidadWarlord?.label || key;
                        
                        // ✅ Si es unidad desbloqueada por warlord, destacarla
                        const esUnidadWarlord = !!unidadWarlord;
                        
                        return (
                            <span 
                                key={key}
                                className={esUnidadWarlord ? 'unidad-warlord-desbloqueada' : ''}
                            >
                                {label}: {parseFloat(value)}
                                {unidadWarlord && ` (${unidadWarlord.puntos} pts)`}
                            </span>
                        );
                    }
                    return null;
                })}
                
                {composicion.guerreros > 0 && <span>Guerreros: {parseFloat(composicion.guerreros)}</span>}
                {composicion.levas > 0 && <span>Levas: {parseFloat(composicion.levas)}</span>}
                {composicion.mercenarios > 0 && <span>Mercenarios: {parseFloat(composicion.mercenarios)}</span>}
            </div>
            
            {/* Opciones de banda */}
            {composicion.opcionesBanda && Object.keys(composicion.opcionesBanda).length > 0 && (
                <div className="opciones-banda-mini-admin">
                    {Object.entries(composicion.opcionesBanda).map(([key, value]) => {
                        const opcion = config?.opcionesBanda?.find(o => o.id === key);
                        const label = opcion?.label || key;
                        return (
                            <span key={key} className="badge-opcion">
                                {label}: {value}
                            </span>
                        );
                    })}
                </div>
            )}
            
            {/* Detalle mercenarios */}
            {composicion.detalleMercenarios && (
                <div className="detalle-mercenarios-mini-admin">
                    🧾 {composicion.detalleMercenarios}
                </div>
            )}
        </div>
    );
};

function VistaJugadoresSaga({ torneoId: propTorneoId, torneo, tipoTorneo, jugadores: propJugadores, equipos: propEquipos, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    
    const [jugadores, setJugadores] = useState(propJugadores || []);
    const [equipos, setEquipos] = useState(propEquipos || []);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState({});
    const [loadingReenvio, setLoadingReenvio] = useState(false);
    const [mostrarModalAnadir, setMostrarModalAnadir] = useState(false);

    useEffect(() => {
        if (!propJugadores && !propEquipos) {
            cargarDatos();
        }
    }, [torneoId, tipoTorneo]);

    useEffect(() => {
        if (propJugadores) {
            const jugadoresNormalizados = propJugadores.map(j => ({
                ...j,
                pagado: j.pagado === 1 || j.pagado === '1' ? 'pagado' : 'pendiente'
            }));
            setJugadores(jugadoresNormalizados);
        }
        if (propEquipos) setEquipos(propEquipos);
    }, [propJugadores, propEquipos]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            if (tipoTorneo === 'Individual') {
                const data = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                const jugadoresArray = Array.isArray(data) ? data : data.data || [];

                const jugadoresNormalizados = jugadoresArray.map(jugador => ({
                    ...jugador,
                    pagado: jugador.pagado === 1 || jugador.pagado === '1' ? 'pagado' : 'pendiente'
                }));
                
                setJugadores(jugadoresNormalizados);
            } else if (tipoTorneo === 'Por equipos') {
                const response = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                const equiposData = response.data || response || [];
                setEquipos(Array.isArray(equiposData) ? equiposData : []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstadoPagoJugador = async (jugadorId, estadoActual) => {
        const nuevoEstado = estadoActual === 'pagado' ? 'pendiente' : 'pagado';

        const confirmar = window.confirm(
            `¿Cambiar estado de pago a "${nuevoEstado.toUpperCase()}"?`
        );
        
        if (!confirmar) return;
            
        try {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: true }));
            
            await torneosSagaApi.actualizarPagoJugador(torneoId, jugadorId, nuevoEstado);
            
            setJugadores(prev => prev.map(j => 
                j.id === jugadorId 
                    ? { ...j, pagado: nuevoEstado }
                    : j
            ));

            alert(`✅ Estado actualizado a: ${nuevoEstado.toUpperCase()}`);
            
            if (onUpdate) onUpdate();
            
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: false }));
        }
    };

    const cambiarEstadoPagoEquipo = async (equipoId, estadoActual) => {
        const nuevoEstado = estadoActual === 'pagado' ? 'pendiente' : 'pagado';
        
        const confirmar = window.confirm(
            `¿Cambiar estado de pago del equipo a "${nuevoEstado.toUpperCase()}"?`
        );
        
        if (!confirmar) return;
        
        try {
            setLoadingPago(prev => ({ ...prev, [`equipo-${equipoId}`]: true }));
        
            await torneosSagaApi.actualizarPagoEquipo(torneoId, equipoId, nuevoEstado);
            
            setEquipos(prev => prev.map(e => 
                String(e.id) === String(equipoId) 
                    ? { ...e, pagado: nuevoEstado }
                    : e
            ));
            
            alert(`✅ Estado de pago actualizado a: ${nuevoEstado.toUpperCase()}`);
            
            if (onUpdate) onUpdate();
            
        } catch (error) {
            console.error('❌ Error completo:', error);
            alert(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoadingPago(prev => ({ ...prev, [`equipo-${equipoId}`]: false }));
        }
    };

    const eliminarJugador = async (jugadorId) => {
        if (!window.confirm('¿Eliminar este jugador del torneo?')) return;
        
        try {
            await torneosSagaApi.eliminarJugadorTorneo(torneoId, jugadorId);
            alert('✅ Jugador eliminado');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const eliminarEquipo = async (equipoId) => {
        if (!window.confirm('¿Eliminar este equipo del torneo?')) return;
        
        try {
            await torneosSagaApi.eliminarEquipoTorneo(torneoId, equipoId);
            alert('✅ Equipo eliminado');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const reenviarTodasLasInvitaciones = async () => {
        const totalEquipos = equipos.length;
        
        const confirmar = window.confirm(
            `⚠️ REENVÍO MASIVO DE INVITACIONES ⚠️\n\n` +
            `Se reenviarán las invitaciones a TODOS los equipos del torneo (${totalEquipos} equipos).\n\n` +
            `¿Estás seguro de continuar?`
        );
        
        if (!confirmar) return;

        try {
            setLoadingReenvio(true);
            
            const response = await torneosSagaApi.reenviarInscripcionTodosEquipos(torneoId);
            
            if (response.success) {
                const { totales } = response.data;
                
                let mensaje = `✅ ${response.message}\n\n`;
                mensaje += `📊 RESUMEN GENERAL\n`;
                mensaje += `🏆 Equipos: ${totalEquipos}\n`;
                mensaje += `📧 Emails enviados: ${totales.emailsEnviados}\n`;
                mensaje += `❌ Emails fallidos: ${totales.emailsFallidos}\n`;
                
                alert(mensaje);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionEquipo = async (equipo) => {
        if (!equipo || !equipo.id) {
            alert('❌ Error: datos del equipo no disponibles');
            return;
        }
        
        const confirmar = window.confirm(
            `¿Reenviar invitaciones al equipo "${equipo.nombre_equipo}"?`
        );
        
        if (!confirmar) return;

        try {
            setLoadingReenvio(true);
            
            const response = await torneosSagaApi.reenviarInscripcionEquipo(torneoId, equipo.id);
            
            if (response.success) {
                alert(`✅ ${response.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionTodosJugadores = async () => {
        if (jugadores.length === 0) {
            alert('❌ No hay jugadores');
            return;
        }

        const confirmar = window.confirm(
            `¿Reenviar invitaciones a todos los jugadores (${jugadores.length})?`
        );

        if (!confirmar) return;

        try {
            setLoadingReenvio(true);
            const response = await torneosSagaApi.reenviarInscripcionTodosJugadores(torneoId);

            if (response.success) {
                alert(`✅ ${response.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionIndividual = async (jugador) => {
        if (!jugador || !jugador.id) {
            alert('❌ Error: datos no disponibles');
            return;
        }

        const confirmar = window.confirm(
            `¿Reenviar invitación a "${jugador.jugador_nombre} ${jugador.jugador_apellidos}"?`
        );

        if (!confirmar) return;

        try {
            setLoadingReenvio(true);
            const response = await torneosSagaApi.reenviarInscripcionJugador(torneoId, jugador.id);

            if (response.success) {
                alert(`✅ ${response.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const confirmarTodosLosPagos = async () => {
        if (tipoTorneo === 'Individual') {
            const pendientes = jugadores.filter(j => j.pagado !== 'pagado');
            if (pendientes.length === 0) {
                alert('✅ Todos los jugadores ya tienen el pago confirmado');
                return;
            }
            if (!window.confirm(`¿Marcar como PAGADO a los ${pendientes.length} jugadores pendientes?`)) return;
            try {
                setLoading(true);
                await Promise.all(
                    pendientes.map(j => torneosSagaApi.actualizarPagoJugador(torneoId, j.id, 'pagado'))
                );
                setJugadores(prev => prev.map(j => ({ ...j, pagado: 'pagado' })));
                if (onUpdate) onUpdate();
                alert(`✅ ${pendientes.length} pagos confirmados`);
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            } finally {
                setLoading(false);
            }
        } else {
            const pendientes = equipos.filter(e => e.pagado !== 'pagado');
            if (pendientes.length === 0) {
                alert('✅ Todos los equipos ya tienen el pago confirmado');
                return;
            }
            if (!window.confirm(`¿Marcar como PAGADO a los ${pendientes.length} equipos pendientes?`)) return;
            try {
                setLoading(true);
                await Promise.all(
                    pendientes.map(e => torneosSagaApi.actualizarPagoEquipo(torneoId, e.id, 'pagado'))
                );
                setEquipos(prev => prev.map(e => ({ ...e, pagado: 'pagado' })));
                if (onUpdate) onUpdate();
                alert(`✅ ${pendientes.length} pagos confirmados`);
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="vista-jugadores">
                <div className="empty-message">⏳ Cargando...</div>
            </div>
        );
    }

    // ==========================================
    // VISTA INDIVIDUAL
    // ==========================================
    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-jugadores">
                <div className="header-jugadores-con-boton">
                    <h2>👥 Jugadores Inscritos ({jugadores.length})</h2>
                    {torneo?.estado === 'pendiente' && (
                        <>
                            <button 
                                className="btn-primary"
                                onClick={() => setMostrarModalAnadir(true)}
                            >
                                Invitar Jugador
                            </button>
                            <button 
                                className="btn-secondary-small"
                                onClick={reenviarInvitacionTodosJugadores}
                                disabled={loadingReenvio}
                            >
                                {loadingReenvio ? '⏳ Enviando...' : '📧 Reenviar Invitaciones'}
                            </button>
                            <button
                                className="btn-secondary-small"
                                onClick={confirmarTodosLosPagos}
                                disabled={loading}
                            >
                                {loading ? '⏳ Procesando...' : '💰 Confirmar Todos los Pagos'}
                            </button>
                        </>
                    )}
                </div>
               
                {jugadores.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 No hay jugadores inscritos</p>
                        <button 
                            className="btn-primary"
                            onClick={() => setMostrarModalAnadir(true)}
                        >
                            ➕ Invitar Primer Jugador
                        </button>
                    </div>
                ) : (
                    <div className="tabla-jugadores-container">
                        <table className="tabla-jugadores-detalle">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Jugador</th>
                                    <th>Alias</th>
                                    <th>Club</th>
                                    <th>Época</th>
                                    <th>Facción</th>
                                    <th>Composición</th>
                                    <th>Pago</th>
                                    {torneo?.estado === 'pendiente' && <th>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {jugadores.map((jugador, index) => {
                                    let composicion = {};
                                    if (jugador.composicion_ejercito) {
                                        try {
                                            composicion = typeof jugador.composicion_ejercito === 'string'
                                                ? JSON.parse(jugador.composicion_ejercito)
                                                : jugador.composicion_ejercito;
                                        } catch (e) {
                                            console.error('Error al parsear composición:', e);
                                        }
                                    }
                                    
                                    // ✅ Obtener banda final (desbloqueada si hay warlord)
                                    const warlord = composicion.warlordLegendario;
                                    const bandaFinal = warlord?.bandaDesbloqueada || jugador.faccion;
                                    
                                    const isPagado = jugador.pagado === 'pagado';
                                    const isLoadingPago = loadingPago[`jugador-${jugador.id}`];

                                    return (
                                        <tr key={jugador.id}>
                                            <td>{index + 1}</td>
                                            <td className="nombre-jugador-completo">
                                                {jugador.jugador_nombre} {jugador.jugador_apellidos}
                                            </td>
                                            <td>{jugador.nombre_alias || '-'}</td>
                                            <td>{jugador.club || '-'}</td>
                                            <td>{torneo?.epocas_disponibles || jugador.epoca || '-'}</td>
                                            <td>
                                                {/* ✅ Mostrar banda base y desbloqueada */}
                                                <div>{jugador.faccion || '-'}</div>
                                                {warlord?.bandaDesbloqueada && (
                                                    <div className="banda-desbloqueada-celda">
                                                        ✨ {warlord.bandaDesbloqueada}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <MostrarComposicion 
                                                    composicion={composicion} 
                                                    banda={bandaFinal}
                                                    mostrarWarlord={torneo?.unidades_legendarias === 1}
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => cambiarEstadoPagoJugador(jugador.id, jugador.pagado)}
                                                    className={`btn-pago ${isPagado ? 'pagado' : 'pendiente'}`}
                                                    disabled={isLoadingPago}
                                                >
                                                    {isLoadingPago ? '⏳' : (isPagado ? '✅ Pagado' : '⏰ Pendiente')}
                                                </button>
                                            </td>
                                            {torneo?.estado === 'pendiente' && (
                                                <td>
                                                    <button 
                                                        className="btn-secondary-small"
                                                        onClick={() => reenviarInvitacionIndividual(jugador)}
                                                        disabled={loadingReenvio}
                                                        style={{ marginRight: '5px' }}
                                                    >
                                                        {loadingReenvio ? '⏳' : '📧'}
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarJugador(jugador.jugador_id)}
                                                        className="btn-danger-small"
                                                    >
                                                        🗑️ Eliminar
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {mostrarModalAnadir && (
                    <div className="modal-overlay" onClick={() => setMostrarModalAnadir(false)}>
                        <div className="modal-content-anadir" onClick={(e) => e.stopPropagation()}>
                            <AnadirParticipantesTorneos
                                torneoId={torneoId}
                                onClose={() => setMostrarModalAnadir(false)}
                                onSuccess={async () => {
                                    setMostrarModalAnadir(false);
                                    await cargarDatos();
                                    if (onUpdate) onUpdate();
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // VISTA DE EQUIPOS
    // ==========================================
    return (
        <div className="vista-jugadores">
            <div className="header-jugadores-con-boton">
                <h2>👥 Equipos Inscritos ({equipos.length})</h2>
                {torneo?.estado === 'pendiente' && (
                    <>
                        <button 
                            className="btn-primary"
                            onClick={() => setMostrarModalAnadir(true)}
                            disabled={loadingReenvio}
                        >
                            Invitar Equipo
                        </button>
                        <button 
                            className="btn-secondary-small"
                            onClick={reenviarTodasLasInvitaciones}
                            disabled={loadingReenvio}
                        >
                            {loadingReenvio ? '⏳ Enviando...' : '📧 Reenviar Invitaciones'}
                        </button>
                        <button
                            className="btn-secondary-small"
                            onClick={confirmarTodosLosPagos}
                            disabled={loading}
                        >
                            {loading ? '⏳ Procesando...' : '💰 Confirmar Todos los Pagos'}
                        </button>
                    </>
                )}
            </div>
            
            {equipos.length === 0 ? (
                <div className="empty-message">
                    <p>📭 No hay equipos inscritos</p>
                    <button 
                        className="btn-primary"
                        onClick={() => setMostrarModalAnadir(true)}
                    >
                        ➕ Invitar Primer Equipo
                    </button>
                </div>
            ) : (
                <div className="grid-equipos-admin">
                    {equipos.map((equipo) => {
                        const isPagado = equipo.pagado === 'pagado';
                        const isLoadingPago = loadingPago[`equipo-${equipo.id}`];

                        return (
                            <div key={equipo.id} className="card-equipo-admin">
                                <div className="equipo-header-admin">
                                    <h3>🏆 {equipo.nombre_equipo}</h3>
                                    <span className="badge-capitan-admin">
                                        👑 {equipo.capitan_nombre} {equipo.capitan_apellidos} {equipo.capitan_alias && `(${equipo.capitan_alias})`}
                                    </span>
                                </div>

                                <div className="equipo-miembros-admin">
                                    <h4>Miembros ({(equipo.miembros || []).length}):</h4>
                                    {(equipo.miembros || []).length > 0 ? (
                                        <ul className="lista-miembros-admin">
                                            {equipo.miembros.map((miembro, idx) => {
                                                // ✅ Obtener banda final del miembro
                                                const warlord = miembro.composicion?.warlordLegendario;
                                                const bandaFinal = warlord?.bandaDesbloqueada || miembro.faccion;

                                                return (
                                                    <li key={idx} className="miembro-item-admin">
                                                        <div className="miembro-header-admin">
                                                            <span className="miembro-nombre-admin">
                                                                {miembro.es_capitan && '👑 '}
                                                                {miembro.nombre} {miembro.alias && `(${miembro.alias})`}
                                                            </span>
                                                            <span className="miembro-epoca-banda-admin">
                                                                {miembro.epoca} - {miembro.faccion}
                                                                {warlord?.bandaDesbloqueada && (
                                                                    <span className="banda-desbloqueada-inline">
                                                                        ✨ {warlord.bandaDesbloqueada}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        
                                                        <MostrarComposicion 
                                                            composicion={miembro.composicion} 
                                                            banda={bandaFinal}
                                                            epoca={miembro.epoca}
                                                            mostrarWarlord={torneo?.unidades_legendarias === 1}
                                                        />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="sin-miembros-admin">Sin miembros</p>
                                    )}
                                </div>

                                <div className="equipo-acciones-admin">
                                    <button
                                        onClick={() => cambiarEstadoPagoEquipo(equipo.id, equipo.pagado)}
                                        className={`btn-pago ${isPagado ? 'pagado' : 'pendiente'}`}
                                        disabled={isLoadingPago}
                                    >
                                        {isLoadingPago ? '⏳' : (isPagado ? '✅ Pagado' : '⏰ Pendiente')}
                                    </button>
                                    {torneo?.estado === 'pendiente' && (
                                        <>
                                            <button 
                                                className="btn-primary"
                                                onClick={() => reenviarInvitacionEquipo(equipo)}
                                                disabled={loadingReenvio}
                                            >
                                                {loadingReenvio ? '⏳' : '📧 Reenviar'}
                                            </button>
                                            <button
                                                onClick={() => eliminarEquipo(equipo.id)}
                                                className="btn-danger-small"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {mostrarModalAnadir && (
                <div className="modal-overlay" onClick={() => setMostrarModalAnadir(false)}>
                    <div className="modal-content-anadir" onClick={(e) => e.stopPropagation()}>
                        <AnadirParticipantesTorneos
                            torneoId={torneoId}
                            onClose={() => setMostrarModalAnadir(false)}
                            onSuccess={async () => {
                                setMostrarModalAnadir(false);
                                await cargarDatos();
                                if (onUpdate) onUpdate();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VistaJugadoresSaga;