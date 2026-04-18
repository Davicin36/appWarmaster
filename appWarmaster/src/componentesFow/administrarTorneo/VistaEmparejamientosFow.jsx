import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import torneosFowApi from '@/servicios/apiFow';
import { generarEmparejamientosIndividuales } from '../funcionesFow/emparejamientosIndividualesFow';

import ModalRegistroPartidaFow from '../ModalRegistroPartidaFow';
import ModalEdicionEmparejamientos from '@/componente/ModalEdicionEmparejamientos';

import '@/estilos/vistasTorneos/vistaEmparejamientos.css';

function VistaEmparejamientosFow({ torneoId: propTorneoId, esVistaPublica = false }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [emparejamientos, setEmparejamientos] = useState([]);
    const [partidasGuardadas, setPartidasGuardadas] = useState([]);
    const [todasLasPartidas, setTodasLasPartidas] = useState([]);
    const [rondasExpandidas, setRondasExpandidas] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cargandoPartidas, setCargandoPartidas] = useState(false);
    const [error, setError] = useState(null);
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [esOrganizador, setEsOrganizador] = useState(false);

    // Estados para edición de emparejamientos
    const [modoEdicion, setModoEdicion] = useState(false);
    const [emparejamientoEditando, setEmparejamientoEditando] = useState(null);
    const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

    // ── Frentes por mesa ─────────────────────────────────────────
    // { [mesaIndex]: nombreFrente }
    const [frentePorMesa, setFrentePorMesa] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUsuarioActual({
                    id: payload.userId,
                    nombre: payload.nombre
                });
            } catch (error) {
                console.error('Error al decodificar token:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (torneo?.created_by && usuarioActual?.id) {
            const esCreador = torneo.created_by === usuarioActual.id
            const esOrgAnadido = torneo.es_organiador === 1
            setEsOrganizador(esCreador || esOrgAnadido);
        }
    }, [torneo, usuarioActual]);

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
        }
    }, [torneoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const responseTorneo = await torneosFowApi.obtenerTorneo(torneoId);
            const dataTorneo = responseTorneo.data?.torneo || responseTorneo.torneo || responseTorneo;
            setTorneo(dataTorneo);
    
            const responseJugadores = await torneosFowApi.obtenerJugadoresTorneo(torneoId);
            const dataJugadores = responseJugadores.data || responseJugadores || [];
            setJugadores(Array.isArray(dataJugadores) ? dataJugadores : []);

            await cargarTodasLasPartidas(dataTorneo.id);
            
            if (dataTorneo.ronda_actual) {
                await cargarPartidasRonda(dataTorneo.id, dataTorneo.ronda_actual);
            }       
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('No se pudieron cargar los datos del torneo');
        } finally {
            setLoading(false);
        }
    };

    const cargarTodasLasPartidas = async (tId = torneoId) => {
        try {
            const response = await torneosFowApi.obtenerPartidasTorneo(tId);
            const partidas = response?.data || response || [];
            const partidasArray = Array.isArray(partidas) ? partidas : [];
            setTodasLasPartidas(partidasArray);
        } catch (err) {
            console.error('Error al cargar todas las partidas:', err);
            setTodasLasPartidas([]);
        }
    };

    const cargarPartidasRonda = async (tId = torneoId, ronda = torneo?.ronda_actual) => {
        try {
            setCargandoPartidas(true);
            
            const response = await torneosFowApi.obtenerEmparejamientosIndividuales(tId, ronda);
            const partidas = response?.data || response || [];
            const partidasArray = Array.isArray(partidas) ? partidas : [];
            setPartidasGuardadas(partidasArray);
             
        } catch (err) {
            console.error('Error al cargar partidas:', err);
            setPartidasGuardadas([]);
        } finally {
            setCargandoPartidas(false);
        }
    };

    const partidasPorRonda = () => {
        const grupos = {};
        todasLasPartidas.forEach(partida => {
            if (!grupos[partida.ronda]) {
                grupos[partida.ronda] = [];
            }
            grupos[partida.ronda].push(partida);
        });
        return grupos;
    };

    const toggleRonda = (ronda) => {
        setRondasExpandidas(prev => ({
            ...prev,
            [ronda]: !prev[ronda]
        }));
    };

    // ── Helper: obtener escenario de un frente para la ronda actual ──
    const getEscenarioFrente = (nombreFrente) => {
        if (!torneo?.frentes || !nombreFrente) return null;
        const frente = torneo.frentes.find(f => (f.nombre_frente || f.nombre) === nombreFrente);
        if (!frente) return null;
        const escenarios = Array.isArray(frente.escenarios)
            ? Object.fromEntries(frente.escenarios.map(e => [e.ronda, e.nombre_partida]))
            : (frente.escenarios || {});
        return escenarios[torneo.ronda_actual] || null;
    };

    // ── Helper: obtener lista de frentes normalizados ──
    const getFrentesDisponibles = () => {
        if (!torneo?.frentes) return [];
        return torneo.frentes.map(f => ({
            nombre: f.nombre_frente || f.nombre,
            escenario: (() => {
                const escenarios = Array.isArray(f.escenarios)
                    ? Object.fromEntries(f.escenarios.map(e => [e.ronda, e.nombre_partida]))
                    : (f.escenarios || {});
                return escenarios[torneo.ronda_actual] || '—';
            })()
        }));
    };

    const handleGenerarEmparejamientos = async () => {
        try {
            if (torneo.estado !== 'en_curso') {
                alert('⚠️ El torneo debe estar en estado "En Curso" para generar emparejamientos.\n\nInicia el torneo primero.');
                return;
            }

            if (!torneoId) {
                alert('⚠️ Error: No se encontró el ID del torneo');
                return;
            }

            const minParticipantes = jugadores.length;
            if (minParticipantes < 2) {
                alert('⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos');
                return;
            }

            const responseClasificacion = await torneosFowApi.obtenerClasificacionIndividual(torneoId);
            const clasificacion = responseClasificacion.data?.general || responseClasificacion.data || [];

            const participantes = jugadores.map(j => {
                const stats = clasificacion.find(c => c.jugador_id === j.jugador_id || c.jugador_id === j.id);
                return {
                    ...j,
                    puntos_victoria: stats?.puntos_victoria_totales || 0,
                    puntos_masacre: stats?.puntos_masacre_totales || 0,                
                };
            });

            const nuevosEmparejamientos = await generarEmparejamientosIndividuales(
                torneoId,
                torneo.ronda_actual || 1,
                participantes
            );
            
            setEmparejamientos(Array.isArray(nuevosEmparejamientos) ? nuevosEmparejamientos : []);
            setFrentePorMesa({});  // ← resetear frentes al generar nuevos emparejamientos
            setModoEdicion(false);
            alert(`✅ ${nuevosEmparejamientos.length} emparejamientos generados correctamente`);
            
        } catch (error) {
            console.error('❌ Error al generar emparejamientos:', error);
            alert(`Error al generar emparejamientos: ${error.message}`);
            setEmparejamientos([]);
        }
    };

    // ==========================================
    // FUNCIONES EDICIÓN DE EMPAREJAMIENTOS
    // ==========================================

    const eliminarEmparejamiento = (index) => {
        if (window.confirm('¿Eliminar este emparejamiento?')) {
            const nuevosEmp = [...emparejamientos];
            nuevosEmp.splice(index, 1);
            nuevosEmp.forEach((emp, i) => { emp.mesa = i + 1; });
            setEmparejamientos(nuevosEmp);

            // Reasignar frentePorMesa tras eliminación
            const nuevoFrentes = {};
            Object.entries(frentePorMesa).forEach(([idx, val]) => {
                const idxNum = parseInt(idx);
                if (idxNum < index) nuevoFrentes[idxNum] = val;
                else if (idxNum > index) nuevoFrentes[idxNum - 1] = val;
            });
            setFrentePorMesa(nuevoFrentes);

            alert('✅ Emparejamiento eliminado');
        }
    };

    const abrirEdicion = (emparejamiento, index) => {
        setEmparejamientoEditando({ ...emparejamiento, index });
        setModalEdicionAbierto(true);
    };

    const guardarEdicion = (nuevosDatos) => {
        const nuevosEmp = [...emparejamientos];

        const jugador1 = jugadores.find(j => (j.jugador_id || j.id) === nuevosDatos.jugador1_id);
        const jugador2 = nuevosDatos.jugador2_id
            ? jugadores.find(j => (j.jugador_id || j.id) === nuevosDatos.jugador2_id)
            : null;

        nuevosEmp[emparejamientoEditando.index] = {
            ...nuevosEmp[emparejamientoEditando.index],
            ...nuevosDatos,
            jugador1: jugador1
                ? {
                    id: jugador1.id || jugador1.jugador_id,
                    jugador_id: jugador1.jugador_id || jugador1.id,
                    nombre: jugador1.jugador_nombre || jugador1.nombre,
                    jugador_nombre: jugador1.jugador_nombre || jugador1.nombre,
                    apellidos: jugador1.jugador_apellidos || jugador1.apellidos || '',
                    club: jugador1.club || '-',
                    ejercito: jugador1.ejercito || '-',
                    bando: jugador1.bando || null,
                    puntos_victoria: jugador1.puntos_victoria || 0,
                    puntos_torneo: jugador1.puntos_torneo || 0
                }
                : nuevosEmp[emparejamientoEditando.index].jugador1,
            jugador2: jugador2
                ? {
                    id: jugador2.id || jugador2.jugador_id,
                    jugador_id: jugador2.jugador_id || jugador2.id,
                    nombre: jugador2.jugador_nombre || jugador2.nombre,
                    jugador_nombre: jugador2.jugador_nombre || jugador2.nombre,
                    apellidos: jugador2.jugador_apellidos || jugador2.apellidos || '',
                    club: jugador2.club || '-',
                    ejercito: jugador2.ejercito || '-',
                    bando: jugador2.bando || null,
                    puntos_victoria: jugador2.puntos_victoria || 0,
                    puntos_torneo: jugador2.puntos_torneo || 0
                }
                : null
        };

        setEmparejamientos(nuevosEmp);
        setModalEdicionAbierto(false);
        setEmparejamientoEditando(null);
        alert('✅ Emparejamiento actualizado');
    };

    // ==========================================
    // GUARDAR EN BD
    // ==========================================

    const guardarResultados = async () => {
        try {
            setGuardando(true);
            setError(null);

            if (!emparejamientos || emparejamientos.length === 0) {
                alert('⚠️ Primero debes generar los emparejamientos');
                return;
            }

            // ── Validación escenarios ──────────────────────────────
            if (torneo.usa_frentes) {
                // Con frentes: cada mesa debe tener su frente asignado
                const sinFrente = emparejamientos
                    .map((_, i) => i)
                    .filter(i => !frentePorMesa[i]);

                if (sinFrente.length > 0) {
                    alert(
                        `⚠️ Debes asignar un frente a todas las mesas.\n\n` +
                        `Mesas sin frente: ${sinFrente.map(i => i + 1).join(', ')}`
                    );
                    return;
                }
            } else {
                // Sin frentes: escenario global de la ronda
                const nombreEscenario = torneo[`partida_ronda_${torneo.ronda_actual}`];
                if (!nombreEscenario) {
                    alert(`⚠️ No se encontró el escenario configurado para la Ronda ${torneo.ronda_actual}`);
                    return;
                }
            }

            // ── Resumen confirmación ───────────────────────────────
            let resumenConfirm;
            if (torneo.usa_frentes) {
                const frentesUsados = [...new Set(Object.values(frentePorMesa))];
                resumenConfirm =
                    `¿Guardar ${emparejamientos.length} emparejamientos para la Ronda ${torneo.ronda_actual}?\n\n` +
                    `Frentes asignados:\n` +
                    frentesUsados.map(f => {
                        const esc = getEscenarioFrente(f);
                        const mesas = Object.entries(frentePorMesa)
                            .filter(([, v]) => v === f)
                            .map(([k]) => parseInt(k) + 1);
                        return `• ${f} → ${esc || '—'} (mesas: ${mesas.join(', ')})`;
                    }).join('\n');
            } else {
                const nombreEscenario = torneo[`partida_ronda_${torneo.ronda_actual}`];
                resumenConfirm =
                    `¿Guardar ${emparejamientos.length} emparejamientos para la Ronda ${torneo.ronda_actual}?\n\n` +
                    `Escenario: ${nombreEscenario}`;
            }

            if (!window.confirm(resumenConfirm)) return;

            // ── Construir array de partidas ────────────────────────
            const todasLasPartidasGuardar = [];
            let mesaCounter = 1;

            emparejamientos.forEach((emp, empIndex) => {
                // Determinar escenario para esta mesa
                const nombreEscenario = torneo.usa_frentes
                    ? getEscenarioFrente(frentePorMesa[empIndex])
                    : torneo[`partida_ronda_${torneo.ronda_actual}`];

                if (emp.partidas && Array.isArray(emp.partidas)) {
                    emp.partidas.forEach((partida) => {
                        todasLasPartidasGuardar.push({
                            mesa: mesaCounter++,
                            jugador1_id: partida.jugador1_id,
                            jugador2_id: partida.jugador2_id,
                            es_bye: partida.es_bye || 0,
                            nombre_partida: nombreEscenario,
                            frente: torneo.usa_frentes ? frentePorMesa[empIndex] : null,
                            ronda: torneo.ronda_actual,
                        });
                    });
                } else {
                    todasLasPartidasGuardar.push({
                        mesa: mesaCounter++,
                        jugador1_id: emp.jugador1_id,
                        jugador2_id: emp.jugador2_id,
                        es_bye: emp.es_bye || 0,
                        nombre_partida: nombreEscenario,
                        frente: torneo.usa_frentes ? frentePorMesa[empIndex] : null,
                        ronda: torneo.ronda_actual,
                    });
                }
            });

            // ── Validar IDs ────────────────────────────────────────
            const errores = [];
            todasLasPartidasGuardar.forEach((partida) => {
                if (!partida.jugador1_id) {
                    errores.push(`Mesa ${partida.mesa}: jugador 1 sin ID`);
                }
            });

            if (errores.length > 0) {
                console.error('Errores de validación:', errores);
                alert('Error: Faltan IDs:\n' + errores.join('\n'));
                return;
            }

            await torneosFowApi.guardarEmparejamientosIndividuales(
                torneo.id,
                todasLasPartidasGuardar,
                torneo.ronda_actual
            );

            alert(`✅ ${emparejamientos.length} partidas creadas para la Ronda ${torneo.ronda_actual}`);

            setEmparejamientos([]);
            setFrentePorMesa({});
            setModoEdicion(false);

            await cargarPartidasRonda();
            await cargarTodasLasPartidas();
        
        } catch (err) {
            console.error('❌ Error completo al guardar:', err);
            setError(err.message || 'No se pudieron guardar los emparejamientos');
            alert(`❌ Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const generarSiguienteRonda = async () => {
        try {
            if (!todasLasPartidasCompletas()) {
                alert('⚠️ Debes completar todas las partidas de la ronda actual antes de generar la siguiente ronda');
                return;
            }

            if (torneo.ronda_actual >= torneo.rondas_max) {
                alert('⚠️ Ya se han jugado todas las rondas del torneo');
                return;
            }

            const confirmar = window.confirm(
                `¿Generar emparejamientos para la Ronda ${torneo.ronda_actual + 1}?\n\n` +
                `Se calcularán los emparejamientos basados en los resultados actuales.`
            );

            if (!confirmar) return;

            await torneosFowApi.actualizarTorneo(torneo.id, {
                ronda_actual: torneo.ronda_actual + 1
            });

            await cargarDatos();

        } catch (err) {
            console.error('Error:', err);
            alert(`❌ Error al generar siguiente ronda: ${err.message}`);
        }
    };

    const todasLasPartidasCompletas = () => {
        if (partidasGuardadas.length === 0) return false;
        
        return partidasGuardadas.every(partida => 
            partida.resultado_pf && 
            partida.resultado_pf !== 'pendiente' &&
            partida.resultado_pf !== null
        );
    };

    const puedeEditarPartidas = () => {
        return torneo?.estado === 'en_curso';
    };

    const esBye = (partida) => {
        return !partida.jugador2_nombre || !partida.jugador2_id || partida.es_bye == 1;
    };

    const tieneDatos = (partida) => {
        if (esBye(partida)) {
            return true;
        }
        return (partida.puntos_victoria_j1 > 0 || partida.puntos_victoria_j2 > 0) &&
               partida.resultado_pf && 
               partida.resultado_pf !== 'pendiente';
    };

    const puedeEditarEstaPartida = (partida) => {
        if (partida.resultado_confirmado == 1) {
            return false;
        }
        if (esBye(partida)) {
            return false;
        }
        return puedeEditarPartidas();
    };

    const abrirModalPartida = (partida) => {
        if (!puedeEditarPartidas()) {
            alert('⚠️ El torneo debe estar "En Curso" para poder introducir resultados.\n\nCambia el estado del torneo primero.');
            return;
        }
        setPartidaSeleccionada(partida);
        setModalAbierto(true);
    };

    const confirmarPartida = async (partidaId, confirmar) => {
        try {
            await torneosFowApi.confirmarResultado(torneo.id, partidaId, confirmar);
        
            alert(confirmar 
                ? '✅ Resultado confirmado. Los puntos se han sumado a las clasificaciones.' 
                : '⚠️ Resultado desconfirmado. Los puntos se han restado de las clasificaciones.'
            );
            
            await cargarPartidasRonda();
            await cargarTodasLasPartidas();
            
        } catch (error) {
            console.error('Error al confirmar resultado:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const renderPartidaIndividual = (partida, index, esRondaActual) => {
        const estaConfirmado = partida.resultado_confirmado;
        const puedeEditar = esRondaActual && puedeEditarEstaPartida(partida) && !esBye(partida);

        // Normalizar campos: las partidas guardadas vienen planas, las de preview anidadas
        const j1Nombre   = partida.jugador1_nombre   || partida.jugador1?.nombre || partida.jugador1?.jugador_nombre || '—';
        const j1Alias    = partida.jugador1_alias     || partida.jugador1?.nombre_alias || null;
        const j1Ejercito = partida.jugador1_ejercito  || partida.jugador1?.ejercito || null;

        const j2Nombre   = partida.jugador2_nombre   || partida.jugador2?.nombre || partida.jugador2?.jugador_nombre || null;
        const j2Alias    = partida.jugador2_alias     || partida.jugador2?.nombre_alias || null;
        const j2Ejercito = partida.jugador2_ejercito  || partida.jugador2?.ejercito || null;

        return (
            <div
                key={partida.id}
                className={`emparejamiento-card ${puedeEditar ? 'editable' : ''}`}
                onClick={() => puedeEditar && abrirModalPartida(partida)}
                style={{
                    border: `2px solid ${estaConfirmado ? '#4caf50' : (tieneDatos(partida) ? '#2196f3' : '#ff9800')}`,
                    background: estaConfirmado ? '#e8f5e9' : (tieneDatos(partida) ? '#e3f2fd' : '#fff'),
                    cursor: puedeEditar ? 'pointer' : 'default'
                }}
            >
                {puedeEditar && (
                    <div className="etiqueta-editar">
                        👆 Click para editar
                    </div>
                )}

                {!esVistaPublica && esOrganizador && esRondaActual && (
                    <button
                        className={`boton-confirmar ${estaConfirmado ? 'confirmado' : (tieneDatos(partida) ? 'por-confirmar' : 'pendiente')}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(
                                estaConfirmado
                                    ? '¿Desconfirmar este resultado?\n\nLos puntos se restarán de la clasificación.'
                                    : (esBye(partida)
                                        ? '⭐ ¿Confirmar este BYE?\n\nSe sumarán 3 PV y 500 PM a la clasificación.'
                                        : '¿Confirmar este resultado?\n\nLos puntos se sumarán a la clasificación.')
                            )) {
                                confirmarPartida(partida.id, !estaConfirmado);
                            }
                        }}
                    >
                        {estaConfirmado ? '✅ CONFIRMADO' : (tieneDatos(partida) ? '🔵 POR CONFIRMAR' : '⏳ PENDIENTE')}
                    </button>
                )}

                <div className={`mesa-numero ${estaConfirmado ? 'confirmado' : (tieneDatos(partida) ? 'por-confirmar' : 'pendiente')} ${esOrganizador && esRondaActual ? 'con-margen' : ''}`}>
                    Mesa {partida.mesa || index + 1}
                    {esBye(partida) ? ' ⭐ BYE' : ''}
                    {partida.nombre_partida && (
                        <div className="escenario-partida">📋 {partida.nombre_partida}</div>
                    )}
                    {partida.frente && (
                        <div className="frente-partida">🗺️ {partida.frente}</div>
                    )}
                </div>

                <div className="enfrentamiento">
                    <div className="jugador">
                        <div className="nombre">
                            {j1Nombre}
                            {j1Alias && ` "${j1Alias}"`}
                        </div>
                        {j1Ejercito && (
                            <div className="faccion">⚔️ {j1Ejercito}</div>
                        )}
                        <div className="stats">
                            PV: {parseFloat(partida.puntos_victoria_j1 || 0).toFixed(1)} |
                            PT: {parseFloat(partida.puntos_torneo_j1 || 0).toFixed(1)}
                        </div>
                    </div>

                    <div className="vs">VS</div>

                    {j2Nombre ? (
                        <div className="jugador">
                            <div className="nombre">
                                {j2Nombre}
                                {j2Alias && ` "${j2Alias}"`}
                            </div>
                            {j2Ejercito && (
                                <div className="faccion">⚔️ {j2Ejercito}</div>
                            )}
                            <div className="stats">
                                PV: {parseFloat(partida.puntos_victoria_j2 || 0).toFixed(1)} |
                                PT: {parseFloat(partida.puntos_torneo_j2 || 0).toFixed(1)}
                            </div>
                        </div>
                    ) : (
                        <div className="jugador bye">
                            <div>⭐ BYE</div>
                            <div>Victoria automática</div>
                            <div>3 PV | 500 PM</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPartidas = (partidas, esRondaActual = false) => {
        return partidas.map((partida, index) => 
            renderPartidaIndividual(partida, index, esRondaActual)
        );
    };

    if (loading) {
        return (
            <div className="vista-emparejamientos">
                <div className="loading-message">⏳ Cargando emparejamientos...</div>
            </div>
        );
    }

    if (error && !torneo) {
        return (
            <div className="vista-emparejamientos">
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={cargarDatos} className="btn-secondary">
                        🔄 Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const grupos = partidasPorRonda();
    const rondasAnteriores = Object.keys(grupos).filter(r => parseInt(r) < torneo.ronda_actual).sort((a, b) => b - a);
    const minParticipantes = jugadores.length;
    const frentesDisponibles = getFrentesDisponibles();

    // Cuántas mesas tienen frente asignado (para el indicador)
    const mesasConFrente = emparejamientos.length > 0
        ? emparejamientos.filter((_, i) => !!frentePorMesa[i]).length
        : 0;

    return (
        <div className="vista-emparejamientos">
            <div className="section-header">
                <div>
                    <div>
                        <h2>🎲 Emparejamientos</h2>
                        <p>Ronda {torneo.ronda_actual} de {torneo.rondas_max}</p>
                        
                        {(torneo.estado === 'en_curso' || torneo.estado === 'finalizado') && (
                            <>
                                {/* Sin frentes: mostrar escenario global */}
                                {!torneo.usa_frentes && torneo[`partida_ronda_${torneo.ronda_actual}`] && (
                                    <p>📋 {torneo[`partida_ronda_${torneo.ronda_actual}`]}</p>
                                )}
                                {/* Con frentes: indicar que cada mesa tiene su escenario */}
                                {torneo.usa_frentes && (
                                    <p>🗺️ Torneo por frentes — el escenario se asigna por mesa</p>
                                )}
                            </>
                        )}

                        {torneo.estado === 'pendiente' && (
                            <p>⏳ Los escenarios se mostrarán cuando el torneo esté en curso</p>
                        )}
                    </div>
                    
                    {!esVistaPublica && (
                        <div className="botones-grupo">
                            {/* BOTÓN GENERAR */}
                            <button 
                                onClick={handleGenerarEmparejamientos}
                                className="btn-primary"
                                disabled={
                                    minParticipantes < 2 || 
                                    guardando || 
                                    partidasGuardadas.length > 0 || 
                                    modoEdicion ||
                                    torneo.estado !== 'en_curso'
                                }
                            >
                                🎲 Generar Emparejamientos
                            </button>

                            {/* BOTONES EDICIÓN / GUARDAR */}
                            {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                                <>
                                    {!modoEdicion ? (
                                        <>
                                            <button 
                                                onClick={() => setModoEdicion(true)}
                                                className="btn-warning"
                                            >
                                                ✏️ Editar Emparejamientos
                                            </button>
                                            
                                            <button 
                                                onClick={guardarResultados}
                                                className="btn-success"
                                                disabled={
                                                    guardando ||
                                                    // Con frentes: deshabilitar si faltan frentes
                                                    (torneo.usa_frentes && mesasConFrente < emparejamientos.length)
                                                }
                                                title={
                                                    torneo.usa_frentes && mesasConFrente < emparejamientos.length
                                                        ? `Asigna frente a todas las mesas (${mesasConFrente}/${emparejamientos.length})`
                                                        : ''
                                                }
                                            >
                                                {guardando
                                                    ? '⏳ Guardando...'
                                                    : torneo.usa_frentes
                                                        ? `💾 Guardar en BD (${mesasConFrente}/${emparejamientos.length} frentes)`
                                                        : '💾 Guardar en BD'
                                                }
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setModoEdicion(false);
                                                alert('✅ Modo edición desactivado. Ahora puedes guardar los emparejamientos.');
                                            }}
                                            className="btn-success"
                                        >
                                            ✅ Finalizar Edición
                                        </button>
                                    )}
                                </>
                            )}

                            {/* BOTÓN SIGUIENTE RONDA */}
                            {partidasGuardadas.length > 0 && todasLasPartidasCompletas() && (
                                <button 
                                    onClick={generarSiguienteRonda}
                                    disabled={torneo.ronda_actual >= torneo.rondas_max}
                                    className="btn-warning"
                                >
                                    ⏭️ Generar Ronda {torneo.ronda_actual + 1}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {partidasGuardadas.length > 0 && !puedeEditarPartidas() && (
                <div className="alerta-estado">
                    <p>⚠️ El torneo debe estar en estado "En Curso" para introducir resultados</p>
                </div>
            )}

            {partidasGuardadas.length > 0 && (
                <div className={`info-partidas ${todasLasPartidasCompletas() ? 'completadas' : 'pendientes'}`}>
                    <p>
                        {todasLasPartidasCompletas() ? (
                            <>✅ Todas las partidas completadas ({partidasGuardadas.length}/{partidasGuardadas.length})</>
                        ) : (
                            <>⏳ Partidas completadas: {partidasGuardadas.filter(p => p.resultado_pf && p.resultado_pf !== 'pendiente').length}/{partidasGuardadas.length}</>
                        )}
                    </p>
                    {!todasLasPartidasCompletas() && puedeEditarPartidas() && (
                        <p>Haz clic en cualquier partida para registrar sus resultados</p>
                    )}
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>❌ {error}</p>
                </div>
            )}

            {cargandoPartidas && (
                <div className="loading-message">⏳ Cargando partidas...</div>
            )}

            {minParticipantes < 2 ? (
                <div className="empty-message">
                    <p>⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos</p>
                </div>
            ) : (
                <>
                    {partidasGuardadas.length === 0 && emparejamientos.length === 0 ? (
                        <div className="empty-message">
                            <p>Haz clic en "Generar Emparejamientos" para crear los enfrentamientos de la ronda {torneo.ronda_actual}</p>
                        </div>
                    ) : (
                        <>
                            {emparejamientos.length > 0 && partidasGuardadas.length === 0 && (
                                <div className="info-box">
                                    <p>
                                        ℹ️ <strong>{emparejamientos.length} emparejamientos generados.</strong>
                                        {modoEdicion
                                            ? ' Modo edición activo: usa ✏️ para cambiar rivales y 🗑️ para eliminar mesas.'
                                            : torneo.usa_frentes
                                                ? ` Asigna el frente a cada mesa y haz clic en "Guardar en BD".`
                                                : ' Haz clic en "Guardar en BD" para crear las partidas en la base de datos.'
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="emparejamientos-grid">
                                {partidasGuardadas.length > 0 ? (
                                    renderPartidas(partidasGuardadas, true)
                                ) : (
                                    emparejamientos.map((emp, index) => {
                                        const jugador1Nombre = emp.jugador1?.nombre || emp.jugador1?.jugador_nombre;
                                        const jugador2Nombre = emp.jugador2 
                                            ? (emp.jugador2?.nombre || emp.jugador2?.jugador_nombre) 
                                            : null;

                                        const frenteSeleccionado = frentePorMesa[index] || '';
                                        const escenarioFrente = frenteSeleccionado
                                            ? getEscenarioFrente(frenteSeleccionado)
                                            : null;
                                        
                                        return (
                                            <div key={index} className="emparejamiento-card">
                                                {/* BOTONES EDICIÓN */}
                                                {modoEdicion && (
                                                    <div className="botones-edicion">
                                                        <button
                                                            onClick={() => abrirEdicion(emp, index)}
                                                            className="btn-editar-small"
                                                            title="Editar emparejamiento"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarEmparejamiento(index)}
                                                            className="btn-eliminar-small"
                                                            title="Eliminar emparejamiento"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="mesa-numero preview">
                                                    Mesa {emp.mesa || index + 1}
                                                    {emp.es_bye === 1 && ' ⭐ BYE'}
                                                </div>

                                                <div className="enfrentamiento">
                                                    <div className="jugador">
                                                        <div className="nombre">{jugador1Nombre}</div>
                                                        {emp.jugador1?.bando && (
                                                            <div className="faccion"> {emp.jugador1.bando}</div>
                                                        )}
                                                    </div>
                                                    <div className="vs">VS</div>
                                                    <div className="jugador">
                                                        <div className="nombre">
                                                            {emp.es_bye === 1 ? '⭐ BYE' : jugador2Nombre}
                                                        </div>
                                                        {emp.jugador2?.bando && (
                                                            <div className="faccion"> {emp.jugador2.bando}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ── SELECTOR DE FRENTE ── */}
                                                {torneo.usa_frentes && frentesDisponibles.length > 0 && (
                                                    <div
                                                        className="frente-selector-container"
                                                        style={{
                                                            marginTop: '10px',
                                                            padding: '8px',
                                                            background: frenteSeleccionado ? '#e8f5e9' : '#fff3e0',
                                                            borderRadius: '6px',
                                                            border: `1px solid ${frenteSeleccionado ? '#4caf50' : '#ff9800'}`
                                                        }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <label
                                                            htmlFor={`frente-mesa-${index}`}
                                                            style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85em' }}
                                                        >
                                                            🗺️ Frente:{frenteSeleccionado ? '' : ' ⚠️ Sin asignar'}
                                                        </label>
                                                        <select
                                                            id={`frente-mesa-${index}`}
                                                            value={frenteSeleccionado}
                                                            onChange={(e) =>
                                                                setFrentePorMesa(prev => ({
                                                                    ...prev,
                                                                    [index]: e.target.value
                                                                }))
                                                            }
                                                            style={{ width: '100%', padding: '4px 6px', borderRadius: '4px' }}
                                                        >
                                                            <option value="">— Selecciona frente —</option>
                                                            {frentesDisponibles.map(f => (
                                                                <option key={f.nombre} value={f.nombre}>
                                                                    {f.nombre}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {/* Mostrar la misión resultante */}
                                                        {escenarioFrente && (
                                                            <div
                                                                style={{
                                                                    marginTop: '4px',
                                                                    fontSize: '0.82em',
                                                                    color: '#2e7d32',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                📋 Misión: <strong>{escenarioFrente}</strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}

                    {rondasAnteriores.length > 0 && (
                        <div className="rondas-anteriores">
                            <h3>📜 Rondas Anteriores</h3>
                            
                            {rondasAnteriores.map(ronda => {
                                const partidasRonda = grupos[ronda] || [];
                                const expandida = rondasExpandidas[ronda];
                                
                                return (
                                    <div key={ronda} className="acordeon-ronda">
                                        <div 
                                            className="acordeon-header"
                                            onClick={() => toggleRonda(ronda)}
                                        >
                                            <div className="titulo">
                                                <strong>Ronda {ronda}</strong>
                                                <span>{partidasRonda.length} partidas</span>
                                            </div>
                                            <div className="icono">
                                                {expandida ? '▼' : '▶'}
                                            </div>
                                        </div>
                                        
                                        {expandida && (
                                            <div className="acordeon-body">
                                                <div className="emparejamientos-grid">
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

            {/* MODAL REGISTRO PARTIDA */}
            {modalAbierto && partidaSeleccionada && (
                <ModalRegistroPartidaFow
                    partida={partidaSeleccionada}
                    esOrganizador={esOrganizador}
                    onClose={() => {
                        setModalAbierto(false);
                        setPartidaSeleccionada(null);
                    }}
                    onGuardar={() => {
                        cargarPartidasRonda();
                        cargarTodasLasPartidas();
                        setModalAbierto(false);
                        setPartidaSeleccionada(null);
                    }}
                />
            )}

            {/* MODAL EDICIÓN EMPAREJAMIENTOS */}
            {modalEdicionAbierto && emparejamientoEditando && (
                <ModalEdicionEmparejamientos
                    emparejamiento={emparejamientoEditando}
                    jugadores={jugadores}
                    equipos={[]}
                    esTorneoEquipos={false}
                    onClose={() => {
                        setModalEdicionAbierto(false);
                        setEmparejamientoEditando(null);
                    }}
                    onGuardar={guardarEdicion}
                />
            )}
        </div>
    );
}

export default VistaEmparejamientosFow;