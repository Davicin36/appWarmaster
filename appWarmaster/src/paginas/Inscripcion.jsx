import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext.jsx";

import torneosSagaApi from '../servicios/apiSaga.js';
import torneosWarmasterApi from '../servicios/apiWarmaster.js'

// Componentes de inscripción
import { REGISTRO_INSCRIPCIONES } from '../funciones/registroInscripciones.js';

import '../estilos/inscripcion.css';


function Inscripcion() {
  const navigate = useNavigate();
  const { torneoId } = useParams();
  const { user } = useAuth();
  
  const [torneo, setTorneo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // CARGAR DATOS DEL TORNEO
  // ==========================================
  useEffect(() => {
    const cargarTorneo = async () => {
      try {
        setLoading(true);
        setError("");

        let dataTorneo = null
        let torneoData = null

        try {

          dataTorneo = await torneosSagaApi.obtenerTorneo(torneoId);
          
          if (dataTorneo.success && dataTorneo.data) {
            torneoData = dataTorneo.data.torneo || dataTorneo.data
          }
        } catch (sagaError) {
          console.log('No es un torneo SAGA, intentando WARMASTER...', sagaError);
        }

        if (!torneoData){
          try {
            dataTorneo = await torneosWarmasterApi.obtenerTorneo(torneoId)
            if(dataTorneo.success && dataTorneo.data) {
              torneoData = dataTorneo.data.torneo || dataTorneo.data
            }
          } catch (warmasterError) {
            console.error('No es un torneo WARMASTER tampoco', warmasterError);
          }
        }

        if (torneoData){
          setTorneo(torneoData)
        } else {
          setError ("No se puedo cargar el torneo")
        }

      } catch (err) {
          console.error("❌ Error al cargar torneo:", err);
          setError(err.message || "Error al cargar el torneo");
        } finally {
          setLoading(false);
        }
    };

    if (torneoId) {
      cargarTorneo();
    } else {
      setError("ID de torneo no encontrado");
      setLoading(false);
    }
  }, [torneoId]);

  // ==========================================
  // ESTADOS DE CARGA Y ERROR
  // ==========================================
  if (loading) {
    return (
      <div className="loading-container">
        <p>Cargando información del torneo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-container">
        <p>⚠️ Debes iniciar sesión para inscribirte en este torneo.</p>
        <button onClick={() => navigate('/')}>Volver al Inicio</button>
      </div>
    );
  }

  if (!torneo) {
    return (
      <div className="error-container">
        <p>No se encontró el torneo</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  const sistema = torneo.sistema
  const tipoTorneo = torneo.tipo_torneo

  //Aqui buscamos el componente de inscripcion segun el sistema y tipo de torneo
  const ComponenteIncripcion = REGISTRO_INSCRIPCIONES[sistema]?.[tipoTorneo]

  if (!ComponenteIncripcion) {
    return (
      <div className="error-container">
        <h2> ⚠️ No disponible </h2>
        <p>El sistema de inscripción para el torneo de {sistema} no está disponible.</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>  
    )
  }
  // ==========================================
  // RENDERIZAR COMPONENTE CORRESPONDIENTE
  // ==========================================
  return (
    <ComponenteIncripcion
        torneoId = {torneoId}
        torneo={torneo}
        user={user}
    />
  );
}

export default Inscripcion;