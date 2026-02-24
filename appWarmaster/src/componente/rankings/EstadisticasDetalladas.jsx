// components/Ranking/EstadisticasDetalladas.jsx
import { useState, useEffect } from 'react';

import apiRanking from '@/servicios/apiRanking';

import '@/estilos/ranking.css';

const EstadisticasDetalladas = ({ jugadorId, sistemaJuego }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
  }, [jugadorId, sistemaJuego]);

  const cargarEstadisticas = async () => {
  try {
    setLoading(true);
    setError(null);
  
    const data = await apiRanking.obtenerEstadisticasCompletas(jugadorId, sistemaJuego);
    setEstadisticas(data);
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Mensaje de error:', error.message);
    console.error('❌ Stack:', error.stack);
    
    if (error.message.includes('404')) {
      setError(null);
      setEstadisticas(null);
    } else {
      setError('No se pudieron cargar las estadísticas detalladas');
    }
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="estadisticas-loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="estadisticas-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!estadisticas) {
    return null;
  }

  return (
    <div className="estadisticas-detalladas-compact">
      
      {/* Fila única con favoritos */}
      <div className="stats-inline-row">
        
        {estadisticas.epoca_favorita && (
          <div className="stat-inline-chip chip-grande">
            <span className="chip-label">⚔️ Época favorita</span>
            <span className="chip-valor">{estadisticas.epoca_favorita}</span>
          </div>
        )}

        {estadisticas.faccion_favorita && (
          <div className="stat-inline-chip chip-grande">
            <span className="chip-label">👥 Facción favorita</span>
            <span className="chip-valor">{estadisticas.faccion_favorita}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadisticasDetalladas;