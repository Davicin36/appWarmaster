// componentesSaga/inscripciones/inscripcionSagaIndividual.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  sonMutuamenteExcluyentes
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import Footer from '@/paginas/Footer.jsx'
import '@/estilos/inscripcion.css';

function InscripcionSagaIndividual({ torneoId, torneo, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const modoEdicion = location.pathname.includes('editar-inscripcion') || location.pathname.includes('actualizarInscripcion');
  
  // ==========================================
  // ESTADOS
  // ==========================================
  const [epocaSeleccionada, setEpocaSeleccionada] = useState("");
  const [bandaSeleccionada, setBandaSeleccionada] = useState("");
  const [warlordSeleccionado, setWarlordSeleccionado] = useState(null);
  const [opcionesWarlordSucesores, setOpcionesWarlordSucesores] = useState({})
  
  const [puntos, setPuntos] = useState({
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
  });

  const [unidadesEspeciales, setUnidadesEspeciales] = useState({});
  const [opcionesBanda, setOpcionesBanda] = useState({});
  const [tiposTropaPersonalizados, setTiposTropaPersonalizados] = useState({});
  
  const [detalleMercenarios, setDetalleMercenarios] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // PROCESAR ÉPOCAS Y BANDAS
  // ==========================================
  const { epocasArray, todasLasBandas, mapaBandaAEpoca } = React.useMemo(
    () => procesarEpocasYBandas(torneo?.epocas_disponibles),
    [torneo?.epocas_disponibles]
  );

  // ==========================================
  // CONFIGURACIÓN DE LA BANDA SELECCIONADA
  // ==========================================
  const configuracionBanda = React.useMemo(() => {
    if (!bandaSeleccionada) {
      return {
        permiteElefantes: false,
        permiteCarros: false,
        permiteTambor: false,
        permiteCuraids: false,
        permitePerros: false,
        permiteBerserkers: false,
        unidadesEspeciales: [],
        tiposTropaPermitidos: null,
        opcionesBanda: [],
        tiposTropaPersonalizados: null,
      };
    }
    return obtenerConfiguracionBanda(bandaSeleccionada);
  }, [bandaSeleccionada]);

  // ==========================================
  // WARLORDS LEGENDARIOS
  // ==========================================
  const opcionesWarlord = React.useMemo(() => {
      if (!bandaSeleccionada) return null;
      if (torneo?.unidades_legendarias !== 1) return null;
      
      const epocaTorneo = torneo?.epocas_disponibles;
      
      if (!epocaTorneo) {
          console.warn('⚠️ No se pudo determinar la época del torneo');
          return null;
      }
      
      return obtenerOpcionesWarlordLegendario(epocaTorneo, bandaSeleccionada);
  }, [bandaSeleccionada, torneo?.unidades_legendarias, torneo?.epocas_disponibles]);

  const infoWarlord = React.useMemo(() => {
      if (!bandaSeleccionada) {
          return {
              tieneWarlord: false,
              nombreBandaFinal: bandaSeleccionada,
              costePuntos: 0,
              restricciones: { mutuamenteExcluyentes: [], prohibido: [] },
              unidadesDesbloqueadas: [] // ✅ AÑADIR
          };
      }
      
      const epocaTorneo = torneo?.epocas_disponibles;
      
      return obtenerInfoCompletaWarlord(epocaTorneo, bandaSeleccionada, warlordSeleccionado);
  }, [bandaSeleccionada, warlordSeleccionado, torneo?.epocas_disponibles]);

  const puntosMaximosReales = React.useMemo(() => {
      if (!torneo?.puntos_banda || !bandaSeleccionada) return 0;
      
      const epocaTorneo = torneo?.epocas_disponibles;
      
      return calcularPuntosDisponibles(
          torneo.puntos_banda,
          epocaTorneo,
          bandaSeleccionada,
          warlordSeleccionado
      );
  }, [torneo?.puntos_banda, torneo?.epocas_disponibles, bandaSeleccionada, warlordSeleccionado])

  // ✅ COMBINAR UNIDADES ESPECIALES: BASE + DESBLOQUEADAS POR WARLORD
  const unidadesEspecialesDisponibles = React.useMemo(() => {
    const unidadesBase = configuracionBanda.unidadesEspeciales || [];
    const unidadesWarlord = infoWarlord.unidadesDesbloqueadas || [];
    
    // Combinar y eliminar duplicados
    const todas = [...unidadesBase];
    unidadesWarlord.forEach(unidadWarlord => {
      const yaExiste = todas.find(u => u.nombre === unidadWarlord.nombre);
      if (!yaExiste) {
        todas.push({
          ...unidadWarlord,
          desbloquedaPorWarlord: true // ✅ Marcar que viene del warlord
        });
      }
    });
    
    return todas;
  }, [configuracionBanda.unidadesEspeciales, infoWarlord.unidadesDesbloqueadas]);

  // Extraer permisos de la configuración
  const permiteElefantes = configuracionBanda.permiteElefantes;
  const permiteCarros = configuracionBanda.permiteCarros;
  const permiteTambor = configuracionBanda.permiteTambor;
  const permiteCuraids = configuracionBanda.permiteCuraids;
  const permitePerros = configuracionBanda.permitePerros;
  const permiteBerserkers = configuracionBanda.permiteBerserkers;
  const tieneUnidadesEspeciales = unidadesEspecialesDisponibles.length > 0; // ✅ USAR LA LISTA COMBINADA
  const tieneOpcionesBanda = configuracionBanda.opcionesBanda?.length > 0;
  const usaTiposTropaPersonalizados = configuracionBanda.tiposTropaPersonalizados !== null;
  
  const permiteGuardias = permiteTipoTropa(configuracionBanda, 'guardias');
  const permiteGuerreros = permiteTipoTropa(configuracionBanda, 'guerreros');
  const permiteLevas = permiteTipoTropa(configuracionBanda, 'levas');
  const permiteMercenarios = permiteTipoTropa(configuracionBanda, 'mercenarios');
  
  const permiteCerdos = React.useMemo (() => {
    if(!bandaSeleccionada || torneo?.unidades_legendarias !== 1) {
      return false
    }

    const config = obtenerConfiguracionBanda (bandaSeleccionada)
    return config.epoca === 'Ánibal'
  }, [bandaSeleccionada, torneo?.unidades_legendarias])

  // ==========================================
  // INICIALIZAR OPCIONES DE BANDA CON VALORES POR DEFECTO
  // ==========================================
  useEffect(() => {
    if (configuracionBanda.opcionesBanda?.length > 0) {
      const valoresPorDefecto = {};
      configuracionBanda.opcionesBanda.forEach(opcion => {
        if (!opcionesBanda[opcion.id]) {
          valoresPorDefecto[opcion.id] = opcion.valorPorDefecto || '';
        }
      });
      if (Object.keys(valoresPorDefecto).length > 0) {
        setOpcionesBanda(prev => ({ ...prev, ...valoresPorDefecto }));
      }
    }
  }, [configuracionBanda.opcionesBanda]);

  // ==========================================
  // CARGAR INSCRIPCIÓN EXISTENTE (MODO EDICIÓN)
  // ==========================================
  useEffect(() => {
    const cargarInscripcion = async () => {
      if (!modoEdicion) return;

      try {
        setLoading(true);
        const dataInscripcion = await torneosSagaApi.obtenerIncripcion(torneoId);
        
        if (dataInscripcion.success && dataInscripcion.data) {
          const inscripcion = dataInscripcion.data;
          
          let composicion = {};
          if (inscripcion.composicion_ejercito) {
            try {
              composicion = typeof inscripcion.composicion_ejercito === 'string'
                ? JSON.parse(inscripcion.composicion_ejercito)
                : inscripcion.composicion_ejercito;
            } catch (e) {
              console.error("Error al parsear composicion:", e);
            }
          }
          
          if (inscripcion.epoca) setEpocaSeleccionada(inscripcion.epoca);
          setBandaSeleccionada(inscripcion.faccion || "");
          
          if (composicion.warlordLegendario) {
            setWarlordSeleccionado(composicion.warlordLegendario.valor);
          }
          
          setPuntos({
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
            cerdos: parseFloat(composicion.cerdos || 0)
          });

          if (composicion.unidadesEspeciales) {
            const unidadesEsp = {};
            Object.keys(composicion.unidadesEspeciales).forEach(key => {
              unidadesEsp[key] = parseFloat(composicion.unidadesEspeciales[key] || 0);
            });
            setUnidadesEspeciales(unidadesEsp);
          }

          if (composicion.opcionesBanda) {
            setOpcionesBanda(composicion.opcionesBanda);
          }

          if (composicion.tiposTropaPersonalizados) {
            setTiposTropaPersonalizados(composicion.tiposTropaPersonalizados);
          }
          
          setDetalleMercenarios(composicion.detalleMercenarios || "");
        }
      } catch (err) {
        console.error("❌ Error al cargar inscripción:", err);
        setError("No se pudo cargar tu inscripción");
      } finally {
        setLoading(false);
      }
    };

    cargarInscripcion();
  }, [modoEdicion, torneoId]);

  // ==========================================
  // LIMPIAR CAMPOS SI CAMBIA LA BANDA O WARLORD
  // ==========================================
  useEffect(() => {
    const nuevosPuntos = { ...puntos };
    let cambios = false;

    if (infoWarlord.restricciones.prohibido.length > 0) {
      infoWarlord.restricciones.prohibido.forEach(tipo => {
        if (nuevosPuntos[tipo] > 0) {
          nuevosPuntos[tipo] = 0;
          cambios = true;
        }
      });
    }

    if(!permiteCerdos && puntos.cerdos > 0) {
      nuevosPuntos.cerdos = 0
      cambios = true
    }

    if (!permiteElefantes && puntos.elefantes > 0) {
      nuevosPuntos.elefantes = 0;
      cambios = true;
    }
    if (!permiteCarros && puntos.carros > 0) {
      nuevosPuntos.carros = 0;
      cambios = true;
    }
    if (!permiteTambor && puntos.tambor > 0) {
      nuevosPuntos.tambor = 0;
      cambios = true;
    }
    if (!permiteCuraids && puntos.curaids > 0) {
      nuevosPuntos.curaids = 0;
      cambios = true;
    }
    if (!permitePerros && puntos.perros > 0) {
      nuevosPuntos.perros = 0;
      cambios = true;
    }
    if (!permiteBerserkers && puntos.berserkers > 0) {
      nuevosPuntos.berserkers = 0;
      cambios = true;
    }

    if (!permiteGuardias && puntos.guardias > 0) {
      nuevosPuntos.guardias = 0;
      cambios = true;
    }
    if (!permiteGuerreros && puntos.guerreros > 0) {
      nuevosPuntos.guerreros = 0;
      cambios = true;
    }
    if (!permiteLevas && puntos.levas > 0) {
      nuevosPuntos.levas = 0;
      cambios = true;
    }
    if (!permiteMercenarios && puntos.mercenarios > 0) {
      nuevosPuntos.mercenarios = 0;
      setDetalleMercenarios("");
      cambios = true;
    }

    if (cambios) {
      setPuntos(nuevosPuntos);
    }

    if (!tieneUnidadesEspeciales && Object.keys(unidadesEspeciales).length > 0) {
      setUnidadesEspeciales({});
    }

    if (!tieneOpcionesBanda && Object.keys(opcionesBanda).length > 0) {
      setOpcionesBanda({});
    }

    if (!usaTiposTropaPersonalizados && Object.keys(tiposTropaPersonalizados).length > 0) {
      setTiposTropaPersonalizados({});
    }
  }, [
    bandaSeleccionada,
    warlordSeleccionado,
    infoWarlord,
    permiteElefantes,
    permiteCarros,
    permiteTambor,
    permiteCuraids,
    permitePerros,
    permiteBerserkers,
    permiteGuardias,
    permiteGuerreros,
    permiteLevas,
    permiteMercenarios,
    tieneUnidadesEspeciales,
    tieneOpcionesBanda,
    usaTiposTropaPersonalizados,
    permiteCerdos
  ]);

  // ==========================================
  // VALIDAR RESTRICCIONES EN TIEMPO REAL
  // ==========================================
  useEffect(() => {
    if (!bandaSeleccionada || !infoWarlord) return;
    
    const composicionActual = {
      elefantes: puntos.elefantes,
      carros: puntos.carros,
      levas: puntos.levas,
      guardias: puntos.guardias,
      guerreros: puntos.guerreros,
      mercenarios: puntos.mercenarios
    };
    
    const validacion = validarComposicionBanda(composicionActual, infoWarlord.restricciones);
    
    if (!validacion.valido && validacion.errores.length > 0) {
      console.warn('⚠️ Restricciones violadas:', validacion.errores);
    }
  }, [puntos, infoWarlord, bandaSeleccionada]);

 //==========================================================
//AUTO-ESTABLECER OPCIONES REQUERIDAS PARA WARLORDS SUCESORES
// ========================================================

useEffect (() => {
  console.log('🔍 useEffect warlord ejecutado:', { warlordSeleccionado, opcionesWarlord });

  if (!warlordSeleccionado || !opcionesWarlord) {
    console.log('❌ No hay warlord u opciones, desbloqueando');
    setOpcionesWarlordSucesores({});
    return;
  }

  // Buscar el warlord seleccionado en las opciones
  const opcionWarlord = opcionesWarlord.opciones.find(o => o.valor === warlordSeleccionado);
  console.log('🔍 Warlord encontrado:', opcionWarlord);
  console.log('🔍 Tiene opcionesRequeridas?', opcionWarlord?.opcionesRequeridas);
  
  if (opcionWarlord?.opcionesRequeridas) {
    console.log('✅ Estableciendo opciones requeridas:', opcionWarlord.opcionesRequeridas);
    
    // Establecer automáticamente las opciones requeridas
    setOpcionesBanda(prev => {
      const nuevo = {
        ...prev,
        ...opcionWarlord.opcionesRequeridas
      };
      console.log('🔍 Nuevo estado opcionesBanda:', nuevo);
      return nuevo;
    });
    
    // Marcar esas opciones como bloqueadas
    const bloqueadas = {};
    Object.keys(opcionWarlord.opcionesRequeridas).forEach(key => {
      bloqueadas[key] = true;
    });
    console.log('🔒 Opciones bloqueadas:', bloqueadas);
    setOpcionesWarlordSucesores(bloqueadas);
  } else {
    console.log('❌ No tiene opciones requeridas, desbloqueando');
    setOpcionesWarlordSucesores({});
  }
}, [warlordSeleccionado, opcionesWarlord]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleBandaChange = (e) => {
    const banda = e.target.value;
    setBandaSeleccionada(banda);
    setWarlordSeleccionado(null);
    
    if (banda && mapaBandaAEpoca[banda]) {
      setEpocaSeleccionada(mapaBandaAEpoca[banda]);
    } else if (!banda) {
      setPuntos({
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
        cerdos: 0
      });
      setUnidadesEspeciales({});
      setOpcionesBanda({});
      setTiposTropaPersonalizados({});
      setDetalleMercenarios("");
      
      if (epocasArray.length === 1) {
        setEpocaSeleccionada(epocasArray[0]);
      } else {
        setEpocaSeleccionada("");
      }
    }
  };

  const handleWarlordChange = (valor) => {
    const valorFinal = valor || null;
    setWarlordSeleccionado(valorFinal);
    
    if (!valorFinal) {
      // Si se deselecciona el warlord, desbloquear opciones
      setOpcionesWarlordSucesores({});
      return;
    }
    
    const epocaTorneo = torneo?.epocas_disponibles;
    const nuevaInfo = obtenerInfoCompletaWarlord(epocaTorneo, bandaSeleccionada, valorFinal);
    
    if (nuevaInfo.restricciones.prohibido.length > 0) {
        const nuevosPuntos = { ...puntos };
        let cambios = false;
        
        nuevaInfo.restricciones.prohibido.forEach(tipo => {
            if (nuevosPuntos[tipo] > 0) {
                nuevosPuntos[tipo] = 0;
                cambios = true;
            }
        });
        
        if (cambios) {
            setPuntos(nuevosPuntos);
            setTimeout(() => {
                alert(`⚠️ Algunas unidades han sido reseteadas porque están prohibidas por ${nuevaInfo.nombreWarlord}`);
            }, 100);
        }
    }
};

  const handlePuntosChange = (e) => {
      const { name, value } = e.target;
      // ← Convertir coma a punto para móviles en español
      const valorNumerico = parseFloat(value) || 0;
      
      setPuntos((prev) => ({ ...prev, [name]: valorNumerico }));

      if (name === "mercenarios" && valorNumerico === 0) {
          setDetalleMercenarios("");
      }
  };

  const handleUnidadEspecialChange = (nombreUnidad, value) => {
      const valorNumerico = parseFloat(value) || 0;
      setUnidadesEspeciales(prev => ({ ...prev, [nombreUnidad]: valorNumerico }));
  };
  
  const handleOpcionBandaChange = (idOpcion, valor) => {
    setOpcionesBanda(prev => ({
      ...prev,
      [idOpcion]: valor
    }));
  };

  const handleTropaPersonalizadaChange = (idTropa, value) => {
      const valorNumerico = parseFloat(value) || 0;
      setTiposTropaPersonalizados(prev => ({ ...prev, [idTropa]: valorNumerico }));
  };

  const eliminarInscripcion = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar tu inscripción?')) {
      return;
    }

    if (!user?.id) {
      setError("No se pudo obtener tu ID de usuario")
      return;
    }
    
    try {
      setLoading(true);
      const resultado = await torneosSagaApi.eliminarJugadorTorneo(torneoId, user.id);

      if (resultado.success) {
        alert("✅ Inscripción eliminada correctamente");
        navigate('/');
      }
    } catch (error) {
      console.error("❌ Error al eliminar inscripción:", error);
      setError(error.message || "Error al eliminar la inscripción");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!user?.id) {
      setError("No hay usuario autenticado");
      return;
    }
    
    if (!epocaSeleccionada) {
      setError("Debes seleccionar una banda (la época se detectará automáticamente)");
      return;
    }

    if (configuracionBanda.opcionesBanda?.length > 0) {
      for (const opcion of configuracionBanda.opcionesBanda) {
        if (opcion.obligatorio && !opcionesBanda[opcion.id]) {
          setError(`Debes seleccionar: ${opcion.label}`);
          return;
        }
      }
    }

    // CALCULAR TOTAL según el tipo de banda
    let totalPuntos = 0;

    if (usaTiposTropaPersonalizados) {
      Object.keys(tiposTropaPersonalizados).forEach(idTropa => {
        const cantidad = tiposTropaPersonalizados[idTropa];
        const config = configuracionBanda.tiposTropaPersonalizados.find(t => t.id === idTropa);
        if (config) {
          totalPuntos += cantidad * config.puntos;
        }
      });
    } else {
      const totalUnidadesEspeciales = Object.values(unidadesEspeciales).reduce((acc, val) => acc + val, 0);
      
      totalPuntos = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios + 
                    puntos.elefantes + puntos.carros + puntos.tambor + puntos.curaids + 
                    puntos.perros + puntos.berserkers + puntos.cerdos + totalUnidadesEspeciales;
    }

    totalPuntos = parseFloat(totalPuntos.toFixed(2));

    if (totalPuntos > 0) {
      const puntosEsperados = puntosMaximosReales;
      
      if (Math.abs(totalPuntos - puntosEsperados) > 0.01) {
        setError(
          `Los puntos deben sumar exactamente ${puntosEsperados}` +
          (warlordSeleccionado ? ` (${torneo.puntos_banda} - ${infoWarlord.costePuntos} del warlord)` : '')
        );
        return;
      }

      if (!bandaSeleccionada) {
        setError("Si introduces puntos, debes seleccionar una banda");
        return;
      }

      if (puntos.mercenarios > 0 && !detalleMercenarios.trim()) {
        setError("Debes especificar qué mercenarios usarás");
        return;
      }
    }

    if (warlordSeleccionado && totalPuntos > 0) {
      const composicionActual = {
        elefantes: puntos.elefantes,
        carros: puntos.carros,
        levas: puntos.levas,
        guardias: puntos.guardias,
        guerreros: puntos.guerreros,
        mercenarios: puntos.mercenarios
      };
      
      const validacion = validarComposicionBanda(composicionActual, infoWarlord.restricciones);
      
      if (!validacion.valido) {
        setError(`Violación de restricciones: ${validacion.errores.join(', ')}`);
        return;
      }
    }

    try {
      setLoading(true);
      
      const inscripcionData = {
        usuarioId: user.id,
        epoca: epocaSeleccionada,
      }

      if (bandaSeleccionada){
        inscripcionData.faccion = bandaSeleccionada;
      }

      if (warlordSeleccionado && opcionesWarlord) {
        const opcionWarlord = opcionesWarlord.opciones.find(o => o.valor === warlordSeleccionado);
        if (opcionWarlord) {
          inscripcionData.warlordLegendario = {
            valor: warlordSeleccionado,
            nombre: opcionWarlord.nombre,
            costePuntos: opcionWarlord.costePuntos,
            bandaDesbloqueada: opcionWarlord.bandaDesbloqueada || null,
            opcionesRequeridas: opcionWarlord.opcionesRequeridas || null
          };
        }
      }

      if (totalPuntos > 0) {
        if (usaTiposTropaPersonalizados) {
          inscripcionData.tiposTropaPersonalizados = tiposTropaPersonalizados;
        } else {
          inscripcionData.puntosGuardias = puntos.guardias;
          inscripcionData.puntosGuerreros = puntos.guerreros;
          inscripcionData.puntosLevas = puntos.levas;
          inscripcionData.puntosMercenarios = puntos.mercenarios;
          inscripcionData.puntosElefantes = puntos.elefantes;
          inscripcionData.puntosCarros = puntos.carros;
          inscripcionData.puntosTambor = puntos.tambor;
          inscripcionData.puntosCuraids = puntos.curaids;
          inscripcionData.puntosPerros = puntos.perros;
          inscripcionData.puntosBerserkers = puntos.berserkers;
          inscripcionData.puntosCerdos = puntos.cerdos
          
          if (Object.keys(unidadesEspeciales).length > 0) {
            inscripcionData.unidadesEspeciales = unidadesEspeciales;
          }
        }

        if (Object.keys(opcionesBanda).length > 0) {
          inscripcionData.opcionesBanda = opcionesBanda;
        }
        
        if (detalleMercenarios){
          inscripcionData.detalleMercenarios = detalleMercenarios;
        }
      }

      let resultado;
      
      if (modoEdicion) {
        resultado = await torneosSagaApi.actualizarInscripcion(torneoId, inscripcionData);
        alert("✅ ¡Inscripción actualizada con éxito!");
      } else {
        resultado = await torneosSagaApi.inscribirse(torneoId, inscripcionData);

        if (bandaSeleccionada && totalPuntos > 0) {
          alert("✅ ¡Inscripción realizada con éxito!");
        } else {
          alert("✅ ¡Inscripción realizada! Recuerda completar tu banda antes del torneo.");
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

  // Calcular puntos actuales
  let puntosActuales = 0;

  if (usaTiposTropaPersonalizados) {
    Object.keys(tiposTropaPersonalizados).forEach(idTropa => {
      const cantidad = tiposTropaPersonalizados[idTropa];
      const config = configuracionBanda.tiposTropaPersonalizados?.find(t => t.id === idTropa);
      if (config) {
        puntosActuales += cantidad * config.puntos;
      }
    });
  } else {
    const totalUnidadesEspeciales = Object.values(unidadesEspeciales).reduce((acc, val) => acc + val, 0);
    puntosActuales = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios + 
                      puntos.elefantes + puntos.carros + puntos.tambor + puntos.curaids + 
                      puntos.perros + puntos.berserkers + puntos.cerdos + totalUnidadesEspeciales;
  }
  
  const diferencia = puntosMaximosReales - puntosActuales;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="inscripcion-container">
      
      <h1>
        {modoEdicion ? '✏️ Editar Inscripción' : '📝 Inscripción'}: {torneo?.nombre_torneo}
      </h1>
      
      {modoEdicion && (
        <div className="info-message">
          ℹ️ Editando tu inscripción actual
        </div>
      )}
      
      <section className="info-usuario">
        <h2>Datos del Participante</h2>
        <div className="datos-grid">
          <div className="dato-item">
            <label>Nombre:</label>
            <span>{user?.nombre} {user?.apellidos}</span>
          </div>
          
          <div className="dato-item">
            <label>Email:</label>
            <span>{user?.email}</span>
          </div>
          
          {user?.club && (
            <div className="dato-item">
              <label>Club:</label>
              <span>{user.club}</span>
            </div>
          )}

          {user?.localidad && (
            <div className="dato-item">
              <label>Localidad:</label>
              <span>{user.localidad}</span>
            </div>
          )}
        </div>
      </section>

      <section className="info-torneo">
        <h2>Detalles del Torneo</h2>
        <div className="datos-grid">
          <div className="dato-item">
            <label>Épocas Disponibles:</label>
            <span className="epoca-badge">
              {epocasArray.join(', ')}
            </span>
          </div>
          
          <div className="dato-item">
            <label>Puntos Banda:</label>
            <span>{torneo?.puntos_banda || 6} puntos</span>
          </div>
          
          <div className="dato-item">
            <label>Fecha:</label>
            <span>
              {torneo?.fecha_inicio 
                ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')
                : "N/A"}
            </span>
          </div>

          {torneo?.unidades_legendarias === 1 && (
            <div className="dato-item">
              <label>Unidades Legendarias:</label>
              <span className="legendarias-activas">✅ Activadas</span>
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="inscripcion-form">
        
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="form-group">
          <select
            id="banda"
            value={bandaSeleccionada}
            onChange={handleBandaChange}
            disabled={loading}
          >
            <option value="">-- Completar después --</option>
            {todasLasBandas.length === 0 ? (
              <option value="" disabled>⚠️ No hay bandas disponibles</option>
            ) : (
              todasLasBandas.map((banda, index) => (
                <option key={index} value={banda.nombre}>
                  {banda.nombre} 
                </option>
              ))
            )}
          </select>
          <small className="form-help-text">
            La época se detectará automáticamente según la banda seleccionada
          </small>
        </div>

        {/* ========================================
            SELECTOR DE WARLORD LEGENDARIO
            ======================================== */}
        {bandaSeleccionada && opcionesWarlord && torneo?.unidades_legendarias === 1 && (
          <section className="warlord-section">
            <h3 className="warlord-title">⚔️ Warlord Legendario</h3>
            
            <div className="form-group">
              <label htmlFor="warlord">
                {opcionesWarlord.label}
                {opcionesWarlord.obligatorio && <span className="required"> *</span>}
              </label>
              <select
                id="warlord"
                value={warlordSeleccionado || ''}
                onChange={(e) => handleWarlordChange(e.target.value || null)}
                disabled={loading}
                required={opcionesWarlord.obligatorio}
              >
                <option value="">-- Sin warlord legendario --</option>
                {opcionesWarlord.opciones.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.nombreCompleto}
                    {opcion.tieneBandaDesbloqueada && ` → ${opcion.bandaDesbloqueada}`}
                  </option>
                ))}
              </select>
            </div>

            {infoWarlord.tieneWarlord && (
              <div className="info-warlord">
                <p className="info-line">
                  <strong>Warlord:</strong> {infoWarlord.nombreWarlord}
                </p>
                <p className="info-line">
                  <strong>Coste:</strong> {infoWarlord.costePuntos} {infoWarlord.costePuntos === 1 ? 'punto' : 'puntos'}
                </p>
                {infoWarlord.tieneBandaDesbloqueada && (
                  <p className="info-line banda-desbloqueada">
                    <strong>✨ Banda desbloqueada:</strong> {infoWarlord.nombreBandaFinal}
                  </p>
                )}
                <p className="info-line">
                  <strong>Puntos disponibles:</strong> {puntosMaximosReales} 
                  <small className="puntos-detalle-small">
                    ({torneo.puntos_banda} - {infoWarlord.costePuntos})
                  </small>
                </p>
                
                {infoWarlord.restricciones.prohibido.length > 0 && (
                  <div className="restriccion-prohibido">
                    <strong>⛔ Prohibido:</strong>{' '}
                    {infoWarlord.restricciones.prohibido.join(', ')}
                  </div>
                )}
                
                {infoWarlord.restricciones.mutuamenteExcluyentes.length > 0 && (
                  <div className="restriccion-excluyentes">
                    <strong>⚠️ Mutuamente excluyentes:</strong>
                    {infoWarlord.restricciones.mutuamenteExcluyentes.map((par, i) => (
                      <div key={i} className="restriccion-item">• {par.join(' ↔ ')}</div>
                    ))}
                  </div>
                )}

                {/* ✅ MOSTRAR UNIDADES DESBLOQUEADAS */}
                {infoWarlord.unidadesDesbloqueadas && infoWarlord.unidadesDesbloqueadas.length > 0 && (
                  <div className="unidades-desbloqueadas">
                    <strong>✨ Unidades desbloqueadas:</strong>
                    <ul className="lista-unidades-desbloqueadas">
                      {infoWarlord.unidadesDesbloqueadas.map((unidad, i) => (
                        <li key={i}>{unidad.label || unidad.nombre}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {bandaSeleccionada && tieneOpcionesBanda && (
          <section className="opciones-banda-section">
            <h3>Configuración de la Banda</h3>
            {configuracionBanda.opcionesBanda.map((opcion) => {

              const estaBloqueada = opcionesWarlordSucesores[opcion.id] || false

              return (
                <div key={opcion.id} className="form-group">
                  <label htmlFor={opcion.id}>
                    {opcion.label}
                    {opcion.obligatorio && <span className="required"> *</span>}
                    {estaBloqueada && <span className="warlord-locked">🔒(Exclusivo de este Warlord)</span>}
                  </label>
                  {opcion.tipo === 'select' && (
                    <select
                      id={opcion.id}
                      value={opcionesBanda[opcion.id] || ''}
                      onChange={(e) => handleOpcionBandaChange(opcion.id, e.target.value)}
                      disabled={loading || estaBloqueada}
                      required={opcion.obligatorio}
                      className={estaBloqueada ? ' input-locked' : ' '}
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
              )
            })}
          </section>
        )}

        {bandaSeleccionada && (
          <>
            <section className="puntos-section">
              <h3>Distribución de Puntos</h3>
              <p className="puntos-info">
                Total: <strong>{puntosActuales.toFixed(1)}</strong> / {puntosMaximosReales}
                {warlordSeleccionado && (
                  <small className="puntos-detalle-small">
                    ({torneo.puntos_banda} - {infoWarlord.costePuntos} warlord)
                  </small>
                )}
                {diferencia > 0 && (
                  <span className="puntos-faltantes"> ⚠️ Faltan {diferencia.toFixed(1)}</span>
                )}
                {diferencia < 0 && (
                  <span className="puntos-excedidos"> ⚠️ Excedido por {Math.abs(diferencia).toFixed(1)}</span>
                )}
              </p>

              <div className="puntos-grid">
                {usaTiposTropaPersonalizados ? (
                  <>
                    {configuracionBanda.tiposTropaPersonalizados.map((tipo) => (
                      <div key={tipo.id} className="punto-item">
                        <label htmlFor={tipo.id}>
                          {tipo.label}
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id={tipo.id}
                          name={tipo.id}
                          value={tiposTropaPersonalizados[tipo.id] || 0}
                          onChange={(e) => handleTropaPersonalizadaChange(tipo.id, e.target.value)}
                          min="0"
                          max={puntosMaximosReales}
                          step={tipo.step || 0.5}
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {permiteGuardias && (
                      <div className="punto-item">
                        <label htmlFor="guardias">
                          Guardias
                          {estaProhibido('guardias', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="guardias"
                          name="guardias"
                          value={puntos.guardias}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="0.5"
                          disabled={loading || estaProhibido('guardias', infoWarlord.restricciones)}
                          className={estaProhibido('guardias', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permiteBerserkers && (
                      <div className="punto-item">
                        <label htmlFor="berserkers">
                          Berserkers
                          {estaProhibido('berserkers', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="berserkers"
                          name="berserkers"
                          value={puntos.berserkers}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="1"
                          disabled={loading || estaProhibido('berserkers', infoWarlord.restricciones)}
                          className={estaProhibido('berserkers', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permiteCerdos && (
                      <div className="punto-item cerdos-legendario">
                        <label htmlFor="cerdos">
                           Cerdos Incendiarios
                          {estaProhibido('cerdos', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="cerdos"
                          name="cerdos"
                          value={puntos.cerdos}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="1"
                          disabled={loading || estaProhibido('cerdos', infoWarlord.restricciones)}
                          className={estaProhibido('cerdos', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permiteElefantes && (
                      <div className="punto-item">
                        <label htmlFor="elefantes">
                          Elefantes
                          {estaProhibido('elefantes', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="elefantes"
                          name="elefantes"
                          value={puntos.elefantes}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="1"
                          disabled={loading || estaProhibido('elefantes', infoWarlord.restricciones)}
                          className={estaProhibido('elefantes', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                        {sonMutuamenteExcluyentes('elefantes', 'carros', infoWarlord.restricciones) && puntos.carros > 0 && (
                          <small className="restriccion-warning">
                            ⚠️ Incompatible con carros
                          </small>
                        )}
                      </div>
                    )}

                    {permiteCarros && (
                      <div className="punto-item">
                        <label htmlFor="carros">
                          Carros
                          {estaProhibido('carros', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="carros"
                          name="carros"
                          value={puntos.carros}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="1"
                          disabled={loading || estaProhibido('carros', infoWarlord.restricciones)}
                          className={estaProhibido('carros', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                        {sonMutuamenteExcluyentes('elefantes', 'carros', infoWarlord.restricciones) && puntos.elefantes > 0 && (
                          <small className="restriccion-warning">
                            ⚠️ Incompatible con elefantes
                          </small>
                        )}
                      </div>
                    )}

                    {permiteTambor && (
                      <div className="punto-item">
                        <label htmlFor="tambor">
                          Tambor de Guerra
                          {estaProhibido('tambor', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="tambor"
                          name="tambor"
                          value={puntos.tambor}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="1"
                          disabled={loading || estaProhibido('tambor', infoWarlord.restricciones)}
                          className={estaProhibido('tambor', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permiteCuraids && (
                      <div className="punto-item">
                        <label htmlFor="curaids">
                          Curaids
                          {estaProhibido('curaids', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="curaids"
                          name="curaids"
                          value={puntos.curaids}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="0.5"
                          disabled={loading || estaProhibido('curaids', infoWarlord.restricciones)}
                          className={estaProhibido('curaids', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permitePerros && (
                      <div className="punto-item">
                        <label htmlFor="perros">
                          Perros de Guerra
                          {estaProhibido('perros', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="perros"
                          name="perros"
                          value={puntos.perros}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="0.5"
                          disabled={loading || estaProhibido('perros', infoWarlord.restricciones)}
                          className={estaProhibido('perros', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {/* ✅ UNIDADES ESPECIALES: BASE + DESBLOQUEADAS POR WARLORD */}
                    {tieneUnidadesEspeciales && unidadesEspecialesDisponibles.map((unidad) => {
                      const key = unidad.valor || unidad.nombre

                      return (
                          <div key={key} className={`punto-item ${unidad.desbloquedaPorWarlord ? 'unidad-warlord' : ''}`}>
                            <label htmlFor={unidad.nombre}>
                              {unidad.desbloquedaPorWarlord && '✨ '}
                              {unidad.label} 
                              <small className="puntos-unidad-small">
                                ({unidad.puntos} pts c/u)
                              </small>
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              id={key}
                              name={key}
                              value={unidadesEspeciales[key] || 0}
                              onChange={(e) => handleUnidadEspecialChange(key, e.target.value)}
                              min="0"
                              max="1"
                              step={unidad.step || 0.5}
                              disabled={loading}
                            />
                            {unidad.desbloquedaPorWarlord && (
                              <small className="unidad-desbloqueada-label">
                                Desbloqueada por {infoWarlord.nombreWarlord}
                              </small>
                            )}
                          </div>
                      )
                    })}

                    {permiteGuerreros && (
                      <div className="punto-item">
                        <label htmlFor="guerreros">
                          Guerreros
                          {estaProhibido('guerreros', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="guerreros"
                          name="guerreros"
                          value={puntos.guerreros}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="0.5"
                          disabled={loading || estaProhibido('guerreros', infoWarlord.restricciones)}
                          className={estaProhibido('guerreros', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permiteLevas && (
                      <div className="punto-item">
                        <label htmlFor="levas">
                          Levas
                          {estaProhibido('levas', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="levas"
                          name="levas"
                          value={puntos.levas}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="0.5"
                          disabled={loading || estaProhibido('levas', infoWarlord.restricciones)}
                          className={estaProhibido('levas', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}

                    {permiteMercenarios && (
                      <div className="punto-item">
                        <label htmlFor="mercenarios">
                          Mercenarios
                          {estaProhibido('mercenarios', infoWarlord.restricciones) && 
                            <span className="prohibido-badge"> ⛔</span>
                          }
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          id="mercenarios"
                          name="mercenarios"
                          value={puntos.mercenarios}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximosReales}
                          step="0.5"
                          disabled={loading || estaProhibido('mercenarios', infoWarlord.restricciones)}
                          className={estaProhibido('mercenarios', infoWarlord.restricciones) ? 'input-prohibido' : ''}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {puntos.mercenarios > 0 && permiteMercenarios && !usaTiposTropaPersonalizados && (
                <div className="form-group mercenarios-detalle">
                  <label htmlFor="detalleMercenarios">
                    Detalla tus mercenarios ({puntos.mercenarios} pts):
                  </label>
                  <textarea
                    id="detalleMercenarios"
                    value={detalleMercenarios}
                    onChange={(e) => setDetalleMercenarios(e.target.value)}
                    placeholder="Ej: Arqueros Cretenses, Caballería Occidental..."
                    rows="3"
                    required
                    disabled={loading}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </form>

      <div className="button-group">
        <button 
          type="submit" 
          onClick={handleSubmit}
          className="btn-primary" 
          disabled={loading || todasLasBandas.length === 0}
        >
          {loading 
            ? '⏳ Procesando...' 
            : (modoEdicion ? '✅ Guardar Cambios' : '✅ Inscribirme')}
        </button>

        {modoEdicion && (
          <button 
            type="button" 
            className="btn-danger" 
            onClick={eliminarInscripcion}
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

      <Footer />
    </div>
  );
}

export default InscripcionSagaIndividual;