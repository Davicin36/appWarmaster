// componentesSaga/inscripciones/inscripcionSagaIndividual.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import torneosWarmasterApi from '@/servicios/apiWarmaster.js';
import { EJERCITOS_WARMASTER } from '@/componentesWarmaster/funcionesWarmaster/constantesFuncionesWarmaster';

import '@/estilos/inscripcion.css';

function InscripcionWarmasterIndividual({ torneoId, torneo, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detectar si es modo edición
  const modoEdicion = location.pathname.includes('editar-inscripcion') || location.pathname.includes('actualizarInscripcion');
  
  // Estados
  const [ejercitoSeleccionado, setEjercitoSeleccionado] = useState("");
  const [archivoPDF, setArchivoPDF] = useState(null);
  const [pdfActual, setPdfActual] = useState(null); 
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
        const dataInscripcion = await torneosWarmasterApi.obtenerIncripcion(torneoId);
        
        if (dataInscripcion.success && dataInscripcion.data) {
          const inscripcion = dataInscripcion.data;
          
          setEjercitoSeleccionado(inscripcion.ejercito || "");
          
          // Si hay lista PDF, guardar metadata
          if (inscripcion.lista_nombre) {
            setPdfActual({
              nombre: inscripcion.lista_nombre,
              tamaño: inscripcion.lista_tamaño
            });
          }
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
  // HANDLERS
  // ==========================================

  const handleArchivoPDF = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setArchivoPDF(null);
      return;
    }
    
    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      setError('⚠️ Solo se permiten archivos PDF');
      e.target.value = '';
      setArchivoPDF(null);
      setTimeout(() => setError(''), 4000);
      return;
    }
    
    // Validar tamaño (máximo 5MB)
    const maxSize = 16 * 1024 * 1024;
    if (file.size > maxSize) {
      const tamañoMB = (file.size / 1024 / 1024).toFixed(2);
      setError(`⚠️ El archivo PDF (${tamañoMB}MB) supera el tamaño máximo de 5MB`);
      e.target.value = '';
      setArchivoPDF(null);
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    setArchivoPDF(file);
    setError('');
  };

  const handleEliminarPDF = () => {
    setArchivoPDF(null);
    const fileInput = document.getElementById('listaPDF');
    if (fileInput) {
      fileInput.value = '';
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
    const resultado = await torneosWarmasterApi.eliminarJugadorTorneo(torneoId, user.id);

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

    if (!ejercitoSeleccionado) {
      setError("Debes seleccionar un ejército");
      return;
    }

    try {
      setLoading(true);
      
      let inscripcionData;
      
      if (archivoPDF) {
        inscripcionData = new FormData();
        inscripcionData.append('ejercito', ejercitoSeleccionado);
        inscripcionData.append('lista_ejercito', archivoPDF);
      } else {
        inscripcionData = {
          ejercito: ejercitoSeleccionado
        };
      }

      let resultado;
      
      if (modoEdicion) {
        resultado = await torneosWarmasterApi.actualizarInscripcion(torneoId, inscripcionData);
        alert("✅ ¡Inscripción actualizada con éxito!");
      } else {
        resultado = await torneosWarmasterApi.inscribirse(torneoId, inscripcionData);
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


  const puntosMaximos = torneo?.puntos_Ejercito || 2000;

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
              <label>Pais:</label>
              <span>{user.pais}</span>
            </div>
          )}
        </div>
      </section>

      {/* DATOS DEL TORNEO */}
      <section className="info-torneo">
        <h2>Detalles del Torneo</h2>
        <div className="datos-grid">
          <div className="dato-item">
            <label>Puntos Máximos del Ejército:</label>
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

        {/* SELECCIÓN DE EJÉRCITO */}
        <fieldset>
          <legend>⚔️ Selección de Ejército</legend>
          
          <div className="form-group">
            <label htmlFor="ejercito">Ejército:*</label>
            <select
              id="ejercito"
              value={ejercitoSeleccionado}
              onChange={(e) => setEjercitoSeleccionado(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Selecciona un ejército --</option>
              {EJERCITOS_WARMASTER.map((ejercito, index) => (
                <option key={index} value={ejercito.nombre}>
                  {ejercito.nombre}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* SUBIR LISTA DE EJÉRCITO (OPCIONAL) */}
        <fieldset>
          <legend>📄 Lista de Ejército (Opcional)</legend>
          
          {pdfActual && !archivoPDF && (
            <div className="pdf-actual">
              <p>📎 Lista actual: <strong>{pdfActual.nombre}</strong></p>
              <p className="pdf-size">Tamaño: {(pdfActual.tamaño / 1024).toFixed(2)} KB</p>
              <small>Sube un nuevo archivo para reemplazarla</small>
            </div>
          )}

          {!archivoPDF ? (
            <>
              <label htmlFor="listaPDF">Subir Lista en PDF:</label>
              <input 
                id="listaPDF" 
                type="file"
                accept=".pdf"
                onChange={handleArchivoPDF}
                disabled={loading}
              />
              <small className="help-text-file">
                📎 Formato: PDF | Tamaño máximo: 5MB
              </small>
            </>
          ) : (
            <div className="archivo-seleccionado-container">
              <div className="archivo-info">
                <p className="archivo-nombre">
                  ✅ <strong>Nuevo archivo:</strong> {archivoPDF.name}
                </p>
                <p className="archivo-tamaño">
                  📦 Tamaño: {(archivoPDF.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleEliminarPDF}
                className="btn-eliminar-pdf"
                disabled={loading}
              >
                🗑️ Quitar archivo
              </button>
            </div>
          )}
        </fieldset>
        
        {/* BOTONES */}
        <div className="button-group">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !ejercitoSeleccionado}
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
            ← Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default InscripcionWarmasterIndividual;