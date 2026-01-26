// componentesSaga/inscripciones/inscripcionSagaIndividual.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import torneosSagaApi from '../../servicios/apiSaga.js';
import { 
  procesarEpocasYBandas, 
  obtenerConfiguracionBanda , 
  permiteTipoTropa
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
  const [puntos, setPuntos] = useState({
    guardias: 0,
    guerreros: 0,
    levas: 0,
    mercenarios: 0,
    elefantes: 0,
    carros: 0,        // ✅ NUEVO
    tambor: 0,        // ✅ NUEVO
    curaids: 0,       // ✅ NUEVO
    perros: 0,
    berserkers: 0,       // ✅ NUEVO
  });

  const [unidadesEspeciales, setUnidadesEspeciales] = useState({});  // Para manubalista, los compañeros, etc.
  const [opcionesBanda, setOpcionesBanda] = useState({});  // Para tipo de Warlord, etc.
  const [tiposTropaPersonalizados, setTiposTropaPersonalizados] = useState({});  // Para Edad de la Magia
  
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
  // ✅ CONFIGURACIÓN DE LA BANDA SELECCIONADA
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

  // ✅ Extraer permisos de la configuración
 const permiteElefantes = configuracionBanda.permiteElefantes;
  const permiteCarros = configuracionBanda.permiteCarros;
  const permiteTambor = configuracionBanda.permiteTambor;
  const permiteCuraids = configuracionBanda.permiteCuraids;
  const permitePerros = configuracionBanda.permitePerros;
  const permiteBerserkers = configuracionBanda.permiteBerserkers;
  const tieneUnidadesEspeciales = configuracionBanda.unidadesEspeciales?.length > 0;
  const tieneOpcionesBanda = configuracionBanda.opcionesBanda?.length > 0;
  const usaTiposTropaPersonalizados = configuracionBanda.tiposTropaPersonalizados !== null;
  
  // ✅ Permisos de tipos de tropa (para bandas con restricciones)
  const permiteGuardias = permiteTipoTropa(configuracionBanda, 'guardias');
  const permiteGuerreros = permiteTipoTropa(configuracionBanda, 'guerreros');
  const permiteLevas = permiteTipoTropa(configuracionBanda, 'levas');
  const permiteMercenarios = permiteTipoTropa(configuracionBanda, 'mercenarios');

// ==========================================
  // INICIALIZAR OPCIONES DE BANDA CON VALORES POR DEFECTO
  // ==========================================
  useEffect(() => {
    if (configuracionBanda.opcionesBanda?.length > 0) {
      const valoresPorDefecto = {};
      configuracionBanda.opcionesBanda.forEach(opcion => {
        if (!opcionesBanda[opcion.id]) {
          valoresPorDefecto[opcion.id] = opcion.porDefecto || '';
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
          
          setPuntos({
            guardias: parseFloat(composicion.guardias || inscripcion.puntos_guardias || 0),
            guerreros: parseFloat(composicion.guerreros || inscripcion.puntos_guerreros || 0),
            levas: parseFloat(composicion.levas || inscripcion.puntos_levas || 0),
            mercenarios: parseFloat(composicion.mercenarios || inscripcion.puntos_mercenarios || 0),
            elefantes: parseFloat(composicion.elefantes || inscripcion.puntos_elefantes || 0),
            carros: parseFloat(composicion.carros || inscripcion.puntos_carros || 0),      // ✅ NUEVO
            tambor: parseFloat(composicion.tambor || inscripcion.puntos_tambor || 0),      // ✅ NUEVO
            curaids: parseFloat(composicion.curaids || inscripcion.puntos_curaids || 0),   // ✅ NUEVO
            perros: parseFloat(composicion.perros || inscripcion.puntos_perros || 0), 
            berserkers: parseFloat(composicion.berserkers || inscripcion.puntos_berserkers || 0)     // ✅ NUEVO
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

          // ✅ Cargar tipos de tropa personalizados (Edad de la Magia)
          if (composicion.tiposTropaPersonalizados) {
            setTiposTropaPersonalizados(composicion.tiposTropaPersonalizados);
          }
          
          setDetalleMercenarios(composicion.detalleMercenarios || inscripcion.detalle_mercenarios || "");
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
  // ✅ LIMPIAR CAMPOS ESPECIALES SI CAMBIA LA BANDA
  // ==========================================
  useEffect(() => {
    const nuevosPuntos = { ...puntos };
    let cambios = false;

    if (!permiteElefantes && puntos.elefantes > 0) {
      nuevosPuntos.elefantes = 0;
      cambios = true;
    }
    if (!permiteCarros && puntos.carros > 0) {
      nuevosPuntos.carros = 0;
      cambios = true;
    }
    if (!permiteTambor && puntos.tambor> 0) {
      nuevosPuntos.tambos = 0;
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

    // ✅ Limpiar unidades especiales si no las tiene
    if (!tieneUnidadesEspeciales && Object.keys(unidadesEspeciales).length > 0) {
      setUnidadesEspeciales({});
    }

    // ✅ Limpiar opciones de banda si no las tiene
    if (!tieneOpcionesBanda && Object.keys(opcionesBanda).length > 0) {
      setOpcionesBanda({});
    }

    // ✅ Limpiar tipos personalizados si no los usa
    if (!usaTiposTropaPersonalizados && Object.keys(tiposTropaPersonalizados).length > 0) {
      setTiposTropaPersonalizados({});
    }
  }, [
    bandaSeleccionada, 
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
    usaTiposTropaPersonalizados
  ]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleBandaChange = (e) => {
    const banda = e.target.value;
    setBandaSeleccionada(banda);
    
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

  const handlePuntosChange = (e) => {
    const { name, value } = e.target;
    const valorNumerico = parseFloat(value) || 0;
    
    setPuntos((prev) => ({ ...prev, [name]: valorNumerico }));

    if (name === "mercenarios" && valorNumerico === 0) {
      setDetalleMercenarios("");
    }
  };

   const handleUnidadEspecialChange = (nombreUnidad, value) => {
      const valorNumerico = parseFloat(value) || 0;
      setUnidadesEspeciales(prev => ({
        ...prev,
        [nombreUnidad]: valorNumerico
      }));
    };

  // ✅ Handler para opciones de banda
    const handleOpcionBandaChange = (idOpcion, valor) => {
      setOpcionesBanda(prev => ({
        ...prev,
        [idOpcion]: valor
      }));
    };

    // ✅ Handler para tipos de tropa personalizados (Edad de la Magia)
    const handleTropaPersonalizadaChange = (idTropa, value) => {
      const valorNumerico = parseFloat(value) || 0;
      setTiposTropaPersonalizados(prev => ({
        ...prev,
        [idTropa]: valorNumerico
      }));
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

    // ✅ Validar opciones de banda obligatorias
    if (configuracionBanda.opcionesBanda?.length > 0) {
      for (const opcion of configuracionBanda.opcionesBanda) {
        if (opcion.obligatorio && !opcionesBanda[opcion.id]) {
          setError(`Debes seleccionar: ${opcion.label}`);
          return;
        }
      }
    }

    // ✅ CALCULAR TOTAL según el tipo de banda
    let totalPuntos = 0;

    if (usaTiposTropaPersonalizados) {
      // Para Edad de la Magia: calcular según puntos de cada tipo
      Object.keys(tiposTropaPersonalizados).forEach(idTropa => {
        const cantidad = tiposTropaPersonalizados[idTropa];
        const config = configuracionBanda.tiposTropaPersonalizados.find(t => t.id === idTropa);
        if (config) {
          totalPuntos += cantidad * config.puntos;
        }
      });
    } else {
      // Para bandas normales
      const totalUnidadesEspeciales = Object.values(unidadesEspeciales).reduce((acc, val) => acc + val, 0);
      
      totalPuntos = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios + 
                    puntos.elefantes + puntos.carros + puntos.tambor + puntos.curaids + 
                    puntos.perros + puntos.berserkers + totalUnidadesEspeciales;
    }

    totalPuntos = parseFloat(totalPuntos.toFixed(2));

    if (totalPuntos > 0) {
      const puntosMaximos = torneo?.puntos_banda || 24;
      
      if (Math.abs(totalPuntos - puntosMaximos) > 0.01) {
        setError(`Si introduces puntos, deben sumar exactamente ${puntosMaximos}`);
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

    try {
      setLoading(true);
      
      const inscripcionData = {
        usuarioId: user.id,
        epoca: epocaSeleccionada,
      }

      if (bandaSeleccionada){
        inscripcionData.faccion = bandaSeleccionada;
      }

      if (totalPuntos > 0) {
        if (usaTiposTropaPersonalizados) {
          // ✅ Edad de la Magia: guardar tipos personalizados
          inscripcionData.tiposTropaPersonalizados = tiposTropaPersonalizados;
        } else {
          // ✅ Bandas normales: guardar tipos estándar
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
          
          // ✅ Unidades especiales
          if (Object.keys(unidadesEspeciales).length > 0) {
            inscripcionData.unidadesEspeciales = unidadesEspeciales;
          }
        }

        // ✅ Opciones de banda
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

  const puntosMaximos = torneo?.puntos_banda || 24;
  let puntosActuales = 0;

  if (usaTiposTropaPersonalizados) {
    // Para Edad de la Magia
    Object.keys(tiposTropaPersonalizados).forEach(idTropa => {
      const cantidad = tiposTropaPersonalizados[idTropa];
      const config = configuracionBanda.tiposTropaPersonalizados?.find(t => t.id === idTropa);
      if (config) {
        puntosActuales += cantidad * config.puntos;
      }
    });
  } else {
    // Para bandas normales
    const totalUnidadesEspeciales = Object.values(unidadesEspeciales).reduce((acc, val) => acc + val, 0);
    puntosActuales = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios + 
                      puntos.elefantes + puntos.carros + puntos.tambor + puntos.curaids + 
                      puntos.perros + puntos.berserkers + totalUnidadesEspeciales;
  }
  const diferencia = puntosMaximos - puntosActuales;

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
            <span>{puntosMaximos} puntos</span>
          </div>
          
          <div className="dato-item">
            <label>Fecha:</label>
            <span>
              {torneo?.fecha_inicio 
                ? new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')
                : "N/A"}
            </span>
          </div>
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
          <small style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
            La época se detectará automáticamente según la banda seleccionada
          </small>
        </div>

        {bandaSeleccionada && tieneOpcionesBanda && (
          <section className="opciones-banda-section" style={{ marginTop: '1rem' }}>
            <h3>Configuración de la Banda</h3>
            {configuracionBanda.opcionesBanda.map((opcion) => (
              <div key={opcion.id} className="form-group">
                <label htmlFor={opcion.id}>
                  {opcion.label}
                  {opcion.obligatorio && <span style={{ color: 'red' }}> *</span>}
                </label>
                {opcion.tipo === 'select' && (
                  <select
                    id={opcion.id}
                    value={opcionesBanda[opcion.id] || ''}
                    onChange={(e) => handleOpcionBandaChange(opcion.id, e.target.value)}
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
          </section>
        )}

        {bandaSeleccionada && (
          <>
            <section className="puntos-section">
              <h3>Distribución de Puntos</h3>
              <p className="puntos-info">
                Total: <strong>{puntosActuales.toFixed(1)}</strong> / {puntosMaximos}
                {diferencia > 0 && (
                  <span className="puntos-faltantes"> ⚠️ Faltan {diferencia.toFixed(1)}</span>
                )}
                {diferencia < 0 && (
                  <span className="puntos-excedidos"> ⚠️ Excedido por {Math.abs(diferencia).toFixed(1)}</span>
                )}
              </p>

              <div className="puntos-grid">
                {/* ========================================
                    EDAD DE LA MAGIA - TIPOS PERSONALIZADOS
                    ======================================== */}
                {usaTiposTropaPersonalizados ? (
                  <>
                    {configuracionBanda.tiposTropaPersonalizados.map((tipo) => (
                      <div key={tipo.id} className="punto-item">
                        <label htmlFor={tipo.id}>
                          {tipo.label}
                        </label>
                        <input
                          type="number"
                          id={tipo.id}
                          name={tipo.id}
                          value={tiposTropaPersonalizados[tipo.id] || 0}
                          onChange={(e) => handleTropaPersonalizadaChange(tipo.id, e.target.value)}
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
                      <div className="punto-item">
                        <label htmlFor="guardias">Guardias</label>
                        <input
                          type="number"
                          id="guardias"
                          name="guardias"
                          value={puntos.guardias}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximos}
                          step="0.5"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* BERSERKERS */}
                    {permiteBerserkers && (
                      <div className="punto-item">
                        <label htmlFor="berserkers">Berserkers</label>
                        <input
                          type="number"
                          id="berserkers"
                          name="berserkers"
                          value={puntos.berserkers}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="1"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* ELEFANTES */}
                    {permiteElefantes && (
                      <div className="punto-item">
                        <label htmlFor="elefantes">Elefantes </label>
                        <input
                          type="number"
                          id="elefantes"
                          name="elefantes"
                          value={puntos.elefantes}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximos}
                          step="1"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* CARROS */}
                    {permiteCarros && (
                      <div className="punto-item">
                        <label htmlFor="carros">Carros </label>
                        <input
                          type="number"
                          id="carros"
                          name="carros"
                          value={puntos.carros}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximos}
                          step="1"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* TAMBOR */}
                    {permiteTambor && (
                      <div className="punto-item">
                        <label htmlFor="tambor">Tambor de Guerra </label>
                        <input
                          type="number"
                          id="tambor"
                          name="tambor"
                          value={puntos.tambor}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="1"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* CURAIDS */}
                    {permiteCuraids && (
                      <div className="punto-item">
                        <label htmlFor="curaids">Curaids </label>
                        <input
                          type="number"
                          id="curaids"
                          name="curaids"
                          value={puntos.curaids}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximos}
                          step="0.5"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* PERROS */}
                    {permitePerros && (
                      <div className="punto-item">
                        <label htmlFor="perros">Perros de Guerra</label>
                        <input
                          type="number"
                          id="perros"
                          name="perros"
                          value={puntos.perros}
                          onChange={handlePuntosChange}
                          min="0"
                          max="1"
                          step="0.5"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* ✅ UNIDADES ESPECIALES DINÁMICAS */}
                    {tieneUnidadesEspeciales && configuracionBanda.unidadesEspeciales.map((unidad) => (
                      <div key={unidad.nombre} className="punto-item">
                        <label htmlFor={unidad.nombre}>
                          {unidad.label} 
                          <small style={{ fontSize: '0.75rem', color: '#666', padding: '0.25rem'}}>
                            ({unidad.puntos} pts c/u)
                          </small>
                        </label>
                        <input
                          type="number"
                          id={unidad.nombre}
                          name={unidad.nombre}
                          value={unidadesEspeciales[unidad.nombre] || 0}
                          onChange={(e) => handleUnidadEspecialChange(unidad.nombre, e.target.value)}
                          min="0"
                          max="1"
                          step={unidad.step || 0.5}
                          disabled={loading}
                        />
                      </div>
                    ))}

                    {/* GUERREROS */}
                    {permiteGuerreros && (
                      <div className="punto-item">
                        <label htmlFor="guerreros">Guerreros</label>
                        <input
                          type="number"
                          id="guerreros"
                          name="guerreros"
                          value={puntos.guerreros}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximos}
                          step="0.5"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* LEVAS */}
                    {permiteLevas && (
                      <div className="punto-item">
                        <label htmlFor="levas">Levas</label>
                        <input
                          type="number"
                          id="levas"
                          name="levas"
                          value={puntos.levas}
                          onChange={handlePuntosChange}
                          min="0"
                          max={puntosMaximos}
                          step="0.5"
                          disabled={loading}
                        />
                      </div>
                    )}

                    {/* MERCENARIOS */}
                    {permiteMercenarios && (
                      <div className="punto-item">
                        <label htmlFor="mercenarios">Mercenarios</label>
                        <input
                          type="number"
                          id="mercenarios"
                          name="mercenarios"
                          value={puntos.mercenarios}
                          onChange={handlePuntosChange}
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