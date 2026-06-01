import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import  {useTranslation} from 'react-i18next';

import torneosSagaApi from '@/servicios/apiSaga';
import AnadirParticipantesTorneos from '@/componente/vistasAdministrarTorneos/AnadirParticipantesTorneos';
import { 
    obtenerConfiguracionBanda,
    obtenerOpcionesWarlordLegendario,
    useSagaI18n
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import '@/estilos/vistasTorneos/vistaJugadores.css';

const calcularPuntosTotales = (composicion, banda) => {
    if (!composicion || Object.keys(composicion).length === 0) return 0;
    const config = banda ? obtenerConfiguracionBanda(banda) : null;
    if (composicion.tiposTropaPersonalizados && config?.tiposTropaPersonalizados) {
        let total = 0;
        Object.keys(composicion.tiposTropaPersonalizados).forEach(idTropa => {
            const cantidad = composicion.tiposTropaPersonalizados[idTropa];
            const tipoConfig = config.tiposTropaPersonalizados.find(t => t.id === idTropa);
            if (tipoConfig) { total += cantidad * tipoConfig.puntos; }
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
        Object.values(composicion.unidadesEspeciales).forEach(valor => { total += parseFloat(valor || 0); });
    }
    return total;
};

const calcularPuntosTotalesConWarlord = (composicion, banda) =>
    calcularPuntosTotales(composicion, banda) + (composicion.warlordLegendario?.costePuntos || 0);

const MostrarComposicion = ({ composicion, torneo, inscrito, banda, mostrarWarlord = false }) => {
    const { t } = useTranslation();
    const { getTropa, getWarlordType } = useSagaI18n();

    if (!composicion || Object.keys(composicion).length === 0)
        return <p className="sin-composicion">{t('vista_info_saga.sin_composicion')}</p>;

    const warlord = composicion.warlordLegendario || null;
    const bandaFinal = warlord?.bandaDesbloqueada || banda;
    const config = bandaFinal ? obtenerConfiguracionBanda(bandaFinal) : null;
    const puntosEjercito = calcularPuntosTotales(composicion, bandaFinal);
    const totalPuntosConWarlord = calcularPuntosTotalesConWarlord(composicion, bandaFinal);

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
                        return <li key={tipo.id}>{getTropa(tipo.id)}: {cantidad} ({(cantidad * tipo.puntos).toFixed(1)} pts)</li>;
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
                {composicion.guardias    > 0 && <li>{getTropa('guardias')}: {parseFloat(composicion.guardias)}</li>}
                {composicion.berserkers  > 0 && <li className="unidad-berserkers">{getTropa('berserkers')}: {parseFloat(composicion.berserkers)}</li>}
                {composicion.elefantes   > 0 && <li>{getTropa('elefantes')}: {parseFloat(composicion.elefantes)}</li>}
                {composicion.carros      > 0 && <li>{getTropa('carros')}: {parseFloat(composicion.carros)}</li>}
                {composicion.tambor      > 0 && <li>{getTropa('tambor')}: {parseFloat(composicion.tambor)}</li>}
                {composicion.curaids     > 0 && <li>{getTropa('curaids')}: {parseFloat(composicion.curaids)}</li>}
                {composicion.perros      > 0 && <li>{getTropa('perros')}: {parseFloat(composicion.perros)}</li>}
                {composicion.cerdos      > 0 && <li className="unidad-cerdos">{t('insc_equipo.cerdos_incendiarios')}: {parseFloat(composicion.cerdos)}</li>}
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
                    const nombre      = unidad?.nombre || key;
                    const esLegendaria= (unidad?.puntos || 0) >= 2;
                    return (
                        <li key={key} className={esLegendaria ? 'unidad-legendaria' : ''}>
                            {esLegendaria && '⭐ '}{nombre}: {parseFloat(value)}
                        </li>
                    );
                })}
                {composicion.guerreros   > 0 && <li>{getTropa('guerreros')}: {parseFloat(composicion.guerreros)}</li>}
                {composicion.levas       > 0 && <li>{getTropa('levas')}: {parseFloat(composicion.levas)}</li>}
                {composicion.mercenarios > 0 && <li>{getTropa('mercenarios')}: {parseFloat(composicion.mercenarios)}</li>}
                {composicion.detalleMercenarios && <li className="detalle-mercenarios">🧾 {composicion.detalleMercenarios}</li>}
            </ul>
        </div>
    );
};

