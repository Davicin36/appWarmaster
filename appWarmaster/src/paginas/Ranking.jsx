// pages/RankingPage.jsx
import { useState, useEffect } from 'react';

import SelectorSistema from '../componente/rankings/SelectorSistema';
import RankingPorSistema from '../componente/rankings/RankingPorSistema';

import apiRanking from '../servicios/apiRanking';
import '@/estilos/ranking.css';

const Ranking = () => {
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);
  const [temporada, setTemporada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSistemaInicial();
  }, []);

  useEffect(() => {
    if (sistemaSeleccionado) {
      cargarTemporada();
    }
  }, [sistemaSeleccionado]);

  const cargarSistemaInicial = async () => {
    try {
      const sistemas = await apiRanking.obtenerSistemasDisponibles();
      if (sistemas.length > 0) {
        // Seleccionar el primer sistema disponible
        setSistemaSeleccionado(sistemas[0].sistema);
      }
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

  const handleCambiarSistema = (nuevoSistema) => {
    setSistemaSeleccionado(nuevoSistema);
  };

  if (loading) {
    return (
      <div className="ranking-page-loading">
        <div className="spinner"></div>
        <p>Cargando sistema de ranking...</p>
      </div>
    );
  }

  return (
    <div className="ranking-page">
      <header className="ranking-header">
        <h1>🏆 Ranking ELO</h1>
        {temporada && (
          <div className="temporada-info">
            <span className="temporada-nombre">{temporada.nombre}</span>
            <span className="temporada-año">Temporada {temporada.año}</span>
          </div>
        )}
      </header>

      <SelectorSistema 
        sistemaActual={sistemaSeleccionado}
        onCambiarSistema={handleCambiarSistema}
      />

      {sistemaSeleccionado && (
        <RankingPorSistema sistema={sistemaSeleccionado} />
      )}
    </div>
  );
};

export default Ranking;