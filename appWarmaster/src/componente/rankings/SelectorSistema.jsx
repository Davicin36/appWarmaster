// components/Ranking/SelectorSistema.jsx
import { useState, useEffect } from 'react';

import rankingApi from '@/servicios/apiRanking';
import { formatearSistemaJuego } from '@/funciones/rankingHelper';

import Footer from '@/paginas/Footer.jsx'

import '@/estilos/ranking.css';

const SelectorSistema = ({ sistemaActual, onCambiarSistema }) => {
  const [sistemas, setSistemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarSistemas();
  }, []);

  const cargarSistemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rankingApi.obtenerSistemasDisponibles();
      setSistemas(data);
    } catch (error) {
      console.error('Error cargando sistemas:', error);
      setError('No se pudieron cargar los sistemas de juego');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="selector-loading">
        <div className="spinner"></div>
        <p>Cargando sistemas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="selector-error">
        <p>{error}</p>
        <button onClick={cargarSistemas}>Reintentar</button>
      </div>
    );
  }

  if (sistemas.length === 0) {
    return (
      <div className="selector-vacio">
        <p>No hay sistemas de juego disponibles</p>
      </div>
    );
  }

  return (
      <div className="selector-sistema">
        <h3>Sistema de Juego</h3>
        <div className="sistema-buttons">
          {sistemas.map((sistema) => (
            <button
              key={sistema.sistema}
              className={`sistema-btn ${sistemaActual === sistema.sistema ? 'active' : ''}`}
              onClick={() => onCambiarSistema(sistema.sistema)}
            >
              <span className="sistema-nombre">
                {formatearSistemaJuego(sistema.sistema)}
              </span>
              <span className="sistema-stats">
                <span className="stat-item">
                  👥 {sistema.total_jugadores}
                </span>
                {sistema.total_partidas > 0 && (
                  <span className="stat-item">
                    🎮 {sistema.total_partidas}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
};

export default SelectorSistema;