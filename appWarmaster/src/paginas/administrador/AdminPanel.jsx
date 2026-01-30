import React, { useState } from 'react';

import TorneosAdmin from './TorneosAdmin';
import UsuariosAdmin from './UsuariosAdmin';
import EstadisticasAdmin from './EstadisticasAdmin';
import ActualizarRanking from './ActualizarRanking';

import './estilosAdmin/adminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('torneos');

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Panel de Superadministrador</h1>
        <p className="admin-subtitle">Gestión completa del sistema</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setActiveTab('estadisticas')}
        >
          📊 Estadísticas
        </button>
        <button 
          className={`admin-tab ${activeTab === 'torneos' ? 'active' : ''}`}
          onClick={() => setActiveTab('torneos')}
        >
          🏆 Torneos
        </button>
        <button 
          className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          👥 Usuarios
        </button>
        <button 
          className={`admin-tab ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          ⚡ Actualizar Ranking
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'estadisticas' && <EstadisticasAdmin />}
        {activeTab === 'torneos' && <TorneosAdmin />}
        {activeTab === 'usuarios' && <UsuariosAdmin />}
        {activeTab === 'ranking' && <ActualizarRanking />}
      </div>
    </div>
  );
};

export default AdminPanel;