import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import torneosSagaApi from '@/servicios/apiSaga';
import '@/estilos/vistasTorneos/vistaGeneral.css';

import {
    EQUIPOS_RANGO, EPOCAS_SAGA, TIPOS_PARTIDA_SAGA,
    RONDAS_DISPONIBLES, JUGADORES_EQUIPO_RANGO,
    formatearEpocas, PUNTOS_BANDA_RANGO, PARTICIPANTES_RANGO,
    useSagaI18n,
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga.js';

function VistaGeneralSaga({ torneoId: propTorneoId, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { getEpoca, getEscenario, rondas, escenarios, getEstado } = useSagaI18n();
    const locale = i18n.language === 'en' ? 'en-GB' : 'es-ES';

    const [torneo,              setTorneo]              = useState(null);
    const [jugadores,           setJugadores]           = useState([]);
    const [equipos,             setEquipos]             = useState([]);
    const [loading,             setLoading]             = useState(true);
    const [modoEdicion,         setModoEdicion]         = useState(false);
    const [duracionTorneo,      setDuracionTorneo]      = useState("1");
    const [datosEdicion,        setDatosEdicion]        = useState({
        nombre_torneo: '', tipo_torneo: '',
        num_jugadores_equipo: JUGADORES_EQUIPO_RANGO.default,
        epocas_disponibles: [], rondas_max: RONDAS_DISPONIBLES[0].valor,
        puntos_banda: PUNTOS_BANDA_RANGO.default,
        participantes_max: PARTICIPANTES_RANGO.default, equipos_max: EQUIPOS_RANGO.default,
        unidades_legendarias: '0', modelo_gakis: '0', warlord_punto_victoria: '0',
        puntosDeTorneo: '0', misiones_secundarias: '0',
        fecha_inicio: '', fecha_fin: '', ubicacion: '', estado: 'pendiente',
        partida_ronda_1: '', partida_ronda_2: '', partida_ronda_3: '',
        partida_ronda_4: '', partida_ronda_5: '',
    });
    const [loadingEdicion,       setLoadingEdicion]      = useState(false);
    const [errorEdicion,         setErrorEdicion]        = useState('');
    const [archivoPDF,           setArchivoPDF]          = useState(null);
    const [eliminarPDF,          setEliminarPDF]         = useState(false);
    const [imagenActual,         setImagenActual]        = useState(null);
    const [imagenNueva,          setImagenNueva]         = useState(null);
    const [vistaPreviaImagen,    setVistaPreviaImagen]   = useState(null);
    const [eliminarImagenFlag,   setEliminarImagenFlag]  = useState(false);
    const [organizadores,        setOrganizadores]       = useState({ activos: [], pendientes: [] });
    const [nuevoOrganizadorEmail,setNuevoOrganizadorEmail]= useState('');
    const [loadingOrganizadores, setLoadingOrganizadores]= useState(false);

    const normalizar = (val) => (val === 1 || val === '1' || val === true) ? '1' : '0';

    // ── Efectos ───────────────────────────────────────────────────────────────
    useEffect(() => { if (torneoId) { cargarDatos(); cargarOrganizadores(); } }, [torneoId]);

    useEffect(() => {
        if (!torneo) return;
        let epocas = torneo.epocas_disponibles
            ? torneo.epocas_disponibles.split('|').map(e => e.trim()).filter(Boolean)
            : [];
        const tipoTorneo  = torneo.tipo_torneo === 'Por equipos' ? 'Por equipos' : 'Individual';
        const fechaInicio = torneo.fecha_inicio?.split('T')[0] || '';
        const fechaFin    = torneo.fecha_fin?.split('T')[0] || '';
        setDuracionTorneo(fechaFin && fechaFin !== fechaInicio ? "2" : "1");
        setDatosEdicion({
            nombre_torneo: torneo.nombre_torneo || '',
            tipo_torneo: tipoTorneo,
            num_jugadores_equipo: torneo.num_jugadores_equipo || JUGADORES_EQUIPO_RANGO.default,
            epocas_disponibles: epocas,
            rondas_max: torneo.rondas_max || RONDAS_DISPONIBLES[0].valor,
            puntos_banda: torneo.puntos_banda || PUNTOS_BANDA_RANGO.default,
            equipos_max: torneo.equipos_max || EQUIPOS_RANGO.default,
            participantes_max: torneo.participantes_max || PARTICIPANTES_RANGO.default,
            unidades_legendarias: normalizar(torneo.unidades_legendarias),
            modelo_gakis: normalizar(torneo.modelo_gakis),
            warlord_punto_victoria: normalizar(torneo.warlord_punto_victoria),
            puntosDeTorneo: normalizar(torneo.puntosDeTorneo),
            misiones_secundarias: normalizar(torneo.misiones_secundarias),
            fecha_inicio: fechaInicio, fecha_fin: fechaFin,
            ubicacion: torneo.ubicacion || '', estado: torneo.estado || 'pendiente',
            partida_ronda_1: torneo.partida_ronda_1 || '', partida_ronda_2: torneo.partida_ronda_2 || '',
            partida_ronda_3: torneo.partida_ronda_3 || '', partida_ronda_4: torneo.partida_ronda_4 || '',
            partida_ronda_5: torneo.partida_ronda_5 || '',
        });
        if (torneo.imagen_url) setImagenActual(torneo.imagen_url);
    }, [torneo]);

    // ── Carga de datos ────────────────────────────────────────────────────────
    const cargarDatos = async () => {
        try {
            setLoading(true);
            const response   = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            try {
                const dj = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dj) ? dj : dj.data || []);
            } catch { setJugadores([]); }
            if (dataTorneo.tipo_torneo === 'Por equipos') {
                try {
                    const de = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                    setEquipos(Array.isArray(de) ? de : de.data || []);
                } catch { setEquipos([]); }
            }
        } catch (error) { console.error('Error al cargar datos:', error); }
        finally { setLoading(false); }
    };

    const cargarOrganizadores = async () => {
        try {
            const data = await torneosSagaApi.obtenerOrganizadores(torneoId);
            setOrganizadores(data.data || { activos: [], pendientes: [] });
        } catch (error) { console.error('Error al cargar organizadores:', error); }
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleReenviarInvitacion = async (org) => {
        if (!org.organizador_id) { alert(`❌ ${t('vgs.err_sin_id')}`); return; }
        if (window.confirm(t('vgs.confirm_reenviar', { email: org.email }))) {
            try {
                await torneosSagaApi.reenviarInvitacion(torneo.id, org.organizador_id);
                alert(`✅ ${t('vgs.exito_reenviar')}`);
            } catch (error) { alert(`❌ ${t('errores.generico')}: ${error.message}`); }
        }
    };

    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({ ...prev, [name]: value }));
        if (errorEdicion) setErrorEdicion('');
    };

    const handleNuevaImagenCartel = (e) => {
        const file = e.target.files[0];
        if (!file) { setImagenNueva(null); setVistaPreviaImagen(null); return; }
        const tipos = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
        if (!tipos.includes(file.type)) {
            setErrorEdicion(t('crear_torneo_saga.err_imagen_tipo'));
            e.target.value = ''; setImagenNueva(null); setVistaPreviaImagen(null);
            setTimeout(() => setErrorEdicion(''), 4000); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            const mb = (file.size / 1024 / 1024).toFixed(2);
            setErrorEdicion(t('crear_torneo_saga.err_imagen_size', { mb }));
            e.target.value = ''; setImagenNueva(null); setVistaPreviaImagen(null);
            setTimeout(() => setErrorEdicion(''), 5000); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setVistaPreviaImagen(reader.result);
        reader.readAsDataURL(file);
        setImagenNueva(file); setEliminarImagenFlag(false); setErrorEdicion('');
    };

    const handleCancelarNuevaImagen   = () => { setImagenNueva(null); setVistaPreviaImagen(null); const fi = document.getElementById('nuevaImagenCartel'); if (fi) fi.value = ''; };
    const handleEliminarImagenActual  = () => { if (window.confirm(t('vgs.confirm_eliminar_imagen'))) { setEliminarImagenFlag(true); setImagenActual(null); setImagenNueva(null); setVistaPreviaImagen(null); } };
    const handleCancelarEliminacionImagen = () => { setEliminarImagenFlag(false); if (torneo?.imagen_url) setImagenActual(torneo.imagen_url); };

    const handleGuardarCambios = async (e) => {
        e.preventDefault();
        if (!datosEdicion.nombre_torneo.trim()) { setErrorEdicion(t('crear_torneo_saga.val_nombre')); return; }
        if (!datosEdicion.epocas_disponibles?.length) { setErrorEdicion(t('crear_torneo_saga.val_epoca')); return; }
        if (datosEdicion.tipo_torneo === 'Por equipos') {
            if (!datosEdicion.num_jugadores_equipo || datosEdicion.num_jugadores_equipo < JUGADORES_EQUIPO_RANGO.min) {
                setErrorEdicion(t('vgs.val_min_jugadores_equipo', { min: JUGADORES_EQUIPO_RANGO.min })); return;
            }
            if (datosEdicion.epocas_disponibles.length < datosEdicion.num_jugadores_equipo) {
                setErrorEdicion(t('crear_torneo_saga.val_epocas_equipo', { n: datosEdicion.num_jugadores_equipo })); return;
            }
            if (datosEdicion.equipos_max < equipos.length) {
                setErrorEdicion(t('vgs.val_min_equipos', { n: equipos.length })); return;
            }
        } else {
            if (datosEdicion.participantes_max < jugadores.length) {
                setErrorEdicion(t('vgs.val_min_participantes', { n: jugadores.length })); return;
            }
        }
        if (!window.confirm(t('vgs.confirm_guardar'))) return;
        try {
            setLoadingEdicion(true); setErrorEdicion('');
            const datosLimpios = {
                nombre_torneo: datosEdicion.nombre_torneo, tipo_torneo: datosEdicion.tipo_torneo,
                num_jugadores_equipo: datosEdicion.num_jugadores_equipo, rondas_max: datosEdicion.rondas_max,
                puntos_banda: datosEdicion.puntos_banda, participantes_max: datosEdicion.participantes_max,
                equipos_max: datosEdicion.equipos_max, epocas_disponibles: datosEdicion.epocas_disponibles,
                unidades_legendarias: datosEdicion.unidades_legendarias, modelo_gakis: datosEdicion.modelo_gakis,
                warlord_punto_victoria: datosEdicion.warlord_punto_victoria, puntosDeTorneo: datosEdicion.puntosDeTorneo,
                misiones_secundarias: datosEdicion.misiones_secundarias,
                fecha_inicio: datosEdicion.fecha_inicio,
                fecha_fin: duracionTorneo === "1" ? null : (datosEdicion.fecha_fin || null),
                ubicacion: datosEdicion.ubicacion || null, estado: datosEdicion.estado,
                partida_ronda_1: datosEdicion.partida_ronda_1, partida_ronda_2: datosEdicion.partida_ronda_2,
                partida_ronda_3: datosEdicion.partida_ronda_3 || null, partida_ronda_4: datosEdicion.partida_ronda_4 || null,
                partida_ronda_5: datosEdicion.partida_ronda_5 || null,
            };
            let dataToSend;
            if (archivoPDF || eliminarPDF || imagenNueva || eliminarImagenFlag) {
                dataToSend = new FormData();
                Object.keys(datosLimpios).forEach(key => { if (datosLimpios[key] !== null && datosLimpios[key] !== '') dataToSend.append(key, datosLimpios[key]); });
                if (archivoPDF)         dataToSend.append('bases_pdf',     archivoPDF);
                if (eliminarPDF)        dataToSend.append('eliminar_pdf',  'true');
                if (imagenNueva)        dataToSend.append('imagen_cartel', imagenNueva);
                if (eliminarImagenFlag) dataToSend.append('eliminar_imagen','true');
            } else { dataToSend = { ...datosLimpios }; }
            await torneosSagaApi.actualizarTorneo(torneoId, dataToSend);
            alert(`✅ ${t('vgs.exito_actualizar')}`);
            setModoEdicion(false); setArchivoPDF(null); setEliminarPDF(false);
            setImagenNueva(null); setVistaPreviaImagen(null); setEliminarImagenFlag(false);
            await cargarDatos(); if (onUpdate) onUpdate();
        } catch (error) { setErrorEdicion(error.message || t('errores.generico')); }
        finally { setLoadingEdicion(false); }
    };

    const handleCancelarEdicion = () => {
        setModoEdicion(false); setErrorEdicion(''); setArchivoPDF(null); setEliminarPDF(false);
        setImagenNueva(null); setVistaPreviaImagen(null); setEliminarImagenFlag(false);
        if (torneo) {
            let epocas = torneo.epocas_disponibles ? torneo.epocas_disponibles.split('|').map(e => e.trim()).filter(Boolean) : [];
            const fechaInicio = torneo.fecha_inicio?.split('T')[0] || '';
            const fechaFin    = torneo.fecha_fin?.split('T')[0] || '';
            setDuracionTorneo(fechaFin && fechaFin !== fechaInicio ? "2" : "1");
            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '', tipo_torneo: torneo.tipo_torneo === 'Por equipos' ? 'Por equipos' : 'Individual',
                num_jugadores_equipo: torneo.num_jugadores_equipo || JUGADORES_EQUIPO_RANGO.default,
                epocas_disponibles: epocas, rondas_max: torneo.rondas_max || RONDAS_DISPONIBLES[0].valor,
                puntos_banda: torneo.puntos_banda || PUNTOS_BANDA_RANGO.default,
                participantes_max: torneo.participantes_max || PARTICIPANTES_RANGO.default,
                equipos_max: torneo.equipos_max || EQUIPOS_RANGO.default,
                unidades_legendarias: normalizar(torneo.unidades_legendarias), modelo_gakis: normalizar(torneo.modelo_gakis),
                warlord_punto_victoria: normalizar(torneo.warlord_punto_victoria), puntosDeTorneo: normalizar(torneo.puntosDeTorneo),
                misiones_secundarias: normalizar(torneo.misiones_secundarias), personaje_especial: normalizar(torneo.personaje_especial),
                fecha_inicio: fechaInicio, fecha_fin: fechaFin, ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '', partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '', partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || '',
            });
            if (torneo.imagen_url) setImagenActual(torneo.imagen_url);
        }
    };

    const cambiarEstadoTorneo = async (nuevoEstado) => {
        if (torneo.estado === 'finalizado') { alert(`⚠️ ${t('vgs.err_ya_finalizado')}`); return; }

        if (nuevoEstado === 'en_curso') {
            try {
                if (torneo.tipo_torneo === 'Individual') {
                    const jd = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                    const jl = Array.isArray(jd) ? jd : jd.data || [];
                    if (jl.length === 0) { alert(`❌ ${t('vgs.err_sin_jugadores_inicio')}`); return; }
                    const incompletos = jl.filter(j => !j.faccion?.trim() || !j.composicion_ejercito);
                    if (incompletos.length > 0) {
                        alert(`❌ ${t('vgs.err_inscripciones_incompletas')}\n\n${t('vgs.err_hay_incompletas', { n: incompletos.length })}\n\n${incompletos.map(j => `• ${j.nombre_usuario}`).join('\n')}\n\n${t('vgs.err_incompletas_detalle')}`);
                        return;
                    }
                } else {
                    const ed = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                    const el = Array.isArray(ed.data) ? ed.data : [];
                    if (el.length === 0) { alert(`❌ ${t('vgs.err_sin_equipos_inicio')}`); return; }
                    const incompletos = el.filter(eq => eq.miembros.some(m => !m.faccion?.trim() || !m.composicion));
                    if (incompletos.length > 0) {
                        const detalle = incompletos.map(eq => {
                            const miIncompletos = eq.miembros.filter(m => !m.faccion?.trim() || !m.composicion).map(m => m.nombre).join(', ');
                            return `• ${eq.nombre_equipo} → ${miIncompletos}`;
                        }).join('\n');
                        alert(`❌ ${t('vgs.err_inscripciones_incompletas')}\n\n${t('vgs.err_hay_equipos_incompletos', { n: incompletos.length })}\n\n${detalle}\n\n${t('vgs.err_incompletas_equipos_detalle')}`);
                        return;
                    }
                }
                const resp = await torneosSagaApi.verificarPagos(torneoId);
                const { todosPagados, total = 0, pagados = 0, pendientes = 0 } = resp.mensaje;
                if (pendientes > 0 || !todosPagados) {
                    const tipo = torneo.tipo_torneo === 'Por equipos' ? t('vgs.equipos') : t('vgs.participantes');
                    alert(`❌ ${t('vgs.err_pagos_pendientes')}\n\n${t('vgs.total')} ${tipo}: ${total}\n✅ ${t('vgs.pagados')}: ${pagados}\n⏰ ${t('vgs.pendientes')}: ${pendientes}\n\n${t('vgs.err_todos_deben_pagar', { tipo })}`);
                    return;
                }
                const tipo = torneo.tipo_torneo === 'Por equipos' ? t('vgs.equipos') : t('vgs.participantes');
                if (!window.confirm(`▶️ ${t('vgs.confirm_iniciar')}\n\n✅ ${t('vgs.confirm_todos_pagados', { total, tipo })}\n${t('vgs.confirm_continuar')}`)) return;
            } catch (error) { alert(`❌ ${t('vgs.err_verificar_pagos', error)}`); return; }
        }

        const mensajes = {
            pendiente:  `⏸️ ${t('vgs.confirm_pendiente')}`,
            finalizado: `🏁 ${t('vgs.confirm_finalizar')}`,
        };
        if (nuevoEstado !== 'en_curso' && mensajes[nuevoEstado]) { if (!window.confirm(mensajes[nuevoEstado])) return; }
        if (nuevoEstado === 'finalizado') { if (!window.confirm(`⚠️ ${t('vgs.confirm_finalizar_2')}`)) return; }

        try {
            await torneosSagaApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert(`✅ ${t('vgs.exito_estado')}`);
            await cargarDatos(); if (onUpdate) onUpdate();
        } catch (error) { alert(error.message || t('errores.generico')); }
    };

    const eliminarTorneo = async () => {
        if (jugadores.length > 0) { alert(t('vgs.err_eliminar_con_jugadores', { n: jugadores.length })); return; }
        if (!window.confirm(t('vgs.confirm_eliminar_torneo', { nombre: torneo.nombre_torneo }))) return;
        if (!window.confirm(`⚠️ ${t('vgs.confirm_eliminar_torneo_2')}`)) return;
        try {
            await torneosSagaApi.eliminarTorneo(torneoId);
            alert(`✅ ${t('vgs.exito_eliminar_torneo')}`);
            navigate('/');
        } catch (error) { alert(error.message || t('errores.generico')); }
    };

    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 16 * 1024 * 1024) { alert(t('vgs.err_pdf_grande')); return; }
            setArchivoPDF(file); setEliminarPDF(false);
        } else { alert(t('crear_torneo_saga.err_pdf_tipo')); }
    };

    const descargarBases = async () => {
        try { await torneosSagaApi.descargarBasesPDF(torneoId); }
        catch (error) { alert(t('vgs.err_descargar_pdf', error)); }
    };

    const handleAgregarOrganizador = async (e) => {
        e.preventDefault();
        if (!nuevoOrganizadorEmail.trim()) { alert(`⚠️ ${t('vgs.err_email_requerido')}`); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoOrganizadorEmail)) { alert(`⚠️ ${t('registro.errores.email_invalido')}`); return; }
        try {
            setLoadingOrganizadores(true);
            const response = await torneosSagaApi.agregarOrganizador(torneoId, { email: nuevoOrganizadorEmail.trim(), rol: 'organizador' });
            alert(response.data.tipo === 'activo'
                ? `✅ ${t('vgs.exito_org_agregado', { email: nuevoOrganizadorEmail })}`
                : `📧 ${t('vgs.exito_org_invitado', { email: nuevoOrganizadorEmail })}`);
            setNuevoOrganizadorEmail('');
            await cargarOrganizadores();
        } catch (error) { alert(error.message || t('errores.generico')); }
        finally { setLoadingOrganizadores(false); }
    };

    const handleEliminarOrganizador = async (organizadorId, tipo, nombre) => {
        const msg = tipo === 'pendiente'
            ? t('vgs.confirm_cancelar_invitacion', { nombre })
            : t('vgs.confirm_eliminar_org', { nombre });
        if (!window.confirm(msg)) return;
        try {
            setLoadingOrganizadores(true);
            await torneosSagaApi.eliminarOrganizador(torneoId, organizadorId);
            alert(`✅ ${t('vgs.exito_org_eliminado')}`);
            await cargarOrganizadores();
        } catch (error) { alert(error.message || t('errores.generico')); }
        finally { setLoadingOrganizadores(false); }
    };

    // ── Estados de carga ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="vista-general">
            <div className="empty-message">⏳ {t('vgs.cargando')}</div>
        </div>
    );
    if (!torneo) return (
        <div className="vista-general">
            <div className="error-message">⚠️ {t('vgs.err_carga')}</div>
        </div>
    );

    const totalJugadores   = jugadores.length;
    const totalEquipos     = equipos.length;
    const esTorneoEquipos  = torneo.tipo_torneo === 'Por equipos';
    const epocasDisplay    = formatearEpocas(torneo.epocas_disponibles, i18n.language);

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="vista-general">
            {errorEdicion && <div className="error-message">⚠️ {errorEdicion}</div>}

            {modoEdicion ? (
                <form onSubmit={handleGuardarCambios} className="formulario-edicion">

                    {/* INFORMACIÓN BÁSICA */}
                    <fieldset>
                        <legend>📋 {t('crear_torneo_saga.fieldset_basico')}</legend>

                        <label htmlFor="nombre_torneo">{t('crear_torneo_saga.nombre_label')}:*</label>
                        <input type="text" id="nombre_torneo" name="nombre_torneo" value={datosEdicion.nombre_torneo} onChange={handleEdicionChange} required disabled={loadingEdicion} />

                        <label htmlFor="tipo_torneo">{t('crear_torneo_saga.tipo_label')}:*</label>
                        <select id="tipo_torneo" name="tipo_torneo" value={datosEdicion.tipo_torneo} onChange={handleEdicionChange} required disabled={loadingEdicion}>
                            <option value="Individual">🎯 {t('crear_torneo_saga.tipo_individual')}</option>
                            <option value="Por equipos">👥 {t('crear_torneo_saga.tipo_equipos')}</option>
                        </select>

                        {datosEdicion.tipo_torneo === 'Por equipos' && (
                            <>
                                <label htmlFor="num_jugadores_equipo">{t('crear_torneo_saga.jugadores_equipo_label')}:*</label>
                                <input type="number" id="num_jugadores_equipo" name="num_jugadores_equipo" value={datosEdicion.num_jugadores_equipo} onChange={handleEdicionChange} min={JUGADORES_EQUIPO_RANGO.min} max={JUGADORES_EQUIPO_RANGO.max} required disabled={loadingEdicion} />
                                <small>ℹ️ {t('vgs.rango_jugadores_equipo', { min: JUGADORES_EQUIPO_RANGO.min, max: JUGADORES_EQUIPO_RANGO.max })}</small>
                            </>
                        )}

                        {/* SELECTOR DE ÉPOCAS — value ES (clave BD), display localizado */}
                        <label htmlFor="epoca_selector">{t('crear_torneo_saga.epocas_label')}:*</label>
                        <div className="form-row">
                            <select id="epoca_selector" disabled={loadingEdicion}>
                                <option value="">{t('crear_torneo_saga.epocas_selecciona', { n: '' }).trim()}</option>
                                {EPOCAS_SAGA.filter(e => !datosEdicion.epocas_disponibles.includes(e)).map((e) => (
                                    <option key={e} value={e}>{getEpoca(e)}</option>
                                ))}
                            </select>
                            <button type="button" onClick={() => {
                                const sel = document.getElementById('epoca_selector');
                                const ep  = sel.value;
                                if (ep && !datosEdicion.epocas_disponibles.includes(ep)) {
                                    setDatosEdicion(prev => ({ ...prev, epocas_disponibles: [...prev.epocas_disponibles, ep] }));
                                    sel.value = ''; if (errorEdicion) setErrorEdicion('');
                                }
                            }} className="btn-secondary" disabled={loadingEdicion}>
                                ➕ {t('botones.añadir')}
                            </button>
                        </div>

                        {datosEdicion.epocas_disponibles.length > 0 ? (
                            <div className="epocas-seleccionadas">
                                <strong>{t('vgs.epocas_seleccionadas')}:</strong>
                                <div className="epocas-tags">
                                    {datosEdicion.epocas_disponibles.map(ep => (
                                        <div key={ep} className="epoca-tag">
                                            <span>{getEpoca(ep)}</span>
                                            <button type="button" onClick={() => setDatosEdicion(prev => ({ ...prev, epocas_disponibles: prev.epocas_disponibles.filter(e => e !== ep) }))} disabled={loadingEdicion} className="btn-remove-epoca" title={t('botones.eliminar')}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="info-text">ℹ️ {t('vgs.sin_epocas_seleccionadas')}</p>
                        )}

                        {datosEdicion.tipo_torneo === 'Por equipos' && datosEdicion.epocas_disponibles.length < datosEdicion.num_jugadores_equipo && (
                            <p className="error-text">⚠️ {t('crear_torneo_saga.val_epocas_equipo', { n: datosEdicion.num_jugadores_equipo })}</p>
                        )}

                        {/* GAKIS */}
                        <fieldset>
                            <legend>🏆 {t('crear_torneo_saga.gakis_titulo')}</legend>
                            <div className="unidades-legendarias-container">
                                <label className="checkbox-container">
                                    <input type="checkbox" checked={datosEdicion.modelo_gakis === '1'} onChange={(e) => {
                                        const activo = e.target.checked;
                                        setDatosEdicion(prev => ({ ...prev, modelo_gakis: activo ? '1' : '0', ...(!activo && { warlord_punto_victoria: '0', misiones_secundarias: '0', puntosDeTorneo: '0', unidades_legendarias: '0' }) }));
                                    }} disabled={loadingEdicion} />
                                    <span className="checkbox-label"><strong>⚔️ {t('crear_torneo_saga.gakis_activar')}</strong></span>
                                </label>
                                <small className="help-text">{datosEdicion.modelo_gakis === '1' ? t('crear_torneo_saga.gakis_activo') : t('crear_torneo_saga.gakis_inactivo')}</small>
                            </div>
                            {datosEdicion.modelo_gakis === '1' && (
                                <div className="gakis-opciones">
                                    {[
                                        { key: 'warlord_punto_victoria', label: t('crear_torneo_saga.gakis_warlord'), onKey: t('crear_torneo_saga.gakis_warlord_on'), offKey: t('crear_torneo_saga.gakis_warlord_off') },
                                        { key: 'puntosDeTorneo',         label: t('crear_torneo_saga.gakis_pt'),      onKey: t('crear_torneo_saga.gakis_pt_on'),      offKey: t('crear_torneo_saga.gakis_pt_off') },
                                        { key: 'misiones_secundarias',   label: t('crear_torneo_saga.gakis_misiones'),onKey: t('crear_torneo_saga.gakis_misiones_on'),offKey: t('crear_torneo_saga.gakis_misiones_off') },
                                        { key: 'unidades_legendarias',   label: t('crear_torneo_saga.gakis_legendarias'),onKey: t('crear_torneo_saga.gakis_legendarias_on'),offKey: t('crear_torneo_saga.gakis_legendarias_off') },
                                    ].map(({ key, label, onKey, offKey }) => (
                                        <div key={key} className="gakis-opcion-item">
                                            <label className="checkbox-container">
                                                <input type="checkbox" checked={datosEdicion[key] === '1'} onChange={(e) => setDatosEdicion(prev => ({ ...prev, [key]: e.target.checked ? '1' : '0' }))} disabled={loadingEdicion} />
                                                <span className="checkbox-label"><strong>{label}</strong></span>
                                            </label>
                                            <small className="help-text">{datosEdicion[key] === '1' ? onKey : offKey}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </fieldset>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="rondas_max">{t('crear_torneo_saga.rondas_label')}:*</label>
                                <select id="rondas_max" name="rondas_max" value={datosEdicion.rondas_max} onChange={handleEdicionChange} required disabled={loadingEdicion}>
                                    {rondas.map(r => <option key={r.valor} value={r.valor}>{r.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="puntos_banda">{t('crear_torneo_saga.puntos_banda_label')}:*</label>
                                <input type="number" id="puntos_banda" name="puntos_banda" value={datosEdicion.puntos_banda} onChange={handleEdicionChange} min={PUNTOS_BANDA_RANGO.min} max={PUNTOS_BANDA_RANGO.max} required disabled={loadingEdicion} />
                                <small>{PUNTOS_BANDA_RANGO.min}-{PUNTOS_BANDA_RANGO.max} pts</small>
                            </div>
                            {esTorneoEquipos ? (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="equipos_max">{t('crear_torneo_saga.equipos_label')}:*</label>
                                        <input type="number" id="equipos_max" name="equipos_max" value={datosEdicion.equipos_max} onChange={handleEdicionChange} min={Math.max(totalEquipos, EQUIPOS_RANGO.min)} max={EQUIPOS_RANGO.max} required disabled={loadingEdicion} />
                                        <small>{EQUIPOS_RANGO.min}-{EQUIPOS_RANGO.max}</small>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="participantes_calculados">{t('vgs.participantes_calculados')}:</label>
                                        <input type="number" id="participantes_calculados" value={datosEdicion.equipos_max * datosEdicion.num_jugadores_equipo} disabled readOnly className="input-calculado" />
                                        <small>{t('vgs.calculado_auto')}</small>
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="participantes_max">{t('crear_torneo_saga.participantes_label')}:*</label>
                                    <input type="number" id="participantes_max" name="participantes_max" value={datosEdicion.participantes_max} onChange={handleEdicionChange} min={Math.max(totalJugadores, PARTICIPANTES_RANGO.min)} max={PARTICIPANTES_RANGO.max} required disabled={loadingEdicion} />
                                    <small>{PARTICIPANTES_RANGO.min}-{PARTICIPANTES_RANGO.max}</small>
                                </div>
                            )}
                        </div>

                        <label htmlFor="estado">{t('vgs.estado_torneo')}:*</label>
                        <select id="estado" name="estado" value={datosEdicion.estado} onChange={handleEdicionChange} required disabled={loadingEdicion}>
                            {['pendiente','en_curso','finalizado'].map(v => (
                                <option key={v} value={v}>{getEstado(v)}</option>
                            ))}
                        </select>
                    </fieldset>

                    {/* FECHAS */}
                    <fieldset>
                        <legend>📅 {t('crear_torneo_saga.fieldset_fechas')}</legend>
                        <label>{t('crear_torneo_saga.duracion_label')}:*</label>
                        <div className="duracion-torneo-container">
                            <label className="duracion-option">
                                <input type="radio" name="duracionTorneo" value="1" checked={duracionTorneo === "1"} onChange={(e) => { setDuracionTorneo(e.target.value); setDatosEdicion(prev => ({ ...prev, fecha_fin: '' })); }} disabled={loadingEdicion} />
                                📅 {t('crear_torneo_saga.duracion_1dia')}
                            </label>
                            <label className="duracion-option">
                                <input type="radio" name="duracionTorneo" value="2" checked={duracionTorneo === "2"} onChange={(e) => setDuracionTorneo(e.target.value)} disabled={loadingEdicion} />
                                📅 {t('crear_torneo_saga.duracion_varios')}
                            </label>
                        </div>
                        {duracionTorneo === "1" ? (
                            <>
                                <label htmlFor="fecha_inicio">{t('crear_torneo_saga.fecha_torneo_label')}:*</label>
                                <input type="date" id="fecha_inicio" name="fecha_inicio" value={datosEdicion.fecha_inicio} onChange={handleEdicionChange} required disabled={loadingEdicion} />
                                <small className="help-text">{t('crear_torneo_saga.fecha_1dia_hint')}</small>
                            </>
                        ) : (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="fecha_inicio">{t('crear_torneo_saga.fecha_inicio_label')}:*</label>
                                    <input type="date" id="fecha_inicio" name="fecha_inicio" value={datosEdicion.fecha_inicio} onChange={handleEdicionChange} required disabled={loadingEdicion} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fecha_fin">{t('crear_torneo_saga.fecha_fin_label')}:*</label>
                                    <input type="date" id="fecha_fin" name="fecha_fin" value={datosEdicion.fecha_fin} onChange={handleEdicionChange} min={datosEdicion.fecha_inicio} required disabled={loadingEdicion} />
                                </div>
                            </div>
                        )}
                        <label htmlFor="ubicacion">{t('crear_torneo_saga.ubicacion_label')}:</label>
                        <input type="text" id="ubicacion" name="ubicacion" value={datosEdicion.ubicacion} onChange={handleEdicionChange} placeholder={t('crear_torneo_saga.ubicacion_placeholder')} disabled={loadingEdicion} />
                    </fieldset>

                    {/* CARTEL */}
                    <fieldset>
                        <legend>🖼️ {t('crear_torneo_saga.fieldset_cartel')}</legend>
                        {imagenActual && !eliminarImagenFlag && !imagenNueva && (
                            <div className="imagen-actual-container">
                                <p className="imagen-label">{t('vgs.imagen_actual')}:</p>
                                <div className="imagen-actual-preview"><img src={imagenActual} alt={t('vgs.cartel_actual')} className="imagen-preview-img" /></div>
                                <div className="imagen-acciones">
                                    <label htmlFor="nuevaImagenCartel" className="btn-cambiar-imagen">🔄 {t('vgs.cambiar_imagen')}</label>
                                    <input type="file" id="nuevaImagenCartel" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleNuevaImagenCartel} style={{ display: 'none' }} disabled={loadingEdicion} />
                                    <button type="button" onClick={handleEliminarImagenActual} className="btn-eliminar-imagen" disabled={loadingEdicion}>🗑️ {t('crear_torneo_saga.eliminar_imagen')}</button>
                                </div>
                            </div>
                        )}
                        {imagenNueva && vistaPreviaImagen && (
                            <div className="imagen-nueva-container">
                                <p className="imagen-label">{t('vgs.nueva_imagen')}:</p>
                                <div className="archivo-info">
                                    <p className="archivo-nombre">✅ <strong>{imagenNueva.name}</strong></p>
                                    <p className="archivo-tamaño">📦 {(imagenNueva.size / 1024).toFixed(2)} KB ({(imagenNueva.size / 1024 / 1024).toFixed(2)} MB)</p>
                                </div>
                                <div className="imagen-preview"><img src={vistaPreviaImagen} alt={t('crear_torneo_saga.vista_previa')} className="imagen-preview-img" /></div>
                                <button type="button" onClick={handleCancelarNuevaImagen} className="btn-cancelar-nueva-imagen" disabled={loadingEdicion}>❌ {t('vgs.cancelar_cambio_imagen')}</button>
                            </div>
                        )}
                        {(!imagenActual || eliminarImagenFlag) && !imagenNueva && (
                            <div className="sin-imagen-container">
                                {eliminarImagenFlag ? (
                                    <>
                                        <p className="aviso-eliminar">⚠️ {t('vgs.aviso_eliminar_imagen')}</p>
                                        <button type="button" onClick={handleCancelarEliminacionImagen} className="btn-cancelar-eliminacion" disabled={loadingEdicion}>↩️ {t('vgs.cancelar_eliminacion')}</button>
                                    </>
                                ) : (
                                    <p className="sin-imagen-texto">📷 {t('vgs.sin_imagen')}</p>
                                )}
                                <label htmlFor="nuevaImagenCartel" className="btn-subir-imagen">➕ {t('vgs.subir_imagen')}</label>
                                <input type="file" id="nuevaImagenCartel" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleNuevaImagenCartel} style={{ display: 'none' }} disabled={loadingEdicion} />
                                <small className="help-text-file">{t('crear_torneo_saga.cartel_hint')}</small>
                            </div>
                        )}
                    </fieldset>

                    {/* ESCENARIOS — value ES (clave BD), display localizado */}
                    <fieldset>
                        <legend>🎲 {t('crear_torneo_saga.fieldset_escenarios')}</legend>
                        {[1,2,3,4,5].map(ronda => {
                            if (ronda > 3 && ronda > datosEdicion.rondas_max) return null;
                            return (
                                <div key={ronda}>
                                    <label htmlFor={`partida_ronda_${ronda}`}>{t('crear_torneo_saga.ronda_n', { n: ronda })}:{ronda <= 3 ? '*' : ''}</label>
                                    <select id={`partida_ronda_${ronda}`} name={`partida_ronda_${ronda}`} value={datosEdicion[`partida_ronda_${ronda}`]} onChange={handleEdicionChange} required={ronda <= 3} disabled={loadingEdicion}>
                                        <option value="">{t('crear_torneo_saga.escenario_placeholder')}</option>
                                        {TIPOS_PARTIDA_SAGA.map((tipo, i) => <option key={tipo} value={tipo}>{escenarios[i]}</option>)}
                                    </select>
                                </div>
                            );
                        })}
                    </fieldset>

                    {/* PDF */}
                    <fieldset>
                        <legend>📄 {t('crear_torneo_saga.fieldset_pdf')}</legend>
                        {torneo.bases_nombre && !eliminarPDF && (
                            <div className="pdf-actual">
                                <p>📎 {t('vgs.archivo_actual')}: <strong>{torneo.bases_nombre}</strong></p>
                                <button type="button" onClick={() => setEliminarPDF(true)} className="btn-danger mt-10">🗑️ {t('vgs.eliminar_pdf_actual')}</button>
                            </div>
                        )}
                        {eliminarPDF && (
                            <div className="advertencia-finalizado mb-20">
                                <p>⚠️ {t('vgs.aviso_eliminar_pdf')}</p>
                                <button type="button" onClick={() => setEliminarPDF(false)} className="btn-secondary mt-10">↩️ {t('vgs.mantener_pdf')}</button>
                            </div>
                        )}
                        <label htmlFor="bases_pdf">{torneo.bases_nombre && !eliminarPDF ? t('vgs.reemplazar_pdf') : t('crear_torneo_saga.pdf_label')}:</label>
                        <input type="file" id="bases_pdf" accept=".pdf" onChange={handleArchivoPDF} disabled={loadingEdicion} className="input-file-pdf" />
                        {archivoPDF && <p className="success-message mt-10">✅ {t('vgs.nuevo_archivo')}: {archivoPDF.name} ({(archivoPDF.size / 1024).toFixed(2)} KB)</p>}
                    </fieldset>

                    {/* ORGANIZADORES EN EDICIÓN */}
                    <fieldset>
                        <legend>👥 {t('vgs.organizadores')}</legend>
                        <div className="organizadores-section">
                            <h4>✅ {t('vgs.org_activos')}</h4>
                            {organizadores.activos?.length > 0 ? (
                                <div className="organizadores-list">
                                    {organizadores.activos.map(org => (
                                        <div key={org.organizador_id} className="organizador-item">
                                            <div className="organizador-info">
                                                <span className="organizador-nombre">{org.es_creador ? '👑 ' : '👤 '}<strong>{org.nombre_usuario}</strong></span>
                                                <span className="organizador-email">{org.email}</span>
                                                <span className="organizador-rol">{org.rol === 'organizador' ? `🎯 ${t('vgs.rol_organizador')}` : `⚙️ ${t('vgs.rol_admin')}`}</span>
                                            </div>
                                            <button type="button" onClick={() => handleEliminarOrganizador(org.organizador_id, 'activo', org.nombre_usuario)} className="btn-danger-small" disabled={loadingOrganizadores || loadingEdicion} title={t('botones.eliminar')}>❌</button>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="info-text">{t('vgs.solo_creador')}</p>}
                        </div>
                        {organizadores.pendientes?.length > 0 && (
                            <div className="organizadores-section mt-20">
                                <h4>⏳ {t('vgs.invitaciones_pendientes')}</h4>
                                <div className="organizadores-list">
                                    {organizadores.pendientes.map(org => (
                                        <div key={org.organizador_id} className="organizador-item pendiente">
                                            <div className="organizador-info">
                                                <span className="organizador-email">📧 {org.email}</span>
                                                <span className="organizador-fecha">{t('vgs.invitado_el')} {new Date(org.fecha_asignacion).toLocaleDateString(locale)}</span>
                                            </div>
                                            <button onClick={() => handleReenviarInvitacion(org)} className="btn-reenviar" title={t('vgs.reenviar')}>📧</button>
                                            <button type="button" onClick={() => handleEliminarOrganizador(org.organizador_id, 'pendiente', org.email)} className="btn-danger-small" disabled={loadingOrganizadores || loadingEdicion} title={t('vgs.cancelar_invitacion')}>❌</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="agregar-organizador-form mt-20">
                            <h4>➕ {t('vgs.agregar_org')}</h4>
                            <div className="form-row">
                                <input type="email" placeholder={t('registro.email_placeholder')} value={nuevoOrganizadorEmail} onChange={(e) => setNuevoOrganizadorEmail(e.target.value)} disabled={loadingOrganizadores || loadingEdicion} className="input-email-organizador" />
                                <button type="button" onClick={handleAgregarOrganizador} className="btn-success" disabled={loadingOrganizadores || loadingEdicion}>
                                    {loadingOrganizadores ? `⏳ ${t('vgs.agregando')}` : `➕ ${t('botones.añadir')}`}
                                </button>
                            </div>
                            <small className="help-text">ℹ️ {t('vgs.hint_agregar_org')}</small>
                        </div>
                        <div className="button-group">
                            <button type="submit" className="btn-primary" disabled={loadingEdicion}>{loadingEdicion ? `⏳ ${t('modal_partida.guardando')}` : `✅ ${t('perfil.guardar_cambios')}`}</button>
                            <button type="button" className="btn-secondary" onClick={handleCancelarEdicion} disabled={loadingEdicion}>❌ {t('botones.cancelar')}</button>
                        </div>
                    </fieldset>
                </form>
            ) : (
                <>
                    {/* VISTA DE INFORMACIÓN */}
                    <section className="seccion-info-torneo">
                        <div className="section-header-inline">
                            <h2>ℹ️ {t('vgs.info_torneo')}</h2>
                            <div className="botones-accion-grupo">
                                {torneo.estado !== 'finalizado' && (
                                    <>
                                        {torneo.estado === 'pendiente' && (
                                            <button onClick={() => cambiarEstadoTorneo('en_curso')} className="btn-success">▶️ {t('vgs.btn_iniciar')}</button>
                                        )}
                                        {torneo.estado === 'en_curso' && (
                                            <>
                                                <button onClick={() => cambiarEstadoTorneo('pendiente')} className="btn-secondary">⏸️ {t('vgs.btn_volver_pendiente')}</button>
                                                <button onClick={() => cambiarEstadoTorneo('finalizado')} className="btn-warning">🏁 {t('vgs.btn_finalizar')}</button>
                                            </>
                                        )}
                                    </>
                                )}
                                {torneo.estado === 'pendiente' && (
                                    <>
                                        <button className="btn-primary" onClick={() => setModoEdicion(true)}>✏️ {t('vgs.btn_editar')}</button>
                                        <button onClick={eliminarTorneo} className="btn-danger">🗑️ {t('vgs.btn_eliminar')}</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {torneo.estado === 'finalizado' && (
                            <div className="advertencia-finalizado">
                                <strong>🏁 {t('vgs.estado_finalizado_titulo')}</strong>
                                <p>{t('vgs.estado_finalizado_texto')}</p>
                            </div>
                        )}
                        {torneo.estado === 'en_curso' && (
                            <div className="advertencia-no-editable">
                                <strong>▶️ {t('vgs.estado_en_curso_titulo')}</strong>
                                <p>{t('vgs.estado_en_curso_texto')}</p>
                            </div>
                        )}

                        {torneo.imagen_url && (
                            <div className="cartel-vista">
                                <h3>🖼️ {t('vgs.cartel_torneo')}</h3>
                                <img src={torneo.imagen_url} alt={t('vgs.cartel_torneo')} className="cartel-imagen-vista" />
                            </div>
                        )}

                        <div className="info-torneo-grid">
                            <div className="info-item">
                                <label>{t('crear_torneo_saga.tipo_label')}:</label>
                                <span>{esTorneoEquipos ? `👥 ${t('crear_torneo_saga.tipo_equipos')}` : `🎯 ${t('crear_torneo_saga.tipo_individual')}`}</span>
                                {esTorneoEquipos && <span className="info-item-secundario">({torneo?.num_jugadores_equipo || 0} {t('crear_torneo_saga.jugadores')})</span>}
                            </div>
                            <div className="info-item">
                                <label>🎭 {t('crear_torneo_saga.epocas_label')}:</label>
                                <p>{epocasDisplay}</p>
                            </div>
                            <div className="info-item">
                                <label>🎲 {t('crear_torneo_saga.rondas_label')}:</label>
                                <p>{torneo.rondas_max} {t('vgs.rondas')}</p>
                            </div>
                            <div className="info-item">
                                <label>⚔️ {t('crear_torneo_saga.puntos_banda_label')}:</label>
                                <p>{torneo.puntos_banda} {t('insc_ind.puntos')}</p>
                            </div>
                            <div className="info-item">
                                {esTorneoEquipos ? (
                                    <>
                                        <span className="info-item-destacado">👥 {totalEquipos} / {torneo.equipos_max || 0} {t('crear_torneo_saga.equipos_label')}</span>
                                        <span className="info-item-destacado">👤 {totalJugadores} {t('vista_info_saga.jugadores_inscritos', { n: '' }).replace('()', '').trim()}</span>
                                    </>
                                ) : (
                                    <span className="info-item-destacado">👤 {totalJugadores} / {torneo?.participantes_max || 0} {t('crear_torneo_saga.participantes_label')}</span>
                                )}
                            </div>
                            {torneo.ubicacion && <div className="info-item"><label>📍 {t('crear_torneo_saga.ubicacion_label')}:</label><p>{torneo.ubicacion}</p></div>}
                            <div className="info-item">
                                <label>📅 {t('crear_torneo_saga.fecha_inicio_label')}:</label>
                                <p>{new Date(torneo.fecha_inicio).toLocaleDateString(locale)}</p>
                            </div>
                            {torneo.fecha_fin && (
                                <div className="info-item">
                                    <label>📅 {t('crear_torneo_saga.fecha_fin_label')}:</label>
                                    <p>{new Date(torneo.fecha_fin).toLocaleDateString(locale)}</p>
                                </div>
                            )}
                            {torneo.modelo_gakis == '1' && (
                                <div className="info-item-gakis">
                                    <label>🏆 {t('crear_torneo_saga.gakis_titulo')}:</label>
                                    <div className="gakis-resumen">
                                        <span className="badge-activo">✅ {t('insc_ind.activadas')}</span>
                                        <ul className="gakis-resumen-lista">
                                            <li>{torneo.warlord_punto_victoria == '1' ? `${t('crear_torneo_saga.gakis_warlord')} ✅` : `${t('crear_torneo_saga.gakis_warlord_off')} ❌`}</li>
                                            <li>{torneo.puntosDeTorneo == 1 ? `${t('crear_torneo_saga.gakis_pt_on')} ✅` : `${t('crear_torneo_saga.gakis_pt_off')} ❌`}</li>
                                            <li>{torneo.misiones_secundarias == '1' ? `${t('crear_torneo_saga.gakis_misiones_on')} ✅` : `${t('crear_torneo_saga.gakis_misiones_off')} ❌`}</li>
                                            <li>{torneo.unidades_legendarias == '1' ? `${t('crear_torneo_saga.gakis_legendarias_on')} ✅` : `${t('crear_torneo_saga.gakis_legendarias_off')} ❌`}</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ESCENARIOS */}
                    <section className="seccion-rondas">
                        <h2>🎮 {t('vgs.escenarios_torneo')}</h2>
                        <div className="rondas-list">
                            {esTorneoEquipos ? (
                                <div className="ronda-item">
                                    <span className="ronda-numero">{t('vgs.partidas_por_ronda')}:</span>
                                    <div className="partidas-container">
                                        {[1,2,3,4,5].map(r => {
                                            if (r > torneo.rondas_max) return null;
                                            const p = torneo[`partida_ronda_${r}`];
                                            if (!p) return null;
                                            return <span key={r} className="ronda-escenario-equipos">{getEscenario(p)}</span>;
                                        })}
                                    </div>
                                </div>
                            ) : (
                                [1,2,3,4,5].map(r => {
                                    if (r > torneo.rondas_max) return null;
                                    const p = torneo[`partida_ronda_${r}`];
                                    if (!p) return null;
                                    return (
                                        <div key={r} className="ronda-item">
                                            <span className="ronda-numero">{t('crear_torneo_saga.ronda_n', { n: r })}:</span>
                                            <div className="partidas-container">
                                                <span className="ronda-escenario">{getEscenario(p)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* BASES PDF */}
                    <section className="seccion-bases">
                        <h2>📄 {t('crear_torneo_saga.fieldset_pdf')}</h2>
                        {torneo.bases_nombre ? (
                            <div className="bases-existentes">
                                <p>📎 {t('vgs.archivo_actual')}: <strong>{torneo.bases_nombre}</strong>
                                {torneo.base_tamaño && ` (${(torneo.base_tamaño / 1024).toFixed(2)} KB)`}</p>
                                <button onClick={descargarBases} className="btn-primary">⬇️ {t('vgs.descargar_bases')}</button>
                            </div>
                        ) : (
                            <p>ℹ️ {t('vgs.sin_bases')}</p>
                        )}
                    </section>

                    {/* ORGANIZADORES VISTA */}
                    <section className="seccion-organizadores">
                        <h2>👥 {t('vgs.organizadores')}</h2>
                        {organizadores.activos?.length > 0 ? (
                            <div className="organizadores-grid">
                                {organizadores.activos.map(org => (
                                    <div key={org.organizador_id} className="organizador-card">
                                        <div className="organizador-avatar">{org.es_creador ? '👑' : '👤'}</div>
                                        <div className="organizador-datos">
                                            <h3>{org.nombre_usuario}{org.es_creador && <span className="badge-creador">{t('vgs.creador')}</span>}</h3>
                                            <p className="organizador-email-display">{org.email}</p>
                                            <p className="organizador-rol-display">{org.rol === 'organizador' ? `🎯 ${t('vgs.rol_organizador')}` : `⚙️ ${t('vgs.rol_admin')}`}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="info-text">{t('vgs.solo_creador')}</p>}
                        {organizadores.pendientes?.length > 0 && (
                            <div className="invitaciones-pendientes-vista mt-20">
                                <h3>⏳ {t('vgs.invitaciones_pendientes')} ({organizadores.pendientes.length})</h3>
                                <div className="invitaciones-list">
                                    {organizadores.pendientes.map(org => (
                                        <div key={org.organizador_id} className="invitacion-item">
                                            <span>📧 {org.email}</span>
                                            <span className="fecha-invitacion">{new Date(org.fecha_asignacion).toLocaleDateString(locale)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default VistaGeneralSaga;