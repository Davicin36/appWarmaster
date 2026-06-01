// componentesSaga/inscripciones/inscripcionSagaIndividual.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import torneosSagaApi from '@/servicios/apiSaga.js';
import {
    procesarEpocasYBandas,
    obtenerConfiguracionBanda,
    permiteTipoTropa,
    obtenerOpcionesWarlordLegendario,
    obtenerInfoCompletaWarlord,
    calcularPuntosDisponibles,
    validarComposicionBanda,
    estaProhibido,
    sonMutuamenteExcluyentes,
    useSagaI18n,
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/inscripcion.css';

function InscripcionSagaIndividual({ torneoId, torneo, user }) {
    const navigate    = useNavigate();
    const location    = useLocation();
    const { t, i18n } = useTranslation();
    const { getEpoca, getTropa, getBanda, traducirTiposT, traducirOpciones } = useSagaI18n();

    const modoEdicion = location.pathname.includes('editar-inscripcion') || location.pathname.includes('actualizarInscripcion');

    // ── Estados ───────────────────────────────────────────────────────────────
    const [epocaSeleccionada,        setEpocaSeleccionada]        = useState("");
    const [bandaSeleccionada,        setBandaSeleccionada]        = useState("");
    const [warlordSeleccionado,      setWarlordSeleccionado]      = useState(null);
    const [opcionesWarlordSucesores, setOpcionesWarlordSucesores] = useState({});
    const [puntos, setPuntos] = useState({
        guardias: 0, guerreros: 0, levas: 0, mercenarios: 0,
        elefantes: 0, carros: 0, tambor: 0, curaids: 0,
        perros: 0, berserkers: 0, cerdos: 0,
    });
    const [unidadesEspeciales,       setUnidadesEspeciales]       = useState({});
    const [opcionesBanda,            setOpcionesBanda]            = useState({});
    const [tiposTropaPersonalizados, setTiposTropaPersonalizados] = useState({});
    const [detalleMercenarios,       setDetalleMercenarios]       = useState("");
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    // ── Épocas y bandas ───────────────────────────────────────────────────────
    const { epocasArray, todasLasBandas, mapaBandaAEpoca } = React.useMemo(
        () => procesarEpocasYBandas(torneo?.epocas_disponibles),
        [torneo?.epocas_disponibles]
    );

    const configuracionBanda = React.useMemo(() => {
        if (!bandaSeleccionada) return {
            permiteElefantes: false, permiteCarros: false, permiteTambor: false,
            permiteCuraids: false, permitePerros: false, permiteBerserkers: false,
            unidadesEspeciales: [], tiposTropaPermitidos: null,
            opcionesBanda: [], tiposTropaPersonalizados: null,
        };
        return obtenerConfiguracionBanda(bandaSeleccionada);
    }, [bandaSeleccionada]);

    // ── Warlord ───────────────────────────────────────────────────────────────
    const opcionesWarlord = React.useMemo(() => {
        if (!bandaSeleccionada || torneo?.unidades_legendarias !== 1) return null;
        const epocaTorneo = torneo?.epocas_disponibles;
        if (!epocaTorneo) return null;
        return obtenerOpcionesWarlordLegendario(epocaTorneo, bandaSeleccionada);
    }, [bandaSeleccionada, torneo?.unidades_legendarias, torneo?.epocas_disponibles]);

    const infoWarlord = React.useMemo(() => {
        if (!bandaSeleccionada) return {
            tieneWarlord: false, nombreBandaFinal: bandaSeleccionada, costePuntos: 0,
            restricciones: { mutuamenteExcluyentes: [], prohibido: [] }, unidadesDesbloqueadas: [],
        };
        return obtenerInfoCompletaWarlord(torneo?.epocas_disponibles, bandaSeleccionada, warlordSeleccionado);
    }, [bandaSeleccionada, warlordSeleccionado, torneo?.epocas_disponibles]);

    const puntosMaximosReales = React.useMemo(() => {
        if (!torneo?.puntos_banda || !bandaSeleccionada) return 0;
        return calcularPuntosDisponibles(torneo.puntos_banda, torneo?.epocas_disponibles, bandaSeleccionada, warlordSeleccionado);
    }, [torneo?.puntos_banda, torneo?.epocas_disponibles, bandaSeleccionada, warlordSeleccionado]);

    const unidadesEspecialesDisponibles = React.useMemo(() => {
        const base  = configuracionBanda.unidadesEspeciales || [];
        const extra = infoWarlord.unidadesDesbloqueadas || [];
        const todas = [...base];
        extra.forEach(u => { if (!todas.find(x => x.nombre === u.nombre)) todas.push({ ...u, desbloquedaPorWarlord: true }); });
        return todas;
    }, [configuracionBanda.unidadesEspeciales, infoWarlord.unidadesDesbloqueadas]);

    // Permisos de banda
    const permiteElefantes  = configuracionBanda.permiteElefantes;
    const permiteCarros     = configuracionBanda.permiteCarros;
    const permiteTambor     = configuracionBanda.permiteTambor;
    const permiteCuraids    = configuracionBanda.permiteCuraids;
    const permitePerros     = configuracionBanda.permitePerros;
    const permiteBerserkers = configuracionBanda.permiteBerserkers;
    const tieneUnidadesEspeciales    = unidadesEspecialesDisponibles.length > 0;
    const tieneOpcionesBanda         = configuracionBanda.opcionesBanda?.length > 0;
    const usaTiposTropaPersonalizados= configuracionBanda.tiposTropaPersonalizados !== null;
    const permiteGuardias   = permiteTipoTropa(configuracionBanda, 'guardias');
    const permiteGuerreros  = permiteTipoTropa(configuracionBanda, 'guerreros');
    const permiteLevas      = permiteTipoTropa(configuracionBanda, 'levas');
    const permiteMercenarios= permiteTipoTropa(configuracionBanda, 'mercenarios');
    const permiteCerdos     = React.useMemo(() => {
        if (!bandaSeleccionada || torneo?.unidades_legendarias !== 1) return false;
        return obtenerConfiguracionBanda(bandaSeleccionada).epoca === 'Ánibal';
    }, [bandaSeleccionada, torneo?.unidades_legendarias]);

    // ── useEffects ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (configuracionBanda.opcionesBanda?.length > 0) {
            const defaults = {};
            configuracionBanda.opcionesBanda.forEach(o => { if (!opcionesBanda[o.id]) defaults[o.id] = o.valorPorDefecto || ''; });
            if (Object.keys(defaults).length > 0) setOpcionesBanda(prev => ({ ...prev, ...defaults }));
        }
    }, [configuracionBanda.opcionesBanda]);

    useEffect(() => {
        const cargarInscripcion = async () => {
            if (!modoEdicion) return;
            try {
                setLoading(true);
                const data = await torneosSagaApi.obtenerIncripcion(torneoId);
                if (data.success && data.data) {
                    const ins = data.data;
                    let c = {};
                    if (ins.composicion_ejercito) {
                        try { c = typeof ins.composicion_ejercito === 'string' ? JSON.parse(ins.composicion_ejercito) : ins.composicion_ejercito; }
                        catch (e) { console.error("Error al parsear composicion:", e); }
                    }
                    if (ins.epoca) setEpocaSeleccionada(ins.epoca);
                    setBandaSeleccionada(ins.faccion || "");
                    if (c.warlordLegendario) setWarlordSeleccionado(c.warlordLegendario.valor);
                    setPuntos({
                        guardias:    parseFloat(c.guardias    || 0), guerreros: parseFloat(c.guerreros   || 0),
                        levas:       parseFloat(c.levas       || 0), mercenarios:parseFloat(c.mercenarios|| 0),
                        elefantes:   parseFloat(c.elefantes   || 0), carros:    parseFloat(c.carros      || 0),
                        tambor:      parseFloat(c.tambor      || 0), curaids:   parseFloat(c.curaids     || 0),
                        perros:      parseFloat(c.perros      || 0), berserkers:parseFloat(c.berserkers  || 0),
                        cerdos:      parseFloat(c.cerdos      || 0),
                    });
                    if (c.unidadesEspeciales) {
                        const ue = {};
                        Object.keys(c.unidadesEspeciales).forEach(k => { ue[k] = parseFloat(c.unidadesEspeciales[k] || 0); });
                        setUnidadesEspeciales(ue);
                    }
                    if (c.opcionesBanda)            setOpcionesBanda(c.opcionesBanda);
                    if (c.tiposTropaPersonalizados) setTiposTropaPersonalizados(c.tiposTropaPersonalizados);
                    setDetalleMercenarios(c.detalleMercenarios || "");
                }
            } catch (err) {
                console.error("Error:", err);
                setError(t('insc_ind.err_carga'));
            } finally { setLoading(false); }
        };
        cargarInscripcion();
    }, [modoEdicion, torneoId]);

    useEffect(() => {
        const p = { ...puntos }; let cambios = false;
        infoWarlord.restricciones.prohibido.forEach(tipo => { if (p[tipo] > 0) { p[tipo] = 0; cambios = true; } });
        if (!permiteCerdos    && p.cerdos     > 0) { p.cerdos     = 0; cambios = true; }
        if (!permiteElefantes && p.elefantes  > 0) { p.elefantes  = 0; cambios = true; }
        if (!permiteCarros    && p.carros     > 0) { p.carros     = 0; cambios = true; }
        if (!permiteTambor    && p.tambor     > 0) { p.tambor     = 0; cambios = true; }
        if (!permiteCuraids   && p.curaids    > 0) { p.curaids    = 0; cambios = true; }
        if (!permitePerros    && p.perros     > 0) { p.perros     = 0; cambios = true; }
        if (!permiteBerserkers&& p.berserkers > 0) { p.berserkers = 0; cambios = true; }
        if (!permiteGuardias  && p.guardias   > 0) { p.guardias   = 0; cambios = true; }
        if (!permiteGuerreros && p.guerreros  > 0) { p.guerreros  = 0; cambios = true; }
        if (!permiteLevas     && p.levas      > 0) { p.levas      = 0; cambios = true; }
        if (!permiteMercenarios && p.mercenarios > 0) { p.mercenarios = 0; setDetalleMercenarios(""); cambios = true; }
        if (cambios) setPuntos(p);
        if (!tieneUnidadesEspeciales    && Object.keys(unidadesEspeciales).length > 0)       setUnidadesEspeciales({});
        if (!tieneOpcionesBanda         && Object.keys(opcionesBanda).length > 0)            setOpcionesBanda({});
        if (!usaTiposTropaPersonalizados && Object.keys(tiposTropaPersonalizados).length > 0) setTiposTropaPersonalizados({});
    }, [bandaSeleccionada, warlordSeleccionado, infoWarlord, permiteElefantes, permiteCarros, permiteTambor, permiteCuraids, permitePerros, permiteBerserkers, permiteGuardias, permiteGuerreros, permiteLevas, permiteMercenarios, tieneUnidadesEspeciales, tieneOpcionesBanda, usaTiposTropaPersonalizados, permiteCerdos]);

    useEffect(() => {
        if (!warlordSeleccionado || !opcionesWarlord) { setOpcionesWarlordSucesores({}); return; }
        const opcion = opcionesWarlord.opciones.find(o => o.valor === warlordSeleccionado);
        if (opcion?.opcionesRequeridas) {
            setOpcionesBanda(prev => ({ ...prev, ...opcion.opcionesRequeridas }));
            const bloqueadas = {};
            Object.keys(opcion.opcionesRequeridas).forEach(k => { bloqueadas[k] = true; });
            setOpcionesWarlordSucesores(bloqueadas);
        } else { setOpcionesWarlordSucesores({}); }
    }, [warlordSeleccionado, opcionesWarlord]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleBandaChange = (e) => {
        const banda = e.target.value;
        setBandaSeleccionada(banda);
        setWarlordSeleccionado(null);
        if (banda && mapaBandaAEpoca[banda]) {
            setEpocaSeleccionada(mapaBandaAEpoca[banda]);
        } else if (!banda) {
            setPuntos({ guardias:0, guerreros:0, levas:0, mercenarios:0, elefantes:0, carros:0, tambor:0, curaids:0, perros:0, berserkers:0, cerdos:0 });
            setUnidadesEspeciales({}); setOpcionesBanda({}); setTiposTropaPersonalizados({}); setDetalleMercenarios("");
            setEpocaSeleccionada(epocasArray.length === 1 ? epocasArray[0] : "");
        }
    };

    const handleWarlordChange = (valor) => {
        const vf = valor || null;
        setWarlordSeleccionado(vf);
        if (!vf) { setOpcionesWarlordSucesores({}); return; }
        const nuevaInfo = obtenerInfoCompletaWarlord(torneo?.epocas_disponibles, bandaSeleccionada, vf);
        if (nuevaInfo.restricciones.prohibido.length > 0) {
            const p = { ...puntos }; let cambios = false;
            nuevaInfo.restricciones.prohibido.forEach(tipo => { if (p[tipo] > 0) { p[tipo] = 0; cambios = true; } });
            if (cambios) {
                setPuntos(p);
                setTimeout(() => alert(`⚠️ ${t('insc_ind.aviso_reset_warlord', { nombre: nuevaInfo.nombreWarlord })}`), 100);
            }
        }
    };

    const handlePuntosChange = (e) => {
        const { name, value } = e.target;
        const v = parseFloat(value) || 0;
        setPuntos(prev => ({ ...prev, [name]: v }));
        if (name === 'mercenarios' && v === 0) setDetalleMercenarios("");
    };

    const handleUnidadEspecialChange  = (k, val) => setUnidadesEspeciales(prev => ({ ...prev, [k]: parseFloat(val) || 0 }));
    const handleOpcionBandaChange     = (id, val) => setOpcionesBanda(prev => ({ ...prev, [id]: val }));
    const handleTropaPersonalizadaChange = (id, val) => setTiposTropaPersonalizados(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));

    const eliminarInscripcion = async () => {
        if (!window.confirm(t('insc_ind.confirm_eliminar'))) return;
        if (!user?.id) { setError(t('insc_ind.err_sin_id')); return; }
        try {
            setLoading(true);
            const r = await torneosSagaApi.eliminarJugadorTorneo(torneoId, user.id);
            if (r.success) { alert(`✅ ${t('insc_ind.exito_eliminar')}`); navigate('/'); }
        } catch (err) {
            setError(err.message || t('insc_ind.err_eliminar'));
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!user?.id)          { setError(t('insc_ind.err_sin_usuario')); return; }
        if (!epocaSeleccionada) { setError(t('insc_ind.err_sin_epoca')); return; }

        if (configuracionBanda.opcionesBanda?.length > 0) {
            for (const o of configuracionBanda.opcionesBanda) {
                if (o.obligatorio && !opcionesBanda[o.id]) { setError(t('insc_ind.err_opcion_banda', { label: o.label })); return; }
            }
        }

        let totalPuntos = 0;
        if (usaTiposTropaPersonalizados) {
            Object.keys(tiposTropaPersonalizados).forEach(id => {
                const can = tiposTropaPersonalizados[id];
                const cfg = configuracionBanda.tiposTropaPersonalizados.find(x => x.id === id);
                if (cfg) totalPuntos += can * cfg.puntos;
            });
        } else {
            const esp = Object.values(unidadesEspeciales).reduce((a, v) => a + v, 0);
            totalPuntos = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios +
                          puntos.elefantes + puntos.carros + puntos.tambor + puntos.curaids +
                          puntos.perros + puntos.berserkers + puntos.cerdos + esp;
        }
        totalPuntos = parseFloat(totalPuntos.toFixed(2));

        if (totalPuntos > 0) {
            if (Math.abs(totalPuntos - puntosMaximosReales) > 0.01) {
                setError(t('insc_ind.err_puntos', { esperado: puntosMaximosReales }) +
                    (warlordSeleccionado ? ` (${torneo.puntos_banda} - ${infoWarlord.costePuntos} ${t('insc_ind.del_warlord')})` : ''));
                return;
            }
            if (!bandaSeleccionada) { setError(t('insc_ind.err_banda_requerida')); return; }
            if (puntos.mercenarios > 0 && !detalleMercenarios.trim()) { setError(t('insc_ind.err_detalle_merc')); return; }
        }

        if (warlordSeleccionado && totalPuntos > 0) {
            const v = validarComposicionBanda({ elefantes: puntos.elefantes, carros: puntos.carros, levas: puntos.levas, guardias: puntos.guardias, guerreros: puntos.guerreros, mercenarios: puntos.mercenarios }, infoWarlord.restricciones);
            if (!v.valido) { setError(t('insc_ind.err_restricciones', { errores: v.errores.join(', ') })); return; }
        }

        try {
            setLoading(true);
            const ins = { usuarioId: user.id, epoca: epocaSeleccionada };
            if (bandaSeleccionada) ins.faccion = bandaSeleccionada;
            if (warlordSeleccionado && opcionesWarlord) {
                const op = opcionesWarlord.opciones.find(o => o.valor === warlordSeleccionado);
                if (op) ins.warlordLegendario = { valor: warlordSeleccionado, nombre: op.nombre, costePuntos: op.costePuntos, bandaDesbloqueada: op.bandaDesbloqueada || null, opcionesRequeridas: op.opcionesRequeridas || null };
            }
            if (totalPuntos > 0) {
                if (usaTiposTropaPersonalizados) { ins.tiposTropaPersonalizados = tiposTropaPersonalizados; }
                else {
                    ins.puntosGuardias = puntos.guardias; ins.puntosGuerreros = puntos.guerreros;
                    ins.puntosLevas = puntos.levas; ins.puntosMercenarios = puntos.mercenarios;
                    ins.puntosElefantes = puntos.elefantes; ins.puntosCarros = puntos.carros;
                    ins.puntosTambor = puntos.tambor; ins.puntosCuraids = puntos.curaids;
                    ins.puntosPerros = puntos.perros; ins.puntosBerserkers = puntos.berserkers;
                    ins.puntosCerdos = puntos.cerdos;
                    if (Object.keys(unidadesEspeciales).length > 0) ins.unidadesEspeciales = unidadesEspeciales;
                }
                if (Object.keys(opcionesBanda).length > 0) ins.opcionesBanda = opcionesBanda;
                if (detalleMercenarios) ins.detalleMercenarios = detalleMercenarios;
            }

            let r;
            if (modoEdicion) {
                r = await torneosSagaApi.actualizarInscripcion(torneoId, ins);
                alert(`✅ ${t('insc_ind.exito_actualizar')}`);
            } else {
                r = await torneosSagaApi.inscribirse(torneoId, ins);
                alert(`✅ ${bandaSeleccionada && totalPuntos > 0 ? t('insc_ind.exito_inscribir') : t('insc_ind.exito_inscribir_sin_banda')}`);
            }
            if (r.success) navigate('/');
        } catch (err) {
            setError(err.message || t('insc_ind.err_procesar'));
        } finally { setLoading(false); }
    };

    // Puntos actuales
    let puntosActuales = 0;
    if (usaTiposTropaPersonalizados) {
        Object.keys(tiposTropaPersonalizados).forEach(id => {
            const can = tiposTropaPersonalizados[id];
            const cfg = configuracionBanda.tiposTropaPersonalizados?.find(x => x.id === id);
            if (cfg) puntosActuales += can * cfg.puntos;
        });
    } else {
        const esp = Object.values(unidadesEspeciales).reduce((a, v) => a + v, 0);
        puntosActuales = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios +
                         puntos.elefantes + puntos.carros + puntos.tambor + puntos.curaids +
                         puntos.perros + puntos.berserkers + puntos.cerdos + esp;
    }
    const diferencia = puntosMaximosReales - puntosActuales;

    // Tipos de tropa y opciones de banda traducidos
    const tiposTrad    = traducirTiposT(configuracionBanda.tiposTropaPersonalizados);
    const opcBandaTrad = traducirOpciones(configuracionBanda.opcionesBanda);

    const locale = i18n.language === 'en' ? 'en-GB' : 'es-ES';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="inscripcion-container">
            <h1>
                {modoEdicion ? `✏️ ${t('insc_ind.titulo_editar')}` : `📝 ${t('insc_ind.titulo_inscribir')}`}: {torneo?.nombre_torneo}
            </h1>

            {modoEdicion && <div className="info-message">ℹ️ {t('insc_ind.info_edicion')}</div>}

            {/* DATOS DEL PARTICIPANTE */}
            <section className="info-usuario">
                <h2>{t('insc_ind.datos_participante')}</h2>
                <div className="datos-grid">
                    <div className="dato-item"><label>{t('insc_ind.nombre')}:</label><span>{user?.nombre} {user?.apellidos}</span></div>
                    <div className="dato-item"><label>{t('registro.email')}:</label><span>{user?.email}</span></div>
                    {user?.club     && <div className="dato-item"><label>{t('navbar.club')}:</label><span>{user.club}</span></div>}
                    {user?.localidad&& <div className="dato-item"><label>{t('insc_ind.localidad')}:</label><span>{user.localidad}</span></div>}
                </div>
            </section>

            {/* DETALLES DEL TORNEO */}
            <section className="info-torneo">
                <h2>{t('insc_ind.detalles_torneo')}</h2>
                <div className="datos-grid">
                    <div className="dato-item">
                        <label>{t('insc_ind.epocas_disponibles')}:</label>
                        <span className="epoca-badge">{epocasArray.map(e => getEpoca(e)).join(', ')}</span>
                    </div>
                    <div className="dato-item">
                        <label>{t('insc_ind.puntos_banda')}:</label>
                        <span>{torneo?.puntos_banda || 6} {t('insc_ind.puntos')}</span>
                    </div>
                    <div className="dato-item">
                        <label>{t('perfil.fecha')}:</label>
                        <span>{torneo?.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString(locale) : 'N/A'}</span>
                    </div>
                    {torneo?.unidades_legendarias === 1 && (
                        <div className="dato-item">
                            <label>{t('insc_ind.unidades_legendarias')}:</label>
                            <span className="legendarias-activas">✅ {t('insc_ind.activadas')}</span>
                        </div>
                    )}
                </div>
            </section>

            <form onSubmit={handleSubmit} className="inscripcion-form">
                {error && <div className="error-message">⚠️ {error}</div>}

                {/* SELECTOR DE BANDA — value ES (clave BD), display sin cambio (nombre propio) */}
                <div className="form-group">
                    <select id="banda" value={bandaSeleccionada} onChange={handleBandaChange} disabled={loading}>
                        <option value="">{t('insc_ind.completar_despues')}</option>
                        {todasLasBandas.length === 0
                            ? <option value="" disabled>⚠️ {t('insc_ind.sin_bandas')}</option>
                            : todasLasBandas.map((b, i) => <option key={i} value={b.nombre}>{getBanda(b.nombre)}</option>)
                        }
                    </select>
                    <small className="form-help-text">{t('insc_ind.banda_hint')}</small>
                </div>

                {/* WARLORD LEGENDARIO */}
                {bandaSeleccionada && opcionesWarlord && torneo?.unidades_legendarias === 1 && (
                    <section className="warlord-section">
                        <h3 className="warlord-title">⚔️ {t('insc_equipo.warlord_titulo')}</h3>
                        <div className="form-group">
                            <label htmlFor="warlord">
                                {t('insc_equipo.warlord_label')}
                                {opcionesWarlord.obligatorio && <span className="required"> *</span>}
                            </label>
                            <select id="warlord" value={warlordSeleccionado || ''}
                                onChange={(e) => handleWarlordChange(e.target.value || null)}
                                disabled={loading} required={opcionesWarlord.obligatorio}>
                                <option value="">{t('insc_equipo.sin_warlord')}</option>
                                {opcionesWarlord.opciones.map(o => (
                                    <option key={o.valor} value={o.valor}>
                                        {o.nombreCompleto}{o.tieneBandaDesbloqueada && ` → ${o.bandaDesbloqueada}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {infoWarlord.tieneWarlord && (
                            <div className="info-warlord">
                                <p className="info-line"><strong>{t('insc_equipo.warlord_nombre')}:</strong> {infoWarlord.nombreWarlord}</p>
                                <p className="info-line">
                                    <strong>{t('insc_equipo.warlord_coste')}:</strong> {infoWarlord.costePuntos} {infoWarlord.costePuntos === 1 ? t('insc_equipo.punto') : t('insc_equipo.puntos')}
                                </p>
                                {infoWarlord.tieneBandaDesbloqueada && (
                                    <p className="info-line banda-desbloqueada">
                                        <strong>✨ {t('insc_equipo.banda_desbloqueada')}:</strong> {infoWarlord.nombreBandaFinal}
                                    </p>
                                )}
                                <p className="info-line">
                                    <strong>{t('insc_equipo.puntos_disponibles')}:</strong> {puntosMaximosReales}
                                    <small className="puntos-detalle-small"> ({torneo.puntos_banda} - {infoWarlord.costePuntos})</small>
                                </p>
                                {infoWarlord.restricciones.prohibido.length > 0 && (
                                    <div className="restriccion-prohibido">
                                        <strong>⛔ {t('insc_equipo.prohibido')}:</strong>{' '}
                                        {infoWarlord.restricciones.prohibido.map(p => getTropa(p)).join(', ')}
                                    </div>
                                )}
                                {infoWarlord.restricciones.mutuamenteExcluyentes.length > 0 && (
                                    <div className="restriccion-excluyentes">
                                        <strong>⚠️ {t('insc_ind.mutuamente_excluyentes')}:</strong>
                                        {infoWarlord.restricciones.mutuamenteExcluyentes.map((par, i) => (
                                            <div key={i} className="restriccion-item">• {par.map(p => getTropa(p)).join(' ↔ ')}</div>
                                        ))}
                                    </div>
                                )}
                                {infoWarlord.unidadesDesbloqueadas?.length > 0 && (
                                    <div className="unidades-desbloqueadas">
                                        <strong>✨ {t('insc_equipo.unidades_desbloqueadas')}:</strong>
                                        <ul className="lista-unidades-desbloqueadas">
                                            {infoWarlord.unidadesDesbloqueadas.map((u, i) => <li key={i}>{u.label || u.nombre}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* OPCIONES DE BANDA */}
                {bandaSeleccionada && tieneOpcionesBanda && (
                    <section className="opciones-banda-section">
                        <h3>{t('insc_equipo.config_banda')}</h3>
                        {opcBandaTrad.map(o => {
                            const bloqueada = opcionesWarlordSucesores[o.id] || false;
                            return (
                                <div key={o.id} className="form-group">
                                    <label htmlFor={o.id}>
                                        {o.label}
                                        {o.obligatorio && <span className="required"> *</span>}
                                        {bloqueada && <span className="warlord-locked">🔒 {t('insc_ind.exclusivo_warlord')}</span>}
                                    </label>
                                    {o.tipo === 'select' && (
                                        <select id={o.id} value={opcionesBanda[o.id] || ''}
                                            onChange={(e) => handleOpcionBandaChange(o.id, e.target.value)}
                                            disabled={loading || bloqueada} required={o.obligatorio}
                                            className={bloqueada ? ' input-locked' : ' '}>
                                            <option value="">{t('insc_equipo.seleccionar')}</option>
                                            {o.opciones.map(opt => <option key={opt.valor} value={opt.valor}>{opt.nombre}</option>)}
                                        </select>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                )}

                {/* DISTRIBUCIÓN DE PUNTOS */}
                {bandaSeleccionada && (
                    <section className="puntos-section">
                        <h3>{t('insc_equipo.distribucion_puntos')}</h3>
                        <p className="puntos-info">
                            {t('insc_equipo.total')}: <strong>{puntosActuales.toFixed(1)}</strong> / {puntosMaximosReales}
                            {warlordSeleccionado && (
                                <small className="puntos-detalle-small"> ({torneo.puntos_banda} - {infoWarlord.costePuntos} warlord)</small>
                            )}
                            {diferencia > 0 && <span className="puntos-faltantes"> ⚠️ {t('insc_equipo.faltan', { n: diferencia.toFixed(1) })}</span>}
                            {diferencia < 0 && <span className="puntos-excedidos"> ⚠️ {t('insc_equipo.excede', { n: Math.abs(diferencia).toFixed(1) })}</span>}
                        </p>

                        <div className="puntos-grid">
                            {usaTiposTropaPersonalizados ? (
                                tiposTrad.map(tipo => (
                                    <div key={tipo.id} className="punto-item">
                                        <label htmlFor={tipo.id}>{tipo.label}</label>
                                        <input type="number" inputMode="decimal" id={tipo.id} name={tipo.id}
                                            value={tiposTropaPersonalizados[tipo.id] || 0}
                                            onChange={(e) => handleTropaPersonalizadaChange(tipo.id, e.target.value)}
                                            min="0" max={puntosMaximosReales} step={tipo.step || 0.5} disabled={loading} />
                                    </div>
                                ))
                            ) : (
                                <>
                                    {permiteGuardias && (
                                        <div className="punto-item">
                                            <label htmlFor="guardias">{getTropa('guardias')}{estaProhibido('guardias', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="guardias" name="guardias" value={puntos.guardias} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="0.5" disabled={loading || estaProhibido('guardias', infoWarlord.restricciones)} className={estaProhibido('guardias', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permiteBerserkers && (
                                        <div className="punto-item">
                                            <label htmlFor="berserkers">{getTropa('berserkers')}{estaProhibido('berserkers', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="berserkers" name="berserkers" value={puntos.berserkers} onChange={handlePuntosChange} min="0" max="1" step="1" disabled={loading || estaProhibido('berserkers', infoWarlord.restricciones)} className={estaProhibido('berserkers', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permiteCerdos && (
                                        <div className="punto-item cerdos-legendario">
                                            <label htmlFor="cerdos">🐷 {t('insc_equipo.cerdos_incendiarios')}{estaProhibido('cerdos', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="cerdos" name="cerdos" value={puntos.cerdos} onChange={handlePuntosChange} min="0" max="1" step="1" disabled={loading || estaProhibido('cerdos', infoWarlord.restricciones)} className={estaProhibido('cerdos', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permiteElefantes && (
                                        <div className="punto-item">
                                            <label htmlFor="elefantes">{getTropa('elefantes')}{estaProhibido('elefantes', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="elefantes" name="elefantes" value={puntos.elefantes} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="1" disabled={loading || estaProhibido('elefantes', infoWarlord.restricciones)} className={estaProhibido('elefantes', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                            {sonMutuamenteExcluyentes('elefantes', 'carros', infoWarlord.restricciones) && puntos.carros > 0 && <small className="restriccion-warning">⚠️ {t('insc_ind.incompatible_carros')}</small>}
                                        </div>
                                    )}
                                    {permiteCarros && (
                                        <div className="punto-item">
                                            <label htmlFor="carros">{getTropa('carros')}{estaProhibido('carros', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="carros" name="carros" value={puntos.carros} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="1" disabled={loading || estaProhibido('carros', infoWarlord.restricciones)} className={estaProhibido('carros', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                            {sonMutuamenteExcluyentes('elefantes', 'carros', infoWarlord.restricciones) && puntos.elefantes > 0 && <small className="restriccion-warning">⚠️ {t('insc_ind.incompatible_elefantes')}</small>}
                                        </div>
                                    )}
                                    {permiteTambor && (
                                        <div className="punto-item">
                                            <label htmlFor="tambor">{getTropa('tambor')}{estaProhibido('tambor', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="tambor" name="tambor" value={puntos.tambor} onChange={handlePuntosChange} min="0" max="1" step="1" disabled={loading || estaProhibido('tambor', infoWarlord.restricciones)} className={estaProhibido('tambor', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permiteCuraids && (
                                        <div className="punto-item">
                                            <label htmlFor="curaids">{getTropa('curaids')}{estaProhibido('curaids', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="curaids" name="curaids" value={puntos.curaids} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="0.5" disabled={loading || estaProhibido('curaids', infoWarlord.restricciones)} className={estaProhibido('curaids', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permitePerros && (
                                        <div className="punto-item">
                                            <label htmlFor="perros">{getTropa('perros')}{estaProhibido('perros', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="perros" name="perros" value={puntos.perros} onChange={handlePuntosChange} min="0" max="1" step="0.5" disabled={loading || estaProhibido('perros', infoWarlord.restricciones)} className={estaProhibido('perros', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {tieneUnidadesEspeciales && unidadesEspecialesDisponibles.map(u => {
                                        const k = u.valor || u.nombre;
                                        return (
                                            <div key={k} className={`punto-item ${u.desbloquedaPorWarlord ? 'unidad-warlord' : ''}`}>
                                                <label htmlFor={k}>
                                                    {u.desbloquedaPorWarlord && '✨ '}{getTropa(u.nombre) !== u.nombre ? getTropa(u.nombre) : u.label}
                                                    <small className="puntos-unidad-small"> ({u.puntos} {t('insc_equipo.pts_cada')})</small>
                                                </label>
                                                <input type="number" inputMode="decimal" id={k} name={k}
                                                    value={unidadesEspeciales[k] || 0}
                                                    onChange={(e) => handleUnidadEspecialChange(k, e.target.value)}
                                                    min="0" max="1" step={u.step || 0.5} disabled={loading} />
                                                {u.desbloquedaPorWarlord && <small className="unidad-desbloqueada-label">{t('insc_ind.desbloqueada_por', { nombre: infoWarlord.nombreWarlord })}</small>}
                                            </div>
                                        );
                                    })}
                                    {permiteGuerreros && (
                                        <div className="punto-item">
                                            <label htmlFor="guerreros">{getTropa('guerreros')}{estaProhibido('guerreros', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="guerreros" name="guerreros" value={puntos.guerreros} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="0.5" disabled={loading || estaProhibido('guerreros', infoWarlord.restricciones)} className={estaProhibido('guerreros', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permiteLevas && (
                                        <div className="punto-item">
                                            <label htmlFor="levas">{getTropa('levas')}{estaProhibido('levas', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="levas" name="levas" value={puntos.levas} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="0.5" disabled={loading || estaProhibido('levas', infoWarlord.restricciones)} className={estaProhibido('levas', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                    {permiteMercenarios && (
                                        <div className="punto-item">
                                            <label htmlFor="mercenarios">{getTropa('mercenarios')}{estaProhibido('mercenarios', infoWarlord.restricciones) && <span className="prohibido-badge"> ⛔</span>}</label>
                                            <input type="number" inputMode="decimal" id="mercenarios" name="mercenarios" value={puntos.mercenarios} onChange={handlePuntosChange} min="0" max={puntosMaximosReales} step="0.5" disabled={loading || estaProhibido('mercenarios', infoWarlord.restricciones)} className={estaProhibido('mercenarios', infoWarlord.restricciones) ? 'input-prohibido' : ''} />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {puntos.mercenarios > 0 && permiteMercenarios && !usaTiposTropaPersonalizados && (
                            <div className="form-group mercenarios-detalle">
                                <label htmlFor="detalleMercenarios">
                                    {t('insc_ind.detalla_mercenarios', { pts: puntos.mercenarios })}:
                                </label>
                                <textarea id="detalleMercenarios" value={detalleMercenarios}
                                    onChange={(e) => setDetalleMercenarios(e.target.value)}
                                    placeholder={t('insc_equipo.detalle_mercenarios_placeholder')}
                                    rows="3" required disabled={loading} />
                            </div>
                        )}
                    </section>
                )}
            </form>

            <div className="button-group">
                <button type="submit" onClick={handleSubmit} className="btn-primary"
                    disabled={loading || todasLasBandas.length === 0}>
                    {loading
                        ? `⏳ ${t('insc_equipo.procesando')}`
                        : modoEdicion ? `✅ ${t('insc_equipo.btn_guardar')}` : `✅ ${t('insc_ind.btn_inscribirme')}`}
                </button>
                {modoEdicion && (
                    <button type="button" className="btn-danger" onClick={eliminarInscripcion} disabled={loading}>
                        🗑️ {t('insc_equipo.btn_eliminar_insc')}
                    </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
                    {t('botones.cancelar')}
                </button>
            </div>

            <Footer />
        </div>
    );
}

export default InscripcionSagaIndividual;