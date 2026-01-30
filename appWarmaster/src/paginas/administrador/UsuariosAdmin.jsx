import React, { useState, useEffect } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';
import ModalEditarInscripcionSaga from './ModalEditarInscripcionSaga';
import './estilosAdmin/usuariosAdmin.css';

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalTorneos, setMostrarModalTorneos] = useState(false);
  const [mostrarModalEditarInscripcion, setMostrarModalEditarInscripcion] = useState(false);
  const [mostrarModalEditarInscripcionSimple, setMostrarModalEditarInscripcionSimple] = useState(false);
  const [inscripcionEditar, setInscripcionEditar] = useState(null);
  const [torneosUsuario, setTorneosUsuario] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    rol: 'todos',
    estado: 'todos'
  });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await apiAdministrador.obtenerUsuarios();
      setUsuarios(response.usuarios || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarMensaje('error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const abrirModalEditarInscripcion = (torneo, sistema) => {
  if (sistema === 'SAGA') {
    // Para SAGA usamos el modal completo
    setInscripcionEditar(torneo);
    setMostrarModalEditarInscripcion(true);
  } else {
    // Para WARMASTER y FOW usamos el modal simple
    let inscripcionData = {
      inscripcionId: torneo.inscripcion_id,
      torneoId: torneo.id,
      torneoNombre: torneo.nombre_torneo,
      sistema: sistema
    };

    if (sistema === 'WARMASTER') {
      inscripcionData.ejercito = torneo.ejercito || '';
    } else if (sistema === 'FOW') {
      inscripcionData.ejercito = torneo.ejercito || '';
      inscripcionData.bandos_2gm = torneo.bandos_2gm || 'Aliados';
    }

    setInscripcionEditar(inscripcionData);
    setMostrarModalEditarInscripcionSimple(true);
  }
};

const guardarInscripcionSaga = async (datos) => {
  try {
    await apiAdministrador.actualizarInscripcionUsuario(
      torneosUsuario.usuario.id,
      inscripcionEditar.inscripcion_id,
      'SAGA',
      datos
    );

    mostrarMensaje('exito', 'Inscripción actualizada');
    setMostrarModalEditarInscripcion(false);
    verTorneosUsuario(torneosUsuario.usuario.id);
  } catch (error) {
    console.error('Error al actualizar inscripción:', error);
    mostrarMensaje('error', 'Error al actualizar inscripción');
  }
};

const guardarInscripcion = async () => {
  try {
    let datos = {};

    if (inscripcionEditar.sistema === 'WARMASTER') {
      datos = {
        ejercito: inscripcionEditar.ejercito
      };
    } else if (inscripcionEditar.sistema === 'FOW') {
      datos = {
        ejercito: inscripcionEditar.ejercito,
        bandos_2gm: inscripcionEditar.bandos_2gm
      };
    }

    await apiAdministrador.actualizarInscripcionUsuario(
      torneosUsuario.usuario.id,
      inscripcionEditar.inscripcionId,
      inscripcionEditar.sistema,
      datos
    );

    mostrarMensaje('exito', 'Inscripción actualizada');
    setMostrarModalEditarInscripcionSimple(false);
    verTorneosUsuario(torneosUsuario.usuario);
  } catch (error) {
    console.error('Error al actualizar inscripción:', error);
    mostrarMensaje('error', 'Error al actualizar inscripción');
  }
};

  const abrirModalEditar = (usuario) => {
    setUsuarioSeleccionado({ ...usuario });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setUsuarioSeleccionado(null);
    setMostrarModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUsuarioSeleccionado(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarCambios = async () => {
    try {
      const datosActualizar = {
        nombre: usuarioSeleccionado.nombre,
        apellidos: usuarioSeleccionado.apellidos,
        nombre_alias: usuarioSeleccionado.nombre_alias,
        club: usuarioSeleccionado.club,
        email: usuarioSeleccionado.email,
        estado_cuenta: usuarioSeleccionado.estado_cuenta,
        rol: usuarioSeleccionado.rol,
        codigo_postal: usuarioSeleccionado.codigo_postal,
        localidad: usuarioSeleccionado.localidad,
        pais: usuarioSeleccionado.pais
      };

      await apiAdministrador.actualizarUsuario(usuarioSeleccionado.id, datosActualizar);
      mostrarMensaje('exito', 'Usuario actualizado correctamente');
      cerrarModal();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      mostrarMensaje('error', error.message || 'Error al actualizar usuario');
    }
  };

  const eliminarUsuario = async (usuarioId, nombreUsuario) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await apiAdministrador.eliminarUsuario(usuarioId);
      mostrarMensaje('exito', 'Usuario eliminado correctamente');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      mostrarMensaje('error', error.message || 'Error al eliminar usuario');
    }
  };

  const verTorneosUsuario = async (usuario) => {
    try {
      setLoading(true);
      const response = await apiAdministrador.obtenerTorneosUsuario(usuario.id);
      setTorneosUsuario({
        usuario: usuario,
        torneos: response.torneos
      });
      setMostrarModalTorneos(true);
    } catch (error) {
      console.error('Error al cargar torneos:', error);
      mostrarMensaje('error', 'Error al cargar torneos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const eliminarInscripcion = async (inscripcionId, sistema, nombreTorneo) => {
    if (!window.confirm(`¿Eliminar inscripción de "${nombreTorneo}"?`)) {
      return;
    }

    try {
      await apiAdministrador.eliminarInscripcionUsuario(
        torneosUsuario.usuario.id,
        inscripcionId,
        sistema
      );
      mostrarMensaje('exito', 'Inscripción eliminada');
      verTorneosUsuario(torneosUsuario.usuario);
    } catch (error) {
      console.error('Error al eliminar inscripción:', error);
      mostrarMensaje('error', 'Error al eliminar inscripción');
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchBusqueda = 
      usuario.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      usuario.apellidos?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      usuario.nombre_alias?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      usuario.club?.toLowerCase().includes(filtros.busqueda.toLowerCase());

    const matchRol = filtros.rol === 'todos' || usuario.rol === filtros.rol;
    const matchEstado = filtros.estado === 'todos' || usuario.estado_cuenta === filtros.estado;

    return matchBusqueda && matchRol && matchEstado;
  });

  const getEstadoBadge = (estado) => {
    const estados = {
      'activo': { clase: 'badge-activo', texto: '✅ Activo' },
      'pendiente_registro': { clase: 'badge-pendiente', texto: '⏳ Pendiente' },
      'suspendido': { clase: 'badge-suspendido', texto: '🚫 Suspendido' }
    };
    return estados[estado] || { clase: '', texto: estado };
  };

  const getRolBadge = (rol) => {
    const roles = {
      'superadmin': { clase: 'rol-superadmin', texto: '👑 SuperAdmin' },
      'organizador': { clase: 'rol-organizador', texto: '🏆 Organizador' },
      'jugador': { clase: 'rol-jugador', texto: '⚔️ Jugador' }
    };
    return roles[rol] || { clase: '', texto: rol };
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="usuarios-admin">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usuarios-admin">
      <div className="usuarios-header">
        <h2>👥 Gestión de Usuarios</h2>
        <p className="subtitulo">Total: {usuariosFiltrados.length} usuarios</p>
      </div>

      {mensaje.texto && (
        <div className={`mensaje mensaje-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* FILTROS */}
      <div className="filtros-container">
        <div className="filtro-busqueda">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, email, alias o club..."
            value={filtros.busqueda}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            className="input-busqueda"
          />
        </div>

        <div className="filtros-select">
          <select
            value={filtros.rol}
            onChange={(e) => setFiltros(prev => ({ ...prev, rol: e.target.value }))}
            className="select-filtro"
          >
            <option value="todos">Todos los roles</option>
            <option value="superadmin">SuperAdmin</option>
            <option value="organizador">Organizador</option>
            <option value="jugador">Jugador</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
            className="select-filtro"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pendiente_registro">Pendiente</option>
            <option value="suspendido">Suspendido</option>
          </select>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="tabla-container">
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Club</th>
              <th>Ubicación</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(usuario => {
              const nombreMostrar = usuario.nombre_alias || 
                                   `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim() ||
                                   'Sin nombre';
              const estadoBadge = getEstadoBadge(usuario.estado_cuenta);
              const rolBadge = getRolBadge(usuario.rol);

              return (
                <tr key={usuario.id}>
                  <td>
                    <div className="usuario-info">
                      <span className="usuario-nombre">{nombreMostrar}</span>
                      {usuario.nombre_alias && (
                        <span className="usuario-nombre-real">
                          {`${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.club || '-'}</td>
                  <td>
                    {usuario.localidad && usuario.pais 
                      ? `${usuario.localidad}, ${usuario.pais}`
                      : usuario.localidad || usuario.pais || '-'
                    }
                  </td>
                  <td>
                    <span className={`badge-rol ${rolBadge.clase}`}>
                      {rolBadge.texto}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-estado ${estadoBadge.clase}`}>
                      {estadoBadge.texto}
                    </span>
                  </td>
                  <td className="fecha-registro">
                    {new Date(usuario.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td>
                    <div className="acciones-usuario">
                      <button
                        onClick={() => verTorneosUsuario(usuario)}
                        className="btn-accion btn-torneos"
                        title="Ver torneos"
                      >
                        🏆
                      </button>
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="btn-accion btn-editar"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminarUsuario(usuario.id, nombreMostrar)}
                        className="btn-accion btn-eliminar"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {usuariosFiltrados.length === 0 && (
          <div className="sin-resultados">
            <p>No se encontraron usuarios con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* MODAL EDITAR USUARIO */}
      {mostrarModal && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Editar Usuario</h3>
              <button onClick={cerrarModal} className="btn-cerrar">✕</button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={usuarioSeleccionado.nombre || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={usuarioSeleccionado.apellidos || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Alias / Apodo</label>
                  <input
                    type="text"
                    name="nombre_alias"
                    value={usuarioSeleccionado.nombre_alias || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={usuarioSeleccionado.email || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Club</label>
                  <input
                    type="text"
                    name="club"
                    value={usuarioSeleccionado.club || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Código Postal</label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={usuarioSeleccionado.codigo_postal || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Localidad</label>
                  <input
                    type="text"
                    name="localidad"
                    value={usuarioSeleccionado.localidad || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>País</label>
                  <input
                    type="text"
                    name="pais"
                    value={usuarioSeleccionado.pais || ''}
                    onChange={handleInputChange}
                    className="input-form"
                  />
                </div>

                <div className="form-group">
                  <label>Rol</label>
                  <select
                    name="rol"
                    value={usuarioSeleccionado.rol || 'jugador'}
                    onChange={handleInputChange}
                    className="input-form"
                  >
                    <option value="jugador">Jugador</option>
                    <option value="organizador">Organizador</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado de cuenta</label>
                  <select
                    name="estado_cuenta"
                    value={usuarioSeleccionado.estado_cuenta || 'activo'}
                    onChange={handleInputChange}
                    className="input-form"
                  >
                    <option value="activo">Activo</option>
                    <option value="pendiente_registro">Pendiente Registro</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={cerrarModal} className="btn-cancelar">
                Cancelar
              </button>
              <button onClick={guardarCambios} className="btn-guardar">
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TORNEOS DEL USUARIO */}
      {mostrarModalTorneos && torneosUsuario && (
        <div className="modal-overlay" onClick={() => setMostrarModalTorneos(false)}>
          <div className="modal-content modal-torneos" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏆 Torneos de {torneosUsuario.usuario.nombre_alias || torneosUsuario.usuario.nombre}</h3>
              <button onClick={() => setMostrarModalTorneos(false)} className="btn-cerrar">✕</button>
            </div>

            <div className="modal-body">
              {/* Torneos como organizador */}
              {torneosUsuario.torneos.organizador.length > 0 && (
                <div className="seccion-torneos">
                  <h4>📋 Como Organizador ({torneosUsuario.torneos.organizador.length})</h4>
                  <div className="lista-torneos-modal">
                    {torneosUsuario.torneos.organizador.map(torneo => (
                      <div key={`org-${torneo.id}`} className="torneo-item-modal">
                        <div className="torneo-info-modal">
                          <span className="torneo-nombre">{torneo.nombre_torneo}</span>
                          <div className="torneo-detalles-modal">
                            <span className="badge-sistema">{torneo.sistema}</span>
                            <span className={`badge-estado estado-${torneo.estado}`}>
                              {torneo.estado}
                            </span>
                            {torneo.es_creador && (
                              <span className="badge-creador">👑 Creador</span>
                            )}
                          </div>
                          <span className="torneo-fecha">
                            {new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Torneos SAGA como jugador */}
              {torneosUsuario.torneos.jugador_saga.length > 0 && (
                <div className="seccion-torneos">
                  <h4>⚔️ Inscrito en SAGA ({torneosUsuario.torneos.jugador_saga.length})</h4>
                  <div className="lista-torneos-modal">
                    {torneosUsuario.torneos.jugador_saga.map(torneo => (
                      <div key={`saga-${torneo.inscripcion_id}`} className="torneo-item-modal">
                        <div className="torneo-info-modal">
                          <span className="torneo-nombre">{torneo.nombre_torneo}</span>
                          <div className="torneo-detalles-modal">
                            <span className="badge-faccion">{torneo.faccion}</span>
                            <span className="badge-epoca">{torneo.epoca}</span>
                            <span className={`badge-estado estado-${torneo.estado}`}>
                              {torneo.estado}
                            </span>
                          </div>
                          <span className="torneo-fecha">
                            {new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="acciones-inscripcion">
                          <button
                            onClick={() => abrirModalEditarInscripcion(torneo, 'SAGA')}
                            className="btn-editar-inscripcion"
                            title="Editar inscripción"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarInscripcion(torneo.inscripcion_id, 'SAGA', torneo.nombre_torneo)}
                            className="btn-eliminar-inscripcion"
                            title="Eliminar inscripción"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Torneos WARMASTER como jugador */}
              {torneosUsuario.torneos.jugador_warmaster.length > 0 && (
                <div className="seccion-torneos">
                  <h4>🛡️ Inscrito en WARMASTER ({torneosUsuario.torneos.jugador_warmaster.length})</h4>
                  <div className="lista-torneos-modal">
                    {torneosUsuario.torneos.jugador_warmaster.map(torneo => (
                      <div key={`wm-${torneo.inscripcion_id}`} className="torneo-item-modal">
                        <div className="torneo-info-modal">
                          <span className="torneo-nombre">{torneo.nombre_torneo}</span>
                          <div className="torneo-detalles-modal">
                            <span className="badge-faccion">{torneo.ejercito}</span>
                            <span className={`badge-estado estado-${torneo.estado}`}>
                              {torneo.estado}
                            </span>
                          </div>
                          <span className="torneo-fecha">
                            {new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="acciones-inscripcion">
                          <button
                            onClick={() => abrirModalEditarInscripcion(torneo, 'WARMASTER')}
                            className="btn-editar-inscripcion"
                            title="Editar inscripción"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarInscripcion(torneo.inscripcion_id, 'WARMASTER', torneo.nombre_torneo)}
                            className="btn-eliminar-inscripcion"
                            title="Eliminar inscripción"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Torneos FOW como jugador */}
              {torneosUsuario.torneos.jugador_fow.length > 0 && (
                <div className="seccion-torneos">
                  <h4>🎖️ Inscrito en FOW ({torneosUsuario.torneos.jugador_fow.length})</h4>
                  <div className="lista-torneos-modal">
                    {torneosUsuario.torneos.jugador_fow.map(torneo => (
                      <div key={`fow-${torneo.inscripcion_id}`} className="torneo-item-modal">
                        <div className="torneo-info-modal">
                          <span className="torneo-nombre">{torneo.nombre_torneo}</span>
                          <div className="torneo-detalles-modal">
                            <span className="badge-faccion">{torneo.ejercito}</span>
                            <span className="badge-bando">{torneo.bandos_2gm}</span>
                            <span className={`badge-estado estado-${torneo.estado}`}>
                              {torneo.estado}
                            </span>
                          </div>
                          <span className="torneo-fecha">
                            {new Date(torneo.fecha_inicio).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="acciones-inscripcion">
                          <button
                            onClick={() => abrirModalEditarInscripcion(torneo, 'FOW')}
                            className="btn-editar-inscripcion"
                            title="Editar inscripción"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarInscripcion(torneo.inscripcion_id, 'FOW', torneo.nombre_torneo)}
                            className="btn-eliminar-inscripcion"
                            title="Eliminar inscripción"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sin torneos */}
              {torneosUsuario.torneos.organizador.length === 0 &&
               torneosUsuario.torneos.jugador_saga.length === 0 &&
               torneosUsuario.torneos.jugador_warmaster.length === 0 &&
               torneosUsuario.torneos.jugador_fow.length === 0 && (
                <div className="sin-torneos-usuario">
                  <p>Este usuario no participa en ningún torneo</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setMostrarModalTorneos(false)} 
                className="btn-cancelar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

{/* MODAL EDITAR INSCRIPCIÓN SAGA */}
{mostrarModalEditarInscripcion && inscripcionEditar && (
  <ModalEditarInscripcionSaga
    torneo={inscripcionEditar}
    onClose={() => setMostrarModalEditarInscripcion(false)}
    onGuardar={guardarInscripcionSaga}
  />
)}

      {/* MODAL EDITAR INSCRIPCIÓN SIMPLE (WARMASTER/FOW) */}
      {mostrarModalEditarInscripcionSimple && inscripcionEditar && (
        <div className="modal-overlay" onClick={() => setMostrarModalEditarInscripcionSimple(false)}>
          <div className="modal-content modal-editar-inscripcion" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Editar Inscripción</h3>
              <button onClick={() => setMostrarModalEditarInscripcionSimple(false)} className="btn-cerrar">✕</button>
            </div>

            <div className="modal-body">
              <div className="info-torneo-inscripcion">
                <p><strong>Torneo:</strong> {inscripcionEditar.torneoNombre}</p>
                <p><strong>Sistema:</strong> {inscripcionEditar.sistema}</p>
              </div>

              <div className="form-inscripcion">
                {/* WARMASTER */}
                {inscripcionEditar.sistema === 'WARMASTER' && (
                  <div className="form-group">
                    <label>Ejército</label>
                    <input
                      type="text"
                      value={inscripcionEditar.ejercito || ''}
                      onChange={(e) => setInscripcionEditar(prev => ({ ...prev, ejercito: e.target.value }))}
                      className="input-form"
                      placeholder="Ej: Imperio"
                    />
                  </div>
                )}

                {/* FOW */}
                {inscripcionEditar.sistema === 'FOW' && (
                  <>
                    <div className="form-group">
                      <label>Ejército</label>
                      <input
                        type="text"
                        value={inscripcionEditar.ejercito || ''}
                        onChange={(e) => setInscripcionEditar(prev => ({ ...prev, ejercito: e.target.value }))}
                        className="input-form"
                        placeholder="Ej: Alemanes"
                      />
                    </div>

                    <div className="form-group">
                      <label>Bando 2GM</label>
                      <select
                        value={inscripcionEditar.bandos_2gm || 'Aliados'}
                        onChange={(e) => setInscripcionEditar(prev => ({ ...prev, bandos_2gm: e.target.value }))}
                        className="input-form"
                      >
                        <option value="Aliados">Aliados</option>
                        <option value="Eje">Eje</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setMostrarModalEditarInscripcionSimple(false)} 
                className="btn-cancelar"
              >
                Cancelar
              </button>
              <button onClick={guardarInscripcion} className="btn-guardar">
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;