import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

import torneosSagaApi from '../servicios/apiSaga.js';

import '../estilos/inscripcion.css'; 

// ==========================================
// DATOS DE BANDAS POR ÉPOCA
// ==========================================
const BANDAS_POR_EPOCA = {
  "Vikingos": [
    {nombre: "VIKINGOS" },
    {nombre: "JOMSVIKINGS" },
    {nombre: "GALESES" },
    {nombre: "ANGLO-DANESES" },
    {nombre: "ANGLO-SAJONES" },
    {nombre: "NORSE-GAELS" },
    {nombre: "CAROLINGIOS" },
    {nombre: "NORMANDOS" },
    {nombre: "IRLANDESES" },
    {nombre: "PAGAN RUSS" },
    {nombre: "ESCOTOS" },
    {nombre: "ÚLTIMOS ROMANOS" },
    {nombre: "PUEBLOS GERMÁNICOS" },
    {nombre: "LOMBARDOS" },
    {nombre: "PUEBLOS DE LAS ESTEPAS" },
    {nombre: "OMEYAS" }
  ],
  "Invasiones": [
   {nombre: "ROMANOS" },
    {nombre: "GODOS" },
    {nombre: "GALESES" },
    {nombre: "FRANCOS" },
    {nombre: "BRITANOS" },
    {nombre: "SAJONES" },
    {nombre: "PICTOS" },
    {nombre: "HUNOS" },
    {nombre: "SASÁNIDAS" },
    {nombre: "ESCOTOS" },
    {nombre: "ALT CLUT Y MANACO GODODDIN" },
    {nombre: "CYMRY" },
    {nombre: "VÁNDALOS" },
  ],
  "Edad de la Magia": [
   {nombre: "GRANDES REINOS" },
    {nombre: "SEÑORES DE LA NATURALEZA" },
    {nombre: "LEGIONES DE LOS NO MUERTOS" },
    {nombre: "LA HORDA" },
    {nombre: "OTROS MUNDOS" },
    {nombre: "PUEBLOS SUBTERRÁNEOS" }
  ],
  "Ánibal": [
    {nombre: "IBEROS" },
    {nombre: "CARTAGINESES" },
    {nombre: "GALESES" },
    {nombre: "REPÚBLICA DE ROMA" },
    {nombre: "GALOS"},
    {nombre: "NÚMIDAS" },
    {nombre: "GRAECULI-SIRACUSSA" },
    {nombre: "GRAECULI-EPIRO" },
    {nombre: "GRAECULI-ITALIOTAS" }
  ],
  "Alejandro": [
    {nombre: "PERSAS-MEDOS" },
    {nombre: "PERSAS-AQUEMÉNIDAS" },
    {nombre: "TRACIOS" },
    {nombre: "MACEDONIOS" },
    {nombre: "INDIOS" },
    {nombre: "SUCESORES-GRECIA" },
    {nombre: "SUCESORES-EGIPTO" },
    {nombre: "SUCESORES-ASIA" },
    {nombre: "CIUDADES GRIEGAS-ATENAS" },
    {nombre: "CIUDADES GRIEGAS-LACEDEMONIOS" },
    {nombre: "CIUDADES GRIEGAS-TESALIOS" },
    {nombre: "CIUDADES GRIEGAS-TEBANOS" }
  ],
  "Cruzadas": [
    {nombre: "BIZANTINOS" },
    {nombre: "CRUZADAS" },
    {nombre: "ORDENSTAAT" },
    {nombre: "MOROS" },
    {nombre: "MILITES CHRISTI" },
    {nombre: "MUTTATAWI'A" },
    {nombre: "PUEBLOS PAGANOS" },
    {nombre: "POLACOS" },
    {nombre: "SARRACERNOS" },
    {nombre: "ESPAÑOLES" },
    {nombre: "MONGOLES" },
    {nombre: "CUMANOS" },
    {nombre: "INCURSORES PAGANOS" },
    {nombre: "ARMENIOS DE CILICIA" },
    {nombre: "HÚNGAROS DE ÁRPÁD" },
    {nombre: "CRUZADOS DE MONTFORT" },
    {nombre: "CÁTAROS" }
  ],
  "Caballeria": [
    {nombre: "INGLESES" },
    {nombre: "FRANCESES" },
    {nombre: "FRANCESES-COMPAÑIA DE ORDENANZA" },
    {nombre: "COMPAÑIAS LIBRES" },
    {nombre: "BORGOÑESES" },
    {nombre: "BORGOÑESES-COMPAÑIA DE ORDENANZA" },
    {nombre: "FLAMENCOS" },
    {nombre: "ESCOCESES-SCHILTRONS" },
    {nombre: "ESCOCESES-COMPAÑIAS PROFESIONALES" },
    {nombre: "SUIZOS" },
    {nombre: "BRETONES" },
    {nombre: "CASTELLANOS" },
    {nombre: "GERMANOS" },
    {nombre: "HUSITAS" },
    {nombre: "CONDOTIEROS-FLORENCIA" },
    {nombre: "CONDOTIEROS-ESTADOS PONTIFICIOS" },
    {nombre: "CONDOTIEROS-MILÁN" },
    {nombre: "CONDOTIEROS-REINO DE NÁPOLES" },
    {nombre: "CONDOTIEROS-VENECIA" },
    {nombre: "YORK" },
    {nombre: "LANCASTER" }
  ],
};

