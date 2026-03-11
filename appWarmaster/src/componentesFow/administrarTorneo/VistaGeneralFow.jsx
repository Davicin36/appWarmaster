import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import torneosFowApi from '@/servicios/apiFow';

import '@/estilos/vistasTorneos/vistaGeneral.css';

import {
    TIPOS_PARTIDA_FOW,
    ESTADOS_TORNEO_FOW,
    EPOCAS_HISTORICA,
    RONDAS_DISPONIBLES,
    PUNTOS_EJERCITO_FOW,
    PARTICIPANTES_RANGO
} from '@/componentesFow/funcionesFow/constantesFuncionesFow.js';

// ── Helper frentes ────────────────────────────────────────────────────────────
const nuevoFrenteVacio = (rondasMax) => ({
    nombre: "",
    escenarios: Object.fromEntries(
        Array.from({ length: rondasMax }, (_, i) => [i + 1, ""])
    ),
});

// ─────────────────────────────────────────────────────────────────────────────

function VistaGeneralFow({ torneoId: propTorneoId, onUpdate }) {
    const { torneoId: paramTorneoId } = useParams();
    const torneoId = propTorneoId || paramTorneoId;
    const navigate = useNavigate();

    const [torneo,    setTorneo]    = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [loading,   setLoading]   = useState(true);

    const [modoEdicion,     setModoEdicion]     = useState(false);
    const [duracionTorneo,  setDuracionTorneo]  = useState("1");
    const [loadingEdicion,  setLoadingEdicion]  = useState(false);
    const [errorEdicion,    setErrorEdicion]    = useState('');

    const [datosEdicion, setDatosEdicion] = useState({
        nombre_torneo:    '',
        epocas_disponibles: [],
        rondas_max:       RONDAS_DISPONIBLES[0].valor,
        puntos_ejercito:  PUNTOS_EJERCITO_FOW.default,
        participantes_max: PARTICIPANTES_RANGO.default,
        fecha_inicio:     '',
        fecha_fin:        '',
        ubicacion:        '',
        estado:           'pendiente',
        partida_ronda_1:  '',
        partida_ronda_2:  '',
        partida_ronda_3:  '',
        partida_ronda_4:  '',
        partida_ronda_5:  ''
    });

    // ── Frentes (edición) ─────────────────────────────────────────
    const [usaFrentes, setUsaFrentes] = useState(false);
    const [frentes,    setFrentes]    = useState([nuevoFrenteVacio(3)]);

    // ── Archivos ──────────────────────────────────────────────────
    const [archivoPDF,         setArchivoPDF]         = useState(null);
    const [eliminarPDF,        setEliminarPDF]        = useState(false);
    const [imagenActual,       setImagenActual]       = useState(null);
    const [imagenNueva,        setImagenNueva]        = useState(null);
    const [vistaPreviaImagen,  setVistaPreviaImagen]  = useState(null);
    const [eliminarImagenFlag, setEliminarImagenFlag] = useState(false);

    // ── Organizadores ─────────────────────────────────────────────
    const [organizadores,        setOrganizadores]        = useState({ activos: [], pendientes: [] });
    const [nuevoOrganizadorEmail, setNuevoOrganizadorEmail] = useState('');
    const [loadingOrganizadores,  setLoadingOrganizadores]  = useState(false);

    // ─────────────────────────────────────────────────────────────
    // Carga inicial
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (torneoId) {
            cargarDatos();
            cargarOrganizadores();
        }
    }, [torneoId]);

    useEffect(() => {
        if (!torneo) return;

        const tieneFrente = !!torneo.usa_frentes;
        setUsaFrentes(tieneFrente);

        // Frentes: el backend debe devolver torneo.frentes con escenarios
        if (tieneFrente && torneo.frentes?.length > 0) {
            setFrentes(torneo.frentes.map(f => ({
                nombre: f.nombre_frente || f.nombre || "",
                escenarios: f.escenarios
                    // si el backend devuelve array [{ronda,nombre_partida}]
                    ? (Array.isArray(f.escenarios)
                        ? Object.fromEntries(f.escenarios.map(e => [e.ronda, e.nombre_partida]))
                        : f.escenarios)
                    : Object.fromEntries(
                        Array.from({ length: torneo.rondas_max }, (_, i) => [i + 1, ""])
                    ),
            })));
        } else if (!tieneFrente) {
            setFrentes([nuevoFrenteVacio(torneo.rondas_max || 3)]);
        }

        const epocas = torneo.epocas_disponibles
            ? torneo.epocas_disponibles.split('|').map(e => e.trim()).filter(Boolean)
            : [];

        const fechaInicio = torneo.fecha_inicio?.split('T')[0] || '';
        const fechaFin    = torneo.fecha_fin?.split('T')[0]    || '';

        setDuracionTorneo(fechaFin && fechaFin !== fechaInicio ? "2" : "1");

        setDatosEdicion({
            nombre_torneo:     torneo.nombre_torneo      || '',
            epocas_disponibles: epocas,
            rondas_max:        torneo.rondas_max         || RONDAS_DISPONIBLES[0].valor,
            puntos_ejercito:   torneo.puntos_ejercito    || PUNTOS_EJERCITO_FOW.default,
            participantes_max: torneo.participantes_max  || PARTICIPANTES_RANGO.default,
            fecha_inicio:      fechaInicio,
            fecha_fin:         fechaFin,
            ubicacion:         torneo.ubicacion          || '',
            estado:            torneo.estado             || 'pendiente',
            partida_ronda_1:   torneo.partida_ronda_1    || '',
            partida_ronda_2:   torneo.partida_ronda_2    || '',
            partida_ronda_3:   torneo.partida_ronda_3    || '',
            partida_ronda_4:   torneo.partida_ronda_4    || '',
            partida_ronda_5:   torneo.partida_ronda_5    || ''
        });

        if (torneo.imagen_url) setImagenActual(torneo.imagen_url);

    }, [torneo]);

    // ─────────────────────────────────────────────────────────────
    // API calls
    // ─────────────────────────────────────────────────────────────
    const cargarDatos = async () => {
        try {
            setLoading(true);
            const response = await torneosFowApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);

            try {
                const dataJugadores = await torneosFowApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
            } catch {
                setJugadores([]);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarOrganizadores = async () => {
        try {
            const data = await torneosFowApi.obtenerOrganizadores(torneoId);
            setOrganizadores(data.data || { activos: [], pendientes: [] });
        } catch (error) {
            console.error('Error al cargar organizadores:', error);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: frentes (edición)
    // ─────────────────────────────────────────────────────────────
    const handleToggleFrentes = (e) => {
        const activo = e.target.checked;
        setUsaFrentes(activo);
        if (activo && frentes.length === 0) {
            setFrentes([nuevoFrenteVacio(datosEdicion.rondas_max)]);
        }
    };

    const handleRondasMaxChange = (e) => {
        const num = parseInt(e.target.value);
        handleEdicionChange(e);
        setFrentes(prev =>
            prev.map(f => ({
                ...f,
                escenarios: Object.fromEntries(
                    Array.from({ length: num }, (_, i) => [i + 1, f.escenarios[i + 1] || ""])
                ),
            }))
        );
    };

    const handleAddFrente = () => {
        if (frentes.length >= 6) { setErrorEdicion("Máximo 6 frentes por torneo"); return; }
        setFrentes(prev => [...prev, nuevoFrenteVacio(datosEdicion.rondas_max)]);
    };

    const handleRemoveFrente = (idx) => {
        setFrentes(prev => prev.filter((_, i) => i !== idx));
    };

    const handleNombreFrente = (idx, valor) => {
        setFrentes(prev => prev.map((f, i) => i === idx ? { ...f, nombre: valor } : f));
    };

    const handleEscenarioFrente = (idx, ronda, valor) => {
        setFrentes(prev =>
            prev.map((f, i) =>
                i === idx ? { ...f, escenarios: { ...f.escenarios, [ronda]: valor } } : f
            )
        );
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: campos básicos
    // ─────────────────────────────────────────────────────────────
    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({ ...prev, [name]: value }));
        if (errorEdicion) setErrorEdicion('');
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: imagen
    // ─────────────────────────────────────────────────────────────
    const handleNuevaImagenCartel = (e) => {
        const file = e.target.files[0];
        if (!file) { setImagenNueva(null); setVistaPreviaImagen(null); return; }

        const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!tiposPermitidos.includes(file.type)) {
            setErrorEdicion('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
            e.target.value = ''; setImagenNueva(null); setVistaPreviaImagen(null);
            setTimeout(() => setErrorEdicion(''), 4000); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrorEdicion(`La imagen supera el tamaño máximo de 5MB.`);
            e.target.value = ''; setImagenNueva(null); setVistaPreviaImagen(null);
            setTimeout(() => setErrorEdicion(''), 5000); return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setVistaPreviaImagen(reader.result);
        reader.readAsDataURL(file);
        setImagenNueva(file);
        setEliminarImagenFlag(false);
        setErrorEdicion('');
    };

    const handleCancelarNuevaImagen = () => {
        setImagenNueva(null); setVistaPreviaImagen(null);
        const fi = document.getElementById('nuevaImagenCartel');
        if (fi) fi.value = '';
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
        if (torneo?.imagen_url) setImagenActual(torneo.imagen_url);
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: PDF
    // ─────────────────────────────────────────────────────────────
    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') { alert('Solo se permiten archivos PDF'); return; }
        if (file.size > 16 * 1024 * 1024)   { alert('El archivo es demasiado grande. Máximo 16MB'); return; }
        setArchivoPDF(file);
        setEliminarPDF(false);
    };

    const descargarBases = async () => {
        try {
            await torneosFowApi.descargarBasesPDF(torneoId);
        } catch (error) {
            alert('Error al descargar las bases', error);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers: organizadores
    // ─────────────────────────────────────────────────────────────
    const handleReenviarInvitacion = async (org) => {
        if (!org.organizador_id) { alert('❌ Error: No se puede reenviar (falta ID).'); return; }
        if (window.confirm(`¿Reenviar invitación a ${org.email}?`)) {
            try {
                await torneosFowApi.reenviarInvitacion(torneo.id, org.organizador_id);
                alert('✅ Invitación reenviada correctamente');
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }
    };

    const handleAgregarOrganizador = async (e) => {
        e.preventDefault();
        if (!nuevoOrganizadorEmail.trim()) { alert('⚠️ Debes ingresar un email'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoOrganizadorEmail)) { alert('⚠️ Email inválido'); return; }

        try {
            setLoadingOrganizadores(true);
            const response = await torneosFowApi.agregarOrganizador(torneoId, {
                email: nuevoOrganizadorEmail.trim(), rol: 'organizador'
            });
            alert(response.data.tipo === 'activo'
                ? `✅ ${nuevoOrganizadorEmail} agregado como organizador`
                : `📧 Invitación enviada a ${nuevoOrganizadorEmail}`
            );
            setNuevoOrganizadorEmail('');
            await cargarOrganizadores();
        } catch (error) {
            alert(error.message || 'Error al agregar organizador');
        } finally {
            setLoadingOrganizadores(false);
        }
    };

    const handleEliminarOrganizador = async (organizadorId, tipo, nombre) => {
        const msg = tipo === 'pendiente' ? `¿Cancelar invitación para ${nombre}?` : `¿Eliminar a ${nombre} como organizador?`;
        if (!window.confirm(msg)) return;
        try {
            setLoadingOrganizadores(true);
            await torneosFowApi.eliminarOrganizador(torneoId, organizadorId);
            alert('✅ Organizador eliminado correctamente');
            await cargarOrganizadores();
        } catch (error) {
            alert(error.message || 'Error al eliminar organizador');
        } finally {
            setLoadingOrganizadores(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Validar formulario edición
    // ─────────────────────────────────────────────────────────────
    const validarEdicion = () => {
        if (!datosEdicion.nombre_torneo.trim()) {
            setErrorEdicion('El nombre del torneo es obligatorio'); return false;
        }
        if (datosEdicion.participantes_max < jugadores.length) {
            setErrorEdicion(`No puedes reducir el número de participantes a menos de ${jugadores.length}`); return false;
        }
        if (!datosEdicion.epocas_disponibles || datosEdicion.epocas_disponibles.length === 0) {
            setErrorEdicion('Debes seleccionar al menos una época'); return false;
        }

        if (!usaFrentes) {
            if (!datosEdicion.partida_ronda_1 || !datosEdicion.partida_ronda_2 || !datosEdicion.partida_ronda_3) {
                setErrorEdicion('Debes seleccionar escenarios para las primeras 3 rondas'); return false;
            }
            if (datosEdicion.rondas_max >= 4 && !datosEdicion.partida_ronda_4) {
                setErrorEdicion('Debes seleccionar el escenario para la ronda 4'); return false;
            }
            if (datosEdicion.rondas_max >= 5 && !datosEdicion.partida_ronda_5) {
                setErrorEdicion('Debes seleccionar el escenario para la ronda 5'); return false;
            }
        } else {
            if (frentes.length === 0) { setErrorEdicion('Añade al menos un frente'); return false; }
            const nombres = frentes.map(f => f.nombre.trim().toLowerCase());
            if (new Set(nombres).size !== nombres.length) {
                setErrorEdicion('Los nombres de los frentes deben ser únicos'); return false;
            }
            for (let i = 0; i < frentes.length; i++) {
                const f = frentes[i];
                if (!f.nombre.trim()) { setErrorEdicion(`El frente ${i + 1} no tiene nombre`); return false; }
                for (let r = 1; r <= datosEdicion.rondas_max; r++) {
                    if (!f.escenarios[r]) {
                        setErrorEdicion(`Selecciona el escenario de la ronda ${r} en el frente "${f.nombre}"`);
                        return false;
                    }
                }
            }
        }
        return true;
    };

    // ─────────────────────────────────────────────────────────────
    // Guardar cambios
    // ─────────────────────────────────────────────────────────────
    const handleGuardarCambios = async (e) => {
        e.preventDefault();
        if (!validarEdicion()) return;
        if (!window.confirm('¿Deseas guardar los cambios en el torneo?')) return;

        try {
            setLoadingEdicion(true);
            setErrorEdicion('');

            const usaArchivos = archivoPDF || eliminarPDF || imagenNueva || eliminarImagenFlag;
            let dataToSend;

            if (usaArchivos) {
                dataToSend = new FormData();

                // Campos básicos
                dataToSend.append('nombre_torneo',     datosEdicion.nombre_torneo);
                dataToSend.append('rondas_max',        datosEdicion.rondas_max);
                dataToSend.append('puntos_ejercito',   datosEdicion.puntos_ejercito);
                dataToSend.append('participantes_max', datosEdicion.participantes_max);
                dataToSend.append('fecha_inicio',      datosEdicion.fecha_inicio);
                dataToSend.append('fecha_fin',         duracionTorneo === "1" ? '' : (datosEdicion.fecha_fin || ''));
                dataToSend.append('ubicacion',         datosEdicion.ubicacion || '');
                dataToSend.append('estado',            datosEdicion.estado);
                dataToSend.append('epoca_torneo',      datosEdicion.epocas_disponibles.join('|'));
                dataToSend.append('usa_frentes',       usaFrentes ? '1' : '0');

                if (usaFrentes) {
                    dataToSend.append('frentes', JSON.stringify(frentes));
                } else {
                    dataToSend.append('partida_ronda_1', datosEdicion.partida_ronda_1);
                    dataToSend.append('partida_ronda_2', datosEdicion.partida_ronda_2);
                    dataToSend.append('partida_ronda_3', datosEdicion.partida_ronda_3);
                    if (datosEdicion.rondas_max >= 4) dataToSend.append('partida_ronda_4', datosEdicion.partida_ronda_4 || '');
                    if (datosEdicion.rondas_max >= 5) dataToSend.append('partida_ronda_5', datosEdicion.partida_ronda_5 || '');
                }

                if (archivoPDF)         dataToSend.append('bases_pdf',      archivoPDF);
                if (eliminarPDF)        dataToSend.append('eliminar_pdf',    'true');
                if (imagenNueva)        dataToSend.append('imagen_cartel',   imagenNueva);
                if (eliminarImagenFlag) dataToSend.append('eliminar_imagen', 'true');

            } else {
                dataToSend = {
                    nombre_torneo:     datosEdicion.nombre_torneo,
                    rondas_max:        datosEdicion.rondas_max,
                    puntos_ejercito:   datosEdicion.puntos_ejercito,
                    participantes_max: datosEdicion.participantes_max,
                    fecha_inicio:      datosEdicion.fecha_inicio,
                    fecha_fin:         duracionTorneo === "1" ? null : (datosEdicion.fecha_fin || null),
                    ubicacion:         datosEdicion.ubicacion || null,
                    estado:            datosEdicion.estado,
                    epoca_torneo:      datosEdicion.epocas_disponibles.join('|'),
                    usa_frentes:       usaFrentes ? 1 : 0,
                    ...(usaFrentes
                        ? { frentes }
                        : {
                            partida_ronda_1: datosEdicion.partida_ronda_1,
                            partida_ronda_2: datosEdicion.partida_ronda_2,
                            partida_ronda_3: datosEdicion.partida_ronda_3,
                            ...(datosEdicion.rondas_max >= 4 && { partida_ronda_4: datosEdicion.partida_ronda_4 || null }),
                            ...(datosEdicion.rondas_max >= 5 && { partida_ronda_5: datosEdicion.partida_ronda_5 || null }),
                        }
                    ),
                };
            }

            await torneosFowApi.actualizarTorneo(torneoId, dataToSend);

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
        // Resets los frentes y datos al estado del torneo actual
        if (torneo) {
            if (torneo.imagen_url) setImagenActual(torneo.imagen_url);
            // El useEffect con [torneo] se encargará de restaurar el resto
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Estado del torneo
    // ─────────────────────────────────────────────────────────────
    const cambiarEstadoTorneo = async (nuevoEstado) => {
        if (torneo.estado === 'finalizado') { alert('⚠️ No se puede cambiar el estado de un torneo FINALIZADO.'); return; }

        if (nuevoEstado === 'en_curso') {
            try {
                const jugadoresData = await torneosFowApi.obtenerJugadoresTorneo(torneoId);
                const lista = Array.isArray(jugadoresData) ? jugadoresData : jugadoresData.data || [];

                if (lista.length === 0) { alert('❌ No hay jugadores inscritos.'); return; }

                const incompletos = lista.filter(j => !j.lista_ejercito);
                if (incompletos.length > 0) {
                    alert(`❌ HAY ${incompletos.length} INSCRIPCIÓN(ES) INCOMPLETA(S):\n\n` +
                        incompletos.map(j => `• ${j.jugador_nombre} ${j.jugador_apellidos}`).join('\n'));
                    return;
                }

                const response = await torneosFowApi.verificarPagos(torneoId);
                const { todosPagados, total = 0, pagados = 0, pendientes = 0 } = response.data;

                if (pendientes > 0 || !todosPagados) {
                    alert(`❌ Hay ${pendientes} participante(s) sin pagar de ${total}.`); return;
                }
                if (!window.confirm(`▶️ ¿Iniciar el torneo?\n✅ Todos los ${total} participantes están pagados.`)) return;

            } catch (error) {
                alert('❌ Error al verificar los pagos. Intenta de nuevo.', error); return;
            }
        }

        const mensajes = {
            pendiente:   '⏸️ ¿Marcar torneo como PENDIENTE?',
            finalizado:  '🏁 ¿Finalizar el torneo?\n\n⚠️ Esta acción es DEFINITIVA.'
        };

        if (nuevoEstado !== 'en_curso' && mensajes[nuevoEstado]) {
            if (!window.confirm(mensajes[nuevoEstado])) return;
        }
        if (nuevoEstado === 'finalizado') {
            if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN:\n¿Estás completamente seguro?')) return;
        }

        try {
            await torneosFowApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert('✅ Estado actualizado correctamente');
            await cargarDatos();
            if (onUpdate) onUpdate();
        } catch (error) {
            alert(error.message || 'Error al cambiar el estado');
        }
    };

    const eliminarTorneo = async () => {
        if (jugadores.length > 0) { alert(`⚠️ No se puede eliminar: hay ${jugadores.length} jugador(es) inscrito(s).`); return; }
        if (!window.confirm(`⚠️ ¿ESTÁS SEGURO de eliminar "${torneo.nombre_torneo}"?`)) return;
        if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN')) return;
        try {
            await torneosFowApi.eliminarTorneo(torneoId);
            alert('✅ Torneo eliminado correctamente');
            navigate('/');
        } catch (error) {
            alert(error.message || 'Error al eliminar el torneo');
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Render helper: selector escenario
    // ─────────────────────────────────────────────────────────────
    const SelectorEscenario = ({ id, name, value, onChange, required = false }) => (
        <select id={id} name={name} value={value} onChange={onChange} required={required} disabled={loadingEdicion}>
            <option value="">Selecciona escenario</option>
            {TIPOS_PARTIDA_FOW.map(tipo => (
                <option key={tipo.nombre} value={tipo.nombre}>[{tipo.tipo}] {tipo.nombre}</option>
            ))}
        </select>
    );

    // ─────────────────────────────────────────────────────────────
    // Guards
    // ─────────────────────────────────────────────────────────────
    if (loading) return <div className="vista-general"><div className="empty-message">⏳ Cargando información del torneo...</div></div>;
    if (!torneo) return <div className="vista-general"><div className="error-message">⚠️ No se pudo cargar la información del torneo</div></div>;

    const totalJugadores = jugadores.length;

    // ─────────────────────────────────────────────────────────────
    // JSX
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="vista-general">
            {errorEdicion && <div className="error-message">⚠️ {errorEdicion}</div>}

            {/* ══════════════════════════════════════════════════════
                MODO EDICIÓN
            ══════════════════════════════════════════════════════ */}
            {modoEdicion ? (
                <form onSubmit={handleGuardarCambios} className="formulario-edicion">

                    {/* ── INFORMACIÓN BÁSICA ── */}
                    <fieldset>
                        <legend>📋 Información Básica</legend>

                        <label htmlFor="nombre_torneo">Nombre del Torneo:*</label>
                        <input type="text" id="nombre_torneo" name="nombre_torneo"
                            value={datosEdicion.nombre_torneo} onChange={handleEdicionChange}
                            required disabled={loadingEdicion} />

                        <label htmlFor="tipo_torneo">Tipo de Torneo:</label>
                        <input type="text" id="tipo_torneo" value="👤 Individual" disabled readOnly className="campo-solo-lectura" />

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="rondas_max">Rondas:*</label>
                                <select id="rondas_max" name="rondas_max"
                                    value={datosEdicion.rondas_max} onChange={handleRondasMaxChange}
                                    required disabled={loadingEdicion}>
                                    {RONDAS_DISPONIBLES.map(r => (
                                        <option key={r.valor} value={r.valor}>{r.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="puntos_ejercito">Puntos Ejército:*</label>
                                <input type="number" id="puntos_ejercito" name="puntos_ejercito"
                                    value={datosEdicion.puntos_ejercito} onChange={handleEdicionChange}
                                    min={PUNTOS_EJERCITO_FOW.min} max={PUNTOS_EJERCITO_FOW.max}
                                    required disabled={loadingEdicion} />
                                <small>{PUNTOS_EJERCITO_FOW.min}-{PUNTOS_EJERCITO_FOW.max} pts</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="participantes_max">Participantes:*</label>
                                <input type="number" id="participantes_max" name="participantes_max"
                                    value={datosEdicion.participantes_max} onChange={handleEdicionChange}
                                    min={Math.max(totalJugadores, PARTICIPANTES_RANGO.min)} max={PARTICIPANTES_RANGO.max}
                                    required disabled={loadingEdicion} />
                                <small>{PARTICIPANTES_RANGO.min}-{PARTICIPANTES_RANGO.max}</small>
                            </div>
                        </div>

                        {/* Épocas */}
                        <label htmlFor="epoca_selector">Épocas Disponibles:*</label>
                        <div className="form-row">
                            <select id="epoca_selector" disabled={loadingEdicion}>
                                <option value="">Selecciona una época</option>
                                {EPOCAS_HISTORICA.filter(e => !datosEdicion.epocas_disponibles.includes(e)).map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                            <button type="button" className="btn-secondary" disabled={loadingEdicion}
                                onClick={() => {
                                    const sel = document.getElementById('epoca_selector');
                                    const epoca = sel.value;
                                    if (epoca && !datosEdicion.epocas_disponibles.includes(epoca)) {
                                        setDatosEdicion(prev => ({ ...prev, epocas_disponibles: [...prev.epocas_disponibles, epoca] }));
                                        sel.value = '';
                                        if (errorEdicion) setErrorEdicion('');
                                    }
                                }}>➕ Agregar</button>
                        </div>
                        {datosEdicion.epocas_disponibles.length > 0 ? (
                            <div className="epocas-seleccionadas">
                                <strong>Épocas seleccionadas:</strong>
                                <div className="epocas-tags">
                                    {datosEdicion.epocas_disponibles.map(epoca => (
                                        <div key={epoca} className="epoca-tag">
                                            <span>{epoca}</span>
                                            <button type="button" className="btn-remove-epoca" disabled={loadingEdicion}
                                                onClick={() => setDatosEdicion(prev => ({
                                                    ...prev, epocas_disponibles: prev.epocas_disponibles.filter(e => e !== epoca)
                                                }))}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="info-text">ℹ️ Aún no has seleccionado ninguna época</p>
                        )}

                        <label htmlFor="estado">Estado del Torneo:*</label>
                        <select id="estado" name="estado" value={datosEdicion.estado} onChange={handleEdicionChange}
                            required disabled={loadingEdicion}>
                            {ESTADOS_TORNEO_FOW.map(e => (
                                <option key={e.valor} value={e.valor}>{e.emoji} {e.nombre}</option>
                            ))}
                        </select>
                    </fieldset>

                    {/* ── FECHAS ── */}
                    <fieldset>
                        <legend>📅 Fechas y Ubicación</legend>

                        <label>Duración del Torneo:*</label>
                        <div className="duracion-torneo-container">
                            <label className="duracion-option">
                                <input type="radio" name="duracionTorneo" value="1"
                                    checked={duracionTorneo === "1"}
                                    onChange={(e) => { setDuracionTorneo(e.target.value); setDatosEdicion(prev => ({ ...prev, fecha_fin: '' })); }}
                                    disabled={loadingEdicion} />
                                📅 Un día
                            </label>
                            <label className="duracion-option">
                                <input type="radio" name="duracionTorneo" value="2"
                                    checked={duracionTorneo === "2"}
                                    onChange={(e) => setDuracionTorneo(e.target.value)}
                                    disabled={loadingEdicion} />
                                📅 Dos días o más
                            </label>
                        </div>

                        <label htmlFor="fecha_inicio">
                            {duracionTorneo === "1" ? "Fecha del Torneo:*" : "Fecha de Inicio:*"}
                        </label>
                        <input type="date" id="fecha_inicio" name="fecha_inicio"
                            value={datosEdicion.fecha_inicio} onChange={handleEdicionChange}
                            min={new Date().toISOString().split('T')[0]} required disabled={loadingEdicion} />

                        {duracionTorneo === "2" && (
                            <>
                                <label htmlFor="fecha_fin">Fecha de Fin:*</label>
                                <input type="date" id="fecha_fin" name="fecha_fin"
                                    value={datosEdicion.fecha_fin} onChange={handleEdicionChange}
                                    min={datosEdicion.fecha_inicio || new Date().toISOString().split('T')[0]}
                                    required disabled={loadingEdicion} />
                            </>
                        )}

                        <label htmlFor="ubicacion">Ubicación:</label>
                        <input type="text" id="ubicacion" name="ubicacion"
                            value={datosEdicion.ubicacion} onChange={handleEdicionChange}
                            placeholder="Ciudad, Local, etc." disabled={loadingEdicion} />
                    </fieldset>

                    {/* ── CARTEL ── */}
                    <fieldset>
                        <legend>🖼️ Cartel del Torneo</legend>

                        {imagenActual && !eliminarImagenFlag && !imagenNueva && (
                            <div className="imagen-actual-container">
                                <p className="imagen-label">Imagen actual:</p>
                                <img src={imagenActual} alt="Cartel actual" className="imagen-preview-img" />
                                <div className="imagen-acciones">
                                    <label htmlFor="nuevaImagenCartel" className="btn-cambiar-imagen">🔄 Cambiar imagen</label>
                                    <input type="file" id="nuevaImagenCartel" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleNuevaImagenCartel} style={{ display: 'none' }} disabled={loadingEdicion} />
                                    <button type="button" onClick={handleEliminarImagenActual} className="btn-eliminar-imagen" disabled={loadingEdicion}>
                                        🗑️ Eliminar imagen
                                    </button>
                                </div>
                            </div>
                        )}

                        {imagenNueva && vistaPreviaImagen && (
                            <div className="imagen-nueva-container">
                                <p className="imagen-label">Nueva imagen seleccionada:</p>
                                <p className="archivo-nombre">✅ <strong>{imagenNueva.name}</strong> — {(imagenNueva.size / 1024).toFixed(2)} KB</p>
                                <img src={vistaPreviaImagen} alt="Vista previa" className="imagen-preview-img" />
                                <button type="button" onClick={handleCancelarNuevaImagen} className="btn-cancelar-nueva-imagen" disabled={loadingEdicion}>
                                    ❌ Cancelar cambio
                                </button>
                            </div>
                        )}

                        {(!imagenActual || eliminarImagenFlag) && !imagenNueva && (
                            <div className="sin-imagen-container">
                                {eliminarImagenFlag ? (
                                    <>
                                        <p className="aviso-eliminar">⚠️ La imagen se eliminará al guardar los cambios</p>
                                        <button type="button" onClick={handleCancelarEliminacionImagen} className="btn-cancelar-eliminacion" disabled={loadingEdicion}>
                                            ↩️ Cancelar eliminación
                                        </button>
                                    </>
                                ) : (
                                    <p className="sin-imagen-texto">📷 Sin imagen de cartel</p>
                                )}
                                <label htmlFor="nuevaImagenCartel" className="btn-subir-imagen">➕ Subir imagen</label>
                                <input type="file" id="nuevaImagenCartel" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={handleNuevaImagenCartel} style={{ display: 'none' }} disabled={loadingEdicion} />
                                <small className="help-text-file">🖼️ JPG, PNG, GIF, WEBP | Máximo 5MB</small>
                            </div>
                        )}
                    </fieldset>

                    {/* ── ESCENARIOS / FRENTES ── */}
                    <fieldset>
                        <legend>🎲 Escenarios por Ronda</legend>

                        {/* Toggle frentes */}
                        <div className="frentes-toggle-container">
                            <label className="frentes-toggle-label">
                                <input type="checkbox" checked={usaFrentes} onChange={handleToggleFrentes} disabled={loadingEdicion} />
                                🗺️ Organizar por frentes (Frente del Este, Frente Occidental…)
                            </label>
                            <small className="help-text">
                                Activa esta opción si el torneo divide a los jugadores por frentes, cada uno con sus propios escenarios.
                            </small>
                        </div>

                        {/* ── SIN FRENTES ── */}
                        {!usaFrentes && [1, 2, 3, 4, 5].map(ronda => {
                            if (ronda > datosEdicion.rondas_max) return null;
                            return (
                                <div key={ronda}>
                                    <label htmlFor={`partida_ronda_${ronda}`}>Ronda {ronda}:{ronda <= 3 ? '*' : ''}</label>
                                    <SelectorEscenario
                                        id={`partida_ronda_${ronda}`}
                                        name={`partida_ronda_${ronda}`}
                                        value={datosEdicion[`partida_ronda_${ronda}`]}
                                        onChange={handleEdicionChange}
                                        required={ronda <= 3}
                                    />
                                </div>
                            );
                        })}

                        {/* ── CON FRENTES ── */}
                        {usaFrentes && (
                            <div className="frentes-container">
                                {frentes.map((frente, idx) => (
                                    <div key={idx} className="frente-card">
                                        <div className="frente-card-header">
                                            <span className="frente-numero">📍 Frente {idx + 1}</span>
                                            {frentes.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveFrente(idx)}
                                                    className="btn-eliminar-organizador" disabled={loadingEdicion} title="Eliminar frente">
                                                    🗑️
                                                </button>
                                            )}
                                        </div>

                                        <label htmlFor={`frente-nombre-${idx}`}>Nombre del frente:*</label>
                                        <input id={`frente-nombre-${idx}`} type="text"
                                            value={frente.nombre} onChange={(e) => handleNombreFrente(idx, e.target.value)}
                                            placeholder="Ej: Frente del Este, Pacífico…" disabled={loadingEdicion} />

                                        {Array.from({ length: datosEdicion.rondas_max }, (_, i) => i + 1).map(r => (
                                            <React.Fragment key={r}>
                                                <label htmlFor={`frente-${idx}-ronda-${r}`}>Ronda {r}:*</label>
                                                <SelectorEscenario
                                                    id={`frente-${idx}-ronda-${r}`}
                                                    value={frente.escenarios[r] || ""}
                                                    onChange={(e) => handleEscenarioFrente(idx, r, e.target.value)}
                                                />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ))}

                                {frentes.length < 6 && (
                                    <button type="button" onClick={handleAddFrente}
                                        className="btn-añadir-organizador btn-añadir-frente" disabled={loadingEdicion}>
                                        ➕ Añadir frente ({frentes.length}/6)
                                    </button>
                                )}
                            </div>
                        )}
                    </fieldset>

                    {/* ── PDF ── */}
                    <fieldset>
                        <legend>📄 Bases del Torneo</legend>

                        {torneo.bases_nombre && !eliminarPDF && (
                            <div className="pdf-actual">
                                <p>📎 Archivo actual: <strong>{torneo.bases_nombre}</strong></p>
                                <button type="button" onClick={() => setEliminarPDF(true)} className="btn-danger mt-10" disabled={loadingEdicion}>
                                    🗑️ Eliminar PDF actual
                                </button>
                            </div>
                        )}
                        {eliminarPDF && (
                            <div className="advertencia-finalizado mb-20">
                                <p>⚠️ El PDF actual se eliminará al guardar</p>
                                <button type="button" onClick={() => setEliminarPDF(false)} className="btn-secondary mt-10" disabled={loadingEdicion}>
                                    ↩️ Mantener PDF actual
                                </button>
                            </div>
                        )}
                        <label htmlFor="bases_pdf">{torneo.bases_nombre && !eliminarPDF ? 'Reemplazar PDF:' : 'Subir PDF de bases:'}</label>
                        <input type="file" id="bases_pdf" accept=".pdf" onChange={handleArchivoPDF} disabled={loadingEdicion} />
                        {archivoPDF && <p className="success-message mt-10">✅ Nuevo: {archivoPDF.name} ({(archivoPDF.size / 1024).toFixed(2)} KB)</p>}
                    </fieldset>

                    {/* ── ORGANIZADORES ── */}
                    <fieldset>
                        <legend>👥 Organizadores del Torneo</legend>

                        <h4>✅ Organizadores Activos</h4>
                        {organizadores.activos?.length > 0 ? (
                            <div className="organizadores-list">
                                {organizadores.activos.map(org => (
                                    <div key={org.organizador_id} className="organizador-item">
                                        <div className="organizador-info">
                                            <span className="organizador-nombre">{org.es_creador ? '👑 ' : '👤 '}<strong>{org.nombre_usuario}</strong></span>
                                            <span className="organizador-email">{org.email}</span>
                                        </div>
                                        {!org.es_creador && (
                                            <button type="button" className="btn-danger-small" disabled={loadingOrganizadores || loadingEdicion}
                                                onClick={() => handleEliminarOrganizador(org.organizador_id, 'activo', org.nombre_usuario)}>❌</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="info-text">Solo el creador está registrado como organizador</p>}

                        {organizadores.pendientes?.length > 0 && (
                            <>
                                <h4 className="mt-20">⏳ Invitaciones Pendientes</h4>
                                <div className="organizadores-list">
                                    {organizadores.pendientes.map(org => (
                                        <div key={org.organizador_id} className="organizador-item pendiente">
                                            <span className="organizador-email">📧 {org.email}</span>
                                            <button type="button" className="btn-reenviar" title="Reenviar"
                                                onClick={() => handleReenviarInvitacion(org)}>📧</button>
                                            <button type="button" className="btn-danger-small" disabled={loadingOrganizadores || loadingEdicion}
                                                onClick={() => handleEliminarOrganizador(org.organizador_id, 'pendiente', org.email)}>❌</button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <h4 className="mt-20">➕ Agregar Nuevo Organizador</h4>
                        <div className="form-row">
                            <input type="email" placeholder="email@ejemplo.com" value={nuevoOrganizadorEmail}
                                onChange={(e) => setNuevoOrganizadorEmail(e.target.value)}
                                disabled={loadingOrganizadores || loadingEdicion} className="input-email-organizador" />
                            <button type="button" onClick={handleAgregarOrganizador} className="btn-success"
                                disabled={loadingOrganizadores || loadingEdicion}>
                                {loadingOrganizadores ? '⏳...' : '➕ Agregar'}
                            </button>
                        </div>
                        <small className="help-text">Si el usuario está registrado se agrega automáticamente; si no, recibirá invitación por email.</small>

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
            /* ══════════════════════════════════════════════════════
                MODO VISTA
            ══════════════════════════════════════════════════════ */
                <>
                    <section className="seccion-info-torneo">
                        <div className="section-header-inline">
                            <h2>ℹ️ Información del Torneo</h2>
                            <div className="botones-accion-grupo">
                                {torneo.estado !== 'finalizado' && (
                                    <>
                                        {torneo.estado === 'pendiente' && (
                                            <button onClick={() => cambiarEstadoTorneo('en_curso')} className="btn-success">▶️ Iniciar Torneo</button>
                                        )}
                                        {torneo.estado === 'en_curso' && (
                                            <>
                                                <button onClick={() => cambiarEstadoTorneo('pendiente')} className="btn-secondary">⏸️ Volver a Pendiente</button>
                                                <button onClick={() => cambiarEstadoTorneo('finalizado')} className="btn-warning">🏁 Finalizar Torneo</button>
                                            </>
                                        )}
                                    </>
                                )}
                                {torneo.estado === 'pendiente' && (
                                    <>
                                        <button className="btn-primary" onClick={() => setModoEdicion(true)}>✏️ Editar Torneo</button>
                                        <button onClick={eliminarTorneo} className="btn-danger">🗑️ Eliminar Torneo</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {torneo.estado === 'finalizado' && (
                            <div className="advertencia-finalizado">
                                <strong>🏁 Torneo FINALIZADO</strong>
                                <p>El estado del torneo es permanente y no se puede modificar.</p>
                            </div>
                        )}
                        {torneo.estado === 'en_curso' && (
                            <div className="advertencia-no-editable">
                                <strong>▶️ Torneo EN CURSO</strong>
                                <p>Para editar, primero vuelve el torneo a estado PENDIENTE.</p>
                            </div>
                        )}

                        {torneo.imagen_url && (
                            <div className="cartel-vista">
                                <h3>🖼️ Cartel del Torneo</h3>
                                <img src={torneo.imagen_url} alt="Cartel del torneo" className="cartel-imagen-vista" />
                            </div>
                        )}

                        <div className="info-torneo-grid">
                            <div className="info-item"><label>Tipo de Torneo:</label><span>🎯 Individual</span></div>
                            <div className="info-item"><label>🎲 Rondas:</label><p>{torneo.rondas_max} rondas</p></div>
                            <div className="info-item"><label>🎭 Épocas:</label><p>{torneo.epocas_disponibles}</p></div>
                            <div className="info-item"><label>⚔️ Puntos Ejército:</label><p>{torneo.puntos_ejercito} pts</p></div>
                            <div className="info-item">
                                <span className="info-item-destacado">👤 {totalJugadores} / {torneo.participantes_max} Jugadores</span>
                            </div>
                            {torneo.ubicacion && <div className="info-item"><label>📍 Ubicación:</label><p>{torneo.ubicacion}</p></div>}
                            <div className="info-item"><label>📅 Fecha Inicio:</label><p>{new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}</p></div>
                            {torneo.fecha_fin && <div className="info-item"><label>📅 Fecha Fin:</label><p>{new Date(torneo.fecha_fin).toLocaleDateString('es-ES')}</p></div>}
                        </div>
                    </section>

                    {/* ── ESCENARIOS: SIN FRENTES ── */}
                    {!torneo.usa_frentes && (
                        <section className="seccion-rondas">
                            <h2>🎮 Escenarios del Torneo</h2>
                            <div className="rondas-list">
                                {[1, 2, 3, 4, 5].map(ronda => {
                                    if (ronda > torneo.rondas_max) return null;
                                    const escenario = torneo[`partida_ronda_${ronda}`];
                                    if (!escenario) return null;
                                    return (
                                        <div key={ronda} className="ronda-item">
                                            <span className="ronda-numero">Ronda {ronda}:</span>
                                            <span className="ronda-escenario">{escenario}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── ESCENARIOS: CON FRENTES ── */}
                    {!!torneo.usa_frentes && torneo.frentes?.length > 0 && (
                        <section className="seccion-rondas">
                            <h2>🗺️ Frentes y Escenarios</h2>
                            <div className="frentes-vista-container">
                                {torneo.frentes.map((frente, idx) => {
                                    // Normalizar escenarios tanto si vienen como array como si vienen como objeto
                                    const escenariosNorm = Array.isArray(frente.escenarios)
                                        ? Object.fromEntries(frente.escenarios.map(e => [e.ronda, e.nombre_partida]))
                                        : (frente.escenarios || {});

                                    return (
                                        <div key={frente.id || idx} className="frente-vista-card">
                                            <h3 className="frente-vista-titulo">
                                                📍 {frente.nombre_frente || frente.nombre}
                                            </h3>
                                            <div className="rondas-list">
                                                {Array.from({ length: torneo.rondas_max }, (_, i) => i + 1).map(r => (
                                                    <div key={r} className="ronda-item">
                                                        <span className="ronda-numero">Ronda {r}:</span>
                                                        <span className="ronda-escenario">
                                                            {escenariosNorm[r] || <em className="sin-escenario">—</em>}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* ── BASES PDF ── */}
                    <section className="seccion-bases">
                        <h2>📄 Bases del Torneo</h2>
                        {torneo.bases_nombre ? (
                            <div className="bases-existentes">
                                <p>📎 <strong>{torneo.bases_nombre}</strong>
                                    {torneo.base_tamaño && ` (${(torneo.base_tamaño / 1024).toFixed(2)} KB)`}
                                </p>
                                <button onClick={descargarBases} className="btn-primary">⬇️ Descargar Bases</button>
                            </div>
                        ) : (
                            <p>ℹ️ Sin bases cargadas. Usa "Editar Torneo" para subir un PDF.</p>
                        )}
                    </section>

                    {/* ── ORGANIZADORES ── */}
                    <section className="seccion-organizadores">
                        <h2>👥 Organizadores del Torneo</h2>

                        {organizadores.activos?.length > 0 ? (
                            <div className="organizadores-grid">
                                {organizadores.activos.map(org => (
                                    <div key={org.organizador_id} className="organizador-card">
                                        <div className="organizador-avatar">{org.es_creador ? '👑' : '👤'}</div>
                                        <div className="organizador-datos">
                                            <h3>{org.nombre_usuario}{org.es_creador && <span className="badge-creador">Creador</span>}</h3>
                                            <p className="organizador-email-display">{org.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="info-text">Solo el creador está registrado como organizador</p>}

                        {organizadores.pendientes?.length > 0 && (
                            <div className="invitaciones-pendientes-vista mt-20">
                                <h3>⏳ Invitaciones Pendientes ({organizadores.pendientes.length})</h3>
                                <div className="invitaciones-list">
                                    {organizadores.pendientes.map(org => (
                                        <div key={org.organizador_id} className="invitacion-item">
                                            <span>📧 {org.email}</span>
                                            <span className="fecha-invitacion">{new Date(org.fecha_asignacion).toLocaleDateString('es-ES')}</span>
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

export default VistaGeneralFow;