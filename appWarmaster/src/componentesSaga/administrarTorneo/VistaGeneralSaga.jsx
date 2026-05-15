import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import torneosSagaApi from '@/servicios/apiSaga';

import '@/estilos/vistasTorneos/vistaGeneral.css';

import {
    EQUIPOS_RANGO,
    EPOCAS_SAGA,
    TIPOS_PARTIDA_SAGA,
    ESTADOS_TORNEO_SAGA,
    RONDAS_DISPONIBLES,
    JUGADORES_EQUIPO_RANGO,
    formatearEpocas,
    PUNTOS_BANDA_RANGO,
    PARTICIPANTES_RANGO
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga.js';

function VistaGeneralSaga({ torneoId: propTorneoId, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    const navigate = useNavigate();

    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modoEdicion, setModoEdicion] = useState(false);
    const [duracionTorneo, setDuracionTorneo] = useState("1");
    const [datosEdicion, setDatosEdicion] = useState({
        nombre_torneo: '',
        tipo_torneo: '',
        num_jugadores_equipo: JUGADORES_EQUIPO_RANGO.default,
        epocas_disponibles: [],
        rondas_max: RONDAS_DISPONIBLES[0].valor,
        puntos_banda: PUNTOS_BANDA_RANGO.default,
        participantes_max: PARTICIPANTES_RANGO.default,
        equipos_max: EQUIPOS_RANGO.default,
        unidades_legendarias: '0',
        modelo_gakis: '0',
        warlord_punto_victoria: '0',
        puntosDeTorneo: '0',
        misiones_secundarias: '0',
        fecha_inicio: '',
        fecha_fin: '',
        ubicacion: '',
        estado: 'pendiente',
        partida_ronda_1: '',
        partida_ronda_2: '',
        partida_ronda_3: '',
        partida_ronda_4: '',
        partida_ronda_5: ''
    });
    const [loadingEdicion, setLoadingEdicion] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState('');
    const [archivoPDF, setArchivoPDF] = useState(null);
    const [eliminarPDF, setEliminarPDF] = useState(false);

    // ⬅️ NUEVOS ESTADOS PARA IMAGEN
    const [imagenActual, setImagenActual] = useState(null);
    const [imagenNueva, setImagenNueva] = useState(null);
    const [vistaPreviaImagen, setVistaPreviaImagen] = useState(null);
    const [eliminarImagenFlag, setEliminarImagenFlag] = useState(false);

    const [organizadores, setOrganizadores] = useState({ activos: [], pendientes: [] });
    const [nuevoOrganizadorEmail, setNuevoOrganizadorEmail] = useState('');
    const [loadingOrganizadores, setLoadingOrganizadores] = useState(false);

    useEffect(() => {
        if (torneoId) {
            cargarDatos();
            cargarOrganizadores()
        }
    }, [torneoId]);

    useEffect(() => {
        if (torneo) {
            let epocas = [];
            if (torneo.epocas_disponibles) {
                epocas = torneo.epocas_disponibles.split('|').map(e => e.trim()).filter(e => e);
            }

            const tipoTorneo = torneo.tipo_torneo === 'Por equipos' 
                ? 'Por equipos' 
                : 'Individual';

            const fechaInicio = torneo.fecha_inicio?.split('T')[0] || '';
            const fechaFin = torneo.fecha_fin?.split('T')[0] || '';

            if (fechaFin && fechaFin !== fechaInicio) {
                setDuracionTorneo("2");
            } else {
                setDuracionTorneo("1");
            }

            // ✅ NORMALIZAR A STRING: Convertir cualquier valor truthy a '1', falsy a '0'
            const normalizar = (val) => (val === 1 || val === '1' || val === true) ? '1' : '0';


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
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '',
                partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '',
                partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || ''
            });

            if (torneo.imagen_url) {
                    setImagenActual(torneo.imagen_url);
                }
        }
    }, [torneo]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            
            const response = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            
            // Cargar jugadores
            try {
                const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
            } catch (err) {
                console.log('No hay jugadores todavía', err);
                setJugadores([]);
            }

            // Cargar equipos si es torneo por equipos
            if (dataTorneo.tipo_torneo === 'Por equipos') {
                try {
                    const dataEquipos = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                    setEquipos(Array.isArray(dataEquipos) ? dataEquipos : dataEquipos.data || []);
                } catch (err) {
                    console.log('No hay equipos todavía', err);
                    setEquipos([]);
                }
            }
            
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarOrganizadores = async () => {
        try {
            const data = await torneosSagaApi.obtenerOrganizadores(torneoId);
            setOrganizadores(data.data || { activos: [], pendientes: [] });
        } catch (error) {
            console.error('Error al cargar organizadores:', error);
        }
    };

    const handleReenviarInvitacion = async (org) => {
        console.log('📧 Reenviando invitación a:', org);
        
        if (!org.organizador_id) {
          alert('❌ Error: No se puede reenviar (falta ID).');
          return;
        }
        
        if (window.confirm(`¿Reenviar invitación a ${org.email}?`)) {
          try {
            await torneosSagaApi.reenviarInvitacion(torneo.id, org.organizador_id);
            alert('✅ Invitación reenviada correctamente');
          } catch (error) {
            console.error('❌ Error:', error);
            alert(`❌ Error: ${error.message}`);
          }
        }
    };
    
    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({ ...prev, [name]: value }));
        if (errorEdicion) setErrorEdicion('');
    };

    const handleNuevaImagenCartel = (e) => {
        const file = e.target.files[0];
        
        if (!file) {
            setImagenNueva(null);
            setVistaPreviaImagen(null);
            return;
        }
        
        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            setErrorEdicion('⚠️ Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
            e.target.value = '';
            setImagenNueva(null);
            setVistaPreviaImagen(null);
            setTimeout(() => setErrorEdicion(''), 4000);
            return;
        }
        
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            const tamañoMB = (file.size / 1024 / 1024).toFixed(2);
            setErrorEdicion(`⚠️ La imagen (${tamañoMB}MB) supera el tamaño máximo de 5MB.`);
            e.target.value = '';
            setImagenNueva(null);
            setVistaPreviaImagen(null);
            setTimeout(() => setErrorEdicion(''), 5000);
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setVistaPreviaImagen(reader.result);
        };
        reader.readAsDataURL(file);
        
        setImagenNueva(file);
        setEliminarImagenFlag(false);
        setErrorEdicion('');
    };

    const handleCancelarNuevaImagen = () => {
        setImagenNueva(null);
        setVistaPreviaImagen(null);
        const fileInput = document.getElementById('nuevaImagenCartel');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleEliminarImagenActual = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar la imagen del cartel?')) {
            setEliminarImagenFlag(true);
            setImagenActual(null);
            setImagenNueva(null);
            setVistaPreviaImagen(null);
        }
    };

    const handleCancelarEliminacionImagen = () => {
        setEliminarImagenFlag(false);
        if (torneo?.imagen_url) {
            setImagenActual(torneo.imagen_url);
        }
    };

    const handleGuardarCambios = async (e) => {
    e.preventDefault();
    
    if (!datosEdicion.nombre_torneo.trim()) {
        setErrorEdicion('El nombre del torneo es obligatorio');
        return;
    }

    if (!datosEdicion.epocas_disponibles || datosEdicion.epocas_disponibles.length === 0) {
        setErrorEdicion('Debes seleccionar al menos una época');
        return;
    }

    if (datosEdicion.tipo_torneo === 'Por equipos') {
        if (!datosEdicion.num_jugadores_equipo || datosEdicion.num_jugadores_equipo < JUGADORES_EQUIPO_RANGO.min) {
            setErrorEdicion(`Los torneos por equipos deben tener al menos ${JUGADORES_EQUIPO_RANGO.min} jugadores por equipo`);
            return;
        }

        if (datosEdicion.epocas_disponibles.length < datosEdicion.num_jugadores_equipo) {
            setErrorEdicion(`Debes seleccionar al menos ${datosEdicion.num_jugadores_equipo} épocas para ${datosEdicion.num_jugadores_equipo} jugadores por equipo`);
            return;
        }
    }

    if (datosEdicion.tipo_torneo === 'Por equipos'){
        if (!datosEdicion.num_jugadores_equipo || datosEdicion.num_jugadores_equipo < JUGADORES_EQUIPO_RANGO.min){
            setErrorEdicion(`Los torneos por equipos deben de tener al menos ${JUGADORES_EQUIPO_RANGO.min} jugadores por equipo.`)
            return
        }
        if (datosEdicion.epocas_disponibles.length < datosEdicion.num_jugadores_equipo){
            setErrorEdicion(`Debes seleccionar al menos ${datosEdicion.num_jugadores_equipo} épocas para cada miembro del equipo.`)
            return
        }

        if (datosEdicion.equipos_max < equipos.length){
            setErrorEdicion(`No puedes reducir el número de equipos a menos de ${equipos.length}`)
            return
        }
    }else {
        if (datosEdicion.participantes_max < jugadores.length) {
            setErrorEdicion(`No puedes reducir el número de participantes a menos de ${jugadores.length}`);
            return;
        }
    }

    if (!window.confirm('¿Deseas guardar los cambios en el torneo?')) return;

    try {
        setLoadingEdicion(true);
        setErrorEdicion('');

        // ✅ CONSTRUIR DATOS CON MANEJO CORRECTO DE '0'
        const datosLimpios = {
            nombre_torneo: datosEdicion.nombre_torneo,
            tipo_torneo: datosEdicion.tipo_torneo,
            num_jugadores_equipo: datosEdicion.num_jugadores_equipo,
            rondas_max: datosEdicion.rondas_max,
            puntos_banda: datosEdicion.puntos_banda,
            participantes_max: datosEdicion.participantes_max,
            equipos_max: datosEdicion.equipos_max,
            epocas_disponibles: datosEdicion.epocas_disponibles,
            unidades_legendarias: datosEdicion.unidades_legendarias, // ✅ Siempre incluir, incluso si es '0'
            modelo_gakis: datosEdicion.modelo_gakis,
            warlord_punto_victoria: datosEdicion.warlord_punto_victoria,
            puntosDeTorneo: datosEdicion.puntosDeTorneo,
            misiones_secundarias: datosEdicion.misiones_secundarias,
            fecha_inicio: datosEdicion.fecha_inicio,
            fecha_fin: duracionTorneo === "1" ? null : (datosEdicion.fecha_fin || null),
            ubicacion: datosEdicion.ubicacion || null,
            estado: datosEdicion.estado,
            partida_ronda_1: datosEdicion.partida_ronda_1,
            partida_ronda_2: datosEdicion.partida_ronda_2,
            partida_ronda_3: datosEdicion.partida_ronda_3 || null,
            partida_ronda_4: datosEdicion.partida_ronda_4 || null,
            partida_ronda_5: datosEdicion.partida_ronda_5 || null
        };

        let dataToSend;
        
        if (archivoPDF || eliminarPDF || imagenNueva || eliminarImagenFlag) {
            dataToSend = new FormData();
            Object.keys(datosLimpios).forEach(key => {
               if (datosLimpios[key] !== null && datosLimpios[key] !== '') {
                    dataToSend.append(key, datosLimpios[key]);
                }
            });
            
            // PDF
            if (archivoPDF) dataToSend.append('bases_pdf', archivoPDF);
            if (eliminarPDF) dataToSend.append('eliminar_pdf', 'true');
            
            // ⬅️ IMAGEN
            if (imagenNueva) {
                dataToSend.append('imagen_cartel', imagenNueva);
                console.log('🖼️ Nueva imagen añadida:', imagenNueva.name);
            }
            if (eliminarImagenFlag) {
                dataToSend.append('eliminar_imagen', 'true');
                console.log('🗑️ Imagen marcada para eliminar');
            }
        } else {
            dataToSend = {...datosLimpios};
        }

        await torneosSagaApi.actualizarTorneo(torneoId, dataToSend);
        
        alert('✅ Torneo actualizado correctamente');
            setModoEdicion(false);
            setArchivoPDF(null);
            setEliminarPDF(false);
            setImagenNueva(null);
            setVistaPreviaImagen(null);
            setEliminarImagenFlag(false);
            await cargarDatos();
            if (onUpdate) onUpdate();
            
        } catch (error) {
            console.error('Error:', error);
            setErrorEdicion(error.message || 'Error al actualizar el torneo');
        } finally {
            setLoadingEdicion(false);
        }
    };

    const handleCancelarEdicion = () => {
        setModoEdicion(false);
            setErrorEdicion('');
            setArchivoPDF(null);
            setEliminarPDF(false);
            setImagenNueva(null);
            setVistaPreviaImagen(null);
            setEliminarImagenFlag(false);
        
        if (torneo) {
            let epocas = [];
            if (torneo.epocas_disponibles) {
                epocas = torneo.epocas_disponibles.split('|').map(e => e.trim()).filter(e => e);
            }

            const tipoTorneo = torneo.tipo_torneo === 'Por equipos'
                ? 'Por equipos'
                : 'Individual';

            const fechaInicio = torneo.fecha_inicio?.split('T')[0] || '';
            const fechaFin = torneo.fecha_fin?.split('T')[0] || '';

            if (fechaFin && fechaFin !== fechaInicio) {
                setDuracionTorneo("2");
            } else {
                setDuracionTorneo("1");
            }

            // ✅ NORMALIZAR A STRING
            const normalizar = (val) => (val === 1 || val === '1' || val === true) ? '1' : '0';

            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '',
                tipo_torneo: tipoTorneo,
                num_jugadores_equipo: torneo.num_jugadores_equipo || JUGADORES_EQUIPO_RANGO.default,
                epocas_disponibles: epocas,
                rondas_max: torneo.rondas_max || RONDAS_DISPONIBLES[0].valor,
                puntos_banda: torneo.puntos_banda || PUNTOS_BANDA_RANGO.default,
                participantes_max: torneo.participantes_max || PARTICIPANTES_RANGO.default,
                equipos_max: torneo.equipos_max || EQUIPOS_RANGO.default,
                unidades_legendarias: normalizar(torneo.unidades_legendarias),
                modelo_gakis: normalizar(torneo.modelo_gakis),
                warlord_punto_victoria: normalizar(torneo.warlord_punto_victoria),
                misiones_secundarias: normalizar(torneo.misiones_secundarias),
                personaje_especial: normalizar(torneo.personaje_especial),
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '',
                partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '',
                partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || ''
            });

            // Restaurar imagen actual
                if (torneo.imagen_url) {
                    setImagenActual(torneo.imagen_url);
                }
        }
    };

    const cambiarEstadoTorneo = async (nuevoEstado) => {
        if (torneo.estado === 'finalizado') {
            alert('⚠️ No se puede cambiar el estado de un torneo FINALIZADO.');
            return;
        }

        // ✅ VALIDAR PAGOS Y LISTAS SI SE INTENTA INICIAR EL TORNEO
        if (nuevoEstado === 'en_curso') {
            try {

                if(torneo.tipo_torneo === 'Individual') {

                     // 1️⃣ VERIFICAR INSCRIPCIONES
                    const jugadoresData = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                    const jugadoresList = Array.isArray(jugadoresData) ? jugadoresData : jugadoresData.data || [];
                    
                    if (jugadoresList.length === 0) {
                        alert('❌ NO SE PUEDE INICIAR EL TORNEO\n\nNo hay jugadores inscritos.');
                        return;
                    }

                    const inscripcionesIncompletas = jugadoresList.filter(jugador => {
                        const faltaFaccion = !jugador.faccion || jugador.faccion.trim() === '';
                        const faltaComposicionBanda = !jugador.composicion_ejercito || jugador.composicion_ejercito === '';
                        return faltaComposicionBanda || faltaFaccion;
                    });

                    if (inscripcionesIncompletas.length > 0) {
                        const nombresIncompletos = inscripcionesIncompletas
                            .map(j => `• ${j.nombre_usuario}`)
                            .join('\n');
                        
                        alert(
                            `❌ NO SE PUEDE INICIAR EL TORNEO\n\n` +
                            `HAY ${inscripcionesIncompletas.length} INSCRIPCIÓN(ES) INCOMPLETA(S):\n\n` +
                            `${nombresIncompletos}\n\n` +
                            `Todos los jugadores deben completar:\n` +
                            `✓ Facción de la banda\n` +
                            `✓ Composición de la banda`
                        );
                        return;
                    }
                } else if (torneo.tipo_torneo === 'Por equipos') {

                     // 1️⃣ VERIFICAR INSCRIPCIONES
                    const equiposData = await torneosSagaApi.obtenerEquiposTorneo(torneoId);
                    const equiposList = Array.isArray(equiposData.data) ? equiposData.data : [];
                    console.log('equipos', equiposList)
                    
                    if (equiposList.length === 0) {
                        alert('❌ NO SE PUEDE INICIAR EL TORNEO\n\nNo hay jugadores inscritos.');
                        return;
                    }

                    const miembrosEquipos = equiposList.map (equipo => equipo.miembros).filter (Boolean)

                    console.log('miembros equipos', miembrosEquipos)

                    const inscripcionesEquiposIncompletas = equiposList.filter(equipo => {
                        return equipo.miembros.some (miembro => {
                            const faltaFaccion = !miembro.faccion || miembro.faccion.trim() === ''
                            const faltaComposicion = !miembro.composicion || miembro.composicion === ''

                            return faltaFaccion || faltaComposicion
                        })
                    });
                        
                    console.log('listas incompletas:', inscripcionesEquiposIncompletas)

                    if (inscripcionesEquiposIncompletas.length > 0){
                        const nombresIncompletos = inscripcionesEquiposIncompletas
                            .map(equipo => {
                                const miembrosIncompletos = equipo.miembros
                                    .filter(m => 
                                        !m.faccion || m.faccion.trim() === '' ||
                                        !m.composicion
                                    )
                                    .map(m => m.nombre)
                                    .join(', ');

                                return `• ${equipo.nombre_equipo} → ${miembrosIncompletos}`;
                            })
                            .join('\n');
                        
                        
                        alert(
                            `❌ NO SE PUEDE INICIAR EL TORNEO\n\n` +
                            `HAY ${inscripcionesEquiposIncompletas.length} INSCRIPCIÓN(ES) DE EQUIPOS INCOMPLETA(S):\n\n` +
                            `${nombresIncompletos}\n\n` +
                            `Todos los equipos deben completar:\n` +
                            `✓ Seleccionar una epoca para cada jugador\n` +
                            `✓ Facción de la banda\n` +
                            `✓ Composición de la banda`

                        );
                        return;
                    }
                }

                //VERIFICAR LOS PAGOS DE LOS JUGADORES
                const response = await torneosSagaApi.verificarPagos(torneoId);

                const todosPagados = response.mensaje.todosPagados;
                const total = response.mensaje.total || 0;
                const pagados = response.mensaje.pagados || 0;
                const pendientes = response.mensaje.pendientes || 0;

                if ( pendientes > 0 || todosPagados === false ) {
                    alert(
                        `❌ NO SE PUEDE INICIAR EL TORNEO\n\n` +
                        `Total de  ${torneo.tipo_torneo === 'Por equipos' ? 'equipos'  : 'participantes'}: ${total}\n` +
                        `✅ Pagados: ${pagados}\n` +
                        `⏰ Pendientes: ${pendientes}\n\n` +
                        `Todos ${torneo.tipo_torneo === 'Por equipos' ? 'los equipos' : 'los participantes'} deben estar marcados como PAGADOS antes de iniciar el torneo.`
                    );
                    return;
                }

                // Si todos están pagados, mostrar confirmación
                if (!window.confirm(
                    `▶️ ¿Iniciar el torneo?\n\n` +
                    `✅ ✅ Todos los ${total} ${torneo.tipo_torneo === 'Por equipos' ? 'equipos' : 'participantes'} están pagados.\n` +
                    `¿Deseas continuar?`
                )) {
                    return;
                }

            } catch (error) {
                console.error('Error al verificar pagos:', error);
                alert('❌ Error al verificar los pagos. Intenta de nuevo.');
                return;
            }
        }

        // Mensajes de confirmación para otros estados
        const mensajes = {
            'pendiente': '⏸️ ¿Marcar torneo como PENDIENTE?',
            'finalizado': '🏁 ¿Finalizar el torneo?\n\n⚠️ Esta acción es DEFINITIVA.'
        };

        // Confirmación normal para otros estados
        if (nuevoEstado !== 'en_curso' && mensajes[nuevoEstado]) {
            if (!window.confirm(mensajes[nuevoEstado])) return;
        }

        // Confirmación extra para finalizar
        if (nuevoEstado === 'finalizado') {
            if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN:\n¿Estás completamente seguro?')) return;
        }

        try {
            await torneosSagaApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert('✅ Estado actualizado correctamente');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al cambiar el estado');
        }
    };

    const eliminarTorneo = async () => {
        if (jugadores.length > 0) {
            alert(`⚠️ No se puede eliminar el torneo porque tiene ${jugadores.length} jugador(es) inscrito(s).`);
            return;
        }

        if (!window.confirm(`⚠️ ¿ESTÁS SEGURO de eliminar "${torneo.nombre_torneo}"?`)) return;
        if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN')) return;

        try {
            await torneosSagaApi.eliminarTorneo(torneoId);
            alert('✅ Torneo eliminado correctamente');
            navigate('/');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el torneo');
        }
    };

    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 16 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Máximo 16MB');
                return;
            }
            setArchivoPDF(file);
            setEliminarPDF(false);
        } else {
            alert('Solo se permiten archivos PDF');
        }
    };

    const descargarBases = async () => {
        try {
            await torneosSagaApi.descargarBasesPDF(torneoId);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al descargar las bases');
        }
    };

    const handleAgregarOrganizador = async (e) => {
        e.preventDefault();
        
        if (!nuevoOrganizadorEmail.trim()) {
            alert('⚠️ Debes ingresar un email');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(nuevoOrganizadorEmail)) {
            alert('⚠️ Email inválido');
            return;
        }

        try {
            setLoadingOrganizadores(true);
            
            const response = await torneosSagaApi.agregarOrganizador(torneoId, {
            email: nuevoOrganizadorEmail.trim(),
            rol: 'organizador'
            });

            if (response.data.tipo === 'activo') {
            alert(`✅ ${nuevoOrganizadorEmail} agregado como organizador`);
            } else {
            alert(`📧 Invitación enviada a ${nuevoOrganizadorEmail}`);
            }

            setNuevoOrganizadorEmail('');
            await cargarOrganizadores();

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al agregar organizador');
        } finally {
            setLoadingOrganizadores(false);
        }
    };

    const handleEliminarOrganizador = async (organizadorId, tipo, nombre) => {
        const mensaje = tipo === 'pendiente'
            ? `¿Cancelar invitación para ${nombre}?`
            : `¿Eliminar a ${nombre} como organizador?`;

        if (!window.confirm(mensaje)) return;

        try {
            setLoadingOrganizadores(true);
            
            await torneosSagaApi.eliminarOrganizador(torneoId, organizadorId);
            
            alert('✅ Organizador eliminado correctamente');
            await cargarOrganizadores();

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar organizador');
        } finally {
            setLoadingOrganizadores(false);
        }
    };

    if (loading) {
        return (
            <div className="vista-general">
                <div className="empty-message">
                    ⏳ Cargando información del torneo...
                </div>
            </div>
        );
    }

    if (!torneo) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ No se pudo cargar la información del torneo
                </div>
            </div>
        );
    }

    const totalJugadores = jugadores.length;
    const totalEquipos = equipos.length;
    const esTorneoEquipos = torneo.tipo_torneo === 'Por equipos';

    return (
        <div className="vista-general">
            {errorEdicion && (
                <div className="error-message">
                    ⚠️ {errorEdicion}
                </div>
            )}

            {modoEdicion ? (
                <form onSubmit={handleGuardarCambios} className="formulario-edicion">
                    <fieldset>
                        <legend>📋 Información Básica</legend>
                        
                        <label htmlFor="nombre_torneo">Nombre del Torneo:*</label>
                        <input
                            type="text"
                            id="nombre_torneo"
                            name="nombre_torneo"
                            value={datosEdicion.nombre_torneo}
                            onChange={handleEdicionChange}
                            required
                            disabled={loadingEdicion}
                        />

                        <label htmlFor="tipo_torneo">Tipo de torneo:*</label>
                        <select 
                            id="tipo_torneo"
                            name="tipo_torneo"
                            value={datosEdicion.tipo_torneo}
                            onChange={handleEdicionChange}
                            required
                            disabled={loadingEdicion}
                        >
                            <option value="Individual">🎯 Individual</option>
                            <option value="Por equipos">👥 Por Equipos</option>
                        </select>

                        {datosEdicion.tipo_torneo === 'Por equipos' && (
                            <>
                                <label htmlFor="num_jugadores_equipo">Jugadores por Equipo:*</label>
                                <input 
                                    type="number"
                                    id="num_jugadores_equipo"
                                    name="num_jugadores_equipo"
                                    value={datosEdicion.num_jugadores_equipo}
                                    onChange={handleEdicionChange}
                                    min={JUGADORES_EQUIPO_RANGO.min}
                                    max={JUGADORES_EQUIPO_RANGO.max}
                                    required
                                    disabled={loadingEdicion}
                                />
                                <small>
                                    ℹ️ Entre {JUGADORES_EQUIPO_RANGO.min} y {JUGADORES_EQUIPO_RANGO.max} jugadores por equipo
                                </small>
                            </>
                        )}

                        <label htmlFor="epoca_selector">Épocas Disponibles:*</label>
                        
                        <div className="form-row">
                            <select id="epoca_selector" disabled={loadingEdicion}>
                                <option value="">Selecciona una época</option>
                                {EPOCAS_SAGA.filter(epoca => !datosEdicion.epocas_disponibles.includes(epoca)).map(epoca => (
                                    <option key={epoca} value={epoca}>{epoca}</option>
                                ))}
                            </select>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    const select = document.getElementById('epoca_selector');
                                    const epoca = select.value;
                                    if (epoca && !datosEdicion.epocas_disponibles.includes(epoca)) {
                                        setDatosEdicion(prev => ({
                                            ...prev,
                                            epocas_disponibles: [...prev.epocas_disponibles, epoca]
                                        }));
                                        select.value = '';
                                        if (errorEdicion) setErrorEdicion('');
                                    }
                                }}
                                className="btn-secondary"
                                disabled={loadingEdicion}
                            >
                                ➕ Agregar
                            </button>
                        </div>

                        {datosEdicion.epocas_disponibles.length > 0 ? (
                            <div className="epocas-seleccionadas">
                                <strong>Épocas seleccionadas:</strong>
                                <div className="epocas-tags">
                                    {datosEdicion.epocas_disponibles.map(epoca => (
                                        <div key={epoca} className="epoca-tag">
                                            <span>{epoca}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDatosEdicion(prev => ({
                                                        ...prev,
                                                        epocas_disponibles: prev.epocas_disponibles.filter(e => e !== epoca)
                                                    }));
                                                }}
                                                disabled={loadingEdicion}
                                                className="btn-remove-epoca"
                                                title="Eliminar época"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="info-text">
                                ℹ️ Aún no has seleccionado ninguna época
                            </p>
                        )}

                        {datosEdicion.tipo_torneo === 'Por equipos' && datosEdicion.epocas_disponibles.length < datosEdicion.num_jugadores_equipo && (
                            <p className="error-text">
                                ⚠️ Necesitas al menos {datosEdicion.num_jugadores_equipo} épocas para {datosEdicion.num_jugadores_equipo} jugadores por equipo
                            </p>
                        )}

                        <fieldset>
                            <legend>🏆 Modelo GAKIS</legend>

                            <div className="unidades-legendarias-container">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={datosEdicion.modelo_gakis === '1'}
                                        onChange={(e) => {
                                            const activo = e.target.checked;
                                            setDatosEdicion(prev => ({
                                                ...prev,
                                                modelo_gakis: activo ? '1' : '0',
                                                // Reset de opciones Gakis si se desactiva
                                                ...(!activo && {
                                                    warlord_punto_victoria: '0',
                                                    misiones_secundarias: '0',
                                                    puntosDeTorneo: '0',
                                                    unidades_legendarias: '0',
                                                })
                                            }));
                                        }}
                                        disabled={loadingEdicion}
                                    />
                                    <span className="checkbox-label">
                                        <strong>⚔️ Activar Modelo Gakis</strong>
                                    </span>
                                </label>
                                <small className="help-text">
                                    {datosEdicion.modelo_gakis === '1'
                                        ? "✅ Modo Gakis activo. Configura las opciones adicionales abajo."
                                        : "ℹ️ Torneo estándar sin reglas Gakis."}
                                </small>
                            </div>

                            {datosEdicion.modelo_gakis === '1' && (
                                <div className="gakis-opciones">

                                    <div className="gakis-opcion-item">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={datosEdicion.warlord_punto_victoria === '1'}
                                                onChange={(e) => setDatosEdicion(prev => ({
                                                    ...prev,
                                                    warlord_punto_victoria: e.target.checked ? '1' : '0'
                                                }))}
                                                disabled={loadingEdicion}
                                            />
                                            <span className="checkbox-label">
                                                <strong>🗡️ Warlord otorga +1 PV al ser eliminado</strong>
                                            </span>
                                        </label>
                                        <small className="help-text">
                                            {datosEdicion.warlord_punto_victoria === '1'
                                                ? "✅ Eliminar al Warlord rival suma 1 PV adicional."
                                                : "⬜ El Warlord no otorga PV adicionales."}
                                        </small>
                                    </div>

                                      <div className="gakis-opcion-item">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={datosEdicion.puntosDeTorneo === '1'}
                                                onChange={(e) => setDatosEdicion(prev => ({
                                                    ...prev,
                                                    puntosDeTorneo: e.target.checked ? '1' : '0'
                                                }))}
                                                disabled={loadingEdicion}
                                            />
                                            <span className="checkbox-label">
                                                <strong>👤 Puntos de Torneo</strong>
                                            </span>
                                        </label>
                                        <small className="help-text">
                                            {datosEdicion.puntosDeTorneo === '1'
                                                ? "✅ El torneo usa puntos de torneo."
                                                : "⬜ Sin puntos de torneo en partida."} 
                                        </small>
                                    </div>
                                    <div className="gakis-opcion-item">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={datosEdicion.misiones_secundarias === '1'}
                                                onChange={(e) => setDatosEdicion(prev => ({
                                                    ...prev,
                                                    misiones_secundarias: e.target.checked ? '1' : '0'
                                                }))}
                                                disabled={loadingEdicion}
                                            />
                                            <span className="checkbox-label">
                                                <strong>👤 Misiones Secundarias</strong>
                                            </span>
                                        </label>
                                        <small className="help-text">
                                            {datosEdicion.misiones_secundarias === '1'
                                                ? "✅ El torneo usa misiones secundarias."
                                                : "⬜ Sin misiones secundarias en las partida."} 
                                        </small>
                                    </div>
                                     <div className="unidades-legendarias-container">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                name="unidades_legendarias"
                                                checked={datosEdicion.unidades_legendarias === '1'}
                                                onChange={(e) => {
                                                    setDatosEdicion(prev => ({
                                                        ...prev,
                                                        unidades_legendarias: e.target.checked ? '1' : '0'
                                                    }));
                                                }}
                                                disabled={loadingEdicion}
                                            />
                                            <span className="checkbox-label">
                                                <strong>Permitir Unidades Legendarias</strong>
                                            </span>
                                        </label>
                                        <small className="help-text">
                                            {(datosEdicion.unidades_legendarias === '1' || datosEdicion.unidades_legendarias === 1)
                                                ? "✅ Los jugadores podrán seleccionar Warlords Legendarios y unidades legendarias que cuestan puntos y pueden desbloquear bandas especiales o imponer restricciones."
                                                : "⚠️ Las Unidades Legendarias están desactivadas."}
                                        </small>
                                    </div>
                                </div>
                            )}
                        </fieldset>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="rondas_max">Rondas:*</label>
                                <select
                                    id="rondas_max"
                                    name="rondas_max"
                                    value={datosEdicion.rondas_max}
                                    onChange={handleEdicionChange}
                                    required
                                    disabled={loadingEdicion}
                                >
                                    {RONDAS_DISPONIBLES.map(ronda => (
                                        <option key={ronda.valor} value={ronda.valor}>
                                            {ronda.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="puntos_banda">Puntos Banda:*</label>
                                <input
                                    type="number"
                                    id="puntos_banda"
                                    name="puntos_banda"
                                    value={datosEdicion.puntos_banda}
                                    onChange={handleEdicionChange}
                                    min={PUNTOS_BANDA_RANGO.min}
                                    max={PUNTOS_BANDA_RANGO.max}
                                    required
                                    disabled={loadingEdicion}
                                />
                                <small>{PUNTOS_BANDA_RANGO.min}-{PUNTOS_BANDA_RANGO.max} pts</small>
                            </div>

                            {esTorneoEquipos ? ( 
                                <>
                                    <div className="form-group">
                                        <label htmlFor="equipos_max">Equipos Máx:*</label>
                                        <input
                                            type="number"
                                            id="equipos_max"
                                            name="equipos_max"
                                            value={datosEdicion.equipos_max}
                                            onChange={handleEdicionChange}
                                            min={Math.max( totalEquipos, EQUIPOS_RANGO.min)}
                                            max={EQUIPOS_RANGO.max}
                                            required
                                            disabled={loadingEdicion}
                                        />
                                        <small>{EQUIPOS_RANGO.min}-{EQUIPOS_RANGO.max}</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="participantes_calculados">Participantes totales::</label>
                                        <input
                                            type="number"
                                            id="participantes_calculados"
                                            value={datosEdicion.equipos_max * datosEdicion.num_jugadores_equipo}
                                            disabled
                                            readOnly
                                            className="input-calculado"
                                        />
                                        <small>Calculado automáticamente</small>
                                    </div>
                                </>
                              ) : (
                                <div className="form-group">
                                        <label htmlFor="participantes_max">Participantes:*</label>
                                        <input
                                            type="number"
                                            id="participantes_max"
                                            name="participantes_max"
                                            value={datosEdicion.participantes_max}
                                            onChange={handleEdicionChange}
                                            min={Math.max( totalJugadores, PARTICIPANTES_RANGO.min)}
                                            max={PARTICIPANTES_RANGO.max}
                                            required
                                            disabled={loadingEdicion}
                                        />
                                        <small>{PARTICIPANTES_RANGO.min}-{PARTICIPANTES_RANGO.max}</small>
                                    </div>
                            )}
                        </div>

                        <label htmlFor="estado">Estado del Torneo:*</label>
                        <select
                            id="estado"
                            name="estado"
                            value={datosEdicion.estado}
                            onChange={handleEdicionChange}
                            required
                            disabled={loadingEdicion}
                        >
                            {ESTADOS_TORNEO_SAGA.map(estado => (
                                <option key={estado.valor} value={estado.valor}>
                                    {estado.emoji} {estado.nombre}
                                </option>
                            ))}
                        </select>
                    </fieldset>

                    <fieldset>
                        <legend>📅 Fechas y Ubicación</legend>

                        <label>Duración del Torneo:*</label>
                        <div className="duracion-torneo-container">
                            <label className="duracion-option">
                                <input
                                    type="radio"
                                    name="duracionTorneo"
                                    value="1"
                                    checked={duracionTorneo === "1"}
                                    onChange={(e) => {
                                        setDuracionTorneo(e.target.value);
                                        setDatosEdicion(prev => ({ ...prev, fecha_fin: '' }));
                                    }}
                                    disabled={loadingEdicion}
                                />
                                📅 Un día
                            </label>
                            <label className="duracion-option">
                                <input
                                    type="radio"
                                    name="duracionTorneo"
                                    value="2"
                                    checked={duracionTorneo === "2"}
                                    onChange={(e) => setDuracionTorneo(e.target.value)}
                                    disabled={loadingEdicion}
                                />
                                📅 Dos días o más
                            </label>
                        </div>

                        {duracionTorneo === "1" ? (
                            <>
                                <label htmlFor="fecha_inicio">Fecha del Torneo:*</label>
                                <input
                                    type="date"
                                    id="fecha_inicio"
                                    name="fecha_inicio"
                                    value={datosEdicion.fecha_inicio}
                                    onChange={handleEdicionChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                    disabled={loadingEdicion}
                                />
                                <small className="help-text">
                                    🗓️ El torneo se celebrará en un solo día
                                </small>
                            </>
                        ) : (
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="fecha_inicio">Fecha de Inicio:*</label>
                                    <input
                                        type="date"
                                        id="fecha_inicio"
                                        name="fecha_inicio"
                                        value={datosEdicion.fecha_inicio}
                                        onChange={handleEdicionChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        disabled={loadingEdicion}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="fecha_fin">Fecha de Fin:*</label>
                                    <input
                                        type="date"
                                        id="fecha_fin"
                                        name="fecha_fin"
                                        value={datosEdicion.fecha_fin}
                                        onChange={handleEdicionChange}
                                        min={datosEdicion.fecha_inicio || new Date().toISOString().split('T')[0]}
                                        required
                                        disabled={loadingEdicion}
                                    />
                                </div>
                            </div>
                        )}

                        <label htmlFor="ubicacion">Ubicación:</label>
                        <input
                            type="text"
                            id="ubicacion"
                            name="ubicacion"
                            value={datosEdicion.ubicacion}
                            onChange={handleEdicionChange}
                            placeholder="Ciudad, Local, etc."
                            disabled={loadingEdicion}
                        />
                    </fieldset>

                    {/* ⬅️ NUEVA SECCIÓN: CARTEL DEL TORNEO */}
                    <fieldset>
                        <legend>🖼️ Cartel del Torneo</legend>
                        
                        {/* MOSTRAR IMAGEN ACTUAL */}
                        {imagenActual && !eliminarImagenFlag && !imagenNueva && (
                            <div className="imagen-actual-container">
                                <p className="imagen-label">Imagen actual:</p>
                                <div className="imagen-actual-preview">
                                    <img 
                                        src={imagenActual} 
                                        alt="Cartel actual" 
                                        className="imagen-preview-img"
                                    />
                                </div>
                                <div className="imagen-acciones">
                                    <label htmlFor="nuevaImagenCartel" className="btn-cambiar-imagen">
                                        🔄 Cambiar imagen
                                    </label>
                                    <input 
                                        type="file"
                                        id="nuevaImagenCartel"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleNuevaImagenCartel}
                                        style={{ display: 'none' }}
                                        disabled={loadingEdicion}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleEliminarImagenActual}
                                        className="btn-eliminar-imagen"
                                        disabled={loadingEdicion}
                                    >
                                        🗑️ Eliminar imagen
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* MOSTRAR NUEVA IMAGEN SELECCIONADA */}
                        {imagenNueva && vistaPreviaImagen && (
                            <div className="imagen-nueva-container">
                                <p className="imagen-label">Nueva imagen seleccionada:</p>
                                <div className="archivo-info">
                                    <p className="archivo-nombre">✅ <strong>{imagenNueva.name}</strong></p>
                                    <p className="archivo-tamaño">
                                        📦 {(imagenNueva.size / 1024).toFixed(2)} KB ({(imagenNueva.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                </div>
                                <div className="imagen-preview">
                                    <img 
                                        src={vistaPreviaImagen} 
                                        alt="Vista previa" 
                                        className="imagen-preview-img"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCancelarNuevaImagen}
                                    className="btn-cancelar-nueva-imagen"
                                    disabled={loadingEdicion}
                                >
                                    ❌ Cancelar cambio
                                </button>
                            </div>
                        )}
                        
                        {/* SI NO HAY IMAGEN O SE MARCÓ PARA ELIMINAR */}
                        {(!imagenActual || eliminarImagenFlag) && !imagenNueva && (
                            <div className="sin-imagen-container">
                                {eliminarImagenFlag ? (
                                    <>
                                        <p className="aviso-eliminar">⚠️ La imagen se eliminará al guardar los cambios</p>
                                        <button
                                            type="button"
                                            onClick={handleCancelarEliminacionImagen}
                                            className="btn-cancelar-eliminacion"
                                            disabled={loadingEdicion}
                                        >
                                            ↩️ Cancelar eliminación
                                        </button>
                                    </>
                                ) : (
                                    <p className="sin-imagen-texto">📷 Este torneo no tiene imagen de cartel</p>
                                )}
                                
                                <label htmlFor="nuevaImagenCartel" className="btn-subir-imagen">
                                    ➕ Subir imagen
                                </label>
                                <input 
                                    type="file"
                                    id="nuevaImagenCartel"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={handleNuevaImagenCartel}
                                    style={{ display: 'none' }}
                                    disabled={loadingEdicion}
                                />
                                <small className="help-text-file">
                                    🖼️ Formatos: JPG, PNG, GIF, WEBP | Tamaño máximo: 5MB
                                </small>
                            </div>
                        )}
                    </fieldset>


                    <fieldset>
                        <legend>🎲 Escenarios por Ronda</legend>

                        {[1, 2, 3, 4, 5].map(ronda => {
                            if (ronda > 3 && ronda > datosEdicion.rondas_max) return null;
                            
                            return (
                                <div key={ronda}>
                                    <label htmlFor={`partida_ronda_${ronda}`}>
                                        Ronda {ronda}:{ronda <= 3 ? '*' : ''}
                                    </label>
                                    <select
                                        id={`partida_ronda_${ronda}`}
                                        name={`partida_ronda_${ronda}`}
                                        value={datosEdicion[`partida_ronda_${ronda}`]}
                                        onChange={handleEdicionChange}
                                        required={ronda <= 3}
                                        disabled={loadingEdicion}
                                    >
                                        <option value="">Selecciona escenario</option>
                                        {TIPOS_PARTIDA_SAGA.map(tipo => (
                                            <option key={tipo} value={tipo}>{tipo}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </fieldset>

                    <fieldset>
                        <legend>📄 Bases del Torneo</legend>

                        {torneo.bases_nombre && !eliminarPDF && (
                            <div className="pdf-actual">
                                <p>📎 Archivo actual: <strong>{torneo.bases_nombre}</strong></p>
                                <button
                                    type="button"
                                    onClick={() => setEliminarPDF(true)}
                                    className="btn-danger mt-10"
                                >
                                    🗑️ Eliminar PDF actual
                                </button>
                            </div>
                        )}

                        {eliminarPDF && (
                            <div className="advertencia-finalizado mb-20">
                                <p>⚠️ El PDF actual se eliminará al guardar</p>
                                <button
                                    type="button"
                                    onClick={() => setEliminarPDF(false)}
                                    className="btn-secondary mt-10"
                                >
                                    ↩️ Mantener PDF actual
                                </button>
                            </div>
                        )}

                        <label htmlFor="bases_pdf">
                            {torneo.bases_nombre && !eliminarPDF ? 'Reemplazar PDF de bases:' : 'Subir PDF de bases:'}
                        </label>
                        <input
                            type="file"
                            id="bases_pdf"
                            accept=".pdf"
                            onChange={handleArchivoPDF}
                            disabled={loadingEdicion}
                            className="input-file-pdf"
                        />

                        {archivoPDF && (
                            <p className="success-message mt-10">
                                ✅ Nuevo archivo: {archivoPDF.name} ({(archivoPDF.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </fieldset>

                    <fieldset>
                        <legend>👥 Organizadores del Torneo</legend>

                        {/* ORGANIZADORES ACTIVOS */}
                        <div className="organizadores-section">
                            <h4>✅ Organizadores Activos</h4>
                            {organizadores.activos && organizadores.activos.length > 0 ? (
                                <div className="organizadores-list">
                                    {organizadores.activos.map(org => (
                                        <div key={org.organizador_id} className="organizador-item">
                                            <div className="organizador-info">
                                                <span className="organizador-nombre">
                                                    {org.es_creador ? '👑 ' : '👤 '}
                                                    <strong>{org.nombre_usuario}</strong>
                                                </span>
                                                <span className="organizador-email">{org.email}</span>
                                                <span className="organizador-rol">
                                                    {org.rol === 'organizador' ? '🎯 Organizador' : '⚙️ Administrador'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleEliminarOrganizador(
                                                    org.organizador_id, 
                                                    'activo', 
                                                    org.nombre_usuario
                                                )}
                                                className="btn-danger-small"
                                                disabled={loadingOrganizadores || loadingEdicion}
                                                title="Eliminar organizador"
                                            >
                                                    ❌
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="info-text">Solo el creador está registrado como organizador</p>
                            )}
                        </div>

                        {/* INVITACIONES PENDIENTES */}
                        {organizadores.pendientes && organizadores.pendientes.length > 0 && (
                            <div className="organizadores-section mt-20">
                                <h4>⏳ Invitaciones Pendientes</h4>
                                <div className="organizadores-list">
                                    {organizadores.pendientes.map(org => (
                                        <div key={org.organizador_id} className="organizador-item pendiente">
                                            <div className="organizador-info">
                                                <span className="organizador-email">
                                                    📧 {org.email}
                                                </span>
                                                <span className="organizador-fecha">
                                                    Invitado el {new Date(org.fecha_asignacion).toLocaleDateString('es-ES')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleReenviarInvitacion(org)}
                                                className="btn-reenviar"
                                                title="Reenviar invitación"
                                            >
                                                📧
                                            </button>                                          
                                            <button
                                                type="button"
                                                onClick={() => handleEliminarOrganizador(
                                                    org.organizador_id, 
                                                    'pendiente', 
                                                    org.email
                                                )}
                                                className="btn-danger-small"
                                                disabled={loadingOrganizadores || loadingEdicion}
                                                title="Cancelar invitación"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                        )}

                        {/* FORMULARIO PARA AGREGAR NUEVO ORGANIZADOR */}
                        <div className="agregar-organizador-form mt-20">
                            <h4>➕ Agregar Nuevo Organizador</h4>
                            <div className="form-row">
                                <input
                                    type="email"
                                    placeholder="email@ejemplo.com"
                                    value={nuevoOrganizadorEmail}
                                    onChange={(e) => setNuevoOrganizadorEmail(e.target.value)}
                                    disabled={loadingOrganizadores || loadingEdicion}
                                    className="input-email-organizador"
                                />
                                <button
                                    type="button"
                                    onClick={handleAgregarOrganizador}
                                    className="btn-success"
                                    disabled={loadingOrganizadores || loadingEdicion}
                                >
                                    {loadingOrganizadores ? '⏳ Agregando...' : '➕ Agregar'}
                                </button>
                            </div>
                            <small className="help-text">
                                ℹ️ Si el usuario está registrado, se agregará automáticamente. 
                                Si no, recibirá una invitación por email.
                            </small>
                        </div>

                         <div className="button-group">
                            <button type="submit" className="btn-primary" disabled={loadingEdicion}>
                                {loadingEdicion ? '⏳ Guardando...' : '✅ Guardar Cambios'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleCancelarEdicion} disabled={loadingEdicion}>
                                ❌ Cancelar
                            </button>
                        </div>
                    </fieldset>
                </form>
            ) : (
                <>
                    <section className="seccion-info-torneo">
                        <div className="section-header-inline">
                            <h2>ℹ️ Información del Torneo</h2>
                            
                            <div className="botones-accion-grupo">
                                {torneo.estado !== 'finalizado' && (
                                    <>
                                        {torneo.estado === 'pendiente' && (
                                            <button onClick={() => cambiarEstadoTorneo('en_curso')} className="btn-success">
                                                ▶️ Iniciar Torneo
                                            </button>
                                        )}
                                        
                                        {torneo.estado === 'en_curso' && (
                                            <>
                                                <button onClick={() => cambiarEstadoTorneo('pendiente')} className="btn-secondary">
                                                    ⏸️ Volver a Pendiente
                                                </button>
                                                <button onClick={() => cambiarEstadoTorneo('finalizado')} className="btn-warning">
                                                    🏁 Finalizar Torneo
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                                
                                {/* SOLO MOSTRAR EDITAR SI ESTÁ PENDIENTE */}
                                {torneo.estado === 'pendiente' && (
                                    <button className="btn-primary" onClick={() => setModoEdicion(true)}>
                                        ✏️ Editar Torneo
                                    </button>
                                )}

                                {/* SOLO ELIMINAR SI ESTÁ PENDIENTE */}
                                {torneo.estado === 'pendiente' && (
                                    <button onClick={eliminarTorneo} className="btn-danger">
                                        🗑️ Eliminar Torneo
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* MENSAJE PARA TORNEO FINALIZADO */}
                        {torneo.estado === 'finalizado' && (
                            <div className="advertencia-finalizado">
                                <strong>🏁 Torneo FINALIZADO</strong>
                                <p>El estado del torneo es permanente y no se puede modificar.</p>
                            </div>
                        )}

                        {/* MENSAJE PARA TORNEO EN CURSO */}
                        {torneo.estado === 'en_curso' && (
                            <div className="advertencia-no-editable">
                                <strong>▶️ Torneo EN CURSO</strong>
                                <p>Para editar la configuración del torneo, primero debe volverse a estado PENDIENTE.</p>
                            </div>
                        )}

                        {/* ⬅️ MOSTRAR IMAGEN EN MODO VISTA */}
                        {torneo.imagen_url && (
                            <div className="cartel-vista">
                                <h3>🖼️ Cartel del Torneo</h3>
                                <img 
                                    src={torneo.imagen_url} 
                                    alt="Cartel del torneo" 
                                    className="cartel-imagen-vista"
                                />
                            </div>
                        )}

                        <div className="info-torneo-grid">
                            <div className="info-item">
                                <label>Tipo de Torneo:</label>
                                <span>{esTorneoEquipos ? '👥 Por Equipos' : '🎯 Individual'}</span>
                                 {esTorneoEquipos ? (
                                    <>
                                        <span className="info-item-secundario">
                                            ({torneo?.num_jugadores_equipo || 0} jugadores por equipo)
                                        </span>
                                    </>
                                ) : (' ')}
                            </div>

                            <div className="info-item">
                                <label>🎭 Épocas Disponibles:</label>
                                <p>{formatearEpocas(torneo.epocas_disponibles)}</p>
                            </div>

                            <div className="info-item">
                                <label>🎲 Número de Rondas:</label>
                                <p>{torneo.rondas_max} rondas</p>
                            </div>

                            <div className="info-item">
                                <label>⚔️ Puntos de Banda:</label>
                                <p>{torneo.puntos_banda} puntos</p>
                            </div>

                            <div className="info-item">
                                {esTorneoEquipos ? (
                                    <>
                                        <span className="info-item-destacado">
                                            👥 {totalEquipos} / {torneo.equipos_max || 0} Equipos
                                        </span>
                                        <span className="info-item-destacado">
                                            👤 {totalJugadores} Jugadores Totales
                                        </span>
                                    </>
                                ) : (
                                    <span className="info-item-destacado">
                                        👤 {totalJugadores} / {torneo?.participantes_max || 0} Jugadores
                                    </span>
                                )}
                            </div>

                            {torneo.ubicacion && (
                                <div className="info-item">
                                    <label>📍 Ubicación:</label>
                                    <p>{torneo.ubicacion}</p>
                                </div>
                            )}

                            <div className="info-item">
                                <label>📅 Fecha Inicio:</label>
                                <p>{new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}</p>
                            </div>

                            {torneo.fecha_fin && (
                                <div className="info-item">
                                    <label>📅 Fecha Fin:</label>
                                    <p>{new Date(torneo.fecha_fin).toLocaleDateString('es-ES')}</p>
                                </div>
                            )}

                              {torneo.modelo_gakis == '1' && (
                                <div className="info-item-gakis">
                                    <label>🏆 Modelo Gakis:</label>
                                    <div className="gakis-resumen">
                                        <span className="badge-activo">✅ Activo</span>
                                        <ul className="gakis-resumen-lista">
                                            <li>
                                                {torneo.warlord_punto_victoria == '1'
                                                    ? " Warlord: +1 PV ✅"
                                                    : "Warlord sin PV extra ❌"}
                                            </li>
                                            <li>
                                                {torneo.puntosDeTorneo ==1
                                                    ? "Usando puntos de torneo ✅"
                                                    : "Sin puntos de torneo ❌"}
                                            </li>
                                            <li>
                                                {torneo.misiones_secundarias == '1'
                                                    ? " Misiones secundarias activas ✅"
                                                    : "Sin misiones secundarias ❌"}
                                            </li>
                                            <li>
                                                {torneo.unidades_legendarias == '1'
                                                    ? " Unidades legendarias permitidas ✅"
                                                    : " Unidades legendarias no permitidas ❌"}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                    </section>

                   <section className="seccion-rondas">
                        <h2>🎮 Escenarios del Torneo</h2>
                        <div className="rondas-list">
                            {torneo.tipo_torneo === 'Por equipos' ? (
                                // EQUIPOS: Mostrar todas las partidas sin especificar ronda
                                <div className="ronda-item">
                                    <span className="ronda-numero">Partidas en cada ronda:</span>
                                    <div className="partidas-container">
                                        {[1, 2, 3, 4, 5].map(ronda => {
                                            if (ronda > torneo.rondas_max) return null;
                                            const partida = torneo[`partida_ronda_${ronda}`];
                                            if (!partida) return null;
                                            
                                            return (
                                                <span key={ronda} className="ronda-escenario-equipos">
                                                    {partida}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                // INDIVIDUAL: Mostrar ronda por ronda
                                [1, 2, 3, 4, 5].map(ronda => {
                                    if (ronda > torneo.rondas_max) return null;
                                    const partidasStr = torneo[`partida_ronda_${ronda}`];
                                    if (!partidasStr) return null;
                                    
                                    return (
                                        <div key={ronda} className="ronda-item">
                                            <span className="ronda-numero">Ronda {ronda}:</span>
                                            <div className="partidas-container">
                                                <span className="ronda-escenario">
                                                    {partidasStr}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                    <section className="seccion-bases">
                        <h2>📄 Bases del Torneo</h2>
                        {torneo.bases_nombre ? (
                            <div className="bases-existentes">
                                <p>📎 Archivo: <strong>{torneo.bases_nombre}</strong> 
                                {torneo.base_tamaño && ` (${(torneo.base_tamaño / 1024).toFixed(2)} KB)`}</p>
                                <button onClick={descargarBases} className="btn-primary">
                                    ⬇️ Descargar Bases
                                </button>
                            </div>
                        ) : (
                            <p>ℹ️ Este torneo no tiene bases cargadas. Usa el botón "Editar Torneo" para subir un PDF.</p>
                        )}
                    </section>

                    <section className="seccion-organizadores">
                        <h2>👥 Organizadores del Torneo</h2>
                        
                        {/* ORGANIZADORES ACTIVOS */}
                        {organizadores.activos && organizadores.activos.length > 0 ? (
                            <div className="organizadores-grid">
                                {organizadores.activos.map(org => (
                                    <div key={org.organizador_id} className="organizador-card">
                                        <div className="organizador-avatar">
                                            {org.es_creador ? '👑' : '👤'}
                                        </div>
                                        <div className="organizador-datos">
                                            <h3>
                                                {org.nombre_usuario}
                                                {org.es_creador && (
                                                    <span className="badge-creador">Creador</span>
                                                )}
                                            </h3>
                                            <p className="organizador-email-display">{org.email}</p>
                                            <p className="organizador-rol-display">
                                                {org.rol === 'organizador' ? '🎯 Organizador' : '⚙️ Administrador'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="info-text">Solo el creador está registrado como organizador</p>
                        )}

                        {/* INVITACIONES PENDIENTES */}
                        {organizadores.pendientes && organizadores.pendientes.length > 0 && (
                            <div className="invitaciones-pendientes-vista mt-20">
                                <h3>⏳ Invitaciones Pendientes ({organizadores.pendientes.length})</h3>
                                <div className="invitaciones-list">
                                    {organizadores.pendientes.map(org => (
                                        <div key={org.organizador_id} className="invitacion-item">
                                            <span>📧 {org.email}</span>
                                            <span className="fecha-invitacion">
                                                {new Date(org.fecha_asignacion).toLocaleDateString('es-ES')}
                                            </span>
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