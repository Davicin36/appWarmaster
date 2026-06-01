import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import apiRanking from '@/servicios/apiRanking';
import '@/estilos/ranking.css';

const EstadisticasDetalladas = ({ jugadorId, sistemaJuego }) => {
  const { t } = useTranslation();
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { cargarEstadisticas(); }, [jugadorId, sistemaJuego]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRanking.obtenerEstadisticasCompletas(jugadorId, sistemaJuego);
      setEstadisticas(data);
    } catch (error) {
      console.error('Error:', error.message);
      if (error.message.includes('404')) {
        setError(null);
        setEstadisticas(null);
      } else {
        setError(t('estadisticas.error_carga'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="estadisticas-loading">
      <div className="spinner"></div>
      <p>{t('estadisticas.cargando')}</p>
    </div>
  );

  if (error) return (
    <div className="estadisticas-error">
      <p>{error}</p>
    </div>
  );

  if (!estadisticas) return null;

  return (
    <div className="estadisticas-detalladas-compact">
      <div className="stats-inline-row">
        {estadisticas.epoca_favorita && (
          <div className="stat-inline-chip chip-grande">
            <span className="chip-label">⚔️ {t('estadisticas.epoca_favorita')}</span>
            <span className="chip-valor">{estadisticas.epoca_favorita}</span>
          </div>
        )}
        {estadisticas.faccion_favorita && (
          <div className="stat-inline-chip chip-grande">
            <span className="chip-label">👥 {t('estadisticas.faccion_favorita')}</span>
            <span className="chip-valor">{estadisticas.faccion_favorita}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadisticasDetalladas;