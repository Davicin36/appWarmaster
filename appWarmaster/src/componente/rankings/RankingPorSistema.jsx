// components/Ranking/RankingPorSistema.jsx
import { useState, useEffect } from 'react';

import rankingApi from '@/servicios/apiRanking';
import TarjetaJugador from './TarjetaJugador';

import '@/estilos/ranking.css';

const RankingPorSistema = ({ sistema }) => {
  const [ranking, setRanking] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    limit: 50,
    minPartidas: 6
  });

  useEffect(() => {
    cargarDatos();
  }, [sistema, filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [rankingData, statsData] = await Promise.all([
        rankingApi.obtenerRanking(sistema, filtros),
        rankingApi.obtenerEstadisticasSistema(sistema)
      ]);
      
      setRanking(rankingData);
      setEstadisticas(statsData);
    } catch (error) {
      console.error('Error cargando ranking:', error);
      setError('No se pudo cargar el ranking. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (loading) {
    return (
      <div className="ranking-loading">
        <div className="spinner"></div>
        <p>Cargando ranking de {sistema.toUpperCase()}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-error">
        <p>{error}</p>
        <button onClick={cargarDatos}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="ranking-container">
      {/* Estadísticas generales */}
      {estadisticas && estadisticas.total_jugadores > 0 && (
        <div className="ranking-estadisticas">
          <div className="stat-card">
            <span className="stat-icono">👥</span>
            <div>
              <span className="stat-numero">{estadisticas.total_jugadores || 0}</span>
              <span className="stat-texto">Jugadores</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">🎮</span>
            <div>
              <span className="stat-numero">{estadisticas.total_partidas || 0}</span>
              <span className="stat-texto">Partidas</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">📊</span>
            <div>
              <span className="stat-numero">
                {estadisticas.elo_promedio ? Math.round(estadisticas.elo_promedio) : '-'}
              </span>
              <span className="stat-texto">ELO Promedio</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">🏆</span>
            <div>
              <span className="stat-numero">{estadisticas.elo_maximo || '-'}</span>
              <span className="stat-texto">ELO Máximo</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="ranking-filtros">
        <div className="filtro">
          <label>Mostrar:</label>
          <select 
            value={filtros.limit}
            onChange={(e) => handleFiltroChange('limit', parseInt(e.target.value))}
          >
            <option value="10">Top 10</option>
            <option value="25">Top 25</option>
            <option value="50">Top 50</option>
            <option value="100">Top 100</option>
          </select>
        </div>

        <button className="btn-actualizar" onClick={cargarDatos}>
          🔄 Actualizar
        </button>
      </div>

      {/* Lista de jugadores */}
      <div className="ranking-lista">
        {ranking.length === 0 ? (
          <div className="ranking-vacio">
            <p>📊 No hay jugadores con los filtros seleccionados</p>
            <p className="texto-secundario">
              Intenta reducir el mínimo de partidas o aumentar el límite
            </p>
          </div>
        ) : (
          ranking.map((jugador) => (
            <TarjetaJugador 
              key={`${jugador.jugador_id}-${jugador.sistema_juego}`}
              jugador={jugador}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RankingPorSistema;