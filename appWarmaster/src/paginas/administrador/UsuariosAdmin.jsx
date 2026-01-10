import React from 'react';

import './estilosAdmin/usuariosAdmin.css';

const UsuariosAdmin = () => {
  return (
    <div className="usuarios-admin">
      <div className="usuarios-header">
        <h2>👥 Gestión de Usuarios</h2>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">🚧</div>
        <h3>Próximamente</h3>
        <p>La gestión de usuarios estará disponible en la próxima versión</p>
        
        <div className="features-preview">
          <h4>Funcionalidades planeadas:</h4>
          <ul>
            <li>✅ Ver lista completa de usuarios</li>
            <li>✅ Editar roles (usuario, organizador, superadmin)</li>
            <li>✅ Activar/suspender cuentas</li>
            <li>✅ Ver historial de torneos por usuario</li>
            <li>✅ Búsqueda y filtros avanzados</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UsuariosAdmin;