// componentesSaga/inscripciones/inscripcionSagaIndividual.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import torneosSagaApi from '../../servicios/apiSaga.js';
import { obtenerBandasDisponibles } from '@/componentesSaga/funcionesSaga/constantesFuncionesSaga';

import Footer from '@/paginas/Footer.jsx'
import '../../estilos/inscripcion.css';

function InscripcionSagaIndividual({ torneoId, torneo, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detectar si es modo edición
  const modoEdicion = location.pathname.includes('editar-inscripcion') || location.pathname.includes('actualizarInscripcion');
  
  // Estados
  const [epocaSeleccionada, setEpocaSeleccionada] = useState("");
  const [bandaSeleccionada, setBandaSeleccionada] = useState("");
  const [puntos, setPuntos] = useState({
    guardias: 0,
    guerreros: 0,
    levas: 0,
    mercenarios: 0,
  });
  const [detalleMercenarios, setDetalleMercenarios] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          
          // Parsear composición si es JSON string
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
          
          // Pre-llenar formulario
          if (inscripcion.epoca) setEpocaSeleccionada(inscripcion.epoca);
          setBandaSeleccionada(inscripcion.faccion || "");
          
          setPuntos({
            guardias: parseFloat(composicion.guardias || inscripcion.puntos_guardias || 0),
            guerreros: parseFloat(composicion.guerreros || inscripcion.puntos_guerreros || 0),
            levas: parseFloat(composicion.levas || inscripcion.puntos_levas || 0),
            mercenarios: parseFloat(composicion.mercenarios || inscripcion.puntos_mercenarios || 0),
          });
          
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
  // AUTO-SELECCIONAR ÉPOCA ÚNICA
  // ==========================================

  useEffect(() => {
    if (torneo && !modoEdicion) {
      const epocas = torneo.epocas_disponibles;
      if (epocas) {
        // Tomar la primera época disponible
        const primeraEpoca = epocas.split(',')[0].trim();
        setEpocaSeleccionada(primeraEpoca);
      }
    }
  }, [torneo, modoEdicion]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handlePuntosChange = (e) => {
    const { name, value } = e.target;
    const valorNumerico = parseFloat(value) || 0;
    
    setPuntos((prev) => ({ ...prev, [name]: valorNumerico }));

    // Limpiar detalle si mercenarios = 0
    if (name === "mercenarios" && valorNumerico === 0) {
      setDetalleMercenarios("");
    }
  };

  const eliminarInscripcion = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar tu inscripción?')) {
      return;
    }

    if (!user?.id) {
      setError ("No se puedo obtener tu ID de usuario")
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
    
    // Validaciones
    if (!user?.id) {
      setError("No hay usuario autenticado");
      return;
    }
    
    if (!epocaSeleccionada) {
      setError("No se pudo cargar época del torneo");
      return;
    }

    const totalPuntos = parseFloat(
    (puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios).toFixed(2)
  );

    if (totalPuntos > 0) {
      const puntosMaximos = torneo?.puntos_banda || 24;
      
      if (Math.abs(totalPuntos - puntosMaximos) > 0.01) {
        setError(`Si introduces puntos, deben sumar exactamente ${puntosMaximos}`);
        return;
      }

      // Si hay puntos, debe haber banda también
      if (!bandaSeleccionada) {
        setError("Si introduces puntos, debes seleccionar una banda");
        return;
      }

      // Si hay mercenarios, validar detalle
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
          inscripcionData.puntosGuardias = puntos.guardias,
          inscripcionData.puntosGuerreros = puntos.guerreros,
          inscripcionData.puntosLevas = puntos.levas,
          inscripcionData.puntosMercenarios = puntos.mercenarios
        
        if (detalleMercenarios){
          inscripcionData.detalleMercenarios =  detalleMercenarios
        };
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


  // CÁLCULOS Y DATOS
 
  const bandasDisponibles = epocaSeleccionada && epocaSeleccionada.trim() !== ' '
    ? obtenerBandasDisponibles(epocaSeleccionada)
    : []

  const puntosMaximos = torneo?.puntos_banda || 24;
  const puntosActuales = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios;
  const diferencia = puntosMaximos - puntosActuales;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="inscripcion-container">
      
      {/* TÍTULO */}
      <h1>
        {modoEdicion ? '✏️ Editar Inscripción' : '📝 Inscripción'}: {torneo?.nombre_torneo}
      </h1>
      
      {modoEdicion && (
        <div className="info-message">
          ℹ️ Editando tu inscripción actual
        </div>
      )}
      
      {/* DATOS DEL PARTICIPANTE */}
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

      {/* DATOS DEL TORNEO */}
      <section className="info-torneo">
        <h2>Detalles del Torneo</h2>
        <div className="datos-grid">
          <div className="dato-item">
            <span className="epoca-badge">
              {torneo?.epocas_disponibles || epocaSeleccionada}
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

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="inscripcion-form">
        
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* SELECTOR DE BANDA */}
        {epocaSeleccionada && (
            <div className="form-group">
              <label htmlFor="banda">Banda:</label>
              <select
                id="banda"
                value={bandaSeleccionada}
                onChange={(e) => setBandaSeleccionada(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Completar después --</option>
                {bandasDisponibles.map((banda, index) => (
                  <option key={index} value={banda.nombre}>
                    {banda.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

        {/* DISTRIBUCIÓN DE PUNTOS */}
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
              </div>

              {/* DETALLE MERCENARIOS */}
              {puntos.mercenarios > 0 && (
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
       {/* BOTONES */}
            <div className="button-group">
              <button 
                type="submit" 
                onClick={handleSubmit}
                className="btn-primary" 
                disabled={loading || !epocaSeleccionada}
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