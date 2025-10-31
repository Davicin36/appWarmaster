// servicios/apiUsuarios.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiUsuarios {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  //Para actualizar usuarios
  async actualizarPerfil(datosUsuario) {
    return this.request('/usuariosRutas/actualizar-perfil', {
      method: 'PUT',
      body: datosUsuario,
    });
  }

  //para cambiar contraseña de los usuarios
  async cambiarPassword(passwordActual, passwordNueva) {
    return this.request('/usuariosRutas/cambiar-password', {
      method: 'PUT',
      body: { passwordActual, passwordNueva },
    });
  }

  //para convertir usuario en organizador
  async convertirOrganizador() {
    return this.request('/usuariosRutas/convertir-organizador', {
      method: 'PUT',
    });
  }
}

export const apiUsuarios = new ApiUsuarios();

export default apiUsuarios;