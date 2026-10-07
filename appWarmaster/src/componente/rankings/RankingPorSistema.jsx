import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import rankingApi from '@/servicios/apiRanking';
import TarjetaJugador from './TarjetaJugador';
import '@/estilos/ranking.css';

const RankingPorSistema = ({ sistema }) => {
  const { t } = useTranslation();
  const [ranking, setRanking] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('anual');                 // 'anual' | 'general'
  const [temporadas, setTemporadas] = useState([]);             // temporadas anuales del sistema
  const [añoSeleccionado, setAñoSeleccionado] = useState('');   // '' = temporada actual
  const [filtros, setFiltros] = useState({
    limit: 50,
    minPartidas: sistema?.toLowerCase() === 'saga' ? 3 : 0
  });

  // Al cambiar de sistema: cargar sus temporadas y volver a la actual
  useEffect(() => {
    setAñoSeleccionado('');
    cargarTemporadas();
  }, [sistema]);

  useEffect(() => { cargarDatos(); }, [sistema, filtros, vista, añoSeleccionado]);

  const cargarTemporadas = async () => {
    try {
      const data = await rankingApi.obtenerTemporadas(sistema);
      setTemporadas(data.filter(tmp => tmp.tipo === 'anual'));
    } catch (error) {
      console.error('Error cargando temporadas:', error);
      setTemporadas([]);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    // general → 'general' | anual → año elegido, o vacío para la actual
    const año = vista === 'general' ? 'general' : (añoSeleccionado || undefined);

    try {
      const [rankingData, statsData] = await Promise.all([
        rankingApi.obtenerRanking(sistema, { ...filtros, año }),
        rankingApi.obtenerEstadisticasSistema(sistema, año)
      ]);
      setRanking(rankingData);
      setEstadisticas(statsData);
    } catch (error) {
      console.error('Error cargando ranking:', error);
      setError(t('ranking_sistema.error_carga'));
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const nombreTemporada = ranking[0]?.temporada_nombre;

  return (
    <div className="ranking-container">

      {/* Pestañas Temporada / General */}
      <div className="ranking-vistas">
        <button
          className={`ranking-vista-btn ${vista === 'anual' ? 'activa' : ''}`}
          onClick={() => setVista('anual')}
          disabled={loading}
        >
          📅 {t('ranking_sistema.vista_anual')}
        </button>
        <button
          className={`ranking-vista-btn ${vista === 'general' ? 'activa' : ''}`}
          onClick={() => setVista('general')}
          disabled={loading}
        >
          🌍 {t('ranking_sistema.vista_general')}
        </button>
      </div>

      {/* Selector de temporada (solo en vista anual) */}
      {vista === 'anual' && temporadas.length > 0 && (
        <div className="ranking-selector-temporada">
          <label>{t('ranking_sistema.temporada')}</label>
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(e.target.value)}
            disabled={loading}
          >
            <option value="">{t('ranking_sistema.temporada_actual')}</option>
            {temporadas.map(tmp => (
              <option key={tmp.id} value={tmp.año}>
                {tmp.año}-{tmp.año + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      {nombreTemporada && !loading && (
        <p className="ranking-temporada-nombre">{nombreTemporada}</p>
      )}

      {loading ? (
        <div className="ranking-loading">
          <div className="spinner"></div>
          <p>{t('ranking_sistema.cargando', { sistema: sistema.toUpperCase() })}</p>
        </div>
      ) : error ? (
        <div className="ranking-error">
          <p>{error}</p>
          <button onClick={cargarDatos}>{t('botones.reintentar')}</button>
        </div>
      ) : (
        <>
          {/* Estadísticas */}
          {estadisticas && estadisticas.total_jugadores > 0 && (
            <div className="ranking-estadisticas">
              <div className="stat-card">
                <span className="stat-icono">👥</span>
                <div>
                  <span className="stat-numero">{estadisticas.total_jugadores || 0}</span>
                  <span className="stat-texto">{t('ranking.jugadores')}</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icono">🎮</span>
                <div>
                  <span className="stat-numero">{estadisticas.total_partidas || 0}</span>
                  <span className="stat-texto">{t('ranking.partidas')}</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icono">📊</span>
                <div>
                  <span className="stat-numero">
                    {estadisticas.elo_promedio ? Math.round(estadisticas.elo_promedio) : '-'}
                  </span>
                  <span className="stat-texto">{t('ranking_sistema.elo_promedio')}</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icono">🏆</span>
                <div>
                  <span className="stat-numero">{estadisticas.elo_maximo || '-'}</span>
                  <span className="stat-texto">{t('perfil.stat_elo_max')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="ranking-filtros">
            <div className="filtro">
              <label>{t('ranking_sistema.mostrar')}</label>
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
              🔄 {t('botones.actualizar')}
            </button>
          </div>

          {/* Lista de jugadores */}
          <div className="ranking-lista">
            {ranking.length === 0 ? (
              <div className="ranking-vacio">
                <p>📊 {t('ranking_sistema.sin_jugadores')}</p>
                <p className="texto-secundario">
                  {vista === 'anual' && !añoSeleccionado
                    ? t('ranking_sistema.temporada_sin_partidas')
                    : t('ranking_sistema.sin_jugadores_hint')}
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
        </>
      )}
    </div>
  );
};

export default RankingPorSistema;