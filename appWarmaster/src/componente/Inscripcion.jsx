import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

import torneosSagaApi from '../servicios/apiSaga.js';

import '../estilos/inscripcion.css'; 

// ==========================================
// DATOS DE BANDAS POR ÉPOCA
// ==========================================
const BANDAS_POR_EPOCA = {
  "Antigüedad": [
    {nombre: "IBEROS" },
    { id: 2, nombre: "Cartagineses", puntos: 500 },
    { id: 3, nombre: "Griegos", puntos: 500 },
    { id: 4, nombre: "Persas", puntos: 500 },
    { id: 5, nombre: "Galos", puntos: 500 },
    { id: 6, nombre: "Germanos", puntos: 500 }
  ],
  "Vikingos": [
    { id: 7, nombre: "Bizantinos", puntos: 500 },
    { id: 8, nombre: "Vikingos", puntos: 500 },
    { id: 9, nombre: "Normandos", puntos: 500 },
    { id: 10, nombre: "Árabes", puntos: 500 },
    { id: 11, nombre: "Cruzados", puntos: 500 },
    { id: 12, nombre: "Mongoles", puntos: 500 }
  ],
  "Edad de la Magia": [
    { id: 13, nombre: "Tercios Españoles", puntos: 500 },
    { id: 14, nombre: "Otomanos", puntos: 500 },
    { id: 15, nombre: "Ingleses Tudor", puntos: 500 },
    { id: 16, nombre: "Franceses", puntos: 500 },
    { id: 17, nombre: "Suizos", puntos: 500 },
    { id: 18, nombre: "Alemanes", puntos: 500 }
  ]
};

function Inscripcion() {
  const navigate = useNavigate();
  const { torneoId } = useParams();
  const { user } = useAuth();
  
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
  // DEBUG - Ver qué datos llegan
  // ==========================================
  useEffect(() => {
    console.log("🔍 DEBUG - Usuario del contexto:", user);
    console.log("🔍 DEBUG - Torneo ID desde params:", torneoId);
  }, [user, torneoId]);

  // ==========================================
  // CARGAR DATOS DEL TORNEO
  // ==========================================
  useEffect(() => {
    const cargarTorneo = async () => {
      try {
        setLoading(true);
        setError("");
        
        console.log("📡 Cargando torneo con ID:", torneoId);
        const data = await torneosSagaApi.getTorneo(torneoId);
        
        console.log("📦 Respuesta completa de la API:", data);
        console.log("📊 Datos del torneo:", data.data);
        
        if (data.success && data.data) {
          // Verificar la estructura de datos
          const torneoData = data.data.torneo || data.data;
          console.log("✅ Torneo cargado:", torneoData);
          setTorneo(torneoData);
        } else {
          console.error("❌ No se pudo cargar el torneo:", data);
          setError(data.message || "No se pudo cargar el torneo");
        }
      } catch (err) {
        console.error("❌ Error al cargar torneo:", err);
        setError(err.message || "Error al cargar los datos del torneo");
      } finally {
        setLoading(false);
      }
    };

    if (torneoId) {
      cargarTorneo();
    } else {
      console.error("❌ No hay torneoId en los parámetros");
      setError("ID de torneo no encontrado");
      setLoading(false);
    }
  }, [torneoId]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPuntos((prev) => ({ ...prev, [name]: Number(value) }));

    if (name === "mercenarios" && Number(value) === 0) {
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

    const totalPuntos = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios;
    const puntosMaximos = torneo?.puntos_banda || 500;
    
    if (totalPuntos !== puntosMaximos) {
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

      console.log("📤 Enviando inscripción:", inscripcionData);
      const resultado = await torneosSagaApi.inscribirse(torneoId, inscripcionData);
      
      if (resultado.success) {
        alert("¡Inscripción realizada con éxito!");
        navigate(`/torneo/${torneoId}`);
      }
      
    } catch (err) {
      console.error("❌ Error al inscribirse:", err);
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
        <p>Cargando datos del torneo...</p>
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
  const bandasDisponibles = BANDAS_POR_EPOCA[torneo?.epoca_torneo || torneo?.epoca] || [];
  const puntosMaximos = torneo?.puntos_banda || 500;
  const puntosActuales = puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="inscripcion-container">
      <h1>Inscripción al Torneo: {torneo?.nombre || "Cargando..."}</h1>
      
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
              bandasDisponibles.map((banda) => (
                <option key={banda.id} value={banda.nombre}>
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
            Total: <strong>{puntosActuales}</strong> / {puntosMaximos} puntos
            {puntosActuales > puntosMaximos && (
              <span className="puntos-excedidos"> ⚠️ ¡Has excedido el límite!</span>
            )}
            {puntosActuales < puntosMaximos && (
              <span className="puntos-faltantes"> ⚠️ Te faltan {puntosMaximos - puntosActuales} puntos</span>
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
            Confirmar Inscripción
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