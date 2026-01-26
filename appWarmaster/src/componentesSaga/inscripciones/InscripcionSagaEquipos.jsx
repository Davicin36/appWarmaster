import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { torneosSagaApi } from '@/servicios/apiSaga';
import { usuarioApi } from '@/servicios/apiUsuarios';
import { 
  PUNTOS_BANDA_RANGO,
  procesarEpocasYBandas,
  obtenerConfiguracionBanda,
  permiteTipoTropa
} from '../funcionesSaga/constantesFuncionesSaga';
import Footer from '@/paginas/Footer.jsx'

import '@/estilos/inscripcionesEquipo.css';

function InscripcionSagaEquipos({ torneoId, torneo, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const modoEdicion = location.pathname.includes('editar-inscripcion');
  
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [equipoId, setEquipoId] = useState(null);
  const [miembrosEquipo, setMiembrosEquipo] = useState([
    { 
      nombre: `${user?.nombre} ${user?.apellidos}`,
      email: user?.email,
      epoca: "",
      banda: "",
      // ✅ Puntos estándar
      puntos: {
        guardias: 0,
        guerreros: 0,
        levas: 0,
        mercenarios: 0,
        elefantes: 0,
        carros: 0,
        tambor: 0,
        curaids: 0,
        perros: 0,
        berserkers: 0,
      },
      // ✅ Sistemas especiales
      unidadesEspeciales: {},
      opcionesBanda: {},
      tiposTropaPersonalizados: {},
      detalleMercenarios: "",
      esCapitan: true,
      esYo: true,
      usuarioValido: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const jugadoresPorEquipo = torneo?.num_jugadores_equipo;
  const puntosMaximos = torneo?.puntos_banda || PUNTOS_BANDA_RANGO.default;
  
  // ==========================================
  // PROCESAR LAS ÉPOCAS Y BANDAS DISPONIBLES
  // ==========================================
  const { epocasArray, todasLasBandas, mapaBandaAEpoca } = React.useMemo(
    () => procesarEpocasYBandas(torneo?.epocas_disponibles),
    [torneo?.epocas_disponibles]
  );

  // ==========================================
  // CARGAR EQUIPO EXISTENTE
  // ==========================================
  useEffect(() => {
    const cargarEquipo = async () => {
      if (!modoEdicion) return;

      try {
        setLoading(true);
        const data = await torneosSagaApi.obtenerInscripcionEquipo(torneoId);
        
        if (data.success && data.data) {
          const equipo = data.data;
          
          setNombreEquipo(equipo.nombre_equipo || "");
          setEquipoId(equipo.id);
          
          if (equipo.miembros && Array.isArray(equipo.miembros)) {
            setMiembrosEquipo(equipo.miembros.map(m => {
              // Parsear composición si existe
              let composicion = {};
              if (m.composicion_ejercito) {
                try {
                  composicion = typeof m.composicion_ejercito === 'string'
                    ? JSON.parse(m.composicion_ejercito)
                    : m.composicion_ejercito;
                } catch (e) {
                  console.error('Error parseando composicion:', e);
                }
              }

              return {
                nombre: m.nombre,
                email: m.email,
                epoca: m.epoca,
                banda: m.banda || "",
                puntos: {
                  guardias: parseFloat(composicion.guardias || 0),
                  guerreros: parseFloat(composicion.guerreros || 0),
                  levas: parseFloat(composicion.levas || 0),
                  mercenarios: parseFloat(composicion.mercenarios || 0),
                  elefantes: parseFloat(composicion.elefantes || 0),
                  carros: parseFloat(composicion.carros || 0),
                  tambor: parseFloat(composicion.tambor || 0),
                  curaids: parseFloat(composicion.curaids || 0),
                  perros: parseFloat(composicion.perros || 0),
                  berserkers: parseFloat(composicion.berserkers || 0),
                },
                unidadesEspeciales: composicion.unidadesEspeciales || {},
                opcionesBanda: composicion.opcionesBanda || {},
                tiposTropaPersonalizados: composicion.tiposTropaPersonalizados || {},
                detalleMercenarios: composicion.detalleMercenarios || "",
                esCapitan: m.es_capitan,
                esYo: m.usuario_id === user.id,
                usuarioValido: m.estado_cuenta === 'activo',
                estadoCuenta: m.estado_cuenta
              };
            }));
          }
        }
      } catch (err) {
        console.error("❌ Error:", err);
        setError("No se pudo cargar el equipo");
      } finally {
        setLoading(false);
      }
    };

    cargarEquipo();
  }, [modoEdicion, torneoId, user.id]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const agregarMiembro = () => {
    if (miembrosEquipo.length < jugadoresPorEquipo) {
      setMiembrosEquipo([
        ...miembrosEquipo,
        { 
          nombre: "", 
          email: "", 
          epoca: "",
          banda: "",
          puntos: {
            guardias: 0,
            guerreros: 0,
            levas: 0,
            mercenarios: 0,
            elefantes: 0,
            carros: 0,
            tambor: 0,
            curaids: 0,
            perros: 0,
            berserkers: 0,
          },
          unidadesEspeciales: {},
          opcionesBanda: {},
          tiposTropaPersonalizados: {},
          detalleMercenarios: "",
          esCapitan: false,
          esYo: false,
          usuarioValido: null
        }
      ]);
      setError("");
    } else {
      setError(`Máximo ${jugadoresPorEquipo} jugadores`);
    }
  };

  const eliminarMiembro = (index) => {
    if (miembrosEquipo[index].esYo) {
      setError("No puedes eliminarte del equipo");
      return;
    }
    
    if (miembrosEquipo.length > 1) {
      const nuevosMiembros = miembrosEquipo.filter((_, i) => i !== index);
      setMiembrosEquipo(nuevosMiembros);
      setError("");
    }
  };

  const eliminarInscripcionEquipo = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar la inscripción de tu equipo?')) {
      return;
    }

    if (!equipoId) {
      setError("No se pudo obtener el ID del equipo");
      return;
    }
    
    try {
      setLoading(true);
      const resultado = await torneosSagaApi.eliminarEquipoTorneo(torneoId, equipoId);

      if (resultado.success) {
        alert("✅ Inscripción del Equipo eliminada correctamente");
        navigate('/');
      }
    } catch (error) {
      console.error("❌ Error al eliminar inscripción:", error);
      setError(error.message || "Error al eliminar la inscripción");
    } finally {
      setLoading(false);
    }
  };

  const actualizarMiembro = (index, campo, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index][campo] = valor;
    
    // Si cambia época, resetear banda Y puntos
    if (campo === 'epoca') {
      nuevosMiembros[index].banda = "";
      nuevosMiembros[index].puntos = {
        guardias: 0,
        guerreros: 0,
        levas: 0,
        mercenarios: 0,
        elefantes: 0,
        carros: 0,
        tambor: 0,
        curaids: 0,
        perros: 0,
        berserkers: 0,
      };
      nuevosMiembros[index].unidadesEspeciales = {};
      nuevosMiembros[index].opcionesBanda = {};
      nuevosMiembros[index].tiposTropaPersonalizados = {};
      nuevosMiembros[index].detalleMercenarios = "";
    }
    
    // Si cambia banda, resetear puntos y sistemas especiales
    if (campo === 'banda') {
      if (!valor) {
        // Si se borra la banda, resetear todo
        nuevosMiembros[index].puntos = {
          guardias: 0,
          guerreros: 0,
          levas: 0,
          mercenarios: 0,
          elefantes: 0,
          carros: 0,
          tambor: 0,
          curaids: 0,
          perros: 0,
          berserkers: 0,
        };
        nuevosMiembros[index].unidadesEspeciales = {};
        nuevosMiembros[index].opcionesBanda = {};
        nuevosMiembros[index].tiposTropaPersonalizados = {};
        nuevosMiembros[index].detalleMercenarios = "";
      } else {
        // Si cambia a otra banda, limpiar solo lo que no aplique
        const config = obtenerConfiguracionBanda(valor);
        
        // Limpiar campos que no están permitidos
        const nuevosPuntos = { ...nuevosMiembros[index].puntos };
        if (!config.permiteElefantes) nuevosPuntos.elefantes = 0;
        if (!config.permiteCarros) nuevosPuntos.carros = 0;
        if (!config.permiteTambor) nuevosPuntos.tambor = 0;
        if (!config.permiteCuraids) nuevosPuntos.curaids = 0;
        if (!config.permitePerros) nuevosPuntos.perros = 0;
        if (!config.permiteBerserkers) nuevosPuntos.berserkers = 0;
        if (!permiteTipoTropa(config, 'guardias')) nuevosPuntos.guardias = 0;
        if (!permiteTipoTropa(config, 'guerreros')) nuevosPuntos.guerreros = 0;
        if (!permiteTipoTropa(config, 'levas')) nuevosPuntos.levas = 0;
        if (!permiteTipoTropa(config, 'mercenarios')) {
          nuevosPuntos.mercenarios = 0;
          nuevosMiembros[index].detalleMercenarios = "";
        }
        
        nuevosMiembros[index].puntos = nuevosPuntos;
        
        // Resetear sistemas especiales si cambia de banda
        if (!config.unidadesEspeciales || config.unidadesEspeciales.length === 0) {
          nuevosMiembros[index].unidadesEspeciales = {};
        }
        if (!config.tiposTropaPersonalizados) {
          nuevosMiembros[index].tiposTropaPersonalizados = {};
        }
        
        // Inicializar opciones de banda con valores por defecto
        if (config.opcionesBanda && config.opcionesBanda.length > 0) {
          const opcionesPorDefecto = {};
          config.opcionesBanda.forEach(opcion => {
            opcionesPorDefecto[opcion.id] = opcion.porDefecto || '';
          });
          nuevosMiembros[index].opcionesBanda = opcionesPorDefecto;
        } else {
          nuevosMiembros[index].opcionesBanda = {};
        }
      }
    }
    
    // Si cambia email, resetear validación
    if (campo === 'email') {
      nuevosMiembros[index].usuarioValido = null;
    }
    
    setMiembrosEquipo(nuevosMiembros);
  };

  const actualizarPuntos = (index, tipoPunto, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index].puntos[tipoPunto] = parseFloat(valor) || 0;
    
    // Si mercenarios = 0, limpiar detalle
    if (tipoPunto === 'mercenarios' && parseFloat(valor) === 0) {
      nuevosMiembros[index].detalleMercenarios = "";
    }
    
    setMiembrosEquipo(nuevosMiembros);
  };

  const actualizarUnidadEspecial = (index, nombreUnidad, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index].unidadesEspeciales[nombreUnidad] = parseFloat(valor) || 0;
    setMiembrosEquipo(nuevosMiembros);
  };

  const actualizarOpcionBanda = (index, idOpcion, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index].opcionesBanda[idOpcion] = valor;
    setMiembrosEquipo(nuevosMiembros);
  };

  const actualizarTropaPersonalizada = (index, idTropa, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index].tiposTropaPersonalizados[idTropa] = parseFloat(valor) || 0;
    setMiembrosEquipo(nuevosMiembros);
  };

  const marcarComoCapitan = (index) => {
    const nuevosMiembros = miembrosEquipo.map((miembro, i) => ({
      ...miembro,
      esCapitan: i === index
    }));
    setMiembrosEquipo(nuevosMiembros);
  };

  const verificarUsuario = async (email, index) => {
    if (!email || !email.includes('@')) return;

    try {
      const resultado = await usuarioApi.verificarUsuario(email);
      
      if (resultado.existe && resultado.usuario) {
        if (!miembrosEquipo[index].nombre.trim()) {
          actualizarMiembro(index, 'nombre', 
            `${resultado.usuario.nombre} ${resultado.usuario.apellidos || ''}`.trim()
          );
        }
        actualizarMiembro(index, 'usuarioValido', true);
      } else {
        actualizarMiembro(index, 'usuarioValido', false);
        if (modoEdicion) {
          setError(`El usuario ${email} no está registrado. En modo edición solo puedes agregar usuarios ya registrados.`);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      actualizarMiembro(index, 'usuarioValido', false);
    }
  };

  const calcularTotalPuntos = (miembro) => {
    const config = miembro.banda ? obtenerConfiguracionBanda(miembro.banda) : null;
    
    // Si usa tipos personalizados (Edad de la Magia)
    if (config && config.tiposTropaPersonalizados) {
      let total = 0;
      Object.keys(miembro.tiposTropaPersonalizados).forEach(idTropa => {
        const cantidad = miembro.tiposTropaPersonalizados[idTropa];
        const tipoConfig = config.tiposTropaPersonalizados.find(t => t.id === idTropa);
        if (tipoConfig) {
          total += cantidad * tipoConfig.puntos;
        }
      });
      return total;
    }
    
    // Bandas normales
    const totalUnidadesEspeciales = Object.values(miembro.unidadesEspeciales || {}).reduce((acc, val) => acc + val, 0);
    
    return miembro.puntos.guardias + miembro.puntos.guerreros + miembro.puntos.levas + 
           miembro.puntos.mercenarios + miembro.puntos.elefantes + miembro.puntos.carros + 
           miembro.puntos.tambor + miembro.puntos.curaids + miembro.puntos.perros + 
           miembro.puntos.berserkers + totalUnidadesEspeciales;
  };

  const validarPuntosMiembro = (miembro) => {
    const total = calcularTotalPuntos(miembro);
    return Math.abs(total - puntosMaximos) < 0.01;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!nombreEquipo.trim()) {
      setError("Debes ingresar un nombre para el equipo");
      return;
    }

    if (!jugadoresPorEquipo) {
      setError("Error: El torneo no tiene configurado el número de jugadores por equipo");
      return;
    }

    // Solo validar nombre, email y época (banda y puntos son opcionales)
    const miembrosValidos = miembrosEquipo.filter(
      m => m.nombre.trim() && m.email.trim() && m.epoca
    );
    
    if (miembrosValidos.length !== jugadoresPorEquipo) {
      setError(`El equipo debe tener exactamente ${jugadoresPorEquipo} jugadores (incluyéndote). Actualmente tienes ${miembrosValidos.length}.`);
      return;
    }

    // Solo validar puntos si el miembro tiene banda seleccionada
    const miembrosConBanda = miembrosValidos.filter(m => m.banda && m.banda.trim());
    const miembrosSinPuntosCorrectos = miembrosConBanda.filter(m => !validarPuntosMiembro(m));
    
    if (miembrosSinPuntosCorrectos.length > 0) {
      setError(`Los jugadores con banda seleccionada deben tener exactamente ${puntosMaximos} puntos distribuidos`);
      return;
    }

    // Validar opciones de banda obligatorias
    for (const miembro of miembrosConBanda) {
      const config = obtenerConfiguracionBanda(miembro.banda);
      if (config.opcionesBanda && config.opcionesBanda.length > 0) {
        for (const opcion of config.opcionesBanda) {
          if (opcion.obligatorio && !miembro.opcionesBanda[opcion.id]) {
            setError(`${miembro.nombre} debe seleccionar: ${opcion.label}`);
            return;
          }
        }
      }
    }

    // Solo validar mercenarios si hay banda
    for (const miembro of miembrosValidos) {
      if (miembro.banda && miembro.puntos.mercenarios > 0 && !miembro.detalleMercenarios.trim()) {
        setError(`El jugador ${miembro.nombre} debe detallar sus mercenarios`);
        return;
      }
    }

    // Validar emails únicos
    const emails = miembrosValidos.map(m => m.email.toLowerCase());
    if (new Set(emails).size !== emails.length) {
      setError("No puede haber emails duplicados");
      return;
    }

    if (!miembrosValidos.some(m => m.esCapitan)) {
      setError("Debe haber un capitán");
      return;
    }

    try {
      setLoading(true);
      
      // Encontrar mis datos
      const misDatos = miembrosValidos.find(m => m.esYo);
      
      if (!misDatos) {
        setError("Error: No se encontraron tus datos en el equipo");
        return;
      }

      // Otros miembros (sin "yo")
      const otrosMiembros = miembrosValidos.filter(m => !m.esYo);
      
      const usuariosConEmail = otrosMiembros.filter(
        m => m.email && m.email.trim() !== ''
      );

      // ✅ Construir datos de inscripción dinámicamente
      const construirDatosMiembro = (m) => {
        const datos = {
          nombre: m.nombre.trim(),
          email: m.email.toLowerCase().trim(),
          epoca: m.epoca,
          banda: m.banda || null,
          esCapitan: m.esCapitan
        };

        // Solo incluir composición si hay banda
        if (m.banda) {
          const config = obtenerConfiguracionBanda(m.banda);
          
          if (config.tiposTropaPersonalizados) {
            // Edad de la Magia
            datos.tiposTropaPersonalizados = m.tiposTropaPersonalizados;
          } else {
            // Bandas normales
            datos.puntos = {};
            if (m.puntos.guardias > 0) datos.puntos.guardias = m.puntos.guardias;
            if (m.puntos.guerreros > 0) datos.puntos.guerreros = m.puntos.guerreros;
            if (m.puntos.levas > 0) datos.puntos.levas = m.puntos.levas;
            if (m.puntos.mercenarios > 0) datos.puntos.mercenarios = m.puntos.mercenarios;
            if (m.puntos.elefantes > 0) datos.puntos.elefantes = m.puntos.elefantes;
            if (m.puntos.carros > 0) datos.puntos.carros = m.puntos.carros;
            if (m.puntos.tambor > 0) datos.puntos.tambor = m.puntos.tambor;
            if (m.puntos.curaids > 0) datos.puntos.curaids = m.puntos.curaids;
            if (m.puntos.perros > 0) datos.puntos.perros = m.puntos.perros;
            if (m.puntos.berserkers > 0) datos.puntos.berserkers = m.puntos.berserkers;
            
            if (Object.keys(m.unidadesEspeciales || {}).length > 0) {
              datos.unidadesEspeciales = m.unidadesEspeciales;
            }
          }

          if (Object.keys(m.opcionesBanda || {}).length > 0) {
            datos.opcionesBanda = m.opcionesBanda;
          }

          if (m.detalleMercenarios && m.detalleMercenarios.trim()) {
            datos.detalleMercenarios = m.detalleMercenarios;
          }
        }

        return datos;
      };

      const inscripcionData = {
        nombreEquipo: nombreEquipo.trim(),
        miembros: modoEdicion 
          ? miembrosValidos.map(construirDatosMiembro)
          : otrosMiembros.map(construirDatosMiembro)
      };

      // En modo creación, añadir mis propios datos
      if (!modoEdicion) {
        const misDatosEnviar = construirDatosMiembro(misDatos);
        inscripcionData.miEpoca = misDatos.epoca;
        inscripcionData.miBanda = misDatos.banda || null;
        
        if (misDatos.banda) {
          const config = obtenerConfiguracionBanda(misDatos.banda);
          
          if (config.tiposTropaPersonalizados) {
            inscripcionData.misTiposTropaPersonalizados = misDatos.tiposTropaPersonalizados;
          } else {
            inscripcionData.misPuntos = misDatosEnviar.puntos;
            if (misDatosEnviar.unidadesEspeciales) {
              inscripcionData.misUnidadesEspeciales = misDatosEnviar.unidadesEspeciales;
            }
          }
          
          if (misDatosEnviar.opcionesBanda) {
            inscripcionData.misOpcionesBanda = misDatosEnviar.opcionesBanda;
          }
          
          if (misDatosEnviar.detalleMercenarios) {
            inscripcionData.miDetalleMercenarios = misDatosEnviar.detalleMercenarios;
          }
        }
      }

      let resultado;
      
      if (modoEdicion) {
        resultado = await torneosSagaApi.actualizarInscripcionEquipos(torneoId, inscripcionData);
        alert("✅ Equipo actualizado correctamente");
      } else {
        resultado = await torneosSagaApi.IncripcionEquipo(torneoId, inscripcionData);
        
        // Mensaje mejorado con info de invitaciones
        if (usuariosConEmail.length > 0) {
          alert(
            `✅ Equipo inscrito correctamente\n\n` +
            `📧 Se han enviado ${usuariosConEmail.length} invitación(es) por email:\n` +
            usuariosConEmail.map(m => `• ${m.nombre} (${m.email})`).join('\n') +
            `\n\nLos jugadores recibirán instrucciones para completar su registro.`
          );
        } else {
          alert("✅ Equipo inscrito correctamente");
        }
      }
      
      if (resultado.success) {
        navigate('/');
      }
      
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || "Error al procesar la inscripción");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="inscripcion-container">
      
      <h1>
        {modoEdicion ? '✏️ Editar Equipo' : '👥 Inscribir Equipo'}: {torneo?.nombre_torneo}
      </h1>
      
      {/* Mensaje informativo principal */}
      <div className="info-message info-equipos">
        ℹ️ Cada jugador debe seleccionar su época. La banda y los puntos son opcionales, pero si se elige banda, los puntos deben sumar {puntosMaximos}.
      </div>

      {/* Aviso sobre invitaciones automáticas */}
      <div className="info-message info-invitaciones" style={{ 
        backgroundColor: '#e0f2fe', 
        borderLeft: '4px solid #0284c7',
        marginTop: '1rem'
      }}>
        📧 Los jugadores no registrados recibirán automáticamente un email de invitación para completar su registro en la plataforma.
      </div>

      <form onSubmit={handleSubmit} className="inscripcion-form">
        
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="form-group">
          <label htmlFor="nombreEquipo">Nombre del Equipo *</label>
          <input
            type="text"
            id="nombreEquipo"
            value={nombreEquipo}
            onChange={(e) => setNombreEquipo(e.target.value)}
            placeholder="Ej: Los Guerreros del Norte"
            required
            disabled={loading}
            maxLength={50}
          />
        </div>

        <section className="miembros-section">
          <div className="miembros-header">
            <h3>Jugadores ({miembrosEquipo.length}/{jugadoresPorEquipo})</h3>
            {miembrosEquipo.length < jugadoresPorEquipo && (
              <button 
                type="button" 
                onClick={agregarMiembro}
                className="btn-agregar"
                disabled={loading}
              >
                ➕ Agregar
              </button>
            )}
          </div>

          <div className="miembros-lista">
            {miembrosEquipo.map((miembro, index) => {
              const totalPuntos = calcularTotalPuntos(miembro);
              const puntosCorrectos = Math.abs(totalPuntos - puntosMaximos) < 0.01;
              
              // ✅ Obtener configuración de la banda seleccionada
              const configuracionBanda = miembro.banda 
                ? obtenerConfiguracionBanda(miembro.banda)
                : null;
              
              // ✅ Bandas disponibles para su época
              const bandasDisponibles = miembro.epoca 
                ? todasLasBandas.filter(b => mapaBandaAEpoca[b.nombre] === miembro.epoca)
                : [];

              // ✅ Permisos
              const permiteElefantes = configuracionBanda?.permiteElefantes || false;
              const permiteCarros = configuracionBanda?.permiteCarros || false;
              const permiteTambor = configuracionBanda?.permiteTambor || false;
              const permiteCuraids = configuracionBanda?.permiteCuraids || false;
              const permitePerros = configuracionBanda?.permitePerros || false;
              const permiteBerserkers = configuracionBanda?.permiteBerserkers || false;
              const tieneUnidadesEspeciales = configuracionBanda?.unidadesEspeciales?.length > 0;
              const tieneOpcionesBanda = configuracionBanda?.opcionesBanda?.length > 0;
              const usaTiposTropaPersonalizados = configuracionBanda?.tiposTropaPersonalizados !== null;
              
              const permiteGuardias = permiteTipoTropa(configuracionBanda || {}, 'guardias');
              const permiteGuerreros = permiteTipoTropa(configuracionBanda || {}, 'guerreros');
              const permiteLevas = permiteTipoTropa(configuracionBanda || {}, 'levas');
              const permiteMercenarios = permiteTipoTropa(configuracionBanda || {}, 'mercenarios');

              return (
                <div key={index} className="miembro-item">
                  <div className="miembro-header-row">
                    <div className="miembro-numero">
                      {miembro.esYo ? '👤 Tú' : `Jugador ${index + 1}`}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => marcarComoCapitan(index)}
                      className={`btn-capitan ${miembro.esCapitan ? 'activo' : ''}`}
                      disabled={loading}
                    >
                      {miembro.esCapitan ? '👑 Capitán' : 'Hacer Capitán'}
                    </button>
                  </div>
                  
                  <div className="miembro-campos">
                    {/* NOMBRE */}
                    <div className="form-group">
                      <label htmlFor={`nombre-${index}`}>Nombre *</label>
                      <input
                        type="text"
                        id={`nombre-${index}`}
                        value={miembro.nombre}
                        onChange={(e) => actualizarMiembro(index, 'nombre', e.target.value)}
                        required
                        disabled={loading || miembro.esYo}
                        placeholder="Nombre completo del jugador"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="form-group">
                      <label htmlFor={`email-${index}`}>Email *</label>
                      <div className="input-con-badge">
                        <input
                          type="email"
                          id={`email-${index}`}
                          value={miembro.email}
                          onChange={(e) => actualizarMiembro(index, 'email', e.target.value)}
                          onBlur={() => !miembro.esYo && verificarUsuario(miembro.email, index)}
                          required
                          disabled={loading || miembro.esYo}
                          placeholder="email@ejemplo.com"
                          className={
                            miembro.usuarioValido === false ? 'input-error' :
                            miembro.usuarioValido === true ? 'input-success' : ''
                          }
                        />
                        {!miembro.esYo && miembro.email && miembro.estadoCuenta === 'pendiente_registro' && (
                          <span 
                            className="badge-registro pendiente" 
                            title="Usuario invitado, pendiente de registro"
                          >
                            ⏳ Pendiente de registro
                          </span>
                        )}

                        {!miembro.esYo && miembro.email && miembro.estadoCuenta === 'activo' && (
                          <span className="badge-registro registrado">
                            ✅ Registrado
                          </span>
                        )}
                      </div>
                      {!miembro.esYo && miembro.usuarioValido === false && miembro.email && (
                        <small style={{ 
                          color: '#0284c7', 
                          fontSize: '0.85rem', 
                          marginTop: '0.25rem', 
                          display: 'block',
                          fontWeight: '500'
                        }}>
                          📧 Se le enviará un email automáticamente para que complete su registro
                        </small>
                      )}
                    </div>

                    {/* ÉPOCA */}
                    <div className="form-group">
                      <label htmlFor={`epoca-${index}`}>
                        Época *
                        <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                          ({epocasArray.length} disponible{epocasArray.length !== 1 ? 's' : ''})
                        </span>
                      </label>
                      <select
                        id={`epoca-${index}`}
                        value={miembro.epoca}
                        onChange={(e) => actualizarMiembro(index, 'epoca', e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">-- Selecciona época --</option>
                        {epocasArray.length === 0 ? (
                          <option value="" disabled>⚠️ No hay épocas disponibles</option>
                        ) : (
                          epocasArray.map((epoca, i) => (
                            <option key={i} value={epoca}>
                              {epoca}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* BANDA - OPCIONAL */}
                    {miembro.epoca && (
                      <div className="form-group">
                        <label htmlFor={`banda-${index}`}>
                          Banda (Opcional) ({miembro.epoca})
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                            ({bandasDisponibles.length} disponible{bandasDisponibles.length !== 1 ? 's' : ''})
                          </span>
                        </label>
                        <select
                          id={`banda-${index}`}
                          value={miembro.banda}
                          onChange={(e) => actualizarMiembro(index, 'banda', e.target.value)}
                          disabled={loading}
                        >
                          <option value="">-- Selecciona banda (opcional) --</option>
                          {bandasDisponibles.length === 0 ? (
                            <option value="" disabled>⚠️ No hay bandas para esta época</option>
                          ) : (
                            bandasDisponibles.map((banda, i) => (
                              <option key={i} value={banda.nombre}>
                                {banda.nombre}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    {/* ✅ OPCIONES DE BANDA (ej: Tipo de Warlord) */}
                    {miembro.banda && tieneOpcionesBanda && (
                      <div className="opciones-banda-mini">
                        <h4>Configuración de la Banda</h4>
                        {configuracionBanda.opcionesBanda.map((opcion) => (
                          <div key={opcion.id} className="form-group">
                            <label htmlFor={`${opcion.id}-${index}`}>
                              {opcion.label}
                              {opcion.obligatorio && <span style={{ color: 'red' }}> *</span>}
                            </label>
                            {opcion.tipo === 'select' && (
                              <select
                                id={`${opcion.id}-${index}`}
                                value={miembro.opcionesBanda[opcion.id] || ''}
                                onChange={(e) => actualizarOpcionBanda(index, opcion.id, e.target.value)}
                                disabled={loading}
                                required={opcion.obligatorio}
                              >
                                <option value="">-- Seleccionar --</option>
                                {opcion.opciones.map((opt) => (
                                  <option key={opt.valor} value={opt.valor}>
                                    {opt.nombre}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DISTRIBUCIÓN DE PUNTOS - Solo si hay BANDA */}
                    {miembro.banda && (
                      <div className="puntos-banda-section">
                        <h4>Distribución de Puntos</h4>
                        <p className="puntos-info">
                          Total: <strong>{totalPuntos.toFixed(1)}</strong> / {puntosMaximos}
                          {!puntosCorrectos && (
                            <span className="puntos-error">
                              {totalPuntos < puntosMaximos 
                                ? ` ⚠️ Faltan ${(puntosMaximos - totalPuntos).toFixed(1)}`
                                : ` ⚠️ Excede por ${(totalPuntos - puntosMaximos).toFixed(1)}`
                              }
                            </span>
                          )}
                          {puntosCorrectos && <span className="puntos-ok"> ✅</span>}
                        </p>

                        <div className="puntos-grid-mini">
                          {/* ========================================
                              EDAD DE LA MAGIA - TIPOS PERSONALIZADOS
                              ======================================== */}
                          {usaTiposTropaPersonalizados ? (
                            <>
                              {configuracionBanda.tiposTropaPersonalizados.map((tipo) => (
                                <div key={tipo.id} className="punto-item-mini">
                                  <label htmlFor={`${tipo.id}-${index}`}>
                                    {tipo.label}
                                    <small style={{ fontSize: '0.75rem', color: '#666', padding: '0.25rem' }}>
                                      ({tipo.puntos} pts c/u)
                                    </small>
                                  </label>
                                  <input
                                    type="number"
                                    id={`${tipo.id}-${index}`}
                                    value={miembro.tiposTropaPersonalizados[tipo.id] || 0}
                                    onChange={(e) => actualizarTropaPersonalizada(index, tipo.id, e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step={tipo.step || 0.5}
                                    disabled={loading}
                                  />
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              {/* ========================================
                                  BANDAS NORMALES - TIPOS ESTÁNDAR
                                  ======================================== */}
                              
                              {/* GUARDIAS */}
                              {permiteGuardias && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`guardias-${index}`}>Guardias</label>
                                  <input
                                    type="number"
                                    id={`guardias-${index}`}
                                    value={miembro.puntos.guardias}
                                    onChange={(e) => actualizarPuntos(index, 'guardias', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* BERSERKERS */}
                              {permiteBerserkers && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`berserkers-${index}`}>Berserkers</label>
                                  <input
                                    type="number"
                                    id={`berserkers-${index}`}
                                    value={miembro.puntos.berserkers}
                                    onChange={(e) => actualizarPuntos(index, 'berserkers', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="1"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* ELEFANTES */}
                              {permiteElefantes && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`elefantes-${index}`}>Elefantes </label>
                                  <input
                                    type="number"
                                    id={`elefantes-${index}`}
                                    value={miembro.puntos.elefantes}
                                    onChange={(e) => actualizarPuntos(index, 'elefantes', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="1"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* CARROS */}
                              {permiteCarros && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`carros-${index}`}>Carros </label>
                                  <input
                                    type="number"
                                    id={`carros-${index}`}
                                    value={miembro.puntos.carros}
                                    onChange={(e) => actualizarPuntos(index, 'carros', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="1"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* TAMBOR */}
                              {permiteTambor && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`tambor-${index}`}>Tambor </label>
                                  <input
                                    type="number"
                                    id={`tambor-${index}`}
                                    value={miembro.puntos.tambor}
                                    onChange={(e) => actualizarPuntos(index, 'tambor', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="1"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* CURAIDS */}
                              {permiteCuraids && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`curaids-${index}`}>Curaids </label>
                                  <input
                                    type="number"
                                    id={`curaids-${index}`}
                                    value={miembro.puntos.curaids}
                                    onChange={(e) => actualizarPuntos(index, 'curaids', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* PERROS */}
                              {permitePerros && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`perros-${index}`}>Perros de Guerra</label>
                                  <input
                                    type="number"
                                    id={`perros-${index}`}
                                    value={miembro.puntos.perros}
                                    onChange={(e) => actualizarPuntos(index, 'perros', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* ✅ UNIDADES ESPECIALES DINÁMICAS */}
                              {tieneUnidadesEspeciales && configuracionBanda.unidadesEspeciales.map((unidad) => (
                                <div key={unidad.nombre} className="punto-item-mini">
                                  <label htmlFor={`${unidad.nombre}-${index}`}>
                                    {unidad.label}
                                    <small style={{ fontSize: '0.75rem', color: '#666', padding: '0.25rem' }}>
                                      ({unidad.puntos} pts c/u)
                                    </small>
                                  </label>
                                  <input
                                    type="number"
                                    id={`${unidad.nombre}-${index}`}
                                    value={miembro.unidadesEspeciales[unidad.nombre] || 0}
                                    onChange={(e) => actualizarUnidadEspecial(index, unidad.nombre, e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step={unidad.step || 0.5}
                                    disabled={loading}
                                  />
                                </div>
                              ))}

                              {/* GUERREROS */}
                              {permiteGuerreros && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`guerreros-${index}`}>Guerreros</label>
                                  <input
                                    type="number"
                                    id={`guerreros-${index}`}
                                    value={miembro.puntos.guerreros}
                                    onChange={(e) => actualizarPuntos(index, 'guerreros', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* LEVAS */}
                              {permiteLevas && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`levas-${index}`}>Levas</label>
                                  <input
                                    type="number"
                                    id={`levas-${index}`}
                                    value={miembro.puntos.levas}
                                    onChange={(e) => actualizarPuntos(index, 'levas', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>
                              )}

                              {/* MERCENARIOS */}
                              {permiteMercenarios && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`mercenarios-${index}`}>Mercenarios</label>
                                  <input
                                    type="number"
                                    id={`mercenarios-${index}`}
                                    value={miembro.puntos.mercenarios}
                                    onChange={(e) => actualizarPuntos(index, 'mercenarios', e.target.value)}
                                    min="0"
                                    max={puntosMaximos}
                                    step="0.5"
                                    disabled={loading}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* DETALLE MERCENARIOS */}
                        {miembro.puntos.mercenarios > 0 && permiteMercenarios && !usaTiposTropaPersonalizados && (
                          <div className="form-group">
                            <label htmlFor={`detalle-merc-${index}`}>Detalle Mercenarios *</label>
                            <textarea
                              id={`detalle-merc-${index}`}
                              value={miembro.detalleMercenarios}
                              onChange={(e) => actualizarMiembro(index, 'detalleMercenarios', e.target.value)}
                              placeholder="Ej: Arqueros Cretenses, Caballería Numida..."
                              rows="2"
                              required
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!miembro.esYo && (
                    <button
                      type="button"
                      onClick={() => eliminarMiembro(index)}
                      className="btn-eliminar"
                      disabled={loading}
                      title="Eliminar jugador"
                    >
                      🗑️ 
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Procesando...' : (modoEdicion ? '✅ Guardar Cambios' : '✅ Inscribir Equipo')}
          </button>

          {modoEdicion && (
            <button 
              type="button" 
              className="btn-danger" 
              onClick={eliminarInscripcionEquipo}
              disabled={loading}
            >
              🗑️ Eliminar Inscripción
            </button>
          )}
          
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate(-1)} 
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}

export default InscripcionSagaEquipos;