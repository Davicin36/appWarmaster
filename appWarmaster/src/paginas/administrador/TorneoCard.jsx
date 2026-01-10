import React, { useState } from 'react';

import './estilosAdmin/torneoCard.css';

const TorneoCard = ({ torneo, onEditar, onEliminar, onGestionarOrganizadores }) => {
  const [mostrarOrganizadores, setMostrarOrganizadores] = useState(false);

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': { icon: '⏳', label: 'Pendiente', className: 'badge-pendiente' },
      'en_curso': { icon: '🎮', label: 'En Curso', className: 'badge-encurso' },
      'finalizado': { icon: '✅', label: 'Finalizado', className: 'badge-finalizado' }
    };
    return badges[estado] || badges.pendiente;
  };

  const getSistemaBadge = (sistema) => {
    const badges = {
      'SAGA': { icon: '⚔️', className: 'badge-saga' },
      'WARMASTER': { icon: '🏰', className: 'badge-warmaster' },
      'FOW': { icon: '🔥', className: 'badge-fow' },
      'BOLT': { icon: '💥', className: 'badge-bolt' }
    };
    return badges[sistema] || { icon: '🎲', className: 'badge-default' };
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const estadoBadge = getEstadoBadge(torneo.estado);
  const sistemaBadge = getSistemaBadge(torneo.sistema);

  return (
    <div className="torneo-card">
      {/* Header */}
      <div className="torneo-card-header">
        <div className="torneo-badges">
          <span className={`badge ${sistemaBadge.className}`}>
            {sistemaBadge.icon} {torneo.sistema}
          </span>
          <span className={`badge ${estadoBadge.className}`}>
            {estadoBadge.icon} {estadoBadge.label}
          </span>
          {torneo.tipo_torneo === 'Por equipos' && (
            <span className="badge badge-equipos">
              👥 Equipos
            </span>
          )}
        </div>
      </div>

      {/* Título */}
      <h3 className="torneo-titulo">{torneo.nombre_torneo}</h3>

      {/* Info principal */}
      <div className="torneo-info">
        <div className="info-row">
          <span className="info-label">📅 Inicio:</span>
          <span className="info-value">{formatFecha(torneo.fecha_inicio)}</span>
        </div>

        {torneo.fecha_fin && (
          <div className="info-row">
            <span className="info-label">🏁 Fin:</span>
            <span className="info-value">{formatFecha(torneo.fecha_fin)}</span>
          </div>
        )}

        {torneo.ubicacion && (
          <div className="info-row">
            <span className="info-label">📍 Ubicación:</span>
            <span className="info-value">{torneo.ubicacion}</span>
          </div>
        )}

        <div className="info-row">
          <span className="info-label">🎯 Rondas:</span>
          <span className="info-value">
            {torneo.ronda_actual || 1} / {torneo.rondas_max}
          </span>
        </div>

        {torneo.tipo_torneo === 'Individual' ? (
          <div className="info-row">
            <span className="info-label">👤 Participantes:</span>
            <span className="info-value">
              {torneo.num_participantes} / {torneo.participantes_max}
            </span>
          </div>
        ) : (
          <>
            <div className="info-row">
              <span className="info-label">👥 Equipos:</span>
              <span className="info-value">
                {torneo.num_equipos} / {torneo.equipos_max}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">👤 Jugadores/Equipo:</span>
              <span className="info-value">{torneo.num_jugadores_equipo}</span>
            </div>
          </>
        )}

        {torneo.sistema === 'SAGA' && torneo.puntos_banda && (
          <div className="info-row">
            <span className="info-label">⚔️ Puntos:</span>
            <span className="info-value">{torneo.puntos_banda} pts</span>
          </div>
        )}

        {(torneo.sistema === 'WARMASTER' || torneo.sistema === 'FOW') && torneo.puntos_ejercito && (
          <div className="info-row">
            <span className="info-label">⚔️ Puntos:</span>
            <span className="info-value">{torneo.puntos_ejercito} pts</span>
          </div>
        )}
      </div>

      {/* Épocas (solo SAGA) */}
      {torneo.sistema === 'SAGA' && torneo.epocas_disponibles && torneo.epocas_disponibles.length > 0 && (
        <div className="torneo-epocas">
          <span className="info-label">🗓️ Épocas:</span>
          <div className="epocas-list">
            {torneo.epocas_disponibles.map((epoca, index) => (
              <span key={index} className="epoca-tag">{epoca}</span>
            ))}
          </div>
        </div>
      )}

      {/* Creador y organizadores - NUEVA ESTRUCTURA */}
      <div className="torneo-organizadores">
        <div className="organizadores-header-section">
          <div className="info-row">
            <span className="info-label">👑 Creador:</span>
            <span className="info-value">{torneo.creador?.nombre || 'Desconocido'}</span>
          </div>

          <button
            onClick={() => onGestionarOrganizadores(torneo)}
            className="btn-gestionar-org"
            title="Gestionar organizadores"
          >
            👥 Gestionar Organizadores
          </button>
        </div>

        {torneo.organizadores && torneo.organizadores.total > 0 && (
          <div className="organizadores-extra">
            <button
              className="btn-toggle-organizadores"
              onClick={() => setMostrarOrganizadores(!mostrarOrganizadores)}
            >
              {mostrarOrganizadores ? '▼' : '▶'} 
              {torneo.organizadores.total} organizador(es)
              {torneo.organizadores.pendientes > 0 && (
                <span className="badge-pendiente-mini">
                  {torneo.organizadores.pendientes} ⏳
                </span>
              )}
            </button>

            {mostrarOrganizadores && (
              <div className="organizadores-lista">
                {torneo.organizadores.lista.map(org => (
                  <div key={org.usuario_id} className="organizador-item">
                    <span className="organizador-nombre">
                      {org.es_creador && '👑 '}
                      {org.nombre}
                    </span>
                    <span className={`organizador-estado ${org.estado_cuenta}`}>
                      {org.estado_cuenta === 'activo' ? '✅' : '⏳'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="torneo-card-acciones">
        <button
          onClick={() => onEditar(torneo)}
          className="btn-editar"
          title="Editar torneo"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => onEliminar(torneo.id)}
          className="btn-eliminar"
          title="Eliminar torneo"
        >
          🗑️ Eliminar
        </button>
      </div>

      {/* Footer con ID */}
      <div className="torneo-card-footer">
        <span className="torneo-id">ID: {torneo.id}</span>
        {torneo.bases_nombre && (
          <span className="torneo-bases" title="Tiene bases en PDF">
            📄 PDF
          </span>
        )}
      </div>
    </div>
  );
};

export default TorneoCard;