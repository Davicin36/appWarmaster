import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../servicios/AuthContext.jsx";

import torneosSagaApi from '../servicios/apiSaga.js';
import {
    EPOCAS_SAGA,
    TIPOS_PARTIDA_SAGA,
    RONDAS_DISPONIBLES,
    PUNTOS_BANDA_RANGO,
    PARTICIPANTES_RANGO,
    EQUIPOS_RANGO,
    JUGADORES_EQUIPO_RANGO,
    useSagaI18n,
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga.js';
import Footer from '@/paginas/Footer.jsx';
import '../estilos/crearTorneo.css';

function CrearTorneoSaga() {
    const navigate = useNavigate();
    const { refrescarUsuario } = useAuth();
    const { t } = useTranslation();
    const { epocas, escenarios, rondas, getEpoca } = useSagaI18n();

    const [loading,              setLoading]              = useState(false);
    const [error,                setError]                = useState("");
    const [nombreTorneo,         setNombreTorneo]         = useState("");
    const [tipoTorneo,           settipoTorneo]           = useState("Individual");
    const [numJugadoresEquipo,   setNumJugadoresEquipo]   = useState(JUGADORES_EQUIPO_RANGO.default);
    const [rondasMax,            setRondasMax]            = useState(RONDAS_DISPONIBLES[0].valor);
    const [epocasSeleccionadas,  setEpocasSeleccionadas]  = useState([]);
    const [fechaInicio,          setFechaInicio]          = useState("");
    const [duracionTorneo,       setDuracionTorneo]       = useState("1");
    const [fechaFin,             setFechaFin]             = useState("");
    const [ubicacion,            setUbicacion]            = useState("");
    const [imagenCartel,         setImagenCartel]         = useState(null);
    const [vistaPrevia,          setVistaPrevia]          = useState(null);
    const [puntosBanda,          setPuntosBanda]          = useState(PUNTOS_BANDA_RANGO.default);
    const [unidadesLegendarias,  setUnidadesLegendarias]  = useState(false);
    const [modeloGakis,          setModeloGakis]          = useState(false);
    const [warlordPuntoVictoria, setWarlordPuntoVictoria] = useState(false);
    const [puntosDeTorneo,       setPuntosDeTorneo]       = useState(false);
    const [misionesSecundarias,  setMisionesSecundarias]  = useState(false);
    const [participantesMax,     setParticipantesMax]     = useState(PARTICIPANTES_RANGO.default);
    const [equiposMax,           setEquiposMax]           = useState(EQUIPOS_RANGO.default);
    const [archivoPDF,           setArchivoPDF]           = useState(null);
    const [partidaRonda1,        setPartidaRonda1]        = useState("");
    const [partidaRonda2,        setPartidaRonda2]        = useState("");
    const [partidaRonda3,        setPartidaRonda3]        = useState("");
    const [partidaRonda4,        setPartidaRonda4]        = useState("");
    const [partidaRonda5,        setPartidaRonda5]        = useState("");
    const [organizadorAdicional, setOrganizadorAdicional] = useState("");
    const [emailOrganizador,     setEmailOrganizador]     = useState("");

    useEffect(() => {
        if (tipoTorneo === "Por equipos") setParticipantesMax(equiposMax * numJugadoresEquipo);
    }, [equiposMax, numJugadoresEquipo, tipoTorneo]);

    // ─── HANDLERS ────────────────────────────────────────────────────────────

    const handleImagenCartel = (e) => {
        const file = e.target.files[0];
        if (!file) { setImagenCartel(null); setVistaPrevia(null); return; }

        const tiposPermitidos = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            setError(t('crear_torneo_saga.err_imagen_tipo'));
            e.target.value = ''; setImagenCartel(null); setVistaPrevia(null);
            setTimeout(() => setError(''), 4000); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            const mb = (file.size / 1024 / 1024).toFixed(2);
            setError(t('crear_torneo_saga.err_imagen_size', { mb }));
            e.target.value = ''; setImagenCartel(null); setVistaPrevia(null);
            setTimeout(() => setError(''), 5000); return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setVistaPrevia(reader.result);
        reader.readAsDataURL(file);
        setImagenCartel(file); setError('');
    };

    const handleEliminarImagen = () => {
        setImagenCartel(null); setVistaPrevia(null);
        const fi = document.getElementById('imagenCartel');
        if (fi) fi.value = '';
    };

    const handleModeloGakis = (activado) => {
        setModeloGakis(activado);
        if (!activado) { setWarlordPuntoVictoria(false); setPuntosDeTorneo(false); }
    };

    const handleEpocaSeleccion = (epoca) => {
        if (tipoTorneo === "Individual") {
            setEpocasSeleccionadas([epoca]);
        } else {
            if (epocasSeleccionadas.includes(epoca)) {
                setEpocasSeleccionadas(epocasSeleccionadas.filter(e => e !== epoca));
            } else if (epocasSeleccionadas.length < numJugadoresEquipo) {
                setEpocasSeleccionadas([...epocasSeleccionadas, epoca]);
            } else {
                setError(t('crear_torneo_saga.err_epocas_max', { n: numJugadoresEquipo }));
                setTimeout(() => setError(""), 3000);
            }
        }
    };

    const handleReseteaEpocas = (tipo) => { settipoTorneo(tipo); setEpocasSeleccionadas([]); };

    const handleAnadirOrganizador = () => {
        const emailCorto = emailOrganizador.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCorto)) {
            setError(t('registro.errores.email_invalido'));
            setTimeout(() => setError(""), 3000); return;
        }
        if (organizadorAdicional.length >= 5) {
            setError(t('crear_torneo_saga.err_org_max'));
            setTimeout(() => setError(""), 3000); return;
        }
        setOrganizadorAdicional([...organizadorAdicional, emailCorto]);
        setEmailOrganizador(""); setError("");
    };

    const handleEliminarOrganizador = (email) =>
        setOrganizadorAdicional(organizadorAdicional.filter(org => org !== email));

    const handleKeyPressOrganizador = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAnadirOrganizador(); }
    };

    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (!file) { setArchivoPDF(null); return; }
        if (file.type !== 'application/pdf') {
            setError(t('crear_torneo_saga.err_pdf_tipo'));
            e.target.value = ''; setArchivoPDF(null);
            setTimeout(() => setError(''), 4000); return;
        }
        if (file.size > 16 * 1024 * 1024) {
            const mb = (file.size / 1024 / 1024).toFixed(2);
            setError(t('crear_torneo_saga.err_pdf_size', { mb }));
            e.target.value = ''; setArchivoPDF(null);
            setTimeout(() => setError(''), 5000); return;
        }
        setArchivoPDF(file); setError('');
    };

    const handleEliminarPDF = () => {
        setArchivoPDF(null);
        const fi = document.getElementById('basesPDF');
        if (fi) fi.value = '';
    };

    // ─── SUBMIT ───────────────────────────────────────────────────────────────

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError("");

        if (!nombreTorneo.trim())                               { setError(t('crear_torneo_saga.val_nombre'));          setLoading(false); return; }
        if (epocasSeleccionadas.length === 0)                   { setError(t('crear_torneo_saga.val_epoca'));           setLoading(false); return; }
        if (tipoTorneo === "Individual" && epocasSeleccionadas.length !== 1) { setError(t('crear_torneo_saga.val_epoca_individual')); setLoading(false); return; }
        if (tipoTorneo === "Por equipos" && epocasSeleccionadas.length < numJugadoresEquipo) {
            setError(t('crear_torneo_saga.val_epocas_equipo', { n: numJugadoresEquipo }));
            setLoading(false); return;
        }
        if (!fechaInicio)                                       { setError(t('crear_torneo_saga.val_fecha'));           setLoading(false); return; }
        if (!partidaRonda1 || !partidaRonda2 || !partidaRonda3) { setError(t('crear_torneo_saga.val_escenarios'));      setLoading(false); return; }
        if (rondasMax >= 4 && !partidaRonda4)                   { setError(t('crear_torneo_saga.val_ronda4'));          setLoading(false); return; }
        if (rondasMax >= 5 && !partidaRonda5)                   { setError(t('crear_torneo_saga.val_ronda5'));          setLoading(false); return; }
        if (participantesMax < PARTICIPANTES_RANGO.min || participantesMax > PARTICIPANTES_RANGO.max) {
            setError(t('crear_torneo_saga.val_participantes', { min: PARTICIPANTES_RANGO.min, max: PARTICIPANTES_RANGO.max }));
            setLoading(false); return;
        }
        if (equiposMax < EQUIPOS_RANGO.min || equiposMax > EQUIPOS_RANGO.max) {
            setError(t('crear_torneo_saga.val_equipos', { min: EQUIPOS_RANGO.min, max: EQUIPOS_RANGO.max }));
            setLoading(false); return;
        }

        try {
            let torneoData;

            if (archivoPDF || imagenCartel) {
                torneoData = new FormData();
                torneoData.append('nombre_torneo',          nombreTorneo);
                torneoData.append('tipo_torneo',            tipoTorneo);
                if (tipoTorneo === "Por equipos") torneoData.append('num_jugadores_equipo', parseInt(numJugadoresEquipo));
                torneoData.append('rondas_max',             parseInt(rondasMax));
                torneoData.append('epocas_disponibles',     JSON.stringify(epocasSeleccionadas));
                torneoData.append('fecha_inicio',           fechaInicio);
                torneoData.append('fecha_fin',              fechaFin || '');
                torneoData.append('ubicacion',              ubicacion || '');
                torneoData.append('puntos_banda',           parseInt(puntosBanda));
                torneoData.append('unidades_legendarias',   unidadesLegendarias   ? '1' : '0');
                torneoData.append('modelo_gakis',           modeloGakis           ? '1' : '0');
                torneoData.append('warlord_punto_victoria', warlordPuntoVictoria  ? '1' : '0');
                torneoData.append('puntosDeTorneo',         puntosDeTorneo        ? '1' : '0');
                torneoData.append('misiones_secundarias',   misionesSecundarias   ? '1' : '0');
                torneoData.append('participantes_max',      parseInt(participantesMax));
                torneoData.append('equipos_max',            parseInt(equiposMax));
                torneoData.append('partida_ronda_1',        partidaRonda1);
                torneoData.append('partida_ronda_2',        partidaRonda2);
                torneoData.append('partida_ronda_3',        partidaRonda3);
                torneoData.append('partida_ronda_4',        rondasMax >= 4 ? partidaRonda4 : '');
                torneoData.append('partida_ronda_5',        rondasMax >= 5 ? partidaRonda5 : '');
                torneoData.append('organizadores_adicionales', JSON.stringify(organizadorAdicional));
                if (archivoPDF)    torneoData.append('bases_pdf',     archivoPDF);
                if (imagenCartel)  torneoData.append('imagen_cartel', imagenCartel);
            } else {
                torneoData = {
                    nombre_torneo:          nombreTorneo,
                    tipo_torneo:            tipoTorneo,
                    num_jugadores_equipo:   tipoTorneo === "Por equipos" ? parseInt(numJugadoresEquipo) : null,
                    rondas_max:             parseInt(rondasMax),
                    epocas_disponibles:     epocasSeleccionadas,
                    fecha_inicio:           fechaInicio,
                    fecha_fin:              fechaFin  || null,
                    ubicacion:              ubicacion || null,
                    puntos_banda:           parseInt(puntosBanda),
                    unidades_legendarias:   unidadesLegendarias   ? '1' : '0',
                    modelo_gakis:           modeloGakis           ? '1' : '0',
                    warlord_punto_victoria: warlordPuntoVictoria  ? '1' : '0',
                    puntosDeTorneo:         puntosDeTorneo        ? '1' : '0',
                    misiones_secundarias:   misionesSecundarias   ? '1' : '0',
                    participantes_max:      parseInt(participantesMax),
                    equipos_max:            parseInt(equiposMax),
                    partida_ronda_1:        partidaRonda1,
                    partida_ronda_2:        partidaRonda2,
                    partida_ronda_3:        partidaRonda3,
                    partida_ronda_4:        rondasMax >= 4 ? partidaRonda4 : null,
                    partida_ronda_5:        rondasMax >= 5 ? partidaRonda5 : null,
                    organizadores_emails:   organizadorAdicional
                };
            }

            const result = await torneosSagaApi.crearTorneo(torneoData);

            if (result.success || result.data) {
                const partes = [
                    t('crear_torneo_saga.exito', { nombre: nombreTorneo }),
                    archivoPDF   ? t('crear_torneo_saga.exito_pdf')    : '',
                    imagenCartel ? t('crear_torneo_saga.exito_imagen') : '',
                    t('crear_torneo_saga.exito_organizador')
                ].filter(Boolean);
                alert(partes.join('\n'));
                await refrescarUsuario();
                navigate("/perfil");
            } else {
                throw new Error(result.error || t('errores.generico'));
            }

        } catch (err) {
            console.error("❌ Error completo:", err);
            let msg = t('crear_torneo_saga.err_crear');
            if (err.message) {
                if      (err.message.includes('max_allowed_packet')) msg = t('crear_torneo_saga.err_archivos_grandes');
                else if (err.message.includes('LIMIT_FILE_SIZE'))    msg = t('crear_torneo_saga.err_size_servidor');
                else if (err.message.includes('Network') || err.message.includes('fetch')) msg = t('errores.conexion');
                else if (err.message.includes('timeout'))            msg = t('errores.timeout');
                else msg = `⚠️ ${err.message}`;
            }
            setError(msg);
            setTimeout(() => setError(''), 8000);
        } finally {
            setLoading(false);
        }
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div className="crear-torneo-container">
            <h1>⚔️ {t('crear_torneo_saga.titulo')}</h1>

            {error && <div className="error-message">⚠️ {error}</div>}

            <form className="torneo-form" onSubmit={handleSubmit}>

                {/* INFORMACIÓN BÁSICA */}
                <fieldset>
                    <legend>📋 {t('crear_torneo_saga.fieldset_basico')}</legend>

                    <label htmlFor="nombreTorneo">{t('crear_torneo_saga.nombre_label')}:*</label>
                    <input name="nombreTorneo" id="nombreTorneo" type="text"
                        value={nombreTorneo} onChange={(e) => setNombreTorneo(e.target.value)}
                        placeholder={t('crear_torneo_saga.nombre_placeholder')}
                        required disabled={loading} />

                    <label>{t('crear_torneo_saga.tipo_label')}:*</label>
                    <div className="tipo-torneo-container">
                        {[["Individual", "👤"], ["Por equipos", "👥"]].map(([val, ico]) => (
                            <label key={val} className="tipo-torneo-option">
                                <input type="radio" name="tipoTorneo" value={val}
                                    checked={tipoTorneo === val}
                                    onChange={(e) => handleReseteaEpocas(e.target.value)}
                                    disabled={loading} />
                                {ico} {t(`crear_torneo_saga.tipo_${val === 'Individual' ? 'individual' : 'equipos'}`)}
                            </label>
                        ))}
                    </div>

                    {tipoTorneo === "Por equipos" && (
                        <>
                            <label htmlFor="numJugadoresEquipo">{t('crear_torneo_saga.jugadores_equipo_label')}:*</label>
                            <select name="numJugadoresEquipo" id="numJugadoresEquipo"
                                value={numJugadoresEquipo}
                                onChange={(e) => { setNumJugadoresEquipo(parseInt(e.target.value)); setEpocasSeleccionadas([]); }}
                                required disabled={loading}>
                                {Array.from({ length: JUGADORES_EQUIPO_RANGO.max - JUGADORES_EQUIPO_RANGO.min + 1 },
                                    (_, i) => JUGADORES_EQUIPO_RANGO.min + i
                                ).map(num => (
                                    <option key={num} value={num}>{num} {t('crear_torneo_saga.jugadores')}</option>
                                ))}
                            </select>
                            <small className="help-text">{t('crear_torneo_saga.jugadores_equipo_hint')}</small>
                        </>
                    )}

                    <label>
                        {tipoTorneo === "Individual" ? t('crear_torneo_saga.epoca_label') : t('crear_torneo_saga.epocas_label')}:*
                        {tipoTorneo === "Por equipos" && (
                            <small className="label-hint">
                                ({t('crear_torneo_saga.epocas_selecciona', { n: numJugadoresEquipo })})
                            </small>
                        )}
                    </label>

                    {/* SISTEMA GAKIS */}
                    <fieldset>
                        <legend>🏆 {t('crear_torneo_saga.gakis_titulo')}</legend>

                        <div className="unidades-legendarias-container">
                            <label className="checkbox-container">
                                <input type="checkbox" checked={modeloGakis}
                                    onChange={(e) => handleModeloGakis(e.target.checked)} disabled={loading} />
                                <span className="checkbox-label">
                                    <strong>⚔️ {t('crear_torneo_saga.gakis_activar')}</strong>
                                </span>
                            </label>
                            <small className="help-text">
                                {modeloGakis ? t('crear_torneo_saga.gakis_activo') : t('crear_torneo_saga.gakis_inactivo')}
                            </small>
                        </div>

                        {modeloGakis && (
                            <div className="gakis-opciones">
                                {/* Warlord PV */}
                                <div className="gakis-opcion-item">
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={warlordPuntoVictoria}
                                            onChange={(e) => setWarlordPuntoVictoria(e.target.checked)} disabled={loading} />
                                        <span className="checkbox-label"><strong>🗡️ {t('crear_torneo_saga.gakis_warlord')}</strong></span>
                                    </label>
                                    <small className="help-text">
                                        {warlordPuntoVictoria ? t('crear_torneo_saga.gakis_warlord_on') : t('crear_torneo_saga.gakis_warlord_off')}
                                    </small>
                                </div>
                                {/* Puntos de Torneo */}
                                <div className="gakis-opcion-item">
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={puntosDeTorneo}
                                            onChange={(e) => setPuntosDeTorneo(e.target.checked)} disabled={loading} />
                                        <span className="checkbox-label"><strong>🎯 {t('crear_torneo_saga.gakis_pt')}</strong></span>
                                    </label>
                                    <small className="help-text">
                                        {puntosDeTorneo ? t('crear_torneo_saga.gakis_pt_on') : t('crear_torneo_saga.gakis_pt_off')}
                                    </small>
                                </div>
                                {/* Misiones Secundarias */}
                                <div className="gakis-opcion-item">
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={misionesSecundarias}
                                            onChange={(e) => setMisionesSecundarias(e.target.checked)} disabled={loading} />
                                        <span className="checkbox-label"><strong>📜 {t('crear_torneo_saga.gakis_misiones')}</strong></span>
                                    </label>
                                    <small className="help-text">
                                        {misionesSecundarias ? t('crear_torneo_saga.gakis_misiones_on') : t('crear_torneo_saga.gakis_misiones_off')}
                                    </small>
                                </div>
                                {/* Unidades Legendarias */}
                                <div className="gakis-opcion-item">
                                    <label className="checkbox-container">
                                        <input type="checkbox" checked={unidadesLegendarias}
                                            onChange={(e) => setUnidadesLegendarias(e.target.checked)} disabled={loading} />
                                        <span className="checkbox-label"><strong>📜 {t('crear_torneo_saga.gakis_legendarias')}</strong></span>
                                    </label>
                                    <small className="help-text">
                                        {unidadesLegendarias ? t('crear_torneo_saga.gakis_legendarias_on') : t('crear_torneo_saga.gakis_legendarias_off')}
                                    </small>
                                </div>
                            </div>
                        )}
                    </fieldset>

                    {/* ÉPOCAS — value ES (clave BD), display localizado */}
                    <div className="epocas-grid">
                        {EPOCAS_SAGA.map((epoca, i) => (
                            <label key={epoca} className="epoca-option">
                                <input type={tipoTorneo === "Individual" ? "radio" : "checkbox"}
                                    name={tipoTorneo === "Individual" ? "epocaIndividual" : undefined}
                                    checked={epocasSeleccionadas.includes(epoca)}
                                    onChange={() => handleEpocaSeleccion(epoca)} disabled={loading} />
                                {epocas[i]}
                            </label>
                        ))}
                    </div>
                    {epocasSeleccionadas.length > 0 && (
                        <div className="epocas-seleccionadas">
                            {tipoTorneo === "Individual" ? (
                                <>✅ {t('crear_torneo_saga.epoca_seleccionada')}: <strong>{getEpoca(epocasSeleccionadas[0])}</strong></>
                            ) : (
                                <>✅ {epocasSeleccionadas.length}/{numJugadoresEquipo} {t('crear_torneo_saga.epocas_seleccionadas')}: <strong>{epocasSeleccionadas.map(e => getEpoca(e)).join(', ')}</strong></>
                            )}
                        </div>
                    )}

                    <label htmlFor="rondasMax">{t('crear_torneo_saga.rondas_label')}:*</label>
                    <select name="rondasMax" id="rondasMax" value={rondasMax}
                        onChange={(e) => setRondasMax(parseInt(e.target.value))} required disabled={loading}>
                        {rondas.map(r => (
                            <option key={r.valor} value={r.valor}>{r.nombre}</option>
                        ))}
                    </select>

                    <label htmlFor="puntosBanda">{t('crear_torneo_saga.puntos_banda_label')}:*</label>
                    <input name="puntosBanda" id="puntosBanda" type="number"
                        min={PUNTOS_BANDA_RANGO.min} max={PUNTOS_BANDA_RANGO.max}
                        value={puntosBanda} onChange={(e) => setPuntosBanda(e.target.value)}
                        required disabled={loading} />
                    <small className="help-text">
                        {t('crear_torneo_saga.puntos_banda_hint', { min: PUNTOS_BANDA_RANGO.min, max: PUNTOS_BANDA_RANGO.max })}
                    </small>

                    <label htmlFor="participantesMax">{t('crear_torneo_saga.participantes_label')}:*</label>
                    <input name="participantesMax" id="participantesMax" type="number"
                        min={PARTICIPANTES_RANGO.min} max={PARTICIPANTES_RANGO.max}
                        value={participantesMax} onChange={(e) => setParticipantesMax(e.target.value)}
                        placeholder={t('crear_torneo_saga.participantes_placeholder')}
                        required disabled={tipoTorneo === "Por equipos" || loading} />
                    <small className="help-text">
                        {t('crear_torneo_saga.participantes_hint', { min: PARTICIPANTES_RANGO.min, max: PARTICIPANTES_RANGO.max })}
                    </small>

                    {tipoTorneo === "Por equipos" && (
                        <>
                            <label htmlFor="equiposMax">{t('crear_torneo_saga.equipos_label')}:*</label>
                            <input name="equiposMax" id="equiposMax" type="number"
                                min={EQUIPOS_RANGO.min} max={EQUIPOS_RANGO.max}
                                value={equiposMax}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setEquiposMax(v);
                                    if (tipoTorneo === "Por equipos") setParticipantesMax(v * numJugadoresEquipo);
                                }}
                                placeholder={t('crear_torneo_saga.equipos_placeholder')}
                                required={tipoTorneo === "Por equipos"} disabled={loading} />
                            <small className="help-text">
                                {t('crear_torneo_saga.equipos_hint', { min: EQUIPOS_RANGO.min, max: EQUIPOS_RANGO.max })}
                            </small>
                        </>
                    )}
                </fieldset>

                {/* FECHAS Y UBICACIÓN */}
                <fieldset>
                    <legend>📅 {t('crear_torneo_saga.fieldset_fechas')}</legend>

                    <label>{t('crear_torneo_saga.duracion_label')}:*</label>
                    <div className="duracion-torneo-container">
                        <label className="duracion-option">
                            <input type="radio" name="duracionTorneo" value="1"
                                checked={duracionTorneo === "1"}
                                onChange={(e) => { setDuracionTorneo(e.target.value); setFechaFin(""); }} disabled={loading} />
                            📅 {t('crear_torneo_saga.duracion_1dia')}
                        </label>
                        <label className="duracion-option">
                            <input type="radio" name="duracionTorneo" value="2"
                                checked={duracionTorneo === "2"}
                                onChange={(e) => setDuracionTorneo(e.target.value)} disabled={loading} />
                            📅 {t('crear_torneo_saga.duracion_varios')}
                        </label>
                    </div>

                    {duracionTorneo === "1" ? (
                        <>
                            <label htmlFor="fechaInicio">{t('crear_torneo_saga.fecha_torneo_label')}:*</label>
                            <input name="fechaInicio" id="fechaInicio" type="date"
                                value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} required disabled={loading} />
                            <small className="help-text">{t('crear_torneo_saga.fecha_1dia_hint')}</small>
                        </>
                    ) : (
                        <>
                            <label htmlFor="fechaInicio">{t('crear_torneo_saga.fecha_inicio_label')}:*</label>
                            <input name="fechaInicio" id="fechaInicio" type="date"
                                value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} required disabled={loading} />
                            <label htmlFor="fechaFin">{t('crear_torneo_saga.fecha_fin_label')}:*</label>
                            <input name="fechaFin" id="fechaFin" type="date"
                                value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                                min={fechaInicio || new Date().toISOString().split('T')[0]} required disabled={loading} />
                            <small className="help-text">{t('crear_torneo_saga.fecha_varios_hint')}</small>
                        </>
                    )}

                    <label htmlFor="ubicacion">{t('crear_torneo_saga.ubicacion_label')}:</label>
                    <input name="ubicacion" id="ubicacion" type="text"
                        value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
                        placeholder={t('crear_torneo_saga.ubicacion_placeholder')} disabled={loading} />
                </fieldset>

                {/* CARTEL */}
                <fieldset>
                    <legend>🖼️ {t('crear_torneo_saga.fieldset_cartel')}</legend>
                    {!imagenCartel ? (
                        <>
                            <label htmlFor="imagenCartel">{t('crear_torneo_saga.cartel_label')}:</label>
                            <input name="imagenCartel" id="imagenCartel" type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleImagenCartel} disabled={loading} />
                            <small className="help-text-file">{t('crear_torneo_saga.cartel_hint')}</small>
                        </>
                    ) : (
                        <div className="archivo-seleccionado-container">
                            <div className="archivo-info">
                                <p className="archivo-nombre">✅ <strong>{t('crear_torneo_saga.imagen_seleccionada')}:</strong> {imagenCartel.name}</p>
                                <p className="archivo-tamaño">📦 {t('crear_torneo_saga.tamaño')}: {(imagenCartel.size / 1024).toFixed(2)} KB ({(imagenCartel.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                            {vistaPrevia && (
                                <div className="imagen-preview">
                                    <p className="preview-titulo">{t('crear_torneo_saga.vista_previa')}:</p>
                                    <img src={vistaPrevia} alt={t('crear_torneo_saga.vista_previa')} className="imagen-preview-img" />
                                </div>
                            )}
                            <button type="button" onClick={handleEliminarImagen} className="btn-eliminar-pdf" disabled={loading}>
                                🗑️ {t('crear_torneo_saga.eliminar_imagen')}
                            </button>
                        </div>
                    )}
                </fieldset>

                {/* PDF */}
                <fieldset>
                    <legend>📄 {t('crear_torneo_saga.fieldset_pdf')}</legend>
                    {!archivoPDF ? (
                        <>
                            <label htmlFor="basesPDF">{t('crear_torneo_saga.pdf_label')}:</label>
                            <input name="basesPDF" id="basesPDF" type="file" accept=".pdf"
                                onChange={handleArchivoPDF} disabled={loading} />
                            <small className="help-text-file">{t('crear_torneo_saga.pdf_hint')}</small>
                        </>
                    ) : (
                        <div className="archivo-seleccionado-container">
                            <div className="archivo-info">
                                <p className="archivo-nombre">✅ <strong>{t('crear_torneo_saga.pdf_seleccionado')}:</strong> {archivoPDF.name}</p>
                                <p className="archivo-tamaño">📦 {t('crear_torneo_saga.tamaño')}: {(archivoPDF.size / 1024).toFixed(2)} KB ({(archivoPDF.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                            <button type="button" onClick={handleEliminarPDF} className="btn-eliminar-pdf" disabled={loading}>
                                🗑️ {t('crear_torneo_saga.eliminar_pdf')}
                            </button>
                        </div>
                    )}
                </fieldset>

                {/* ORGANIZADORES ADICIONALES */}
                <fieldset>
                    <legend>👥 {t('crear_torneo_saga.fieldset_organizadores')}</legend>
                    <label htmlFor="emailOrganizador">{t('crear_torneo_saga.org_label')}:</label>
                    <div className="organizador-input-container">
                        <input name="emailOrganizador" id="emailOrganizador" type="email"
                            value={emailOrganizador}
                            onChange={(e) => setEmailOrganizador(e.target.value)}
                            onKeyPress={handleKeyPressOrganizador}
                            placeholder={t('registro.email_placeholder')} disabled={loading} />
                        <button type="button" onClick={handleAnadirOrganizador}
                            className="btn-añadir-organizador"
                            disabled={loading || !emailOrganizador.trim()}>
                            ➕ {t('botones.añadir')}
                        </button>
                    </div>
                    <small className="help-text">{t('crear_torneo_saga.org_hint')}</small>

                    {organizadorAdicional.length > 0 && (
                        <div className="organizadores-lista">
                            <p className="organizadores-titulo">
                                <strong>{t('crear_torneo_saga.org_lista', { n: organizadorAdicional.length })}:</strong>
                            </p>
                            <ul className="organizadores-items">
                                {organizadorAdicional.map((email, i) => (
                                    <li key={i} className="organizador-item">
                                        <span className="organizador-email">📧 {email}</span>
                                        <button type="button" onClick={() => handleEliminarOrganizador(email)}
                                            className="btn-eliminar-organizador" disabled={loading}
                                            title={t('botones.eliminar')}>✖️</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </fieldset>

                {/* ESCENARIOS POR RONDA */}
                <fieldset>
                    <legend>🎲 {t('crear_torneo_saga.fieldset_escenarios')}</legend>
                    {[1, 2, 3].map(n => (
                        <React.Fragment key={n}>
                            <label htmlFor={`partidaRonda${n}`}>{t('crear_torneo_saga.ronda_n', { n })}:*</label>
                            <select name={`partidaRonda${n}`} id={`partidaRonda${n}`}
                                value={[partidaRonda1, partidaRonda2, partidaRonda3][n-1]}
                                onChange={(e) => [setPartidaRonda1, setPartidaRonda2, setPartidaRonda3][n-1](e.target.value)}
                                required disabled={loading}>
                                <option value="">{t('crear_torneo_saga.escenario_placeholder')}</option>
                                {TIPOS_PARTIDA_SAGA.map((tipo, i) => <option key={tipo} value={tipo}>{escenarios[i]}</option>)}
                            </select>
                        </React.Fragment>
                    ))}
                    {rondasMax >= 4 && (
                        <>
                            <label htmlFor="partidaRonda4">{t('crear_torneo_saga.ronda_n', { n: 4 })}:*</label>
                            <select name="partidaRonda4" id="partidaRonda4" value={partidaRonda4}
                                onChange={(e) => setPartidaRonda4(e.target.value)}
                                required={rondasMax >= 4} disabled={loading}>
                                <option value="">{t('crear_torneo_saga.escenario_placeholder')}</option>
                                {TIPOS_PARTIDA_SAGA.map((tipo, i) => <option key={tipo} value={tipo}>{escenarios[i]}</option>)}
                            </select>
                        </>
                    )}
                    {rondasMax >= 5 && (
                        <>
                            <label htmlFor="partidaRonda5">{t('crear_torneo_saga.ronda_n', { n: 5 })}:*</label>
                            <select name="partidaRonda5" id="partidaRonda5" value={partidaRonda5}
                                onChange={(e) => setPartidaRonda5(e.target.value)}
                                required={rondasMax >= 5} disabled={loading}>
                                <option value="">{t('crear_torneo_saga.escenario_placeholder')}</option>
                                {TIPOS_PARTIDA_SAGA.map((tipo, i) => <option key={tipo} value={tipo}>{escenarios[i]}</option>)}
                            </select>
                        </>
                    )}
                </fieldset>

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? `⏳ ${t('crear_torneo_saga.creando')}` : `✅ ${t('crear_torneo_saga.btn_crear')}`}
                    </button>
                    <button type="button" onClick={() => navigate('/')} disabled={loading} className="btn-secondary">
                        ← {t('botones.cancelar')}
                    </button>
                </div>
            </form>
            <Footer />
        </div>
    );
}

export default CrearTorneoSaga;