import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import SelectorSistema from '../componente/rankings/SelectorSistema';
import RankingPorSistema from '../componente/rankings/RankingPorSistema';

import apiRanking from '../servicios/apiRanking';
import '@/estilos/ranking.css';

const Ranking = () => {
  const { t } = useTranslation();

  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);
  const [temporada, setTemporada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarSistemaInicial(); }, []);

  useEffect(() => {
    if (sistemaSeleccionado) cargarTemporada();
  }, [sistemaSeleccionado]);

  const cargarSistemaInicial = async () => {
    try {
      const sistemas = await apiRanking.obtenerSistemasDisponibles();
      if (sistemas.length > 0) setSistemaSeleccionado(sistemas[0].sistema);
    } catch (error) {
      console.error('Error cargando sistema inicial:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTemporada = async () => {
    try {
      const data = await apiRanking.obtenerTemporadaActual(sistemaSeleccionado);
      setTemporada(data);
    } catch (error) {
      console.error('Error cargando temporada:', error);
    }
  };

  if (loading) return (
    <div className="ranking-page-loading">
      <div className="spinner"></div>
      <p>{t('ranking_page.cargando')}</p>
    </div>
  );

  return (
    <div className="ranking-page">
      <header className="ranking-header">
        <h1>🏆 {t('ranking_page.titulo')}</h1>
        {temporada && (
          <div className="temporada-info">
            <span className="temporada-nombre">{t('ranking_page.temporada')}</span>
            <span className="temporada-año">{t('ranking_page.temporada')} {temporada.año}</span>
          </div>
        )}
      </header>

      <SelectorSistema
        sistemaActual={sistemaSeleccionado}
        onCambiarSistema={setSistemaSeleccionado}
      />

      {sistemaSeleccionado && (
        <RankingPorSistema sistema={sistemaSeleccionado} />
      )}
    </div>
  );
};

export default Ranking;