function Inscripcion() {
  const navigate = useNavigate();
  const { torneoId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  
  // ✅ DETECTAR MODO EDICIÓN
  const modoEdicion = location.pathname.includes('editar-inscripcion');
  
  // Estados
  const [torneo, setTorneo] = useState(null);
  const [bandaSeleccionada, setBandaSeleccionada] = useState("");
  const [puntos, setPuntos] = useState({
    guardias: 0,
    guerreros: 0,
    levas: 0,
    mercenarios: 0,
  });
  const [detalleMercenarios, setDetalleMercenarios] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // CARGAR DATOS DEL TORNEO Y LA INSCRIPCIÓN
  // ==========================================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log("📡 Cargando torneo con ID:", torneoId);
        
        // Cargar torneo
        const dataTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
        
        if (dataTorneo.success && dataTorneo.data) {
          const torneoData = dataTorneo.data.torneo || dataTorneo.data;
          console.log("✅ Torneo cargado:", torneoData);
          setTorneo(torneoData);
        }

        // ✅ SI ES MODO EDICIÓN, CARGAR INSCRIPCIÓN EXISTENTE
if (modoEdicion) {
  try {
    console.log("📝 Modo edición - Cargando inscripción existente...");
    const dataInscripcion = await torneosSagaApi.obtenerMiInscripcion(torneoId);
    
    if (dataInscripcion.success && dataInscripcion.data) {
      const inscripcion = dataInscripcion.data;
      console.log("✅ Inscripción cargada:", inscripcion);
      
      // Pre-llenar el formulario con los datos existentes
      setBandaSeleccionada(inscripcion.faccion || inscripcion.banda_tipo || "");
      setPuntos({
        guardias: parseFloat(inscripcion.puntos_guardias || 0),
        guerreros: parseFloat(inscripcion.puntos_guerreros || 0),
        levas: parseFloat(inscripcion.puntos_levas || 0),
        mercenarios: parseFloat(inscripcion.puntos_mercenarios || 0),
      });
      setDetalleMercenarios(inscripcion.detalle_mercenarios || "");
    }
  } catch (err) {
    console.error("❌ Error al cargar inscripción:", err);
    setError("No se pudo cargar tu inscripción actual");
  }
}
        
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
        setError(err.message || "Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    if (torneoId) {
      cargarDatos();
    } else {
      console.error("❌ No hay torneoId en los parámetros");
      setError("ID de torneo no encontrado");
      setLoading(false);
    }
  }, [torneoId, modoEdicion]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuntos((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));

    if (name === "mercenarios" && parseFloat(value) === 0) {
      setDetalleMercenarios("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!user || !user.id) {
      setError("No hay usuario autenticado");
      return;
    }
    
    if (!bandaSeleccionada) {
      setError("Debes seleccionar una banda");
      return;
    }

    const totalPuntos = parseFloat(
      (puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios).toFixed(2)
    );
    const puntosMaximos = torneo?.puntos_banda || 24;
    
    if (Math.abs(totalPuntos - puntosMaximos) > 0.01) {
      setError(`Los puntos deben sumar exactamente ${puntosMaximos}`);
      return;
    }

    if (puntos.mercenarios > 0 && !detalleMercenarios.trim()) {
      setError("Debes especificar qué mercenarios usarás");
      return;
    }

    try {
      const inscripcionData = {
        usuarioId: user.id,
        bandaTipo: bandaSeleccionada,
        puntosGuardias: puntos.guardias,
        puntosGuerreros: puntos.guerreros,
        puntosLevas: puntos.levas,
        puntosMercenarios: puntos.mercenarios,
        detalleMercenarios: detalleMercenarios || null
      };

      console.log("📤 ==========================================");
      console.log(`📤 ${modoEdicion ? 'EDITANDO' : 'CREANDO'} INSCRIPCIÓN`);
      console.log("📤 Torneo ID:", torneoId);
      console.log("📤 User ID:", user.id);
      console.log("📤 Datos:", inscripcionData);
      console.log("📤 ==========================================");

      let resultado;
      
      if (modoEdicion) {
        // ✅ ACTUALIZAR INSCRIPCIÓN EXISTENTE
        resultado = await torneosSagaApi.actualizarInscripcion(torneoId, inscripcionData);
        alert("✅ ¡Inscripción actualizada con éxito!");
      } else {
        // ✅ CREAR NUEVA INSCRIPCIÓN
        resultado = await torneosSagaApi.inscribirse(torneoId, inscripcionData);
        alert("✅ ¡Inscripción realizada con éxito!");
      }
      
      if (resultado.success) {
        navigate('/');
      }
      
    } catch (err) {
      console.error("❌ Error al procesar inscripción:", err);
      setError(err.message || "Error al procesar la inscripción");
    }
  };

  const volverAtras = () => {
    navigate(-1);
  };

  // ==========================================
  // LOADING Y ERROR STATES
  // ==========================================
  if (loading) {
    return (
      <div className="loading-container">
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error && !torneo) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={volverAtras}>Volver</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-container">
        <p>No hay usuario autenticado. Por favor, inicia sesión.</p>
        <button onClick={() => navigate('/login')}>Ir a Login</button>
      </div>
    );
  }

  // Obtener bandas disponibles según la época del torneo
  const bandasDisponibles = BANDAS_POR_EPOCA[torneo?.epoca_torneo] || [];
  const puntosMaximos = torneo?.puntos_banda || 24;
  const puntosActuales = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="inscripcion-container">
      {/* ✅ TÍTULO DINÁMICO SEGÚN MODO */}
      <h1>
        {modoEdicion ? '✏️ Editar Inscripción' : '📝 Inscripción al Torneo'}: {torneo?.nombre || "Cargando..."}
      </h1>
      
      {modoEdicion && (
        <div className="info-message">
          ℹ️ Estás editando tu inscripción actual. Realiza los cambios necesarios y confirma.
        </div>
      )}
      
      {/* INFORMACIÓN DEL USUARIO */}
      <section className="info-usuario">
        <h2>Datos del Participante</h2>
        <div className="datos-grid">
          <div className="dato-item">
            <label>Nombre:</label>
            <span>
              {user?.nombre || "N/A"} {user?.apellidos || ""}
            </span>
          </div>
          
          <div className="dato-item">
            <label>Email:</label>
            <span>{user?.email || "N/A"}</span>
          </div>
          
          {user?.club && (
            <div className="dato-item">
              <label>Club:</label>
              <span>{user.club}</span>
            </div>
          )}
        </div>
      </section>

      {/* INFORMACIÓN DEL TORNEO */}
      <section className="info-torneo">
        <h2>Detalles del Torneo</h2>
        <div className="datos-grid">
          <div className="dato-item">
            <label>Época:</label>
            <span className="epoca-badge">
              {torneo?.epoca_torneo || torneo?.epoca || "N/A"}
            </span>
          </div>
          
          <div className="dato-item">
            <label>Puntos Máximos:</label>
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

      {/* FORMULARIO DE INSCRIPCIÓN */}
      <form onSubmit={handleSubmit} className="inscripcion-form">
        
        {error && <div className="error-message">{error}</div>}

        {/* SELECCIÓN DE BANDA */}
        <div className="form-group">
          <label htmlFor="bandaTipo">Selecciona tu banda:</label>
          <select
            id="bandaTipo"
            value={bandaSeleccionada}
            onChange={(e) => setBandaSeleccionada(e.target.value)}
            required
          >
            <option value="">-- Selecciona una banda --</option>
            {bandasDisponibles.length > 0 ? (
              bandasDisponibles.map((banda, index) => (
                <option key={index} value={banda.nombre}>
                  {banda.nombre}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No hay bandas disponibles para esta época
              </option>
            )}
          </select>
        </div>

        {/* DISTRIBUCIÓN DE PUNTOS */}
        <section className="puntos-section">
          <h3>Distribución de Puntos</h3>
          <p className="puntos-info">
            Total: <strong>{puntosActuales.toFixed(1)}</strong> / {puntosMaximos} puntos
            {puntosActuales > puntosMaximos && (
              <span className="puntos-excedidos"> ⚠️ ¡Has excedido el límite!</span>
            )}
            {puntosActuales < puntosMaximos && (
              <span className="puntos-faltantes"> ⚠️ Te faltan {(puntosMaximos - puntosActuales).toFixed(1)} puntos</span>
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
                onChange={handleChange}
                min="0"
                max={puntosMaximos}
                step="0.5"
              />
            </div>

            <div className="punto-item">
              <label htmlFor="guerreros">Guerreros</label>
              <input
                type="number"
                id="guerreros"
                name="guerreros"
                value={puntos.guerreros}
                onChange={handleChange}
                min="0"
                max={puntosMaximos}
                step="0.5"
              />
            </div>

            <div className="punto-item">
              <label htmlFor="levas">Levas</label>
              <input
                type="number"
                id="levas"
                name="levas"
                value={puntos.levas}
                onChange={handleChange}
                min="0"
                max={puntosMaximos}
                step="0.5"
              />
            </div>

            <div className="punto-item">
              <label htmlFor="mercenarios">Mercenarios</label>
              <input
                type="number"
                id="mercenarios"
                name="mercenarios"
                value={puntos.mercenarios}
                onChange={handleChange}
                min="0"
                max={puntosMaximos}
                step="0.5"
              />
            </div>
          </div>

          {/* DETALLE DE MERCENARIOS */}
          {puntos.mercenarios > 0 && (
            <div className="form-group mercenarios-detalle">
              <label htmlFor="detalleMercenarios">
                Especificar mercenarios ({puntos.mercenarios} puntos):
              </label>
              <textarea
                id="detalleMercenarios"
                value={detalleMercenarios}
                onChange={(e) => setDetalleMercenarios(e.target.value)}
                placeholder="Ejemplo: Arqueros Cretenses (50 pts), Caballería Occidental (100 pts)..."
                rows="3"
                required
              />
            </div>
          )}
        </section>

        {/* BOTONES */}
        <div className="button-group">
          <button type="submit" className="btn-primary">
            {modoEdicion ? '✅ Guardar Cambios' : '✅ Confirmar Inscripción'}
          </button>
          <button type="button" className="btn-secondary" onClick={volverAtras}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default Inscripcion;