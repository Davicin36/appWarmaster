import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { torneosSagaApi } from '@/servicios/apiSaga';
import { usuarioApi } from '@/servicios/apiUsuarios';
import { 
  PUNTOS_BANDA_RANGO,
  procesarEpocasYBandas,
  obtenerConfiguracionBanda,
  permiteTipoTropa,
  obtenerOpcionesWarlordLegendario,
  obtenerInfoCompletaWarlord,
  calcularPuntosDisponibles,
  validarComposicionBanda
} from '../funcionesSaga/constantesFuncionesSaga';
import Footer from '@/paginas/Footer.jsx'

import '@/estilos/inscripcionesEquipo.css';

// ==========================================
// ESTADO INICIAL DE UN MIEMBRO
// ==========================================
const miembroVacio = (overrides = {}) => ({
  nombre: "",
  email: "",
  epoca: "",
  banda: "",
  warlordSeleccionado: null,
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
    cerdos: 0,
  },
  unidadesEspeciales: {},
  opcionesBanda: {},
  tiposTropaPersonalizados: {},
  detalleMercenarios: "",
  esCapitan: false,
  esYo: false,
  usuarioValido: null,
  ...overrides
});

function InscripcionSagaEquipos({ torneoId, torneo, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const modoEdicion = location.pathname.includes('editar-inscripcion');
  
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [equipoId, setEquipoId] = useState(null);
  const [miembrosEquipo, setMiembrosEquipo] = useState([
    miembroVacio({
      nombre: `${user?.nombre} ${user?.apellidos}`,
      email: user?.email,
      esCapitan: true,
      esYo: true,
      usuarioValido: true
    })
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
  // CARGAR EQUIPO EXISTENTE (MODO EDICIÓN)
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
                warlordSeleccionado: composicion.warlordLegendario?.valor || null,
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
                  cerdos: parseFloat(composicion.cerdos || 0),
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
      setMiembrosEquipo([...miembrosEquipo, miembroVacio()]);
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
      setMiembrosEquipo(miembrosEquipo.filter((_, i) => i !== index));
      setError("");
    }
  };

  const eliminarInscripcionEquipo = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar la inscripción de tu equipo?')) return;
    if (!equipoId) { setError("No se pudo obtener el ID del equipo"); return; }
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
    
    if (campo === 'epoca') {
      nuevosMiembros[index].banda = "";
      nuevosMiembros[index].warlordSeleccionado = null;
      nuevosMiembros[index].puntos = {
        guardias: 0, guerreros: 0, levas: 0, mercenarios: 0,
        elefantes: 0, carros: 0, tambor: 0, curaids: 0,
        perros: 0, berserkers: 0, cerdos: 0,
      };
      nuevosMiembros[index].unidadesEspeciales = {};
      nuevosMiembros[index].opcionesBanda = {};
      nuevosMiembros[index].tiposTropaPersonalizados = {};
      nuevosMiembros[index].detalleMercenarios = "";
    }
    
    if (campo === 'banda') {
      nuevosMiembros[index].warlordSeleccionado = null;
      if (!valor) {
        nuevosMiembros[index].puntos = {
          guardias: 0, guerreros: 0, levas: 0, mercenarios: 0,
          elefantes: 0, carros: 0, tambor: 0, curaids: 0,
          perros: 0, berserkers: 0, cerdos: 0,
        };
        nuevosMiembros[index].unidadesEspeciales = {};
        nuevosMiembros[index].opcionesBanda = {};
        nuevosMiembros[index].tiposTropaPersonalizados = {};
        nuevosMiembros[index].detalleMercenarios = "";
      } else {
        const config = obtenerConfiguracionBanda(valor);
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
        // Limpiar cerdos si la nueva banda no es Aníbal
        if (config.epoca !== 'Ánibal') nuevosPuntos.cerdos = 0;
        
        nuevosMiembros[index].puntos = nuevosPuntos;
        if (!config.unidadesEspeciales || config.unidadesEspeciales.length === 0) {
          nuevosMiembros[index].unidadesEspeciales = {};
        }
        if (!config.tiposTropaPersonalizados) {
          nuevosMiembros[index].tiposTropaPersonalizados = {};
        }
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
    
    if (campo === 'email') {
      nuevosMiembros[index].usuarioValido = null;
    }
    
    setMiembrosEquipo(nuevosMiembros);
  };

  // ✅ HANDLER WARLORD POR MIEMBRO
  const actualizarWarlord = (index, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    const valorFinal = valor || null;
    nuevosMiembros[index].warlordSeleccionado = valorFinal;

    if (valorFinal) {
      const nuevaInfo = obtenerInfoCompletaWarlord(
        nuevosMiembros[index].epoca,
        nuevosMiembros[index].banda,
        valorFinal
      );
      if (nuevaInfo.restricciones.prohibido.length > 0) {
        const nuevosPuntos = { ...nuevosMiembros[index].puntos };
        let cambios = false;
        nuevaInfo.restricciones.prohibido.forEach(tipo => {
          if (nuevosPuntos[tipo] > 0) {
            nuevosPuntos[tipo] = 0;
            cambios = true;
          }
        });
        if (cambios) {
          nuevosMiembros[index].puntos = nuevosPuntos;
          setTimeout(() => {
            alert(`⚠️ Algunas unidades de ${nuevosMiembros[index].nombre} han sido reseteadas por restricciones del warlord`);
          }, 100);
        }
      }
    }

    setMiembrosEquipo(nuevosMiembros);
  };

  const actualizarPuntos = (index, tipoPunto, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index].puntos[tipoPunto] = parseFloat(valor) || 0;
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
    setMiembrosEquipo(miembrosEquipo.map((miembro, i) => ({
      ...miembro,
      esCapitan: i === index
    })));
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

  // ==========================================
  // CÁLCULO DE PUNTOS
  // ==========================================
  const calcularTotalPuntos = (miembro) => {
    const config = miembro.banda ? obtenerConfiguracionBanda(miembro.banda) : null;
    if (config && config.tiposTropaPersonalizados) {
      let total = 0;
      Object.keys(miembro.tiposTropaPersonalizados).forEach(idTropa => {
        const cantidad = miembro.tiposTropaPersonalizados[idTropa];
        const tipoConfig = config.tiposTropaPersonalizados.find(t => t.id === idTropa);
        if (tipoConfig) total += cantidad * tipoConfig.puntos;
      });
      return total;
    }
    const totalUnidadesEspeciales = Object.values(miembro.unidadesEspeciales || {})
      .reduce((acc, val) => acc + val, 0);
    return miembro.puntos.guardias + miembro.puntos.guerreros + miembro.puntos.levas +
           miembro.puntos.mercenarios + miembro.puntos.elefantes + miembro.puntos.carros +
           miembro.puntos.tambor + miembro.puntos.curaids + miembro.puntos.perros +
           miembro.puntos.berserkers + miembro.puntos.cerdos + totalUnidadesEspeciales;
  };

  // ✅ Puntos máximos por miembro, descontando coste del warlord
  const calcularPuntosMaximosMiembro = (miembro) => {
    if (!miembro.banda || !miembro.epoca) return puntosMaximos;
    return calcularPuntosDisponibles(
      puntosMaximos,
      miembro.epoca,
      miembro.banda,
      miembro.warlordSeleccionado
    );
  };

  const validarPuntosMiembro = (miembro) => {
    const total = calcularTotalPuntos(miembro);
    const maximos = calcularPuntosMaximosMiembro(miembro);
    return Math.abs(total - maximos) < 0.01;
  };

  // ==========================================
  // CONSTRUIR DATOS DE MIEMBRO PARA ENVÍO
  // ==========================================
  const construirDatosMiembro = (m) => {
    const datos = {
      nombre: m.nombre.trim(),
      email: m.email.toLowerCase().trim(),
      epoca: m.epoca,
      banda: m.banda || null,
      esCapitan: m.esCapitan
    };

    if (m.banda) {
      const config = obtenerConfiguracionBanda(m.banda);

      // ✅ Warlord legendario
      if (m.warlordSeleccionado) {
        const opcionesWarlord = obtenerOpcionesWarlordLegendario(
          m.epoca,
          m.banda
        );
        const opcionWarlord = opcionesWarlord?.opciones.find(
          o => o.valor === m.warlordSeleccionado
        );
        if (opcionWarlord) {
          datos.warlordLegendario = {
            valor: m.warlordSeleccionado,
            nombre: opcionWarlord.nombre,
            costePuntos: opcionWarlord.costePuntos,
            bandaDesbloqueada: opcionWarlord.bandaDesbloqueada || null
          };
        }
      }

      if (config.tiposTropaPersonalizados) {
        datos.tiposTropaPersonalizados = m.tiposTropaPersonalizados;
      } else {
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
        if (m.puntos.cerdos > 0) datos.puntos.cerdos = m.puntos.cerdos;
        if (Object.keys(m.unidadesEspeciales || {}).length > 0) {
          datos.unidadesEspeciales = m.unidadesEspeciales;
        }
      }

      if (Object.keys(m.opcionesBanda || {}).length > 0) {
        datos.opcionesBanda = m.opcionesBanda;
      }
      if (m.detalleMercenarios?.trim()) {
        datos.detalleMercenarios = m.detalleMercenarios;
      }
    }

    return datos;
  };

  // ==========================================
  // SUBMIT
  // ==========================================
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

    const miembrosValidos = miembrosEquipo.filter(
      m => m.nombre.trim() && m.email.trim() && m.epoca
    );
    
    if (miembrosValidos.length !== jugadoresPorEquipo) {
      setError(`El equipo debe tener exactamente ${jugadoresPorEquipo} jugadores. Actualmente tienes ${miembrosValidos.length}.`);
      return;
    }

    const miembrosConBanda = miembrosValidos.filter(m => m.banda && m.banda.trim());
    const miembrosSinPuntosCorrectos = miembrosConBanda.filter(m => !validarPuntosMiembro(m));
    if (miembrosSinPuntosCorrectos.length > 0) {
      const nombres = miembrosSinPuntosCorrectos.map(m => m.nombre).join(', ');
      setError(`Puntos incorrectos en: ${nombres}. Revisa el coste del warlord si aplica.`);
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

    // Validar restricciones del warlord por miembro
    for (const miembro of miembrosConBanda) {
      if (miembro.warlordSeleccionado) {
        const infoWarlord = obtenerInfoCompletaWarlord(
          miembro.epoca,
          miembro.banda,
          miembro.warlordSeleccionado
        );
        const composicionActual = {
          elefantes: miembro.puntos.elefantes,
          carros: miembro.puntos.carros,
          levas: miembro.puntos.levas,
          guardias: miembro.puntos.guardias,
          guerreros: miembro.puntos.guerreros,
          mercenarios: miembro.puntos.mercenarios
        };
        const validacion = validarComposicionBanda(composicionActual, infoWarlord.restricciones);
        if (!validacion.valido) {
          setError(`${miembro.nombre} - Restricciones del warlord: ${validacion.errores.join(', ')}`);
          return;
        }
      }
    }

    // Validar mercenarios con detalle
    for (const miembro of miembrosValidos) {
      if (miembro.banda && miembro.puntos.mercenarios > 0 && !miembro.detalleMercenarios.trim()) {
        setError(`${miembro.nombre} debe detallar sus mercenarios`);
        return;
      }
    }

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
      
      const misDatos = miembrosValidos.find(m => m.esYo);
      if (!misDatos) {
        setError("Error: No se encontraron tus datos en el equipo");
        return;
      }

      const otrosMiembros = miembrosValidos.filter(m => !m.esYo);
      const usuariosConEmail = otrosMiembros.filter(m => m.email && m.email.trim() !== '');

      const inscripcionData = {
        nombreEquipo: nombreEquipo.trim(),
        miembros: modoEdicion
          ? miembrosValidos.map(construirDatosMiembro)
          : otrosMiembros.map(construirDatosMiembro)
      };

      // En modo creación, añadir datos propios del capitán por separado
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
          // ✅ Warlord del capitán
          if (misDatosEnviar.warlordLegendario) {
            inscripcionData.miWarlordLegendario = misDatosEnviar.warlordLegendario;
          }
        }
      }

      let resultado;
      if (modoEdicion) {
        resultado = await torneosSagaApi.actualizarInscripcionEquipos(torneoId, inscripcionData);
        alert("✅ Equipo actualizado correctamente");
      } else {
        resultado = await torneosSagaApi.IncripcionEquipo(torneoId, inscripcionData);
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
      
      if (resultado.success) navigate('/');
      
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
      
      <div className="info-message info-equipos">
        ℹ️ Cada jugador debe seleccionar su época. La banda y los puntos son opcionales, pero si se elige banda, los puntos deben sumar correctamente (descontando el coste del warlord si aplica).
      </div>

      <div className="info-message info-invitaciones" style={{ 
        backgroundColor: '#e0f2fe', 
        borderLeft: '4px solid #0284c7',
        marginTop: '1rem'
      }}>
        📧 Los jugadores no registrados recibirán automáticamente un email de invitación.
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
              <button type="button" onClick={agregarMiembro} className="btn-agregar" disabled={loading}>
                ➕ Agregar
              </button>
            )}
          </div>

          <div className="miembros-lista">
            {miembrosEquipo.map((miembro, index) => {
              const configuracionBanda = miembro.banda
                ? obtenerConfiguracionBanda(miembro.banda)
                : null;

              const bandasDisponibles = miembro.epoca
                ? todasLasBandas.filter(b => mapaBandaAEpoca[b.nombre] === miembro.epoca)
                : [];

              // ✅ Info warlord por miembro — usar miembro.epoca (string limpia ej: "Ánibal")
              // NO usar torneo?.epocas_disponibles porque puede ser "Ánibal|Vikingos" y
              // obtenerUnidadesLegendarias solo maneja separador '/', no '|'
              const opcionesWarlordMiembro = miembro.banda && miembro.epoca && torneo?.unidades_legendarias === 1
                ? obtenerOpcionesWarlordLegendario(miembro.epoca, miembro.banda)
                : null;

              const infoWarlordMiembro = miembro.banda && miembro.epoca
                ? obtenerInfoCompletaWarlord(
                    miembro.epoca,
                    miembro.banda,
                    miembro.warlordSeleccionado
                  )
                : { tieneWarlord: false, costePuntos: 0, restricciones: { prohibido: [], mutuamenteExcluyentes: [] }, unidadesDesbloqueadas: [] };

              const puntosMaximosMiembro = calcularPuntosMaximosMiembro(miembro);
              const totalPuntos = calcularTotalPuntos(miembro);
              const puntosCorrectos = Math.abs(totalPuntos - puntosMaximosMiembro) < 0.01;

              const permiteElefantes = configuracionBanda?.permiteElefantes || false;
              const permiteCarros = configuracionBanda?.permiteCarros || false;
              const permiteTambor = configuracionBanda?.permiteTambor || false;
              const permiteCuraids = configuracionBanda?.permiteCuraids || false;
              const permitePerros = configuracionBanda?.permitePerros || false;
              const permiteBerserkers = configuracionBanda?.permiteBerserkers || false;
              const tieneOpcionesBanda = configuracionBanda?.opcionesBanda?.length > 0;
              const usaTiposTropaPersonalizados = configuracionBanda?.tiposTropaPersonalizados !== null && configuracionBanda?.tiposTropaPersonalizados !== undefined;
              const permiteGuardias = permiteTipoTropa(configuracionBanda || {}, 'guardias');
              const permiteGuerreros = permiteTipoTropa(configuracionBanda || {}, 'guerreros');
              const permiteLevas = permiteTipoTropa(configuracionBanda || {}, 'levas');
              const permiteMercenarios = permiteTipoTropa(configuracionBanda || {}, 'mercenarios');
              // ✅ Cerdos solo para Aníbal con legendarias activadas
              const permiteCerdos = configuracionBanda?.epoca === 'Ánibal' && torneo?.unidades_legendarias === 1;

              // ✅ Combinar unidades especiales base + desbloqueadas por warlord
              const unidadesEspecialesDisponibles = React.useMemo ? (() => {
                const base = configuracionBanda?.unidadesEspeciales || [];
                const desbloqueadas = infoWarlordMiembro.unidadesDesbloqueadas || [];
                const todas = [...base];
                desbloqueadas.forEach(u => {
                  if (!todas.find(b => b.nombre === u.nombre)) {
                    todas.push({ ...u, desbloquedaPorWarlord: true });
                  }
                });
                return todas;
              })() : (configuracionBanda?.unidadesEspeciales || []);

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
                            miembro.usuarioValido === false && modoEdicion ? 'input-error' :
                            miembro.usuarioValido === true ? 'input-success' : ''
                          }
                        />
                        {!miembro.esYo && miembro.estadoCuenta === 'pendiente_registro' && (
                          <span className="badge-registro pendiente" title="Pendiente de registro">
                            ⏳ Pendiente de registro
                          </span>
                        )}
                        {!miembro.esYo && miembro.estadoCuenta === 'activo' && (
                          <span className="badge-registro registrado">✅ Registrado</span>
                        )}
                      </div>
                      {!miembro.esYo && miembro.usuarioValido === false && miembro.email && !modoEdicion && (
                        <small style={{ color: '#0284c7', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>
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
                        {epocasArray.map((epoca, i) => (
                          <option key={i} value={epoca}>{epoca}</option>
                        ))}
                      </select>
                    </div>

                    {/* BANDA - OPCIONAL */}
                    {miembro.epoca && (
                      <div className="form-group">
                        <label htmlFor={`banda-${index}`}>
                          Banda (Opcional)
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
                          {bandasDisponibles.map((banda, i) => (
                            <option key={i} value={banda.nombre}>{banda.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* ✅ WARLORD LEGENDARIO POR MIEMBRO */}
                    {miembro.banda && opcionesWarlordMiembro && torneo?.unidades_legendarias === 1 && (
                      <div className="warlord-section">
                        <h4>⚔️ Warlord Legendario</h4>
                        <div className="form-group">
                          <label htmlFor={`warlord-${index}`}>
                            {opcionesWarlordMiembro.label}
                            {opcionesWarlordMiembro.obligatorio && <span style={{ color: 'red' }}> *</span>}
                          </label>
                          <select
                            id={`warlord-${index}`}
                            value={miembro.warlordSeleccionado || ''}
                            onChange={(e) => actualizarWarlord(index, e.target.value || null)}
                            disabled={loading}
                            required={opcionesWarlordMiembro.obligatorio}
                          >
                            <option value="">-- Sin warlord legendario --</option>
                            {opcionesWarlordMiembro.opciones.map((opcion) => (
                              <option key={opcion.valor} value={opcion.valor}>
                                {opcion.nombreCompleto}
                                {opcion.tieneBandaDesbloqueada && ` → ${opcion.bandaDesbloqueada}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {infoWarlordMiembro.tieneWarlord && (
                          <div className="info-warlord">
                            <p className="info-line">
                              <strong>Warlord:</strong> {infoWarlordMiembro.nombreWarlord}
                            </p>
                            <p className="info-line">
                              <strong>Coste:</strong> {infoWarlordMiembro.costePuntos} {infoWarlordMiembro.costePuntos === 1 ? 'punto' : 'puntos'}
                            </p>
                            {infoWarlordMiembro.tieneBandaDesbloqueada && (
                              <p className="info-line banda-desbloqueada">
                                ✨ <strong>Banda desbloqueada:</strong> {infoWarlordMiembro.nombreBandaFinal}
                              </p>
                            )}
                            <p className="info-line">
                              <strong>Puntos disponibles:</strong> {puntosMaximosMiembro}
                              <small className="puntos-detalle-small"> ({puntosMaximos} - {infoWarlordMiembro.costePuntos})</small>
                            </p>
                            {infoWarlordMiembro.restricciones.prohibido.length > 0 && (
                              <div className="restriccion-prohibido">
                                <strong>⛔ Prohibido:</strong> {infoWarlordMiembro.restricciones.prohibido.join(', ')}
                              </div>
                            )}
                            {infoWarlordMiembro.unidadesDesbloqueadas?.length > 0 && (
                              <div className="unidades-desbloqueadas">
                                <strong>✨ Unidades desbloqueadas:</strong>
                                <ul className="lista-unidades-desbloqueadas">
                                  {infoWarlordMiembro.unidadesDesbloqueadas.map((u, i) => (
                                    <li key={i}>{u.label || u.nombre}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* OPCIONES DE BANDA */}
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
                                  <option key={opt.valor} value={opt.valor}>{opt.nombre}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DISTRIBUCIÓN DE PUNTOS */}
                    {miembro.banda && (
                      <div className="puntos-banda-section">
                        <h4>Distribución de Puntos</h4>
                        <p className="puntos-info">
                          Total: <strong>{totalPuntos.toFixed(1)}</strong> / {puntosMaximosMiembro}
                          {miembro.warlordSeleccionado && infoWarlordMiembro.costePuntos > 0 && (
                            <small className="puntos-detalle-small">
                              {' '}({puntosMaximos} - {infoWarlordMiembro.costePuntos} warlord)
                            </small>
                          )}
                          {!puntosCorrectos && (
                            <span className="puntos-error">
                              {totalPuntos < puntosMaximosMiembro
                                ? ` ⚠️ Faltan ${(puntosMaximosMiembro - totalPuntos).toFixed(1)}`
                                : ` ⚠️ Excede por ${(totalPuntos - puntosMaximosMiembro).toFixed(1)}`
                              }
                            </span>
                          )}
                          {puntosCorrectos && <span className="puntos-ok"> ✅</span>}
                        </p>

                        <div className="puntos-grid-mini">
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
                                    type="number" inputMode="decimal"
                                    id={`${tipo.id}-${index}`}
                                    value={miembro.tiposTropaPersonalizados[tipo.id] || 0}
                                    onChange={(e) => actualizarTropaPersonalizada(index, tipo.id, e.target.value)}
                                    min="0" max={puntosMaximosMiembro}
                                    step={tipo.step || 0.5}
                                    disabled={loading}
                                  />
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              {permiteGuardias && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`guardias-${index}`}>Guardias</label>
                                  <input type="number" inputMode="decimal" id={`guardias-${index}`}
                                    value={miembro.puntos.guardias}
                                    onChange={(e) => actualizarPuntos(index, 'guardias', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="0.5" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteBerserkers && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`berserkers-${index}`}>Berserkers</label>
                                  <input type="number" inputMode="decimal" id={`berserkers-${index}`}
                                    value={miembro.puntos.berserkers}
                                    onChange={(e) => actualizarPuntos(index, 'berserkers', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="1" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteCerdos && (
                                <div className="punto-item-mini cerdos-legendario">
                                  <label htmlFor={`cerdos-${index}`}>🐷 Cerdos Incendiarios</label>
                                  <input type="number" inputMode="decimal" id={`cerdos-${index}`}
                                    value={miembro.puntos.cerdos}
                                    onChange={(e) => actualizarPuntos(index, 'cerdos', e.target.value)}
                                    min="0" max="1" step="1" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteElefantes && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`elefantes-${index}`}>Elefantes</label>
                                  <input type="number" inputMode="decimal" id={`elefantes-${index}`}
                                    value={miembro.puntos.elefantes}
                                    onChange={(e) => actualizarPuntos(index, 'elefantes', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="1" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteCarros && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`carros-${index}`}>Carros</label>
                                  <input type="number" inputMode="decimal" id={`carros-${index}`}
                                    value={miembro.puntos.carros}
                                    onChange={(e) => actualizarPuntos(index, 'carros', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="1" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteTambor && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`tambor-${index}`}>Tambor de Guerra</label>
                                  <input type="number" inputMode="decimal" id={`tambor-${index}`}
                                    value={miembro.puntos.tambor}
                                    onChange={(e) => actualizarPuntos(index, 'tambor', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="1" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteCuraids && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`curaids-${index}`}>Curaids</label>
                                  <input type="number" inputMode="decimal" id={`curaids-${index}`}
                                    value={miembro.puntos.curaids}
                                    onChange={(e) => actualizarPuntos(index, 'curaids', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="0.5" disabled={loading}
                                  />
                                </div>
                              )}
                              {permitePerros && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`perros-${index}`}>Perros de Guerra</label>
                                  <input type="number" inputMode="decimal" id={`perros-${index}`}
                                    value={miembro.puntos.perros}
                                    onChange={(e) => actualizarPuntos(index, 'perros', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="0.5" disabled={loading}
                                  />
                                </div>
                              )}
                              {/* ✅ Unidades especiales: base + desbloqueadas por warlord */}
                              {unidadesEspecialesDisponibles.length > 0 && unidadesEspecialesDisponibles.map((unidad) => {
                                const key = unidad.valor || unidad.nombre;
                                return (
                                  <div key={key} className={`punto-item-mini ${unidad.desbloquedaPorWarlord ? 'unidad-warlord' : ''}`}>
                                    <label htmlFor={`${key}-${index}`}>
                                      {unidad.desbloquedaPorWarlord && '✨ '}
                                      {unidad.label}
                                      <small style={{ fontSize: '0.75rem', color: '#666', padding: '0.25rem' }}>
                                        ({unidad.puntos} pts c/u)
                                      </small>
                                    </label>
                                    <input type="number" inputMode="decimal" id={`${key}-${index}`}
                                      value={miembro.unidadesEspeciales[key] || 0}
                                      onChange={(e) => actualizarUnidadEspecial(index, key, e.target.value)}
                                      min="0" max={puntosMaximosMiembro}
                                      step={unidad.step || 0.5}
                                      disabled={loading}
                                    />
                                  </div>
                                );
                              })}
                              {permiteGuerreros && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`guerreros-${index}`}>Guerreros</label>
                                  <input type="number" inputMode="decimal" id={`guerreros-${index}`}
                                    value={miembro.puntos.guerreros}
                                    onChange={(e) => actualizarPuntos(index, 'guerreros', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="0.5" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteLevas && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`levas-${index}`}>Levas</label>
                                  <input type="number" inputMode="decimal" id={`levas-${index}`}
                                    value={miembro.puntos.levas}
                                    onChange={(e) => actualizarPuntos(index, 'levas', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="0.5" disabled={loading}
                                  />
                                </div>
                              )}
                              {permiteMercenarios && (
                                <div className="punto-item-mini">
                                  <label htmlFor={`mercenarios-${index}`}>Mercenarios</label>
                                  <input type="number" inputMode="decimal" id={`mercenarios-${index}`}
                                    value={miembro.puntos.mercenarios}
                                    onChange={(e) => actualizarPuntos(index, 'mercenarios', e.target.value)}
                                    min="0" max={puntosMaximosMiembro} step="0.5" disabled={loading}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>

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
            <button type="button" className="btn-danger" onClick={eliminarInscripcionEquipo} disabled={loading}>
              🗑️ Eliminar Inscripción
            </button>
          )}
          
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}

export default InscripcionSagaEquipos;