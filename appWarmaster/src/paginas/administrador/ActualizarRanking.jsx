// components/Admin/ActualizarRanking.jsx
import { useState, useEffect } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';
import apiRanking from '@/servicios/apiRanking.js';
import BotonRecalcularRanking from '@/componente/rankings/BotonRecalcularRanking.jsx';

import './estilosAdmin/adminPanel.css';

const ActualizarRanking = () => {
  const [config, setConfig] = useState([]);
  const [guardandoSistema, setGuardandoSistema] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState({});
  const [mensajes, setMensajes] = useState({});

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    setMensajes({});
    try {
      const [configData, torneosData] = await Promise.all([
        apiRanking.obtenerConfigRanking(),
        apiAdministrador.obtenerTorneosFinalizadosSinElo()
      ]);
      setConfig(configData);
      setTorneos(torneosData);
    } catch (error) {
      console.error('Error cargando datos del ranking:', error);
      setMensajes({
        general: { tipo: 'error', texto: `❌ Error al cargar: ${error.message}` }
      });
    } finally {
      setLoading(false);
    }
  };

  const refrescarTorneos = async () => {
    try {
      setTorneos(await apiAdministrador.obtenerTorneosFinalizadosSinElo());
    } catch (error) {
      console.error('Error refrescando torneos:', error);
    }
  };

  const sistemaActivo = (sistema) =>
    config.some(c => c.sistema_juego === String(sistema).toLowerCase() && c.activo);

  // ─── ACTIVAR / STANDBY ──────────────────────────────────────

  const handleToggleSistema = async (sistema, activo) => {
    setGuardandoSistema(sistema);
    setMensajes(prev => ({ ...prev, general: null }));
    try {
      await apiRanking.actualizarConfigRanking(sistema, activo);
      setConfig(prev => prev.map(c => c.sistema_juego === sistema ? { ...c, activo } : c));
    } catch (error) {
      setMensajes(prev => ({
        ...prev,
        general: { tipo: 'error', texto: `❌ No se pudo cambiar ${sistema.toUpperCase()}: ${error.message}` }
      }));
    } finally {
      setGuardandoSistema(null);
    }
  };

  // ─── PROCESAR UN TORNEO ─────────────────────────────────────

  const actualizarRanking = async (torneoId) => {
    setProcesando(prev => ({ ...prev, [torneoId]: true }));
    setMensajes(prev => ({ ...prev, [torneoId]: null }));

    try {
      const data = await apiAdministrador.actualizarRankingTorneo(torneoId);
      setMensajes(prev => ({
        ...prev,
        general: {
          tipo: 'exito',
          texto: `✅ ELO actualizado: ${data.partidasProcesadas} partidas procesadas (${data.sistemaJuego})`
        }
      }));
      setTorneos(prev => prev.filter(t => t.id !== torneoId));
    } catch (error) {
      setMensajes(prev => ({
        ...prev,
        [torneoId]: { tipo: 'error', texto: `❌ Error: ${error.message}` }
      }));
    } finally {
      setProcesando(prev => ({ ...prev, [torneoId]: false }));
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="actualizar-ranking-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="actualizar-ranking-container">
      <div className="ranking-header">
        <h2>🏆 Gestión del Ranking ELO</h2>
        <p className="subtitulo">Activa sistemas y procesa los torneos pendientes</p>
      </div>

      {mensajes.general && (
        <div className={`mensaje mensaje-${mensajes.general.tipo} mensaje-general`}>
          {mensajes.general.texto}
        </div>
      )}

      {/* ── SISTEMAS ACTIVOS / STANDBY ── */}
      <section className="ranking-seccion">
        <h3>⚙️ Sistemas con ranking</h3>
        <p className="texto-secundario">
          Los sistemas en standby no aparecen en el ranking público ni calculan ELO al finalizar torneos.
          Sus datos se conservan.
        </p>

        <ul className="config-ranking-lista">
          {config.map(c => (
            <li key={c.sistema_juego} className="config-ranking-item">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={c.activo}
                  disabled={guardandoSistema === c.sistema_juego}
                  onChange={(e) => handleToggleSistema(c.sistema_juego, e.target.checked)}
                />
                <strong>{c.sistema_juego.toUpperCase()}</strong>
                <span>{c.activo ? '✅ Activo' : '⏸️ En standby'}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* ── TORNEOS PENDIENTES ── */}
      <section className="ranking-seccion">
        <h3>📋 Torneos finalizados pendientes de ELO</h3>

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
                Hay <strong>{torneos.length}</strong> torneo(s) finalizado(s) pendiente(s).
                Los de sistemas en standby se procesarán al activar el sistema y recalcular.
              </p>
            </div>

            {torneos.map(torneo => {
              const activo = sistemaActivo(torneo.sistema);
              return (
                <div key={torneo.id} className={`torneo-card ${!activo ? 'torneo-standby' : ''}`}>
                  <div className="torneo-info">
                    <h3>{torneo.nombre_torneo}</h3>
                    <div className="torneo-detalles">
                      <span className="badge-sistema">{torneo.sistema.toUpperCase()}</span>
                      {!activo && <span className="badge-standby">⏸️ Standby</span>}
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
                    disabled={!activo || procesando[torneo.id]}
                    title={!activo ? 'Activa el sistema para poder procesar este torneo' : ''}
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
              );
            })}
          </div>
        )}

        <div className="acciones-footer">
          <button className="btn-refrescar" onClick={cargarTodo} disabled={loading}>
            🔄 Refrescar
          </button>
        </div>
      </section>

      {/* ── RECALCULAR DESDE CERO ── */}
      <section className="ranking-seccion">
        <h3>♻️ Recalcular ranking desde cero</h3>
        <p className="texto-secundario">
          Borra y recalcula el ranking de los sistemas activos (temporada anual + general).
          Los sistemas en standby no se tocan.
        </p>
        <BotonRecalcularRanking onRecalculado={refrescarTorneos} />
      </section>
    </div>
  );
};

export default ActualizarRanking;