function VistaJugadoresSaga({ torneoId: propTorneoId, torneo, tipoTorneo, jugadores: propJugadores, equipos: propEquipos, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    const { t } = useTranslation();
    const { getBanda, getEpoca } = useSagaI18n();
    
    const [jugadores, setJugadores] = useState(propJugadores || []);
    const [equipos, setEquipos] = useState(propEquipos || []);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState({});
    const [loadingReenvio, setLoadingReenvio] = useState(false);
    const [mostrarModalAnadir, setMostrarModalAnadir] = useState(false);

    useEffect(() => {
        if (!propJugadores && !propEquipos) { cargarDatos(); }
    }, [torneoId, tipoTorneo]);

    useEffect(() => {
        if (propJugadores) {
            setJugadores(propJugadores.map(j => ({
                ...j,
                pagado: j.pagado === 1 || j.pagado === '1' ? 'pagado' : 'pendiente'
            })));
        }
        if (propEquipos) setEquipos(propEquipos);
    }, [propJugadores, propEquipos]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            if (tipoTorneo === 'Individual') {
                const data = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                const jugadoresArray = Array.isArray(data) ? data : data.data || [];
                setJugadores(jugadoresArray.map(jugador => ({
                    ...jugador,
                    pagado: jugador.pagado === 1 || jugador.pagado === '1' ? 'pagado' : 'pendiente'
                })));
            } else if (tipoTorneo === 'Por equipos') {
                const response = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                const equiposData = response.data || response || [];
                setEquipos(Array.isArray(equiposData) ? equiposData : []);
            }
        } catch (error) {
            console.error(`${t('comun.error_datos')}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstadoPagoJugador = async (jugadorId, estadoActual) => {
        const nuevoEstado = estadoActual === 'pagado' ? 'pendiente' : 'pagado';
        const label = nuevoEstado === 'pagado' ? t('comun.pagados') : t('comun.pendiente');
        
        if (!window.confirm(`${t('vista_jugadores.cambio_pago_jugador')} "${label.toUpperCase()}"?`)) return;
        try {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: true }));
            await torneosSagaApi.actualizarPagoJugador(torneoId, jugadorId, nuevoEstado);
            setJugadores(prev => prev.map(j => j.id === jugadorId ? { ...j, pagado: nuevoEstado } : j));
            alert(`✅ ${t('vista_jugadores.estado_actualizado')} ${label.toUpperCase()}`);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        } finally {
            setLoadingPago(prev => ({ ...prev, [`jugador-${jugadorId}`]: false }));
        }
    };

    const cambiarEstadoPagoEquipo = async (equipoId, estadoActual) => {
        // Valores de BD: siempre literales, NUNCA traducidos
        const nuevoEstado = estadoActual === 'pagado' ? 'pendiente' : 'pagado';
        // Label solo para mostrar al usuario
        const label = nuevoEstado === 'pagado' ? t('comun.pagados') : t('comun.pendiente');

        if (!window.confirm(`${t('vista_jugadores.cambio_pago_equipo')} "${label.toUpperCase()}"?`)) return;
        try {
            setLoadingPago(prev => ({ ...prev, [`equipo-${equipoId}`]: true }));
            await torneosSagaApi.actualizarPagoEquipo(torneoId, equipoId, nuevoEstado);
            setEquipos(prev => prev.map(e =>
                String(e.id) === String(equipoId) ? { ...e, pagado: nuevoEstado } : e
            ));
            alert(`✅ ${t('vista_jugadores.estado_actualizado')} ${label.toUpperCase()}`);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('vista_jugadores.error_actualizar')} ${error.response?.data?.error || error.message}`);
        } finally {
            setLoadingPago(prev => ({ ...prev, [`equipo-${equipoId}`]: false }));  // ← template literal fuera de t()
        }
    };

    const eliminarJugador = async (jugadorId) => {
        if (!window.confirm(t('vista_jugadores.eliminar_jugador'))) return;
        try {
            await torneosSagaApi.eliminarJugadorTorneo(torneoId, jugadorId);
            alert(`✅ ${t('vista_jugadores.jugador_eliminado')}`);
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        }
    };

    const eliminarEquipo = async (equipoId) => {
        if (!window.confirm(t('vista_jugadores.eliminar_equipo'))) return;
        try {
            await torneosSagaApi.eliminarEquipoTorneo(torneoId, equipoId);
            alert(`✅ ${t('vista_jugadores.equipo_eliminado')}`);
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        }
    };

    const reenviarTodasLasInvitaciones = async () => {
        const totalEquipos = equipos.length;
        if (!window.confirm(
            `⚠️ ${t('vista_jugadores.reenvio_todos_equipos')} ⚠️\n\n` +
            `${t('vista_jugadores.reenvio_descripcion')} (${totalEquipos} ${t('vista_jugadores.equipos')}).\n\n` +
            t('vista_jugadores.confirmar_reenvio')
        )) return;
        try {
            setLoadingReenvio(true);
            const response = await torneosSagaApi.reenviarInscripcionTodosEquipos(torneoId);
            if (response.success) {
                const { totales } = response.data;
                alert(
                    `✅ ${response.message}\n\n` +
                    `📊 ${t('vista_jugadores.resumen_general')}\n` +
                    `🏆 ${t('vista_jugadores.equipos')}: ${totalEquipos}\n` +
                    `📧 ${t('vista_jugadores.email_enviado')}: ${totales.emailsEnviados}\n` +
                    `❌ ${t('vista_jugadores.email_fallo')}: ${totales.emailsFallidos}`
                );
            }
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionEquipo = async (equipo) => {
        if (!equipo || !equipo.id) { alert(`❌ ${t('comun.no_datos_participantes')}`); return; }
        if (!window.confirm(`${t('vista_jugadores.reenvio_un_equipo')} "${equipo.nombre_equipo}"?`)) return;
        try {
            setLoadingReenvio(true);
            const response = await torneosSagaApi.reenviarInscripcionEquipo(torneoId, equipo.id);
            if (response.success) alert(`✅ ${response.message}`);
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionTodosJugadores = async () => {
        if (jugadores.length === 0) { alert(`❌ ${t('comun.no_datos_participantes')}`); return; }
        if (!window.confirm(`${t('vista_jugadores.reenvio_jugadores')} (${jugadores.length})?`)) return;
        try {
            setLoadingReenvio(true);
            const response = await torneosSagaApi.reenviarInscripcionTodosJugadores(torneoId);
            if (response.success) alert(`✅ ${response.message}`);
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const reenviarInvitacionIndividual = async (jugador) => {
        if (!jugador || !jugador.id) { alert(`❌ ${t('comun.no_datos_participantes')}`); return; }
        if (!window.confirm(`${t('vista_jugadores.reenvio_jugador')} "${jugador.jugador_nombre} ${jugador.jugador_apellidos}"?`)) return;
        try {
            setLoadingReenvio(true);
            const response = await torneosSagaApi.reenviarInscripcionJugador(torneoId, jugador.id);
            if (response.success) alert(`✅ ${response.message}`);
        } catch (error) {
            console.error(`${t('comun.error')}:`, error);
            alert(`❌ ${t('comun.error')}: ${error.message}`);
        } finally {
            setLoadingReenvio(false);
        }
    };

    const confirmarTodosLosPagos = async () => {
        if (tipoTorneo === 'Individual') {
            const pendientes = jugadores.filter(j => j.pagado !== 'pagado');
            if (pendientes.length === 0) { alert(`✅ ${t('vista_jugadores.confirmar_todos_pagados_jug')}`); return; }
            if (!window.confirm(`${t('vista_jugadores.marcar_pagados')} ${pendientes.length} ${t('vista_jugadores.jugadores_pendientes')}?`)) return;
            try {
                setLoading(true);
                await Promise.all(pendientes.map(j => torneosSagaApi.actualizarPagoJugador(torneoId, j.id, 'pagado')));
                setJugadores(prev => prev.map(j => ({ ...j, pagado: 'pagado' })));
                if (onUpdate) onUpdate();
                alert(`✅ ${pendientes.length} ${t('comun.pagos_confirmados')}`);
            } catch (error) {
                alert(`❌ ${t('comun.error')}: ${error.message}`);
            } finally {
                setLoading(false);
            }
        } else {
            const pendientes = equipos.filter(e => e.pagado !== 'pagado');
            if (pendientes.length === 0) { alert(`✅ ${t('vista_jugadores.confirmar_todos_pagados_eq')}`); return; }
            if (!window.confirm(`${t('vista_jugadores.marcar_pagados')} ${pendientes.length} ${t('vista_jugadores.equipos_pendientes')}?`)) return;
            try {
                setLoading(true);
                await Promise.all(pendientes.map(e => torneosSagaApi.actualizarPagoEquipo(torneoId, e.id, 'pagado')));
                setEquipos(prev => prev.map(e => ({ ...e, pagado: 'pagado' })));
                if (onUpdate) onUpdate();
                alert(`✅ ${pendientes.length} ${t('comun.pagos_confirmados')}`);
            } catch (error) {
                alert(`❌ ${t('comun.error')}: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="vista-jugadores">
                <div className="empty-message">⏳ {t('vista_jugadores.cargando_jugadores')}</div>
            </div>
        );
    }

    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-jugadores">
                <div className="header-jugadores-con-boton">
                    <h2>👥 {t('vista_jugadores.jugadores_inscritos')} ({jugadores.length})</h2>
                    {torneo?.estado === 'pendiente' && (
                        <>
                            <button className="btn-primary" onClick={() => setMostrarModalAnadir(true)}>
                                {t('vista_jugadores.invitar_jugador')}
                            </button>
                            <button className="btn-secondary-small" onClick={reenviarInvitacionTodosJugadores} disabled={loadingReenvio}>
                                {loadingReenvio ? `⏳ ${t('vista_jugadores.enviando')}` : `📧 ${t('vista_jugadores.reenviar_invitaciones')}`}
                            </button>
                            <button className="btn-secondary-small" onClick={confirmarTodosLosPagos} disabled={loading}>
                                {loading ? `⏳ ${t('vista_jugadores.procesando')}` : `💰 ${t('vista_jugadores.confirmar_pagos')}`}
                            </button>
                        </>
                    )}
                </div>
               
                {jugadores.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 {t('vista_jugadores.sin_jugadores')}</p>
                        <button className="btn-primary" onClick={() => setMostrarModalAnadir(true)}>
                            ➕ {t('vista_jugadores.invitar_primer_jugador')}
                        </button>
                    </div>
                ) : (
                    <div className="tabla-jugadores-container">
                        <table className="tabla-jugadores-detalle">
                            <thead>
                                <tr>
                                    <th>{t('vista_jugadores.almohadilla')}</th>
                                    <th>{t('vista_jugadores.jugador')}</th>
                                    <th>{t('vista_clasificacion.alias')}</th>
                                    <th>{t('vista_clasificacion.club')}</th>
                                    <th>{t('vista_clasificacion.epocas')}</th>
                                    <th>{t('vista_clasificacion.faccion')}</th>
                                    <th>{t('vista_jugadores.composicion')}</th>
                                    <th>{t('vista_jugadores.pago')}</th>
                                    {torneo?.estado === 'pendiente' && <th>{t('vista_jugadores.acciones')}</th>}
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
                                            console.error(`${t('vista_jugadores.error_composicion')}`, e);
                                        }
                                    }
                                    const warlord = composicion.warlordLegendario;
                                    const bandaFinal = warlord?.bandaDesbloqueada || jugador.faccion;
                                    const isPagado = jugador.pagado === 'pagado';
                                    // FIX L579: clave fija
                                    const isLoadingPago = loadingPago[`jugador-${jugador.id}`];
                                    return (
                                        <tr key={jugador.id}>
                                            <td>{index + 1}</td>
                                            <td className="nombre-jugador-completo">{jugador.jugador_nombre} {jugador.jugador_apellidos}</td>
                                            <td>{jugador.nombre_alias || '-'}</td>
                                            <td>{jugador.club || '-'}</td>
                                            <td>{jugador.epoca ? getEpoca(jugador.epoca) : (torneo?.epocas_disponibles ? getEpoca(torneo.epocas_disponibles) : '-')}</td>
                                            <td>
                                                <div>{jugador.faccion ? getBanda(jugador.faccion) : '-'}</div>
                                                {warlord?.bandaDesbloqueada && (
                                                    <div className="banda-desbloqueada-celda">✨ {getBanda(warlord.bandaDesbloqueada)}</div>
                                                )}
                                            </td>
                                            <td>
                                                <MostrarComposicion composicion={composicion} banda={bandaFinal} mostrarWarlord={torneo?.unidades_legendarias === 1} />
                                            </td>
                                            <td>
                                                <button onClick={() => cambiarEstadoPagoJugador(jugador.id, jugador.pagado)} className={`btn-pago ${isPagado ? 'pagado' : 'pendiente'}`} disabled={isLoadingPago}>
                                                    {isLoadingPago ? '⏳' : (isPagado ? `✅ ${t('botones.pagado')}` : `⏰ ${t('botones.pendiente')}`)}
                                                </button>
                                            </td>
                                            {torneo?.estado === 'pendiente' && (
                                                <td>
                                                    <button className="btn-secondary-small" onClick={() => reenviarInvitacionIndividual(jugador)} disabled={loadingReenvio} style={{ marginRight: '5px' }}>
                                                        {loadingReenvio ? '⏳' : '📧'}
                                                    </button>
                                                    <button onClick={() => eliminarJugador(jugador.jugador_id)} className="btn-danger-small">
                                                        🗑️ {t('botones.eliminar')}
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
                            <AnadirParticipantesTorneos torneoId={torneoId}
                                onClose={() => setMostrarModalAnadir(false)}
                                onSuccess={async () => { setMostrarModalAnadir(false); await cargarDatos(); if (onUpdate) onUpdate(); }} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="vista-jugadores">
            <div className="header-jugadores-con-boton">
                <h2>👥 {t('vista_jugadores.equipos')} ({equipos.length})</h2>
                {torneo?.estado === 'pendiente' && (
                    <>
                        <button className="btn-primary" onClick={() => setMostrarModalAnadir(true)} disabled={loadingReenvio}>
                            {t('vista_jugadores.invitar_primer_equipo')}
                        </button>
                        <button className="btn-secondary-small" onClick={reenviarTodasLasInvitaciones} disabled={loadingReenvio}>
                            {loadingReenvio ? `⏳ ${t('vista_jugadores.enviando')}` : `📧 ${t('vista_jugadores.reenviar_invitaciones')}`}
                        </button>
                        <button className="btn-secondary-small" onClick={confirmarTodosLosPagos} disabled={loading}>
                            {loading ? `⏳ ${t('vista_jugadores.procesando')}` : `💰 ${t('vista_jugadores.confirmar_pagos')}`}
                        </button>
                    </>
                )}
            </div>
            
            {equipos.length === 0 ? (
                <div className="empty-message">
                    <p>📭 {t('vista_jugadores.no_equipos')}</p>
                    <button className="btn-primary" onClick={() => setMostrarModalAnadir(true)}>
                        ➕ {t('vista_jugadores.invitar_primer_equipo')}
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
                                    <h4>{t('vista_jugadores.miembros_equipo')} ({(equipo.miembros || []).length}):</h4>
                                    {(equipo.miembros || []).length > 0 ? (
                                        <ul className="lista-miembros-admin">
                                            {equipo.miembros.map((miembro, idx) => {
                                                const warlord = miembro.composicion?.warlordLegendario;
                                                const bandaFinal = warlord?.bandaDesbloqueada || miembro.faccion;
                                                return (
                                                    <li key={idx} className="miembro-item-admin">
                                                        <div className="miembro-header-admin">
                                                            <span className="miembro-nombre-admin">
                                                                {miembro.es_capitan && '👑 '}{miembro.nombre} {miembro.alias && `(${miembro.alias})`}
                                                            </span>
                                                            <span className="miembro-epoca-banda-admin">
                                                                {miembro.epoca ? getEpoca(miembro.epoca) : '-'} - {miembro.faccion ? getBanda(miembro.faccion) : '-'}
                                                                {warlord?.bandaDesbloqueada && (
                                                                    <span className="banda-desbloqueada-inline">✨ {getBanda(warlord.bandaDesbloqueada)}</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <MostrarComposicion composicion={miembro.composicion} banda={bandaFinal} epoca={miembro.epoca} mostrarWarlord={torneo?.unidades_legendarias === 1} />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="sin-miembros-admin">{t('vista_jugadores.sin_miembros')}</p>
                                    )}
                                </div>
                                <div className="equipo-acciones-admin">
                                    <button onClick={() => cambiarEstadoPagoEquipo(equipo.id, equipo.pagado)} className={`btn-pago ${isPagado ? 'pagado' : 'pendiente'}`} disabled={isLoadingPago}>
                                        {isLoadingPago ? '⏳' : (isPagado ? `✅ ${t('botones.pagado')}` : `⏰ ${t('botones.pendiente')}`)}
                                    </button>
                                    {torneo?.estado === 'pendiente' && (
                                        <>
                                            <button className="btn-primary" onClick={() => reenviarInvitacionEquipo(equipo)} disabled={loadingReenvio}>
                                                {loadingReenvio ? '⏳' : `📧 ${t('botones.reenviar_invitacion')}`}
                                            </button>
                                            <button onClick={() => eliminarEquipo(equipo.id)} className="btn-danger-small">
                                                🗑️ {t('botones.eliminar')}
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
                        <AnadirParticipantesTorneos torneoId={torneoId}
                            onClose={() => setMostrarModalAnadir(false)}
                            onSuccess={async () => { setMostrarModalAnadir(false); await cargarDatos(); if (onUpdate) onUpdate(); }} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VistaJugadoresSaga;