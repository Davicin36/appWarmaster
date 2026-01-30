// components/Admin/ActualizarRanking.jsx
import { useState, useEffect } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';

import './estilosAdmin/adminPanel.css';

const ActualizarRanking = () => {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState({});
  const [mensajes, setMensajes] = useState({});

  useEffect(() => {
    fetchTorneosFinalizados();
  }, []);

  const fetchTorneosFinalizados = async () => {
    setLoading(true);
    setMensajes({}); // Limpiar mensajes anteriores
    
    try {
      const data = await apiAdministrador.obtenerTorneosFinalizadosSinElo();
      setTorneos(data);
      console.log(data)
    } catch (error) {
      console.error('Error obteniendo torneos:', error);
      setMensajes({
        general: {
          tipo: 'error',
          texto: `❌ Error al cargar torneos: ${error.message}`
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const actualizarRanking = async (torneoId) => {
    setProcesando(prev => ({ ...prev, [torneoId]: true }));
    setMensajes(prev => ({ ...prev, [torneoId]: null }));

    try {
      const data = await apiAdministrador.actualizarRankingTorneo(torneoId);
      
      setMensajes(prev => ({
        ...prev,
        [torneoId]: {
          tipo: 'exito',
          texto: `✅ ELO actualizado: ${data.partidasProcesadas} partidas procesadas (${data.sistemaJuego})`
        }
      }));
    } catch (error) {
      setMensajes(prev => ({
        ...prev,
        [torneoId]: {
          tipo: 'error',
          texto: `❌ Error: ${error.message}`
        }
      }));
    } finally {
      setProcesando(prev => ({ ...prev, [torneoId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="actualizar-ranking-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando torneos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="actualizar-ranking-container">
      <div className="ranking-header">
        <h2>🏆 Actualizar Ranking desde Torneos</h2>
        <p className="subtitulo">
          Procesa el ELO de torneos finalizados pendientes
        </p>
      </div>

      {mensajes.general && (
        <div className={`mensaje mensaje-${mensajes.general.tipo} mensaje-general`}>
          {mensajes.general.texto}
        </div>
      )}

      {torneos.length === 0 ? (
        <div className="sin-torneos">
          <p>✅ No hay torneos pendientes de procesar</p>
          <p className="texto-secundario">
            Todos los torneos finalizados ya tienen su ELO calculado
          </p>
        </div>
      ) : (
        <div className="torneos-lista">
          <div className="info-box">
            <span className="info-icono">ℹ️</span>
            <p>
              Hay <strong>{torneos.length}</strong> torneo(s) finalizado(s) 
              pendiente(s) de procesar para el ranking
            </p>
          </div>

          {torneos.map(torneo => (
            <div key={torneo.id} className="torneo-card">
              <div className="torneo-info">
                <h3>{torneo.nombre_torneo}</h3>
                <div className="torneo-detalles">
                  <span className="badge-sistema">{torneo.sistema.toUpperCase()}</span>
                  <span className="fecha">
                    📅 {new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}
                  </span>
                  <span className="participantes">
                    👥 {torneo.num_participantes || 0} jugadores
                  </span>
                </div>
              </div>

              <button
                className="btn-actualizar"
                onClick={() => actualizarRanking(torneo.id)}
                disabled={procesando[torneo.id]}
              >
                {procesando[torneo.id] ? (
                  <>
                    <span className="spinner-small"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    Actualizar Ranking
                  </>
                )}
              </button>

              {mensajes[torneo.id] && (
                <div className={`mensaje mensaje-${mensajes[torneo.id].tipo}`}>
                  {mensajes[torneo.id].texto}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="acciones-footer">
        <button 
          className="btn-refrescar"
          onClick={fetchTorneosFinalizados}
          disabled={loading}
        >
          🔄 Refrescar lista
        </button>
      </div>
    </div>
  );
};

export default ActualizarRanking;