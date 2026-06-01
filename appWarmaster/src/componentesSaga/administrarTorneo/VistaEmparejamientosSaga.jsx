import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import torneosSagaApi from '@/servicios/apiSaga';
import usuarioApi from '@/servicios/apiUsuarios';
import { generarEmparejamientos } from '@/componentesSaga/funcionesSaga/seleccionEmparejamientos';
import { useSagaI18n } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import ModalRegistroPartida from '../ModalRegistroPartidaSaga';
import ModalEdicionEmparejamientos from '@/componente/ModalEdicionEmparejamientos';

import '@/estilos/vistasTorneos/vistaEmparejamientos.css';

function VistaEmparejamientosSaga({ torneoId: propTorneoId, esVistaPublica = false }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const { t, i18n } = useTranslation();
    const { getEpoca, getEscenario, getBanda } = useSagaI18n();
    const locale = i18n.language === 'en' ? 'en-GB' : 'es-ES';

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [emparejamientos, setEmparejamientos] = useState([]);
    const [partidasGuardadas, setPartidasGuardadas] = useState([]);
    const [todasLasPartidas, setTodasLasPartidas] = useState([]);
    const [rondasExpandidas, setRondasExpandidas] = useState({});
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cargandoPartidas, setCargandoPartidas] = useState(false);
    const [error, setError] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [partidaSeleccionada, setPartidaSeleccionada]  = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [esOrganizador, setEsOrganizador] = useState(false);
    const [esParticipante, setEsParticipante] = useState(false);
    const [mostrarSelectorEscenarios, setMostrarSelectorEscenarios] = useState(false);
    const [asignacionesEscenarios,    setAsignacionesEscenarios]    = useState({});
    const [modoEdicion,          setModoEdicion]          = useState(false);
    const [emparejamientoEditando, setEmparejamientoEditando] = useState(null);
    const [modalEdicionAbierto,  setModalEdicionAbierto]  = useState(false);

    const esTorneoEquipos = () => torneo?.tipo_torneo === 'Por equipos';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUsuarioActual({ id: payload.userId, nombre: payload.nombre });
            } catch (error) { console.error('Error al decodificar token:', error); }
        }
    }, []);

    useEffect(() => {
        const verificarOrganizador = async () => {
            if (torneoId && usuarioActual?.id) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) { setEsOrganizador(false); return; }
                    const response = await usuarioApi.verificarOrganizador(torneoId);
                    const esOrg = response.data?.esOrganizador || response.esOrganizador || false;
                    setEsOrganizador(esOrg);
                } catch (error) {
                    console.error('❌ Error al verificar organizador:', error);
                    setEsOrganizador(false);
                }
            }
        };
        try { verificarOrganizador(); } catch (error) { console.error('💥 Error fatal:', error); }
    }, [torneoId, usuarioActual]);

    useEffect(() => { if (torneoId) cargarDatos(); }, [torneoId]);

    useEffect(() => {
        if (usuarioActual && (jugadores.length > 0 || equipos.length > 0))
            setEsParticipante(verificarEsParticipante());
    }, [usuarioActual, jugadores, equipos, torneo]);

    const cargarDatos = async () => {
        try {
            setLoading(true); setError(null);
            const responseTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
            if (dataTorneo.tipo_torneo === 'Por equipos') {
                try { const r = await torneosSagaApi.obtenerEquiposTorneo(torneoId); const d = r.data || r || []; setEquipos(Array.isArray(d) ? d : []); }
                catch { setEquipos([]); }
            } else {
                try { const r = await torneosSagaApi.obtenerJugadoresTorneo(torneoId); const d = r.data || r || []; setJugadores(Array.isArray(d) ? d : []); }
                catch { setJugadores([]); }
            }
            await cargarTodasLasPartidas(dataTorneo.id);
            if (dataTorneo.ronda_actual) await cargarPartidasRonda(dataTorneo.id, dataTorneo.ronda_actual);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError(t('comun.error_datos'));
        } finally { setLoading(false); }
    };

    const verificarEsParticipante = () => {
        if (!usuarioActual?.id) return false;
        if (esTorneoEquipos()) return equipos.some(eq => eq.jugadores?.some(j => j.jugador_id === usuarioActual.id));
        return jugadores.some(j => j.jugador_id === usuarioActual.id || j.id === usuarioActual.id);
    };

    const puedeVerPartidas = () => {
        if (esOrganizador) return true;
        if (torneo?.estado === 'finalizado' || torneo?.estado === 'en_curso') return true;
        return false;
    };

    const cargarTodasLasPartidas = async (tId = torneoId) => {
        try {
            let allPartidas = [];
            const rondasMax = torneo?.rondas_max || 5;
            for (let r = 1; r <= rondasMax; r++) {
                try {
                    let roundResponse;
                    if (esOrganizador) {
                        roundResponse = esTorneoEquipos()
                            ? await torneosSagaApi.obtenerEmparejamientosEquipos(tId, r)
                            : await torneosSagaApi.obtenerEmparejamientosIndividuales(tId, r);
                    } else {
                        roundResponse = esTorneoEquipos()
                            ? await torneosSagaApi.obtenerEmparejamientosEquiposPublico(tId, r)
                            : await torneosSagaApi.obtenerEmparejamientosIndividualesPublico(tId, r);
                    }
                    const roundPartidas = roundResponse?.data || roundResponse || [];
                    if (Array.isArray(roundPartidas) && roundPartidas.length > 0) allPartidas.push(...roundPartidas);
                } catch (err) { console.error(`⚠️ ${t('vista_emp.error_ronda')} ${r}:`, err.message); }
            }
            setTodasLasPartidas(allPartidas);
        } catch  { setTodasLasPartidas([]); }
    };

    const cargarPartidasRonda = async (tId = torneoId, ronda = torneo?.ronda_actual) => {
        try {
            setCargandoPartidas(true);
            let response;
            if (esOrganizador) {
                response = esTorneoEquipos()
                    ? await torneosSagaApi.obtenerEmparejamientosEquipos(tId, ronda)
                    : await torneosSagaApi.obtenerEmparejamientosIndividuales(tId, ronda);
            } else {
                response = esTorneoEquipos()
                    ? await torneosSagaApi.obtenerEmparejamientosEquiposPublico(tId, ronda)
                    : await torneosSagaApi.obtenerEmparejamientosIndividualesPublico(tId, ronda);
            }
            const partidas = response?.data || response || [];
            setPartidasGuardadas(Array.isArray(partidas) ? partidas : []);
        } catch (err) {
            console.warn(`${t('vista_emp.error_emparejamientos')} ${ronda}:`, err.message);
            setPartidasGuardadas([]);
        } finally { setCargandoPartidas(false); }
    };

    const partidasPorRonda = () => {
        const grupos = {};
        todasLasPartidas.forEach(p => { if (!grupos[p.ronda]) grupos[p.ronda] = []; grupos[p.ronda].push(p); });
        return grupos;
    };

    const toggleRonda = (ronda) => setRondasExpandidas(prev => ({ ...prev, [ronda]: !prev[ronda] }));

    const handleGenerarEmparejamientos = async () => {
        try {
            if (torneo.estado !== 'en_curso') {
                alert(`⚠️ ${t('vista_emp.torneo_enCurso')}\n\n${t('vista_emp.iniciar_torneo')}`); return;
            }
            if (!torneoId) { alert(`⚠️ ${t('vista_emp.error_id_torneo')}`); return; }
            const esEquipos = esTorneoEquipos();
            const minParticipantes = esEquipos ? equipos.length : jugadores.length;
            if (minParticipantes < 2) {
                alert(`⚠️ ${t('vista_emp.minimo_ronda1')} 2 ${esEquipos ? t('vgs.equipos') : t('tabla.jugadores')} ${t('vista_emp.minimo_ronda2')}`); return;
            }
            let participantes = [];
            if (!esEquipos) {
                const rc = await torneosSagaApi.obtenerClasificacionIndividual(torneoId);
                const cl = rc.data || rc || [];
                participantes = jugadores.map(j => {
                    const s = cl.find(c => c.jugador_id === j.jugador_id || c.jugador_id === j.id);
                    return { ...j, puntos_torneo: s?.puntos_torneo || 0, puntos_victoria: s?.puntos_victoria || 0, puntos_masacre: s?.puntos_masacre || 0, partidas_jugadas: s?.partidas_jugadas || 0 };
                });
            }
            const nuevosEmparejamientos = await generarEmparejamientos(torneoId, torneo.ronda_actual || 1, esEquipos ? 'Por equipos' : 'individual', participantes);
            setEmparejamientos(Array.isArray(nuevosEmparejamientos) ? nuevosEmparejamientos : []);
            alert(`✅ ${nuevosEmparejamientos.length} ${t('vista_emp.emp_correctos')}`);
        } catch (error) {
            console.error(`❌ ${t('vista_emp.error_generar_emp')}:`, error);
            alert(`❌ ${t('vista_emp.error_generar_emp')}: ${error.message}`);
            setEmparejamientos([]);
        }
    };

    const obtenerEpocasDisponibles = () => {
        const epocas = new Set();
        if (esTorneoEquipos()) equipos.forEach(eq => eq.jugadores?.forEach(j => { if (j.epoca) epocas.add(j.epoca); }));
        return Array.from(epocas).sort();
    };

    const guardarResultados = async () => {
        try {
            setGuardando(true); setError(null);
            if (!emparejamientos?.length) { alert(`⚠️ ${t('vista_emp.primero_emp')}`); return; }
            if (esTorneoEquipos()) {
                const epocas = obtenerEpocasDisponibles();
                if (epocas.length > 0 && Object.keys(asignacionesEscenarios).length === 0) {
                    setMostrarSelectorEscenarios(true); setGuardando(false); return;
                }
            }
            let nombreEscenario;
            if (torneo.tipo_torneo === 'Por equipos') {
                const rondas = [torneo.partida_ronda_1, torneo.partida_ronda_2, torneo.partida_ronda_3, torneo.partida_ronda_4, torneo.partida_ronda_5].filter(Boolean);
                nombreEscenario = rondas.length > 0 ? rondas.join(' / ') : t('vista_emp.escenario_definir');
            } else {
                nombreEscenario = torneo[`partida_ronda_${torneo.ronda_actual}`];
                if (!nombreEscenario) { alert(`⚠️ ${t('vista_emp.no_escenario_ronda')} ${torneo.ronda_actual}`); return; }
            }
            if (!window.confirm(`¿${t('vista_emp.guardar_emp1')} ${emparejamientos.length} ${t('vista_emp.guardar_emp2')} ${torneo.ronda_actual}?`)) {
                setGuardando(false); return;
            }
            const todasLasP = [];
            let mesaCounter = 1;
            const esEquipos = esTorneoEquipos();

            console.log('🔍 IDs que van a la DB:', emparejamientos.map(e => ({
                j1: e.jugador1_id,
                j2: e.jugador2_id,
                partidas: e.partidas?.map(p => ({ j1: p.jugador1_id, j2: p.jugador2_id }))
            })));

            emparejamientos.forEach(emp => {
                if (emp.partidas && Array.isArray(emp.partidas)) {
                    emp.partidas.forEach(partida => {
                        const esc = esEquipos && partida.epoca ? asignacionesEscenarios[partida.epoca] : nombreEscenario;
                        todasLasP.push({ mesa: mesaCounter++, jugador1_id: partida.jugador1_id ?? null, jugador2_id: partida.jugador2_id ?? null, equipo1_id: emp.equipo1_id, equipo2_id: emp.equipo2_id, epoca: partida.epoca || null, es_bye: partida.es_bye || 0, nombre_partida: esc, ronda: torneo.ronda_actual });
                    });
                } else {
                    todasLasP.push({ mesa: mesaCounter++, jugador1_id: emp.jugador1_id ?? null, jugador2_id: emp.jugador2_id ?? null, equipo1_id: null, equipo2_id: null, epoca: emp.epoca || null, es_bye: emp.es_bye || 0, nombre_partida: nombreEscenario, ronda: torneo.ronda_actual });
                }
            });
            const errores = [];
            todasLasP.forEach((p, i) => { if (!p.jugador1_id && !p.es_bye) errores.push(`${t('vista_emp.mesa')} ${p.mesa}: ${t('vista_emp.jugador1_sin_id')} (${t('vista_emp.partida')} ${i+1})`); });
            if (errores.length > 0) { console.error(t('vista_emp.errores_validacion'), errores); alert(`${t('vista_emp.error_id_emp')}\n` + errores.join('\n')); return; }
            if (esEquipos) await torneosSagaApi.guardarEmparejamientosEquipos(torneo.id, todasLasP, torneo.ronda_actual);
            else await torneosSagaApi.guardarEmparejamientosIndividuales(torneo.id, todasLasP, torneo.ronda_actual);
            // FIX: \n en lugar de \$ (bug original)
            alert(`✅ ${emparejamientos.length} ${t('vista_emp.partidas_creadas_ronda')} ${torneo.ronda_actual}\n${t('vista_emp.escenario')}: ${nombreEscenario}`);
            setEmparejamientos([]); setAsignacionesEscenarios({}); setMostrarSelectorEscenarios(false);
            await cargarPartidasRonda(); await cargarTodasLasPartidas();
        } catch (err) {
            console.error(`❌ ${t('vista_emp.errores_guardar_emp')}`, err);
            setError(err.message || t('vista_emp.no_pudieron_guardar_emp'));
            alert(`❌ ${t('comun.error')} ${err.message}`);
        } finally { setGuardando(false); }
    };

    const generarSiguienteRonda = async () => {
        try {
            if (!todasLasPartidasCompletas()) { alert(`⚠️ ${t('vista_emp.completar_todas_partidas')}`); return; }
            if (torneo.ronda_actual >= torneo.rondas_max) { alert(`⚠️ ${t('vista_emp.ronda_maxima')}`); return; }
            if (!window.confirm(`${t('vista_emp.generar_siguiente_ronda')} ${torneo.ronda_actual + 1}?\n\n${t('vista_emp.afirmar_emp')}`)) return;
            await torneosSagaApi.actualizarTorneo(torneo.id, { ronda_actual: torneo.ronda_actual + 1 });
            await cargarDatos();
        } catch (err) { alert(`❌ ${t('vista_emp.error_generar_emp')} ${err.message}`); }
    };

    const todasLasPartidasCompletas = () => {
        if (partidasGuardadas.length === 0) return false;
        return partidasGuardadas.every(p => p.resultado_ps && p.resultado_ps !== 'pendiente' && p.resultado_ps !== null);
    };

    const puedeEditarEstaPartida = (partida) => {
        if (torneo?.estado !== 'en_curso') return false;
        if (partida.resultado_confirmado && !esOrganizador) return false;
        if (esOrganizador) return true;
        if (!esParticipante || !usuarioActual) return false;
        if (esTorneoEquipos()) {
            const eq1 = equipos.find(eq => eq.id === partida.equipo1_id || eq.equipo_id === partida.equipo1_id);
            const eq2 = equipos.find(eq => eq.id === partida.equipo2_id || eq.equipo_id === partida.equipo2_id);
            return (eq1 && eq1.jugadores?.some(j => j.jugador_id === usuarioActual.id)) ||
                   (eq2 && eq2.jugadores?.some(j => j.jugador_id === usuarioActual.id));
        } else {
            const j1 = jugadores.find(j => j.id === partida.jugador1_id);
            const j2 = jugadores.find(j => j.id === partida.jugador2_id);
            return (j1 && j1.jugador_id === usuarioActual.id) || (j2 && j2.jugador_id === usuarioActual.id);
        }
    };

    const handleAsignarEscenario = (epoca, escenario) => setAsignacionesEscenarios(prev => ({ ...prev, [epoca]: escenario }));
    
    const todasLasEpocasAsignadas = () => obtenerEpocasDisponibles().every(ep => asignacionesEscenarios[ep]);

    const confirmarAsignaciones = () => {
        if (!todasLasEpocasAsignadas()) { alert(`⚠️ ${t('vista_emp.asignar_escenario')}`); return; }
        setMostrarSelectorEscenarios(false); guardarResultados();
    };

    const eliminarEmparejamiento = (index) => {
        if (window.confirm(t('vista_emp.eliminar_emp'))) {
            const n = [...emparejamientos]; n.splice(index, 1); setEmparejamientos(n);
            alert(`✅ ${t('vista_emp.eliminado_emp')}`);
        }
    };

    const abrirEdicion = (emparejamiento, index) => {
        const getJugadorId = (j) => j.id || j.jugador_id;
        const jug1 = jugadores.find(j => j.id === emparejamiento.jugador1_id || j.id === emparejamiento.jugador1?.id);
        const jug2 = jugadores.find(j => j.id === emparejamiento.jugador2_id || j.id === emparejamiento.jugador2?.id);
        setEmparejamientoEditando({ ...emparejamiento, index, jugador1_id: jug1 ? getJugadorId(jug1) : null, jugador2_id: jug2 ? getJugadorId(jug2) : null, equipo1_id: emparejamiento.equipo1_id ? Number(emparejamiento.equipo1_id) : null, equipo2_id: emparejamiento.equipo2_id ? Number(emparejamiento.equipo2_id) : null, es_bye: emparejamiento.es_bye || 0 });
        setModalEdicionAbierto(true);
    };

    const guardarEdicion = (nuevosDatos) => {
        const nuevosEmp = [...emparejamientos];
        const empActual = nuevosEmp[emparejamientoEditando.index];
        let empActualizado;
        if (esTorneoEquipos()) {
            const eq1 = equipos.find(eq => (eq.id || eq.equipo_id) === nuevosDatos.equipo1_id);
            const eq2 = nuevosDatos.equipo2_id ? equipos.find(eq => (eq.id || eq.equipo_id) === nuevosDatos.equipo2_id) : null;
            let nuevasPartidas = empActual.partidas || [];
            if (eq1 && eq2) {
                const j1s = eq1.jugadores || [], j2s = eq2.jugadores || [];
                nuevasPartidas = j1s.map((j1, i) => { 
                    const j2 = j2s[i] || null; 
                    const pa = empActual.partidas?.[i] || {}; 
                        return { ...pa, jugador1_id: j1.id, jugador1_nombre: j1.jugador_nombre || j1.nombre, jugador1_alias: j1.nombre_alias || null, jugador2_id: j2 ?  j2.id : null, jugador2_nombre: j2 ? (j2.jugador_nombre || j2.nombre) : null, jugador2_alias: j2 ? (j2.nombre_alias || null) : null, epoca: j1.epoca || pa.epoca || null, es_bye: j2 ? 0 : 1 }; });
            } else if (eq1 && !eq2) {
                nuevasPartidas = (eq1.jugadores || []).map((j1, i) => { const pa = empActual.partidas?.[i] || {}; return { ...pa, jugador1_id: j1.id, jugador1_nombre: j1.jugador_nombre || j1.nombre, jugador1_alias: j1.nombre_alias || null, jugador2_id: null, jugador2_nombre: null, jugador2_alias: null, epoca: j1.epoca || pa.epoca || null, es_bye: 1 }; });
            }
            empActualizado = { ...empActual, ...nuevosDatos, equipo1_nombre: eq1?.nombre_equipo || empActual.equipo1_nombre, equipo2_nombre: eq2?.nombre_equipo || null, partidas: nuevasPartidas };
        } else {
            const getNombre = (j) => j.jugador_nombre || j.nombre;
            const j1 = jugadores.find(j => j.id === nuevosDatos.jugador1_id);
            const j2 = nuevosDatos.jugador2_id ? jugadores.find(j => j.id === nuevosDatos.jugador2_id) : null;
            empActualizado = { ...empActual, ...nuevosDatos, jugador1_nombre: j1 ? getNombre(j1) : empActual.jugador1_nombre, jugador2_nombre: j2 ? getNombre(j2) : null, jugador1: j1 ? { ...empActual.jugador1, ...j1, nombre: getNombre(j1), jugador_nombre: getNombre(j1) } : empActual.jugador1, jugador2: j2 ? { ...empActual.jugador2, ...j2, nombre: getNombre(j2), jugador_nombre: getNombre(j2) } : null };
        }
        nuevosEmp[emparejamientoEditando.index] = empActualizado;
        setEmparejamientos(nuevosEmp);
        setModalEdicionAbierto(false); setEmparejamientoEditando(null);
        alert(`✅ ${t('vista_emp.emp_actualizado')}`);
    };

    const compartirEmparejamientos = async () => {
        const emps = partidasGuardadas.length > 0 ? partidasGuardadas : emparejamientos;
        // FIX: clave correcta para "no hay nada que compartir"
        if (emps.length === 0) { alert(`⚠️ ${t('vista_emp.compatir.no_compartir_emp')}`); return; }
        let texto = `🎮 ${t('vista_emp.compatir.emparejamientos')} ${torneo.ronda_actual}\n`;
        texto += `📅 ${t('comun.torneo')}: ${torneo.nombre_torneo}\n`;
        texto += `📍 ${t('comun.fecha')}: ${new Date().toLocaleDateString(locale)}\n\n`;
        if (partidasGuardadas.length > 0) {
            partidasGuardadas.forEach((partida, index) => {
                texto += `━━━━━━━━━━━━━━━━━━━━━━━━━\n🎲 ${t('vista_emp.compatir.mesa')} ${partida.mesa || index + 1}\n`;
                if (esTorneoEquipos()) {
                    texto += `🔵 ${partida.equipo1_nombre || t('vista_emp.compatir.equipo1')}\n   👤 ${partida.jugador1_nombre || t('vista_emp.compatir.jugador1')}\n`;
                   if (partida.jugador1_faccion) texto += `   ⚔️ ${getBanda(partida.jugador1_faccion)}\n`
                    texto += `\n VS \n\n`;
                    if (partida.es_bye || !partida.jugador2_nombre) texto += `🔴 ${t('vista_emp.compatir.bye')}\n`;
                    else { texto += `🔴 ${partida.equipo2_nombre || t('vista_emp.compatir.equipo2')}\n   
                        👤 ${partida.jugador2_nombre || t('vista_emp.compatir.jugador2')}\n`;
                        if (partida.jugador2_faccion) texto += `   ⚔️ ${getBanda(partida.jugador2_faccion)}\n`; 
                    }
                } else {
                    texto += `🔵 ${partida.jugador1_nombre || t('vista_emp.compatir.jugador1')}\n`;
                    if (partida.jugador1_faccion) texto += `   ⚔️ ${getBanda(partida.jugador1_faccion)}\n`;
                    texto += `\n VS \n\n`;
                    if (partida.es_bye || !partida.jugador2_nombre) texto += `🔴 ${t('vista_emp.compatir.bye')}\n`;
                    else { texto += `🔴 ${partida.jugador2_nombre || t('vista_emp.compatir.jugador2')}\n`;
                    if (partida.jugador2_faccion) texto += `   ⚔️ ${getBanda(partida.jugador2_faccion)}\n`; }
                }
                if (partida.nombre_partida) texto += `\n📋 ${t('vista_emp.escenario')}: ${getEscenario(partida.nombre_partida)}\n`;
                if (partida.epoca) texto += `📅 ${t('modal_partida.epoca')}: ${getEpoca(partida.epoca)}\n`;
                texto += `\n`;
            });
        } else {
            emparejamientos.forEach((emp, index) => {
                texto += `━━━━━━━━━━━━━━━━━━━━━━━━━\n🎲 ${t('vista_emp.compatir.mesa')} ${emp.mesa || index + 1}\n`;
                if (esTorneoEquipos()) {
                    texto += `🔵 ${emp.equipo1_nombre || t('vista_emp.compatir.equipo1')}\n`;
                    if (emp.partidas) emp.partidas.forEach(p => { texto += `   👤 ${p.jugador1_nombre}\n`; if (p.epoca) texto += `   📅 ${getEpoca(p.epoca)}\n`; });
                    texto += `\n VS \n\n`;
                    if (emp.es_bye) texto += `🔴 ${t('vista_emp.compatir.bye')}\n`;
                    else { texto += `🔴 ${emp.equipo2_nombre || t('vista_emp.compatir.equipo2')}\n`; if (emp.partidas) emp.partidas.forEach(p => { if (p.jugador2_nombre) texto += `   👤 ${p.jugador2_nombre}\n`; }); }
                } else {
                    const j1n = emp.jugador1?.nombre || emp.jugador1?.jugador_nombre;
                    const j2n = emp.jugador2 ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) : null;
                    texto += `🔵 ${j1n || t('vista_emp.compatir.jugador1')}\n\n VS \n\n`;
                    texto += emp.es_bye ? `🔴 ${t('vista_emp.compatir.bye')}\n` : `🔴 ${j2n || t('vista_emp.compatir.jugador2')}\n`;
                }
                texto += `\n`;
            });
        }
        if (navigator.share) {
            try { await navigator.share({ title: `${t('vista_emp.compatir.emp_ronda')} ${torneo.ronda_actual}`, text: texto }); }
            // FIX: clave correcta dentro del namespace compatir
            catch (err) { if (err.name !== 'AbortError') console.error(t('vista_emp.compatir.no_compartir'), err); }
        } else {
            try { await navigator.clipboard.writeText(texto); alert(`✅ ${t('vista_emp.compatir.copiados_portapapeles')}\n\n${t('vista_emp.compatir.wasap_telegram')}`); }
            catch (err) { alert(`❌ ${t('vista_emp.compatir.error_copiar')}`), err }
        }
    };

    const tieneDatos = (partida) => {
        if (partida.resultado_ps && partida.resultado_ps !== 'pendiente') return true;
        return (partida.puntos_torneo_j1 > 0 || partida.puntos_torneo_j2 > 0 || partida.puntos_masacre_j1 > 0 || partida.puntos_masacre_j2 > 0 || partida.puntos_victoria_j1 > 0 || partida.puntos_victoria_j2 > 0);
    };

    const esBye = (partida) => {
        if (tieneDatos(partida)) return false;
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.es_bye;
    };

    const abrirModalPartida = (partida) => {
        if (!puedeEditarEstaPartida(partida)) {
            alert(`⚠️ ${t('vista_emp.torneo_enCurso_resultados')}\n\n${t('vista_emp.cambia_estado')}`); return;
        }
        setPartidaSeleccionada(partida); setModalAbierto(true);
    };

    const confirmarPartida = async (partidaId, confirmar) => {
        try {
            if (esTorneoEquipos()) await torneosSagaApi.confirmarResultadoEquipo(torneo.id, partidaId, confirmar);
            else await torneosSagaApi.confirmarResultado(torneo.id, partidaId, confirmar);
            alert(confirmar ? `✅ ${t('vista_emp.resultado_confirmar')}` : `⚠️ ${t('vista_emp.resultado_desconfimar')}`);
            await cargarPartidasRonda(); await cargarTodasLasPartidas();
        } catch (error) {
            console.error(t('vista_emp.error_confirmar_resultados'), error);
            alert(`❌ ${t('comun.error')} ${error.message}`);
        }
    };

    const agruparPartidasPorEquipos = (partidas) => {
        if (!esTorneoEquipos()) return partidas;
        const grupos = {};
        partidas.forEach(partida => {
            const eq1_id = partida.equipo1_id, eq2_id = partida.equipo2_id;
            const equipoKey = eq2_id ? `equipo_${eq1_id}_vs_${eq2_id}` : `equipo_${eq1_id}_bye`;
            if (!grupos[equipoKey]) {
                const eq1Data = equipos.find(eq => eq.id === eq1_id || eq.equipo_id === eq1_id);
                const eq2Data = eq2_id ? equipos.find(eq => eq.id === eq2_id || eq.equipo_id === eq2_id) : null;
                grupos[equipoKey] = { equipo1_id: eq1_id, equipo2_id: eq2_id, equipo1_nombre: eq1Data?.nombre_equipo || `${t('comun.equipo')} ${eq1_id}`, equipo2_nombre: eq2Data?.nombre_equipo || null, partidasPorEpoca: {}, todasLasPartidas: [] };
            }
            grupos[equipoKey].todasLasPartidas.push(partida);
            const epoca = partida.epoca || t('vista_emp.sin_epocas');
            if (!grupos[equipoKey].partidasPorEpoca[epoca]) grupos[equipoKey].partidasPorEpoca[epoca] = [];
            grupos[equipoKey].partidasPorEpoca[epoca].push(partida);
        });
        return grupos;
    };

    const renderPartidaIndividual = (partida, index, esRondaActual) => {
        const estaConfirmado = partida.resultado_confirmado;
        const puedeEditar = esRondaActual && puedeEditarEstaPartida(partida) && !esBye(partida);
        return (
            <div key={partida.id} className={`emparejamiento-card ${puedeEditar ? 'editable' : ''}`}
                onClick={() => puedeEditar && abrirModalPartida(partida)}
                style={{ border: `2px solid ${estaConfirmado ? '#4caf50' : '#ff9800'}`, background: estaConfirmado ? '#e8f5e9' : '#fff', cursor: puedeEditar ? 'pointer' : 'default' }}>

                {/* FIX: eliminar guion de 'click_editar-' */}
                {puedeEditar && <div className="etiqueta-editar">👆 {t('vista_emp.click_editar')}</div>}

                {!esVistaPublica && esOrganizador && esRondaActual && (
                    <button className={`boton-confirmar ${estaConfirmado ? 'confirmado' : (tieneDatos(partida) ? 'por-confirmar' : 'pendiente')}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(
                                estaConfirmado
                                    ? t('vista_emp.confirm_desconfirmar')
                                    : esBye(partida) ? t('vista_emp.confirm_bye') : t('vista_emp.confirm_resultado')
                            )) confirmarPartida(partida.id, !estaConfirmado);
                        }}>
                        {estaConfirmado
                            ? `✅ ${t('vista_emp.estado_confirmado')}`
                            : tieneDatos(partida) ? t('vista_emp.estado_por_confirmar') : t('comun.pendiente').toUpperCase()}
                    </button>
                )}

                <div className={`mesa-numero ${estaConfirmado ? 'confirmado' : 'pendiente'} ${esOrganizador && esRondaActual ? 'con-margen' : ''}`}>
                    {t('vista_emp.mesa')} {partida.mesa || index + 1}
                    {esBye(partida) ? ' ⭐ BYE' : ''}
                    {partida.epoca && ` - 📅 ${getEpoca(partida.epoca)}`}
                    {partida.nombre_partida && <div className="escenario-partida">📋 {getEscenario(partida.nombre_partida)}</div>}
                </div>

                <div className="enfrentamiento">
                    <div className="jugador">
                        <div className="nombre">{partida.jugador1_nombre}{partida.jugador1?.nombre_alias && ` "${partida.jugador1?.nombre_alias}"`}</div>
                        {partida.jugador1?.equipo_nombre && <div className="equipo">🏆 {partida.jugador1.equipo_nombre}</div>}
                        {partida.jugador1?.faccion && 
                        <div className="faccion">⚔️ {getBanda(partida.jugador1.faccion)}</div>}
                        <div className="stats">
                            ${t('vista_clasificacion.pv')}: {parseFloat(partida.puntos_victoria_j1 || 0).toFixed(1)} | 
                            ${t('vista_clasificacion.puntos_partida')}: {parseFloat(partida.puntos_partida_j1 || 0).toFixed(1)} |
                            ${t('vista_clasificacion.pm')}: {parseFloat(partida.puntos_masacre_j1 || 0).toFixed(1)} |
                            ${t('vista_clasificacion.pt')}: {parseFloat(partida.puntos_torneo_j1 || 0).toFixed(1)} 
                        </div>
                    </div>
                    <div className="vs">VS</div>
                    {partida.jugador2_nombre ? (
                        <div className="jugador">
                            <div className="nombre">{partida.jugador2_nombre}{partida.jugador2?.nombre_alias && ` "${partida.jugador2?.nombre_alias}"`}</div>
                            {partida.jugador2?.equipo_nombre && <div className="equipo">🏆 {partida.jugador2.equipo_nombre}</div>}
                            {partida.jugador2?.faccion && 
                            <div className="faccion">⚔️ {getBanda(partida.jugador2.faccion)}</div>}
                            <div className="stats">
                                ${t('vista_clasificacion.pv')}: {parseFloat(partida.puntos_victoria_j2 || 0).toFixed(1)} | 
                                ${t('vista_clasificacion.puntos_partida')}: {parseFloat(partida.puntos_partida_j2 || 0).toFixed(1)} |
                                ${t('vista_clasificacion.pm')}: {parseFloat(partida.puntos_masacre_j2 || 0).toFixed(1)} |
                                ${t('vista_clasificacion.pt')}: {parseFloat(partida.puntos_torneo_j2 || 0).toFixed(1)}
                            </div>
                        </div>
                    ) : (
                        <div className="jugador bye">
                            <div>⭐ BYE</div>
                            <div>{t('vista_emp.victoria_automatica')}</div>
                            <div>{t('vista_emp.bye_pts')}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPartidas = (partidas, esRondaActual = false) => {
        if (!esTorneoEquipos()) return partidas.map((p, i) => renderPartidaIndividual(p, i, esRondaActual));
        const grupos = agruparPartidasPorEquipos(partidas);
        return Object.entries(grupos).map(([claveGrupo, grupo]) => (
            <div key={claveGrupo} className="enfrentamiento-equipos">
                <div className="header-equipos">
                    <h4>⚔️ {grupo.equipo1_nombre}{grupo.equipo2_nombre ? ` vs ${grupo.equipo2_nombre}` : ' (BYE)'}</h4>
                    <span className="total-partidas">
                        {grupo.todasLasPartidas.length} {grupo.todasLasPartidas.length === 1 ? t('vista_emp.partida') : t('vista_emp.partidas')}
                    </span>
                </div>
                <div className="contenedor-epocas">
                    {Object.entries(grupo.partidasPorEpoca).map(([epoca, partidasEpoca]) => (
                        <div key={epoca} className="grupo-epoca">
                            <div className="epoca-header">
                                <span className="epoca-badge-grande">📅 {getEpoca(epoca)}</span>
                                <span className="cantidad-partidas">({partidasEpoca.length} {partidasEpoca.length === 1 ? t('vista_emp.partida') : t('vista_emp.partidas')})</span>
                            </div>
                            <div className="partidas-epoca">{partidasEpoca.map((p, i) => renderPartidaIndividual(p, i, esRondaActual))}</div>
                        </div>
                    ))}
                </div>
            </div>
        ));
    };

    if (loading) return <div className="vista-emparejamientos"><div className="loading-message">⏳ {t('comun.cargando')}</div></div>;
    if (error && !torneo) return (
        <div className="vista-emparejamientos">
            <div className="error-message">⚠️ {error}<button onClick={cargarDatos} className="btn-secondary">{t('botones.reintentar')}</button></div>
        </div>
    );

    const grupos = partidasPorRonda();
    const rondasAnteriores = Object.keys(grupos).filter(r => parseInt(r) < torneo.ronda_actual).sort((a, b) => b - a);
    const minParticipantes = esTorneoEquipos() ? equipos.length : jugadores.length;

    return (
        <div className="vista-emparejamientos">

            {/* SELECTOR DE ESCENARIOS */}
            {mostrarSelectorEscenarios && esTorneoEquipos() && (
                <div className="modal-overlay" onClick={() => { setMostrarSelectorEscenarios(false); setGuardando(false); }}>
                    <div className="selector-escenarios-epoca" onClick={e => e.stopPropagation()}>
                        <div className="selector-header">
                            <h3>📋 {t('vista_emp.asignar_titulo')}</h3>
                            <p>{t('vista_emp.asignar_subtitulo', { n: torneo.ronda_actual })}</p>
                        </div>
                        <div className="escenarios-disponibles">
                            <strong>{t('vista_emp.escenarios_ronda')}:</strong>
                            <div className="badges-escenarios">
                                {[torneo.partida_ronda_1, torneo.partida_ronda_2, torneo.partida_ronda_3, torneo.partida_ronda_4, torneo.partida_ronda_5].filter(Boolean).flatMap(r => r.split('/')).map(e => e.trim()).map((esc, idx) => <span key={idx} className="badge-escenario">{getEscenario(esc)}</span>)}
                            </div>
                        </div>
                        <div className="asignaciones-lista">
                            {obtenerEpocasDisponibles().map(epoca => {
                                const escenarios = [torneo.partida_ronda_1, torneo.partida_ronda_2, torneo.partida_ronda_3, torneo.partida_ronda_4, torneo.partida_ronda_5].filter(Boolean).flatMap(r => r.split('/')).map(e => e.trim());
                                return (
                                    <div key={epoca} className="asignacion-row">
                                        <span className="epoca-nombre">📅 {getEpoca(epoca)}:</span>
                                        <select value={asignacionesEscenarios[epoca] || ''} onChange={e => handleAsignarEscenario(epoca, e.target.value)} className={asignacionesEscenarios[epoca] ? 'seleccionado' : ''}>
                                            <option value="">{t('insc_equipo.seleccionar')}</option>
                                            {escenarios.map((esc, idx) => <option key={idx} value={esc}>{getEscenario(esc)}</option>)}
                                        </select>
                                        {asignacionesEscenarios[epoca] && <span className="check-ok">✅</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="selector-footer">
                            <button onClick={() => { setMostrarSelectorEscenarios(false); setGuardando(false); setAsignacionesEscenarios({}); }} className="btn-cancelar">❌ {t('botones.cancelar')}</button>
                            <button onClick={confirmarAsignaciones} className="btn-confirmar-asignacion" disabled={!todasLasEpocasAsignadas()}>✅ {t('vista_emp.confirmar_asignacion')}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="section-header">
                <div>
                    <div>
                        <h2>🎲 {esTorneoEquipos() ? t('vista_emp.titulo_equipos') : t('vista_emp.titulo_individuales')}</h2>
                        <p>{t('vista_emp.ronda_de', { actual: torneo.ronda_actual, max: torneo.rondas_max })}</p>
                        {(torneo.estado === 'en_curso' || torneo.estado === 'finalizado') && (
                            esTorneoEquipos() ? (() => {
                                const rondas = [torneo.partida_ronda_1, torneo.partida_ronda_2, torneo.partida_ronda_3, torneo.partida_ronda_4, torneo.partida_ronda_5].filter(Boolean);
                                return rondas.length > 0
                                    ? <p>📋 {t('vista_emp.escenarios_label')}: {rondas.map(r => getEscenario(r)).join(' / ')}</p>
                                    : <p>⚠️ {t('vista_emp.sin_escenarios')}</p>;
                            })() : (
                                torneo[`partida_ronda_${torneo.ronda_actual}`] && <p>📋 {getEscenario(torneo[`partida_ronda_${torneo.ronda_actual}`])}</p>
                            )
                        )}
                        {torneo.estado === 'pendiente' && <p>⏳ {t('vista_emp.escenarios_pendientes')}</p>}
                    </div>

                    {!esVistaPublica && esOrganizador && (
                        <div className="botones-grupo">
                            <button onClick={handleGenerarEmparejamientos} className="btn-primary"
                                disabled={minParticipantes < 2 || guardando || partidasGuardadas.length > 0 || modoEdicion || torneo.estado !== 'en_curso'}>
                                🎲 {t('vista_emp.btn_generar')}
                            </button>
                            {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                                !modoEdicion ? (
                                    <>
                                        <button onClick={() => setModoEdicion(true)} className="btn-warning">✏️ {t('vista_emp.btn_editar_emp')}</button>
                                        <button onClick={guardarResultados} className="btn-success" disabled={guardando}>
                                            {guardando ? `⏳ ${t('perfil.guardando')}` : `💾 ${t('vista_emp.btn_guardar_bd')}`}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => { setModoEdicion(false); alert(`✅ ${t('vista_emp.fin_edicion')}`); }} className="btn-success">
                                        ✅ {t('vista_emp.btn_finalizar_edicion')}
                                    </button>
                                )
                            )}
                            {partidasGuardadas.length > 0 && todasLasPartidasCompletas() && (
                                <button onClick={generarSiguienteRonda} disabled={torneo.ronda_actual >= torneo.rondas_max} className="btn-warning">
                                    ⏭️ {t('vista_emp.btn_siguiente_ronda', { n: torneo.ronda_actual + 1 })}
                                </button>
                            )}
                        </div>
                    )}
                    {(emparejamientos.length > 0 || partidasGuardadas.length > 0) && (
                        <div className="botones-grupo" style={{ marginTop: esOrganizador ? '0' : '20px' }}>
                            <button onClick={compartirEmparejamientos} className="btn-success" disabled={guardando}>
                                📤 {t('vista_emp.btn_compartir')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {partidasGuardadas.length > 0 && torneo?.estado === 'en_curso' && !esOrganizador && !esParticipante && (
                <div className="alerta-estado"><p>⚠️ {t('vista_emp.solo_participantes')}</p></div>
            )}

            {partidasGuardadas.length > 0 && (
                <div className={`info-partidas ${todasLasPartidasCompletas() ? 'completadas' : 'pendientes'}`}>
                    <p>
                        {todasLasPartidasCompletas()
                            ? `✅ ${t('vista_emp.todas_completadas', { n: partidasGuardadas.length })}`
                            : `⏳ ${t('vista_emp.partidas_completadas', { done: partidasGuardadas.filter(p => p.resultado_ps && p.resultado_ps !== 'pendiente').length, total: partidasGuardadas.length })}`}
                    </p>
                </div>
            )}

            {error && <div className="error-message"><p>❌ {error}</p></div>}
            {cargandoPartidas && <div className="loading-message">⏳ {t('vista_emp.cargando_partidas')}</div>}

            {minParticipantes < 2 ? (
                <div className="empty-message">
                    <p>⚠️ {t('vista_emp.min_participantes', { tipo: esTorneoEquipos() ? t('vgs.equipos') : t('tabla.jugadores') })}</p>
                </div>
            ) : (
                <>
                    {!puedeVerPartidas() ? (
                        <div className="empty-message">
                            <p>🔒 {t('vista_emp.torneo_no_iniciado')}</p>
                            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>{t('vista_emp.torneo_no_iniciado_hint')}</p>
                        </div>
                    ) : (
                        <>
                            {partidasGuardadas.length === 0 && todasLasPartidas.length === 0 && !cargandoPartidas && (
                                <div className="info-message">
                                    {torneo?.ronda_actual && torneo.ronda_actual > 0
                                        ? <p>ℹ️ {t('vista_emp.sin_emparejamientos_ronda')}</p>
                                        : <p>ℹ️ {t('vista_emp.torneo_preparacion')}</p>}
                                </div>
                            )}
                            {partidasGuardadas.length > 0 && !todasLasPartidasCompletas() && (esOrganizador || esParticipante) && (
                                <div className="info-box">
                                    <p>📝 {esOrganizador ? t('vista_emp.info_org_editar') : t('vista_emp.info_part_editar')}</p>
                                </div>
                            )}
                            {partidasGuardadas.length > 0 && !usuarioActual && (
                                <div className="info-box" style={{ background: '#e3f2fd', borderColor: '#2196f3' }}>
                                    <p>👁️ {t('vista_emp.info_visitante')}</p>
                                </div>
                            )}

                            {partidasGuardadas.length === 0 && emparejamientos.length === 0 ? (
                                esOrganizador && (
                                    <div className="empty-message">
                                        <p>{t('vista_emp.hint_generar_emp', { n: torneo.ronda_actual })}</p>
                                    </div>
                                )
                            ) : (
                                <>
                                    {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                                        <div className="info-box">
                                            <p>ℹ️ <strong>{t('vista_emp.hint_guardar_bd', { n: emparejamientos.length })}</strong></p>
                                        </div>
                                    )}
                                    <div className={`emparejamientos-grid ${esTorneoEquipos() ? 'equipos-layout' : ''}`}>
                                        {partidasGuardadas.length > 0 ? renderPartidas(partidasGuardadas, true) : (
                                            emparejamientos.map((emp, index) => {
                                                const esEquipos = esTorneoEquipos();
                                                if (esEquipos && emp.jugadores_equipo1) {
                                                    return (
                                                        <div key={index} className="enfrentamiento-equipos-preview">
                                                            {modoEdicion && (
                                                                <div className="botones-edicion">
                                                                    <button onClick={() => abrirEdicion(emp, index)} className="btn-editar-small" title={t('botones.administrar')}>✏️</button>
                                                                    <button onClick={() => eliminarEmparejamiento(index)} className="btn-eliminar-small" title={t('botones.eliminar')}>🗑️</button>
                                                                </div>
                                                            )}
                                                            <div className="header-equipos-preview">
                                                                <h4>⚔️ {emp.equipo1_nombre} {emp.equipo2_nombre ? `vs ${emp.equipo2_nombre}` : '(BYE)'}</h4>
                                                            </div>
                                                            {emp.partidas && emp.partidas.length > 0 && (
                                                                <div className="partidas-preview">
                                                                    <h6>{t('vista_emp.partidas_equipo', { n: emp.partidas.length })}:</h6>
                                                                    <div className="lista-partidas-preview">
                                                                        {emp.partidas.map((partida, pIndex) => (
                                                                            <div key={pIndex} className="partida-individual-preview">
                                                                                <span className="epoca-badge">{getEpoca(partida.epoca) || t('vista_emp.sin_epocas')}</span>
                                                                                <div>
                                                                                    <span className="jugadores-partida">
                                                                                        {partida.jugador1_nombre}{partida.jugador1_alias && ` "${partida.jugador1_alias}"`}
                                                                                        <strong> vs </strong>
                                                                                        {partida.jugador2_nombre || '⭐ BYE'}{partida.jugador2_alias && ` "${partida.jugador2_alias}"`}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                const j1n = emp.jugador1?.nombre || emp.jugador1?.jugador_nombre;
                                                const j1a = emp.jugador1?.nombre_alias;
                                                const j2n = emp.jugador2 ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) : null;
                                                const j2a = emp.jugador2?.nombre_alias;
                                                return (
                                                    <div key={index} className="emparejamiento-card">
                                                        {modoEdicion && (
                                                            <div className="botones-edicion">
                                                                <button onClick={() => abrirEdicion(emp, index)} className="btn-editar-small" title={t('botones.administrar')}>✏️</button>
                                                                <button onClick={() => eliminarEmparejamiento(index)} className="btn-eliminar-small" title={t('botones.eliminar')}>🗑️</button>
                                                            </div>
                                                        )}
                                                        <div className="mesa-numero preview">
                                                            {t('vista_emp.mesa')} {emp.mesa || index + 1} {emp.es_bye === 1 && ' ⭐ BYE'}
                                                        </div>
                                                        <div className="enfrentamiento">
                                                            <div className="jugador"><div className="nombre">{j1n}{j1a && ` "${j1a}"`}</div></div>
                                                            <div className="vs">VS</div>
                                                            <div className="jugador"><div className="nombre">{emp.es_bye ? '⭐ BYE' : <>{j2n}{j2a && ` "${j2a}"`}</>}</div></div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}

                            {rondasAnteriores.length > 0 && (
                                <div className="rondas-anteriores">
                                    <h3>📜 {t('vista_emp.rondas_anteriores')}</h3>
                                    {rondasAnteriores.map(ronda => {
                                        const partidasRonda = grupos[ronda] || [];
                                        const expandida = rondasExpandidas[ronda];
                                        return (
                                            <div key={ronda} className="acordeon-ronda">
                                                <div className="acordeon-header" onClick={() => toggleRonda(ronda)}>
                                                    <div className="titulo">
                                                        <strong>{t('crear_torneo_general.ronda_n', { n: ronda })}</strong>
                                                        <span>{partidasRonda.length} {partidasRonda.length === 1 ? t('vista_emp.partida') : t('vista_emp.partidas')}</span>
                                                    </div>
                                                    <div className="icono">{expandida ? '▼' : '▶'}</div>
                                                </div>
                                                {expandida && (
                                                    <div className="acordeon-body">
                                                        <div className={`emparejamientos-grid ${esTorneoEquipos() ? 'equipos-layout' : ''}`}>
                                                            {renderPartidas(partidasRonda, false)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {modalAbierto && partidaSeleccionada && (
                <ModalRegistroPartida 
                    partida={partidaSeleccionada} 
                    torneo={torneo} 
                    esOrganizador={esOrganizador}
                    onClose={() => { 
                        setModalAbierto(false); 
                        setPartidaSeleccionada(null); 
                    }}
                    onGuardar={() => { cargarPartidasRonda(); 
                        cargarTodasLasPartidas(); 
                        setModalAbierto(false); 
                        setPartidaSeleccionada(null); 
                    }} />
            )}
            {modalEdicionAbierto && emparejamientoEditando && (
                <ModalEdicionEmparejamientos 
                    emparejamiento={emparejamientoEditando} 
                    jugadores={jugadores} 
                    equipos={equipos}
                    esTorneoEquipos={esTorneoEquipos()}
                    onClose={() => { 
                        setModalEdicionAbierto(false); 
                        setEmparejamientoEditando(null); 
                    }}
                    onGuardar={guardarEdicion} />
            )}
        </div>
    );
}

export default VistaEmparejamientosSaga;