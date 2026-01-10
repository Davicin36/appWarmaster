import React, { useState, useEffect } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';

import './estilosAdmin/estadisticasAdmin.css';

const EstadisticasAdmin = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await apiAdministrador.obtenerEstadisticas();
      setStats(response.estadisticas);
      setError(null);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-error">
        <p>❌ {error}</p>
        <button onClick={fetchEstadisticas} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="estadisticas-admin">
      <h2>📊 Estadísticas del Sistema</h2>

      <div className="stats-grid">
        {/* Usuarios */}
        <div className="stat-card usuarios-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Usuarios</h3>
            <div className="stat-number">{stats.total_usuarios}</div>
            <div className="stat-details">
              <span className="stat-detail">
                ✅ Activos: {stats.usuarios_activos}
              </span>
              <span className="stat-detail">
                ⏳ Pendientes: {stats.usuarios_pendientes}
              </span>
            </div>
          </div>
        </div>

        {/* Organizadores */}
        <div className="stat-card organizadores-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Organizadores</h3>
            <div className="stat-number">{stats.total_organizadores}</div>
            <div className="stat-details">
              <span className="stat-detail">
                🛡️ Superadmins: {stats.total_superadmins}
              </span>
            </div>
          </div>
        </div>

        {/* Torneos */}
        <div className="stat-card torneos-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Torneos</h3>
            <div className="stat-number">{stats.total_torneos}</div>
            <div className="stat-details">
              <span className="stat-detail">
                ⏳ Pendientes: {stats.torneos_pendientes}
              </span>
              <span className="stat-detail">
                🎮 En curso: {stats.torneos_en_curso}
              </span>
              <span className="stat-detail">
                ✅ Finalizados: {stats.torneos_finalizados}
              </span>
            </div>
          </div>
        </div>

        {/* Torneos por Sistema */}
        <div className="stat-card sistemas-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3>Por Sistema</h3>
            <div className="stat-systems">
              <div className="system-stat">
                <span className="system-label">SAGA</span>
                <span className="system-value">{stats.torneos_saga}</span>
              </div>
              <div className="system-stat">
                <span className="system-label">WARMASTER</span>
                <span className="system-value">{stats.torneos_warmaster}</span>
              </div>
              <div className="system-stat">
                <span className="system-label">FOW</span>
                <span className="system-value">{stats.torneos_fow}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inscripciones */}
        <div className="stat-card inscripciones-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Inscripciones</h3>
            <div className="stat-details vertical">
              <span className="stat-detail">
                SAGA: {stats.total_inscripciones_saga}
              </span>
              <span className="stat-detail">
                WARMASTER: {stats.total_inscripciones_warmaster}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <button onClick={fetchEstadisticas} className="btn-refresh">
          🔄 Actualizar Estadísticas
        </button>
        <span className="stats-timestamp">
          Actualizado: {new Date().toLocaleString('es-ES')}
        </span>
      </div>
    </div>
  );
};

export default EstadisticasAdmin;