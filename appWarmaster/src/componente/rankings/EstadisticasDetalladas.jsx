// components/Ranking/EstadisticasDetalladas.jsx
import { useState, useEffect } from 'react';

import API_URL from '@/servicios/apiUrl';

const API_BASE_URL = API_URL;
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
    
    console.log('🔍 Datos de entrada:', { jugadorId, sistemaJuego });
    console.log('📡 URL que se va a llamar:', `${API_BASE_URL}/ranking/jugador/${jugadorId}/${sistemaJuego}/estadisticas-completas`);
    
    const data = await apiRanking.obtenerEstadisticasCompletas(jugadorId, sistemaJuego);
    
    console.log('✅ Respuesta recibida:', data);
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

  // Convertir objetos a arrays ordenados
  const epocasArray = Object.entries(estadisticas.epocas_jugadas || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const faccionesArray = Object.entries(estadisticas.facciones_jugadas || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calcular porcentajes
  const totalPartidas = estadisticas.partidas.total;

  return (
    <div className="estadisticas-detalladas">
      <h3>📊 Estadísticas Detalladas</h3>
      
      <div className="estadisticas-grid">
         {/* Época Favorita (solo SAGA) */}
        {estadisticas.epoca_favorita && (
          <div className="stat-card-detalle epoca-favorita">
            <h4>⚔️ Época Favorita</h4>
            <div className="favorito-destacado">
              <span className="favorito-icono">🛡️</span>
              <span className="favorito-nombre">{estadisticas.epoca_favorita}</span>
            </div>
          </div>
        )}

        {/* Facción Favorita (solo SAGA) */}
        {estadisticas.faccion_favorita && (
          <div className="stat-card-detalle faccion-favorita">
            <h4>👥 Facción Favorita</h4>
            <div className="favorito-destacado">
              <span className="favorito-icono">⚔️</span>
              <span className="favorito-nombre">{estadisticas.faccion_favorita}</span>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos de Épocas */}
      {epocasArray.length > 0 && (
        <div className="chart-container">
          <h4>📊 Épocas Más Jugadas</h4>
          <div className="bar-chart">
            {epocasArray.map(([epoca, cantidad]) => {
              const porcentaje = (cantidad / totalPartidas) * 100;
              return (
                <div key={epoca} className="bar-item">
                  <div className="bar-info">
                    <span className="bar-label">{epoca}</span>
                    <span className="bar-valor">{cantidad} partidas</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill"
                      style={{ width: `${porcentaje}%` }}
                    >
                      <span className="bar-porcentaje">{porcentaje.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos de Facciones */}
      {faccionesArray.length > 0 && (
        <div className="chart-container">
          <h4>👥 Facciones Más Jugadas</h4>
          <div className="bar-chart">
            {faccionesArray.map(([faccion, cantidad]) => {
              const porcentaje = (cantidad / totalPartidas) * 100;
              return (
                <div key={faccion} className="bar-item">
                  <div className="bar-info">
                    <span className="bar-label">{faccion}</span>
                    <span className="bar-valor">{cantidad} partidas</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className="bar-fill faccion"
                      style={{ width: `${porcentaje}%` }}
                    >
                      <span className="bar-porcentaje">{porcentaje.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EstadisticasDetalladas;