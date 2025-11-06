import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import torneosSagaApi from '../servicios/apiSaga.js';
import { generarEmparejamientosSuizo } from "../funciones/emparejamientos.js";

import VistaGeneral from '../componente/vistas/VistaGeneral';
import VistaJugadores from '../componente/vistas/VistaJugadores';
import VistaClasificacion from '../componente/vistas/VistaClasificacion';
import VistaEmparejamientos from '../componente/vistas/VistaEmparejamientos';

import '../estilos/administrarTorneo.css';

function AdministrarTorneo() {
    const navigate = useNavigate();
    const { torneoId } = useParams();
    
    const [torneo, setTorneo] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [clasificacion, setClasificacion] = useState([]);
    
    // Estado para edición del torneo
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({
        nombre_torneo: '',
        epoca_torneo: '',
        rondas_max: 3,
        puntos_banda: 6,
        participantes_max: 16,
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
    
    // Estado para gestión de bases PDF
    const [archivoPDF, setArchivoPDF] = useState(null);
    const [eliminarPDF, setEliminarPDF] = useState(false);

    // Estados generales
    const [vistaActual, setVistaActual] = useState('general');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [emparejamientos, setEmparejamientos] = useState([]);

    // Listas de opciones
    const epocaTorneo = [
        "Alejandro",
        "Ánibal",
        "Vikingos",
        "Invasiones",
        "Cruzadas",
        "Caballeria",
        "Edad de la Magia",
        "Alejandro/Ánibal",
        "Vikingos/Invasiones",
        "Cruzadas/Caballería",
    ];

    const tiposPartida = [
        "Choque de Bandas",
        "Conquista",
        "Avance",
        "Desacralización",
        "Captura"
    ];

    const estadosTorneo = [
        { valor: 'pendiente', nombre: 'Pendiente' },
        { valor: 'en_curso', nombre: 'En Curso' },
        { valor: 'finalizado', nombre: 'Finalizado' }
    ];

    useEffect(() => {
        if (!torneoId) {
            setError('No se especificó un ID de torneo');
            setLoading(false);
            return;
        }
        cargarDatosTorneo();
    }, [torneoId]);

    // Sincronizar datos del torneo cuando se carga
    useEffect(() => {
        if (torneo) {
            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '',
                epoca_torneo: torneo.epoca_torneo || '',
                rondas_max: torneo.rondas_max || 3,
                puntos_banda: torneo.puntos_banda || 6,
                participantes_max: torneo.participantes_max || 16,
                fecha_inicio: torneo.fecha_inicio?.split('T')[0] || '',
                fecha_fin: torneo.fecha_fin?.split('T')[0] || '',
                ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '',
                partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '',
                partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || ''
            });
        }
    }, [torneo]);

    const cargarDatosTorneo = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await torneosSagaApi.obtenerTorneo(torneoId);
            const dataTorneo = response.data?.torneo || response.torneo || response;
            setTorneo(dataTorneo);
            
            try {
                const dataJugadores = await torneosSagaApi.obtenerJugadoresTorneo(torneoId);
                setJugadores(Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || []);
            } catch (err) {
                console.log('No hay jugadores todavía', err);
                setJugadores([]);
            }
            
            try {
                const dataClasificacion = await torneosSagaApi.obtenerClasificacionTorneo(torneoId);
                setClasificacion(Array.isArray(dataClasificacion) ? dataClasificacion : dataClasificacion.data || []);
            } catch (err) {
                console.log('No hay clasificación todavía', err);
                setClasificacion([]);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            setError(`Error al cargar los datos del torneo: ${error.message}`);
            setLoading(false);
        }
    };

    const marcarComoPagado = async (jugadorId, nombreJugador) => {
        try {
            const confirmar = window.confirm(
                `¿Confirmar que ${nombreJugador} ha pagado la inscripción?`
            );
            
            if (!confirmar) return;

            await torneosSagaApi.actualizarPago(torneoId, jugadorId, { 
                pagado: 'pagado' 
            });

            // Recargar los datos del torneo
            await cargarDatosTorneo();
            
            alert('✅ Pago registrado exitosamente');

        } catch (error) {
            console.error('Error al marcar como pagado:', error);
            alert('❌ Error al registrar el pago: ' + error.message);
        }
    };

    const marcarComoPendiente = async (jugadorId, nombreJugador) => {
        try {
            const confirmar = window.confirm(
                `¿Marcar el pago de ${nombreJugador} como pendiente?`
            );
            
            if (!confirmar) return;

            await torneosSagaApi.actualizarPago(torneoId, jugadorId, { 
                pagado: 'pendiente' 
            });

            // Recargar los datos del torneo
            await cargarDatosTorneo();
            
            alert('⏳ Estado actualizado a pendiente');

        } catch (error) {
            console.error('Error al marcar como pendiente:', error);
            alert('❌ Error al actualizar estado: ' + error.message);
        }
    };


    // ==========================================
    // FUNCIONES DE EDICIÓN DEL TORNEO
    // ==========================================
    
    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({
            ...prev,
            [name]: value
        }));
        if (errorEdicion) setErrorEdicion('');
    };

    const handleGuardarCambios = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!datosEdicion.nombre_torneo.trim()) {
            setErrorEdicion('El nombre del torneo es obligatorio');
            return;
        }

        if (datosEdicion.participantes_max < jugadores.length) {
            setErrorEdicion(`No puedes reducir el número de participantes a menos de ${jugadores.length} (jugadores ya inscritos)`);
            return;
        }

        if (!window.confirm('¿Deseas guardar los cambios en el torneo?')) {
            return;
        }

        try {
            setLoadingEdicion(true);
            setErrorEdicion('');

            let dataToSend;
            
            if (archivoPDF || eliminarPDF) {
                dataToSend = new FormData();
                
                Object.keys(datosEdicion).forEach(key => {
                    if (datosEdicion[key] !== null && datosEdicion[key] !== '') {
                        dataToSend.append(key, datosEdicion[key]);
                    }
                });
                
                if (archivoPDF) {
                    dataToSend.append('bases_pdf', archivoPDF);
                }
                
                if (eliminarPDF) {
                    dataToSend.append('eliminar_pdf', 'true');
                }
            } else {
                dataToSend = datosEdicion;
            }

            await torneosSagaApi.updateTorneo(torneoId, dataToSend);
            
            alert('✅ Torneo actualizado correctamente');
            setModoEdicion(false);
            setArchivoPDF(null);
            setEliminarPDF(false);
            await cargarDatosTorneo();
            
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
        if (torneo) {
            setDatosEdicion({
                nombre_torneo: torneo.nombre_torneo || '',
                epoca_torneo: torneo.epoca_torneo || '',
                rondas_max: torneo.rondas_max || 3,
                puntos_banda: torneo.puntos_banda || 6,
                participantes_max: torneo.participantes_max || 16,
                fecha_inicio: torneo.fecha_inicio?.split('T')[0] || '',
                fecha_fin: torneo.fecha_fin?.split('T')[0] || '',
                ubicacion: torneo.ubicacion || '',
                estado: torneo.estado || 'pendiente',
                partida_ronda_1: torneo.partida_ronda_1 || '',
                partida_ronda_2: torneo.partida_ronda_2 || '',
                partida_ronda_3: torneo.partida_ronda_3 || '',
                partida_ronda_4: torneo.partida_ronda_4 || '',
                partida_ronda_5: torneo.partida_ronda_5 || ''
            });
        }
    };

    // ==========================================
    // FUNCIONES HELPER PARA VISTA GENERAL
    // ==========================================
    
    const handleSetEliminarPDF = (valor) => {
        setEliminarPDF(valor);
    };

    // ==========================================
    // FUNCIONES DE GESTIÓN DE ESTADO
    // ==========================================
    
    const cambiarEstadoTorneo = async (nuevoEstado) => {
        // 🔒 BLOQUEAR si el torneo ya está finalizado
        if (torneo.estado === 'finalizado') {
            alert('⚠️ No se puede cambiar el estado de un torneo FINALIZADO.\n\nUna vez finalizado, el estado es permanente.');
            return;
        }

        const mensajes = {
            'pendiente': '⏸️ ¿Marcar torneo como PENDIENTE?',
            'en_curso': '▶️ ¿Iniciar el torneo? (Cambiará a EN CURSO)',
            'finalizado': '🏁 ¿Finalizar el torneo?\n\n⚠️ Esta acción es DEFINITIVA y NO se puede revertir.'
        };

        if (!window.confirm(mensajes[nuevoEstado])) {
            return;
        }

        // Confirmación extra para finalizar
        if (nuevoEstado === 'finalizado') {
            if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN:\n¿Estás completamente seguro de finalizar el torneo?\n\nNo podrás cambiarlo después.')) {
                return;
            }
        }

        try {
            await torneosSagaApi.cambiarEstadoTorneo(torneoId, nuevoEstado);
            alert('✅ Estado actualizado correctamente');
            await cargarDatosTorneo();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al cambiar el estado');
        }
    };

    // ==========================================
    // FUNCIONES DE ELIMINACIÓN
    // ==========================================
    
    const eliminarTorneo = async () => {
        console.log('🗑️ Intentando eliminar torneo ID:', torneoId);

        if (jugadores.length > 0) {
            alert(`⚠️ No se puede eliminar el torneo porque tiene ${jugadores.length} jugador(es) inscrito(s).\n\nPrimero elimina todos los jugadores.`);
            return;
        }

        if (!window.confirm(`⚠️ ¿ESTÁS SEGURO de eliminar el torneo "${torneo.nombre_torneo}"?\n\nEsta acción NO se puede deshacer.`)) {
            return;
        }

        if (!window.confirm('⚠️ ÚLTIMA CONFIRMACIÓN: ¿Realmente quieres ELIMINAR este torneo permanentemente?')) {
            return;
        }

        try {
            console.log('📞 Llamando a deleteTorneo...');
            await torneosSagaApi.deleteTorneo(torneoId);
            
            alert('✅ Torneo eliminado correctamente');
            navigate('/');
        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            alert(error.message || 'Error al eliminar el torneo');
        }
    };

    const eliminarJugador = async (jugadorId, nombreJugador) => {
        if (!window.confirm(`¿Estás seguro de eliminar a ${nombreJugador} del torneo?`)) {
            return;
        }

        try {
            await torneosSagaApi.deleteParticipante(torneoId, jugadorId);
            alert(`✅ ${nombreJugador} eliminado correctamente del torneo`);
            await cargarDatosTorneo();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al eliminar el jugador');
        }
    };

    // ==========================================
    // FUNCIONES DE GESTIÓN DE PDF
    // ==========================================
    
    const handleArchivoPDF = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            if (file.size > 5 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Máximo 5MB');
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

    const handleGenerarEmparejamientos = async () => {
        try {
            if (!torneoId) {
                alert('⚠️ Error: No se encontró el ID del torneo');
                return;
            }

            if (jugadores.length < 2) {
                alert('⚠️ Se necesitan al menos 2 jugadores para generar emparejamientos');
                return;
            }

            // Generar emparejamientos para la ronda 1
            const nuevosEmparejamientos = await generarEmparejamientosSuizo(torneoId, 1);
            
            // Asegurar que siempre sea un array
            setEmparejamientos(Array.isArray(nuevosEmparejamientos) ? nuevosEmparejamientos : []);
            
            alert('✅ Emparejamientos generados correctamente');
            
        } catch (error) {
            console.error('❌ Error al generar emparejamientos:', error);
            alert(`Error al generar emparejamientos: ${error.message}`);
            setEmparejamientos([]); // Asegurar array vacío en caso de error
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    // ==========================================
    // PANTALLAS DE CARGA Y ERROR
    // ==========================================

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '1.5em',
                color: '#4a7c2e'
            }}>
                ⏳ Cargando datos del torneo...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                maxWidth: '600px', 
                margin: '100px auto', 
                padding: '40px', 
                textAlign: 'center',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>⚠️ Error</h2>
                <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>{error}</p>
                <button 
                    onClick={volverInicio}
                    className="btn-secondary"
                >
                    ⬅️ Volver al Inicio
                </button>
            </div>
        );
    }

    // ==========================================
    // RENDER PRINCIPAL
    // ==========================================

    return (
        <div className="administrar-torneo-container">
            {/* ==================== HEADER ==================== */}
            <header className="torneo-header">
                <h1>⚔️ {torneo?.nombre_torneo || 'Torneo'}</h1>
                <div className="torneo-info">
                    <span className={`estado-badge ${torneo?.estado || 'pendiente'}`}>
                        {torneo?.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                    <span>📅 {torneo?.fecha_inicio ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                    <span>👥 {jugadores.length} / {torneo?.participantes_max || 0} jugadores</span>
                </div>
            </header>

            {/* ==================== NAVEGACIÓN ==================== */}
            <nav className="vista-nav">
                <button 
                    className={vistaActual === 'general' ? 'active' : ''}
                    onClick={() => setVistaActual('general')}
                >
                    📊 General
                </button>
                <button 
                    className={vistaActual === 'jugadores' ? 'active' : ''}
                    onClick={() => setVistaActual('jugadores')}
                >
                    👥 Jugadores ({jugadores.length})
                </button>
                <button 
                    className={vistaActual === 'emparejamientos' ? 'active' : ''}
                    onClick={() => setVistaActual('emparejamientos')}
                >
                    🎲 Emparejamientos
                </button>
                <button 
                    className={vistaActual === 'clasificacion' ? 'active' : ''}
                    onClick={() => setVistaActual('clasificacion')}
                >
                    🏆 Clasificación
                </button>
            </nav>

            {/* ==================== CONTENIDO PRINCIPAL ==================== */}
            <div className="contenido-principal">
                
                {/* ==================== VISTA GENERAL ==================== */}
                {vistaActual === 'general' && (
                    <VistaGeneral 
                        torneo={torneo}
                        jugadores={jugadores}
                        modoEdicion={modoEdicion}
                        setModoEdicion={setModoEdicion}
                        datosEdicion={datosEdicion}
                        loadingEdicion={loadingEdicion}
                        errorEdicion={errorEdicion}
                        archivoPDF={archivoPDF}
                        eliminarPDF={eliminarPDF}
                        handleSetEliminarPDF={handleSetEliminarPDF}
                        handleGuardarCambios={handleGuardarCambios}
                        handleCancelarEdicion={handleCancelarEdicion}
                        handleEdicionChange={handleEdicionChange}
                        handleArchivoPDF={handleArchivoPDF}
                        descargarBases={descargarBases}
                        cambiarEstadoTorneo={cambiarEstadoTorneo}
                        eliminarTorneo={eliminarTorneo}
                        epocaTorneo={epocaTorneo}
                        tiposPartida={tiposPartida}
                        estadosTorneo={estadosTorneo}
                    />
                )}

                {/* ==================== VISTA JUGADORES ==================== */}
                {vistaActual === 'jugadores' && (
                    <VistaJugadores 
                        torneo={torneo}
                        jugadores={jugadores}
                        eliminarJugador={eliminarJugador}
                        marcarComoPagado={marcarComoPagado}
                        marcarComoPendiente={marcarComoPendiente}
                    />
                )}

                {/* ==================== VISTA EMPAREJAMIENTOS ==================== */}
                {vistaActual === 'emparejamientos' && (
                    <VistaEmparejamientos 
                        torneo={torneo}
                        jugadores={jugadores}
                        emparejamientos={emparejamientos}
                        handleGenerarEmparejamientos={handleGenerarEmparejamientos}
                    />
                )}

                {/* ==================== VISTA CLASIFICACIÓN ==================== */}
                {vistaActual === 'clasificacion' && (
                    <VistaClasificacion 
                        clasificacion={clasificacion}
                    />
                )}
            </div>

            {/* ==================== FOOTER ==================== */}
            <footer className="footer-controles">
                <button type="button" onClick={volverInicio} className="btn-atras">
                    ⬅️ Volver al Inicio
                </button>
            </footer>
        </div>
    );
}

export default AdministrarTorneo;