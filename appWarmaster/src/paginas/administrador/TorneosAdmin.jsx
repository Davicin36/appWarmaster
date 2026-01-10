import React, { useState, useEffect } from 'react';
import apiAdministrador from '@/servicios/apiAdmin.js';

import TorneoCard from './TorneoCard';
import EditarTorneoModal from './EditarTorneosModal';
import GestionarOrganizadoresModal from './GestionarOrganizadoresModal';

import './estilosAdmin/torneosAdmin.css';

const TorneosAdmin = () => {
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paginacion, setPaginacion] = useState({
    paginaActual: 1,
    totalPaginas: 0,
    totalRegistros: 0,
    registrosPorPagina: 20
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    sistema: '',
    estado: '',
    buscar: ''
  });

  // Modales
  const [torneoEditando, setTorneoEditando] = useState(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [torneoGestionandoOrg, setTorneoGestionandoOrg] = useState(null);
  const [modalOrganizadoresAbierto, setModalOrganizadoresAbierto] = useState(false);

  useEffect(() => {
    fetchTorneos();
  }, [paginacion.paginaActual, filtros]);

  const fetchTorneos = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: paginacion.paginaActual,
        limit: paginacion.registrosPorPagina,
        ...(filtros.sistema && { sistema: filtros.sistema }),
        ...(filtros.estado && { estado: filtros.estado })
      };

      const response = await apiAdministrador.obtenerTorneos(params);

      setTorneos(response.torneos);
      setPaginacion(response.paginacion);
      setError(null);
    } catch (error) {
      console.error('Error al obtener torneos:', error);
      setError('Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
  };

  const handleEditarTorneo = (torneo) => {
    setTorneoEditando(torneo);
    setModalEditarAbierto(true);
  };

  const handleGestionarOrganizadores = (torneo) => {
    setTorneoGestionandoOrg(torneo);
    setModalOrganizadoresAbierto(true);
  };

  const handleEliminarTorneo = async (torneoId) => {
    const torneo = torneos.find(t => t.id === torneoId);
    
    if (!window.confirm(
      `¿Estás seguro de eliminar el torneo "${torneo.nombre_torneo}"?\n\n` +
      `⚠️ Esta acción eliminará:\n` +
      `- Todas las inscripciones (${torneo.num_participantes} participantes)\n` +
      `- Todos los emparejamientos y partidas\n` +
      `- Todas las clasificaciones\n\n` +
      `Esta acción NO se puede deshacer.`
    )) {
      return;
    }

    try {
      await apiAdministrador.eliminarTorneo(torneoId);
      alert('✅ Torneo eliminado correctamente');
      fetchTorneos();
    } catch (error) {
      console.error('Error al eliminar torneo:', error);
      alert('❌ Error al eliminar torneo: ' + error.message);
    }
  };

  const handleTorneoActualizado = () => {
    setModalEditarAbierto(false);
    setTorneoEditando(null);
    fetchTorneos();
  };

  const handleOrganizadoresActualizados = () => {
    fetchTorneos(); // Refrescar la lista completa
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
  };

  return (
    <div className="torneos-admin">
      <div className="torneos-header">
        <h2>🏆 Gestión de Torneos</h2>
        <button onClick={fetchTorneos} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="torneos-filtros">
        <div className="filtro-grupo">
          <label>Sistema:</label>
          <select 
            value={filtros.sistema} 
            onChange={(e) => handleFiltroChange('sistema', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="SAGA">SAGA</option>
            <option value="WARMASTER">WARMASTER</option>
            <option value="FOW">Flames of War</option>
            <option value="BOLT">Bolt Action</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Estado:</label>
          <select 
            value={filtros.estado} 
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="en_curso">🎮 En Curso</option>
            <option value="finalizado">✅ Finalizado</option>
          </select>
        </div>

        <div className="filtro-resultado">
          Mostrando <strong>{torneos.length}</strong> de <strong>{paginacion.totalRegistros}</strong> torneos
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="torneos-loading">
          <div className="spinner"></div>
          <p>Cargando torneos...</p>
        </div>
      ) : error ? (
        <div className="torneos-error">
          <p>❌ {error}</p>
          <button onClick={fetchTorneos} className="btn-retry">
            Reintentar
          </button>
        </div>
      ) : torneos.length === 0 ? (
        <div className="torneos-empty">
          <p>No se encontraron torneos con los filtros aplicados</p>
        </div>
      ) : (
        <>
          {/* Grid de torneos */}
          <div className="torneos-grid">
            {torneos.map(torneo => (
              <TorneoCard
                key={torneo.id}
                torneo={torneo}
                onEditar={handleEditarTorneo}
                onEliminar={handleEliminarTorneo}
                onGestionarOrganizadores={handleGestionarOrganizadores}
              />
            ))}
          </div>

          {/* Paginación */}
          {paginacion.totalPaginas > 1 && (
            <div className="torneos-paginacion">
              <button
                onClick={() => cambiarPagina(paginacion.paginaActual - 1)}
                disabled={paginacion.paginaActual === 1}
                className="btn-paginacion"
              >
                ← Anterior
              </button>

              <span className="paginacion-info">
                Página {paginacion.paginaActual} de {paginacion.totalPaginas}
              </span>

              <button
                onClick={() => cambiarPagina(paginacion.paginaActual + 1)}
                disabled={paginacion.paginaActual === paginacion.totalPaginas}
                className="btn-paginacion"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de edición */}
      {modalEditarAbierto && torneoEditando && (
        <EditarTorneoModal
          torneo={torneoEditando}
          onClose={() => {
            setModalEditarAbierto(false);
            setTorneoEditando(null);
          }}
          onSuccess={handleTorneoActualizado}
        />
      )}

      {/* Modal de gestión de organizadores */}
      {modalOrganizadoresAbierto && torneoGestionandoOrg && (
        <GestionarOrganizadoresModal
          torneo={torneoGestionandoOrg}
          onClose={() => {
            setModalOrganizadoresAbierto(false);
            setTorneoGestionandoOrg(null);
          }}
          onSuccess={handleOrganizadoresActualizados}
        />
      )}
    </div>
  );
};

export default TorneosAdmin;