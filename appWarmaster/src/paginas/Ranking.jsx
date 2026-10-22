import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import SelectorSistema from '../componente/rankings/SelectorSistema';
import RankingPorSistema from '../componente/rankings/RankingPorSistema';
import FiltroZona from '../componente/rankings/FiltroZona';

import apiRanking from '../servicios/apiRanking';
import '@/estilos/ranking.css';

const ZONA_VACIA = { pais: '', comunidad: '', provincia: '' };

const Ranking = () => {
  const { t } = useTranslation();

  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);
  const [hayRanking, setHayRanking] = useState(true);
  const [temporada, setTemporada] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtro geográfico: se mantiene al cambiar de sistema de juego
  const [zona, setZona] = useState(ZONA_VACIA);
  const [paisesDisponibles, setPaisesDisponibles] = useState([]);

  useEffect(() => {
    cargarSistemaInicial();
    cargarPaises();
  }, []);

  useEffect(() => {
    if (sistemaSeleccionado) cargarTemporada();
  }, [sistemaSeleccionado]);

  const cargarSistemaInicial = async () => {
    try {
      // El backend solo devuelve los sistemas con ranking activo
      const sistemas = await apiRanking.obtenerSistemasDisponibles();
      if (sistemas.length > 0) {
        setSistemaSeleccionado(sistemas[0].sistema);
        setHayRanking(true);
      } else {
        setHayRanking(false);
      }
    } catch (error) {
      console.error('Error cargando sistema inicial:', error);
      setHayRanking(false);
    } finally {
      setLoading(false);
    }
  };

  const cargarPaises = async () => {
    try {
      const data = await apiRanking.obtenerPaisesDisponibles();
      setPaisesDisponibles(data.map(p => p.pais));
    } catch (error) {
      console.error('Error cargando países:', error);
      setPaisesDisponibles([]);
    }
  };

  const cargarTemporada = async () => {
    try {
      const data = await apiRanking.obtenerTemporadaActual(sistemaSeleccionado);
      setTemporada(data);
    } catch (error) {
      console.error('Error cargando temporada:', error);
      setTemporada(null);
    }
  };

  if (loading) return (
    <div className="ranking-page-loading">
      <div className="spinner"></div>
      <p>{t('ranking_page.cargando')}</p>
    </div>
  );

  // Todo el ranking en standby
  if (!hayRanking) return (
    <div className="ranking-page">
      <header className="ranking-header">
        <h1>🏆 {t('ranking_page.titulo')}</h1>
      </header>
      <div className="ranking-vacio">
        <p>⏸️ {t('ranking_page.standby', 'El ranking no está disponible en este momento')}</p>
        <p className="texto-secundario">{t('ranking_page.standby_hint', 'Volverá a estar activo próximamente')}</p>
      </div>
    </div>
  );

  return (
    <div className="ranking-page">
      <header className="ranking-header">
        <h1>🏆 {t('ranking_page.titulo')}</h1>
        {temporada && (
          <div className="temporada-info">
            <span className="temporada-nombre">{temporada.nombre}</span>
          </div>
        )}
      </header>

      <SelectorSistema
        sistemaActual={sistemaSeleccionado}
        onCambiarSistema={setSistemaSeleccionado}
      />

      <FiltroZona
        paisesDisponibles={paisesDisponibles}
        zona={zona}
        onCambiar={setZona}
      />

      {sistemaSeleccionado && (
        <RankingPorSistema sistema={sistemaSeleccionado} zona={zona} />
      )}
    </div>
  );
};

export default Ranking;