import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { useAuth } from "../servicios/AuthContext.jsx";
import usuarioApi from "../servicios/apiUsuarios.js";

import torneosSagaApi from '../servicios/apiSaga.js';
import torneosWarmasterApi from '../servicios/apiWarmaster.js';
import torneosFowApi from "../servicios/apiFow.js";
import torneosEpicApi from "../servicios/apiEpic.js";
import torneosDraculaApi from "../servicios/apiDracula.js";

import { REGISTRO_INSCRIPCIONES } from '../funciones/registroInscripciones.js';
import '../estilos/inscripcion.css';

function Inscripcion() {
  const navigate = useNavigate();
  const { torneoId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [torneo, setTorneo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarTorneo = async () => {
      try {
        setLoading(true);
        setError("");

        const { sistema } = await usuarioApi.obtenerSistema(torneoId);

        const APIS_POR_SISTEMA = {
          'SAGA':     torneosSagaApi,
          'WARMASTER':torneosWarmasterApi,
          'FOW':      torneosFowApi,
          'EPIC':     torneosEpicApi,
          'DRACULA':  torneosDraculaApi
        };

        const api = APIS_POR_SISTEMA[sistema];
        if (!api) throw new Error(`Sistema ${sistema} no soportado`);

        const dataTorneo = await api.obtenerTorneo(torneoId);
        setTorneo(dataTorneo.data?.torneo || dataTorneo.data);

      } catch (err) {
        console.error("Error al cargar torneo:", err);
        setError(err.message || t('inscripcion_general.error_carga'));
      } finally {
        setLoading(false);
      }
    };

    if (torneoId) {
      cargarTorneo();
    } else {
      setError(t('inscripcion_general.error_sin_id'));
      setLoading(false);
    }
  }, [torneoId]);

  if (loading) return (
    <div className="loading-container">
      <p>{t('inscripcion_general.cargando')}</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>{error}</p>
      <button onClick={() => navigate(-1)}>{t('ver_torneo.volver')}</button>
    </div>
  );

  if (!user) return (
    <div className="error-container">
      <p>⚠️ {t('inscripcion_general.login_requerido')}</p>
      <button onClick={() => navigate('/')}>{t('inscripcion_general.volver_inicio')}</button>
    </div>
  );

  if (!torneo) return (
    <div className="error-container">
      <p>{t('inscripcion_general.torneo_no_encontrado')}</p>
      <button onClick={() => navigate(-1)}>{t('ver_torneo.volver')}</button>
    </div>
  );

  const sistema   = torneo.sistema;
  const tipoTorneo = torneo.tipo_torneo;
  const ComponenteInscripcion = REGISTRO_INSCRIPCIONES[sistema]?.[tipoTorneo];

  if (!ComponenteInscripcion) return (
    <div className="error-container">
      <h2>⚠️ {t('inscripcion_general.no_disponible')}</h2>
      <p>{t('inscripcion_general.sistema_no_disponible', { sistema })}</p>
      <button onClick={() => navigate(-1)}>{t('ver_torneo.volver')}</button>
    </div>
  );

  return (
    <ComponenteInscripcion torneoId={torneoId} torneo={torneo} user={user} />
  );
}

export default Inscripcion;