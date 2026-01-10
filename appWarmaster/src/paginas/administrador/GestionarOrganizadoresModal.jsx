// componentes/administrador/GestionarOrganizadoresModal.jsx
import React, { useState, useEffect } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';

import './estilosAdmin/gestionarOrganizadoresModal.css';

const GestionarOrganizadoresModal = ({ torneo, onClose, onSuccess }) => {
  const [organizadores, setOrganizadores] = useState({ activos: [], pendientes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    fetchOrganizadores();
  }, [torneo.id]);

  const fetchOrganizadores = async () => {
    try {
      setLoading(true);
      console.log('📥 Obteniendo organizadores del torneo:', torneo.id);
      
      const response = await apiAdministrador.obtenerOrganizadores(torneo.id);
      
      console.log('✅ Organizadores obtenidos:', response);
      
      setOrganizadores({
        activos: response.data.activos || [],
        pendientes: response.data.pendientes || []
      });
      setError(null);
    } catch (error) {
      console.error('❌ Error al obtener organizadores:', error);
      setError('Error al cargar organizadores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarOrganizador = async (e) => {
    e.preventDefault();

    if (!nuevoEmail.trim()) {
      alert('Por favor ingresa un email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoEmail)) {
      alert('Email inválido');
      return;
    }

    if (window.confirm(
      `¿Agregar a ${nuevoEmail} como organizador?\n\n` +
      `Se le enviará una invitación por email.`
    )) {
      try {
        setAgregando(true);
        console.log('➕ Agregando organizador:', nuevoEmail);
        
        const response = await apiAdministrador.agregarOrganizador(torneo.id, nuevoEmail);
        
        console.log('✅ Organizador agregado:', response);
        
        alert(`✅ ${response.message || 'Organizador agregado correctamente'}`);
        setNuevoEmail('');
        
        // Esperar un momento y refrescar
        setTimeout(() => {
          fetchOrganizadores();
        }, 500);
        
        onSuccess?.();
      } catch (error) {
        console.error('❌ Error al agregar organizador:', error);
        alert(`❌ Error: ${error.message || 'No se pudo agregar el organizador'}`);
      } finally {
        setAgregando(false);
      }
    }
  };

  const handleEliminarOrganizador = async (org) => {
    console.log('🗑️ Datos del organizador a eliminar:', org);
    
    if (!org.organizador_id) {
      console.error('❌ ERROR: No hay organizador_id');
      alert('❌ Error: No se puede eliminar (falta ID). Intenta refrescar.');
      return;
    }

    const nombreMostrar = org.nombre_usuario || org.email;
    const totalOrganizadores = organizadores.activos.length + organizadores.pendientes.length;

    // ✅ Verificar si es el último organizador
    if (totalOrganizadores <= 1) {
      alert('⚠️ No se puede eliminar. Debe quedar al menos un organizador en el torneo.');
      return;
    }

    // ✅ Verificar si es el creador y el único activo
    if (org.es_creador && organizadores.activos.length === 1) {
      alert(
        '⚠️ No se puede eliminar al creador.\n\n' +
        'Es el único organizador activo. Debe haber al menos otro organizador activo antes de eliminar al creador.\n\n' +
        'Sugerencia: Agrega otro organizador primero o espera a que algún pendiente active su cuenta.'
      );
      return;
    }

    // Mensaje diferente si es el creador
    const mensajeConfirmacion = org.es_creador 
      ? `⚠️ ATENCIÓN: Estás a punto de eliminar al CREADOR del torneo.\n\n` +
        `Organizador: ${nombreMostrar}\n` +
        `Email: ${org.email}\n\n` +
        `Se asignará automáticamente como nuevo creador al organizador activo más antiguo.\n\n` +
        `¿Estás seguro de continuar?`
      : `¿Eliminar a ${nombreMostrar} como organizador?\n\n` +
        `Email: ${org.email}\n\n` +
        `Esta acción no se puede deshacer.`;

    if (window.confirm(mensajeConfirmacion)) {
      try {
        console.log('🗑️ Eliminando:', {
          torneoId: torneo.id,
          organizadorId: org.organizador_id,
          esCreador: org.es_creador,
          totalOrganizadores
        });
        
        const response = await apiAdministrador.eliminarOrganizador(torneo.id, org.organizador_id);
        
        console.log('✅ Respuesta:', response);
        
        // Mensaje diferente si era el creador
        if (org.es_creador && response.nuevo_creador_asignado) {
          alert('✅ Creador eliminado correctamente.\n\nSe ha asignado un nuevo creador al torneo.');
        } else {
          alert('✅ Organizador eliminado correctamente');
        }
        
        fetchOrganizadores();
        onSuccess?.();
      } catch (error) {
        console.error('❌ Error:', error);
        
        // Manejar error específico si el backend no permite la eliminación
        if (error.message.includes('al menos un organizador')) {
          alert('⚠️ No se puede eliminar. Debe quedar al menos un organizador en el torneo.');
        } else {
          alert(`❌ Error: ${error.message}`);
        }
      }
    }
  };

  const handleReenviarInvitacion = async (org) => {
    console.log('📧 Reenviando invitación a:', org);
    
    if (!org.organizador_id) {
      alert('❌ Error: No se puede reenviar (falta ID).');
      return;
    }
    
    if (window.confirm(`¿Reenviar invitación a ${org.email}?`)) {
      try {
        await apiAdministrador.reenviarInvitacion(torneo.id, org.organizador_id);
        alert('✅ Invitación reenviada correctamente');
      } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Error: ${error.message}`);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const totalOrganizadores = organizadores.activos.length + organizadores.pendientes.length;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content gestionar-org-modal">
        <div className="modal-header">
          <h2>👥 Gestionar Organizadores</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="torneo-info-header">
          <h3>{torneo.nombre_torneo}</h3>
          <span className="torneo-badge">{torneo.sistema}</span>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando organizadores...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={fetchOrganizadores} className="btn-retry">
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Formulario agregar */}
            <div className="agregar-organizador-section">
              <h3>➕ Agregar Organizador</h3>
              <form onSubmit={handleAgregarOrganizador} className="agregar-form">
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  disabled={agregando}
                  className="input-email"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={agregando || !nuevoEmail.trim()}
                  className="btn-agregar"
                >
                  {agregando ? '⏳ Agregando...' : '➕ Agregar'}
                </button>
              </form>
              <p className="help-text">
                💡 Si el usuario no existe, se creará automáticamente y recibirá una invitación
              </p>
            </div>

            {/* Organizadores activos */}
            <div className="organizadores-section">
              <h3>
                <span className="section-icon">✅</span>
                Organizadores Activos ({organizadores.activos.length})
              </h3>
              {organizadores.activos.length === 0 ? (
                <p className="empty-message">No hay organizadores activos</p>
              ) : (
                <div className="organizadores-lista">
                  {organizadores.activos.map(org => (
                    <div key={org.organizador_id} className="organizador-card">
                      <div className="org-info">
                        <div className="org-header">
                          <span className="org-nombre">
                            {org.es_creador && '👑 '}
                            {org.nombre_usuario}
                          </span>
                          {org.es_creador && (
                            <span className="badge-creador">Creador</span>
                          )}
                        </div>
                        <span className="org-email">{org.email}</span>
                        <span className="org-fecha">
                          📅 Desde: {new Date(org.fecha_asignacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="org-acciones">
                        <button
                          onClick={() => handleEliminarOrganizador(org)}
                          className="btn-eliminar-org"
                          title={org.es_creador ? "Eliminar creador (se asignará nuevo creador)" : "Eliminar organizador"}
                        >
                          🗑️
                        </button>
                        {org.es_creador && (
                          <span className="org-creador-label">👑 Creador</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Organizadores pendientes */}
            <div className="organizadores-section">
              <h3>
                <span className="section-icon">⏳</span>
                Invitaciones Pendientes ({organizadores.pendientes.length})
              </h3>
              {organizadores.pendientes.length === 0 ? (
                <p className="empty-message">No hay invitaciones pendientes</p>
              ) : (
                <div className="organizadores-lista">
                  {organizadores.pendientes.map(org => (
                    <div key={org.organizador_id} className="organizador-card pendiente">
                      <div className="org-info">
                        <div className="org-header">
                          <span className="org-nombre">
                            {org.nombre_usuario || org.email}
                          </span>
                          <span className="badge-pendiente">⏳ Pendiente</span>
                        </div>
                        <span className="org-email">{org.email}</span>
                        <span className="org-fecha">
                          📧 Invitado: {new Date(org.fecha_asignacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      <div className="org-acciones">
                        <button
                          onClick={() => handleReenviarInvitacion(org)}
                          className="btn-reenviar"
                          title="Reenviar invitación"
                        >
                          📧
                        </button>
                        <button
                          onClick={() => handleEliminarOrganizador(org)}
                          className="btn-eliminar-org"
                          title="Cancelar invitación"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen */}
            <div className="organizadores-resumen">
              <p>
                <strong>Total:</strong> {totalOrganizadores} organizador{totalOrganizadores !== 1 ? 'es' : ''}
                {organizadores.pendientes.length > 0 && (
                  <span className="resumen-pendientes">
                    {' '}({organizadores.pendientes.length} pendiente{organizadores.pendientes.length !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cerrar">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionarOrganizadoresModal;