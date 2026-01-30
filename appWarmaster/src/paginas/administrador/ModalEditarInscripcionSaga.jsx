import React, { useState, useEffect } from 'react';
import { 
  procesarEpocasYBandas, 
  obtenerConfiguracionBanda, 
  permiteTipoTropa 
} from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

const ModalEditarInscripcionSaga = ({ 
  torneo, 
  onClose, 
  onGuardar 
}) => {
  const [epocaSeleccionada, setEpocaSeleccionada] = useState("");
  const [bandaSeleccionada, setBandaSeleccionada] = useState("");
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
  });
  const [unidadesEspeciales, setUnidadesEspeciales] = useState({});
  const [opcionesBanda, setOpcionesBanda] = useState({});
  const [tiposTropaPersonalizados, setTiposTropaPersonalizados] = useState({});
  const [detalleMercenarios, setDetalleMercenarios] = useState("");
  const [error, setError] = useState("");

  // Procesar épocas
  const { epocasArray, todasLasBandas, mapaBandaAEpoca } = React.useMemo(
    () => procesarEpocasYBandas(torneo?.epocas_disponibles),
    [torneo?.epocas_disponibles]
  );

  // Configuración de banda
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

  // Permisos
  const permiteElefantes = configuracionBanda.permiteElefantes;
  const permiteCarros = configuracionBanda.permiteCarros;
  const permiteTambor = configuracionBanda.permiteTambor;
  const permiteCuraids = configuracionBanda.permiteCuraids;
  const permitePerros = configuracionBanda.permitePerros;
  const permiteBerserkers = configuracionBanda.permiteBerserkers;
  const tieneUnidadesEspeciales = configuracionBanda.unidadesEspeciales?.length > 0;
  const tieneOpcionesBanda = configuracionBanda.opcionesBanda?.length > 0;
  const usaTiposTropaPersonalizados = configuracionBanda.tiposTropaPersonalizados !== null;
  
  const permiteGuardias = permiteTipoTropa(configuracionBanda, 'guardias');
  const permiteGuerreros = permiteTipoTropa(configuracionBanda, 'guerreros');
  const permiteLevas = permiteTipoTropa(configuracionBanda, 'levas');
  const permiteMercenarios = permiteTipoTropa(configuracionBanda, 'mercenarios');

  // Cargar datos existentes
  useEffect(() => {
    if (!torneo) return;

    let composicion = {};
    if (torneo.composicion_ejercito) {
      try {
        composicion = typeof torneo.composicion_ejercito === 'string'
          ? JSON.parse(torneo.composicion_ejercito)
          : torneo.composicion_ejercito;
      } catch (e) {
        console.error("Error al parsear composicion:", e);
      }
    }

    if (torneo.epoca) setEpocaSeleccionada(torneo.epoca);
    setBandaSeleccionada(torneo.faccion || "");
    
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
    });

    if (composicion.unidadesEspeciales) {
      setUnidadesEspeciales(composicion.unidadesEspeciales);
    }

    if (composicion.opcionesBanda) {
      setOpcionesBanda(composicion.opcionesBanda);
    }

    if (composicion.tiposTropaPersonalizados) {
      setTiposTropaPersonalizados(composicion.tiposTropaPersonalizados);
    }
    
    setDetalleMercenarios(composicion.detalleMercenarios || "");
  }, [torneo]);

  // Handlers
  const handleBandaChange = (e) => {
    const banda = e.target.value;
    setBandaSeleccionada(banda);
    
    if (banda && mapaBandaAEpoca[banda]) {
      setEpocaSeleccionada(mapaBandaAEpoca[banda]);
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

  const handleOpcionBandaChange = (idOpcion, valor) => {
    setOpcionesBanda(prev => ({
      ...prev,
      [idOpcion]: valor
    }));
  };

  const handleTropaPersonalizadaChange = (idTropa, value) => {
    const valorNumerico = parseFloat(value) || 0;
    setTiposTropaPersonalizados(prev => ({
      ...prev,
      [idTropa]: valorNumerico
    }));
  };

  const handleGuardar = () => {
    setError("");

    if (!epocaSeleccionada) {
      setError("Debes seleccionar una banda");
      return;
    }

    // Validar opciones obligatorias
    if (configuracionBanda.opcionesBanda?.length > 0) {
      for (const opcion of configuracionBanda.opcionesBanda) {
        if (opcion.obligatorio && !opcionesBanda[opcion.id]) {
          setError(`Debes seleccionar: ${opcion.label}`);
          return;
        }
      }
    }

    // Calcular total
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
                    puntos.perros + puntos.berserkers + totalUnidadesEspeciales;
    }

    totalPuntos = parseFloat(totalPuntos.toFixed(2));
    const puntosMaximos = torneo?.puntos_banda || 6;

    if (totalPuntos > 0 && Math.abs(totalPuntos - puntosMaximos) > 0.01) {
      setError(`Los puntos deben sumar exactamente ${puntosMaximos}`);
      return;
    }

    if (puntos.mercenarios > 0 && !detalleMercenarios.trim()) {
      setError("Debes especificar los mercenarios");
      return;
    }

    // Preparar datos
    const datos = {
      faccion: bandaSeleccionada,
      epoca: epocaSeleccionada,
      composicion_ejercito: usaTiposTropaPersonalizados 
        ? JSON.stringify({ tiposTropaPersonalizados })
        : JSON.stringify({
            guardias: puntos.guardias,
            guerreros: puntos.guerreros,
            levas: puntos.levas,
            mercenarios: puntos.mercenarios,
            elefantes: puntos.elefantes,
            carros: puntos.carros,
            tambor: puntos.tambor,
            curaids: puntos.curaids,
            perros: puntos.perros,
            berserkers: puntos.berserkers,
            unidadesEspeciales,
            opcionesBanda,
            detalleMercenarios
          })
    };

    onGuardar(datos);
  };

  // Calcular puntos actuales
  const puntosMaximos = torneo?.puntos_banda || 6;
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
                      puntos.perros + puntos.berserkers + totalUnidadesEspeciales;
  }
  const diferencia = puntosMaximos - puntosActuales;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-editar-saga" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Editar Inscripción SAGA</h3>
          <button onClick={onClose} className="btn-cerrar">✕</button>
        </div>

        <div className="modal-body">
          <div className="info-torneo-inscripcion">
            <p><strong>Torneo:</strong> {torneo.nombre_torneo}</p>
            <p><strong>Puntos Banda:</strong> {puntosMaximos}</p>
            <p><strong>Épocas:</strong> {epocasArray.join(', ')}</p>
          </div>

          {error && (
            <div className="error-message" style={{ margin: '1rem 0', padding: '0.75rem', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c00' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-inscripcion-saga">
            {/* BANDA */}
            <div className="form-group">
              <label>Banda</label>
              <select
                value={bandaSeleccionada}
                onChange={handleBandaChange}
                className="input-form"
              >
                <option value="">-- Seleccionar Banda --</option>
                {todasLasBandas.map((banda, index) => (
                  <option key={index} value={banda.nombre}>
                    {banda.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* OPCIONES DE BANDA */}
            {bandaSeleccionada && tieneOpcionesBanda && (
              <div className="opciones-banda-section">
                <h4>Configuración de la Banda</h4>
                {configuracionBanda.opcionesBanda.map((opcion) => (
                  <div key={opcion.id} className="form-group">
                    <label>
                      {opcion.label}
                      {opcion.obligatorio && <span style={{ color: 'red' }}> *</span>}
                    </label>
                    <select
                      value={opcionesBanda[opcion.id] || ''}
                      onChange={(e) => handleOpcionBandaChange(opcion.id, e.target.value)}
                      className="input-form"
                    >
                      <option value="">-- Seleccionar --</option>
                      {opcion.opciones.map((opt) => (
                        <option key={opt.valor} value={opt.valor}>
                          {opt.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* PUNTOS */}
            {bandaSeleccionada && (
              <div className="puntos-section">
                <h4>
                  Distribución de Puntos
                  <span style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
                    {puntosActuales.toFixed(1)} / {puntosMaximos}
                    {diferencia !== 0 && (
                      <span style={{ color: diferencia > 0 ? '#e74c3c' : '#27ae60', marginLeft: '0.5rem' }}>
                        ({diferencia > 0 ? `Faltan ${diferencia.toFixed(1)}` : `Excedido por ${Math.abs(diferencia).toFixed(1)}`})
                      </span>
                    )}
                  </span>
                </h4>

                <div className="puntos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {usaTiposTropaPersonalizados ? (
                    <>
                      {configuracionBanda.tiposTropaPersonalizados.map((tipo) => (
                        <div key={tipo.id} className="form-group">
                          <label>{tipo.label}</label>
                          <input
                            type="number"
                            value={tiposTropaPersonalizados[tipo.id] || 0}
                            onChange={(e) => handleTropaPersonalizadaChange(tipo.id, e.target.value)}
                            min="0"
                            step={tipo.step || 0.5}
                            className="input-form"
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {permiteGuardias && (
                        <div className="form-group">
                          <label>Guardias</label>
                          <input type="number" name="guardias" value={puntos.guardias} onChange={handlePuntosChange} min="0" step="0.5" className="input-form" />
                        </div>
                      )}
                      
                      {permiteBerserkers && (
                        <div className="form-group">
                          <label>Berserkers</label>
                          <input type="number" name="berserkers" value={puntos.berserkers} onChange={handlePuntosChange} min="0" step="1" max="1" className="input-form" />
                        </div>
                      )}

                      {permiteElefantes && (
                        <div className="form-group">
                          <label>Elefantes</label>
                          <input type="number" name="elefantes" value={puntos.elefantes} onChange={handlePuntosChange} min="0" step="1" className="input-form" />
                        </div>
                      )}

                      {permiteCarros && (
                        <div className="form-group">
                          <label>Carros</label>
                          <input type="number" name="carros" value={puntos.carros} onChange={handlePuntosChange} min="0" step="1" className="input-form" />
                        </div>
                      )}

                      {permiteTambor && (
                        <div className="form-group">
                          <label>Tambor</label>
                          <input type="number" name="tambor" value={puntos.tambor} onChange={handlePuntosChange} min="0" step="1" max="1" className="input-form" />
                        </div>
                      )}

                      {permiteCuraids && (
                        <div className="form-group">
                          <label>Curaids</label>
                          <input type="number" name="curaids" value={puntos.curaids} onChange={handlePuntosChange} min="0" step="0.5" className="input-form" />
                        </div>
                      )}

                      {permitePerros && (
                        <div className="form-group">
                          <label>Perros</label>
                          <input type="number" name="perros" value={puntos.perros} onChange={handlePuntosChange} min="0" step="0.5" max="1" className="input-form" />
                        </div>
                      )}

                      {tieneUnidadesEspeciales && configuracionBanda.unidadesEspeciales.map((unidad) => (
                        <div key={unidad.nombre} className="form-group">
                          <label>{unidad.label} ({unidad.puntos} pts)</label>
                          <input
                            type="number"
                            value={unidadesEspeciales[unidad.nombre] || 0}
                            onChange={(e) => handleUnidadEspecialChange(unidad.nombre, e.target.value)}
                            min="0"
                            step={unidad.step || 0.5}
                            max="1"
                            className="input-form"
                          />
                        </div>
                      ))}

                      {permiteGuerreros && (
                        <div className="form-group">
                          <label>Guerreros</label>
                          <input type="number" name="guerreros" value={puntos.guerreros} onChange={handlePuntosChange} min="0" step="0.5" className="input-form" />
                        </div>
                      )}

                      {permiteLevas && (
                        <div className="form-group">
                          <label>Levas</label>
                          <input type="number" name="levas" value={puntos.levas} onChange={handlePuntosChange} min="0" step="0.5" className="input-form" />
                        </div>
                      )}

                      {permiteMercenarios && (
                        <div className="form-group">
                          <label>Mercenarios</label>
                          <input type="number" name="mercenarios" value={puntos.mercenarios} onChange={handlePuntosChange} min="0" step="0.5" className="input-form" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* DETALLE MERCENARIOS */}
                {puntos.mercenarios > 0 && permiteMercenarios && !usaTiposTropaPersonalizados && (
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Detalle de Mercenarios ({puntos.mercenarios} pts)</label>
                    <textarea
                      value={detalleMercenarios}
                      onChange={(e) => setDetalleMercenarios(e.target.value)}
                      placeholder="Ej: Arqueros Cretenses, Caballería Occidental..."
                      rows="3"
                      className="input-form textarea-form"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancelar">
            Cancelar
          </button>
          <button onClick={handleGuardar} className="btn-guardar">
            💾 Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarInscripcionSaga;