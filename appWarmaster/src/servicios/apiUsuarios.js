const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class apiUsuarios {
  constructor() {
    this.baseURL = `${API_BASE_URL}/usuarios`;
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
      credentials: 'include',
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  //======REGISTRO===========

    async registro(userData) {
    return this.request('/registro', {
      method: 'POST',
      body: userData,
    });
  }

  //======LOGIN===========

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: credentials,
    });
  }

    //======VERIFICAR TOKEN===========

  async verificarToken(token) {
    return this.request('/verificar', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

    //======ACTUALIZAR USUARIOS===========

  async actualizarPerfil(datosUsuario) {
    return this.request('/actualizarPerfil', {
      method: 'PUT',
      body: datosUsuario,
    });
  }

  //======CAMBIAR PASSWORD USUARIO===========

  async cambiarPassword(data) {
    return this.request('/cambiarPassword', {
      method: 'POST',
      body: data
    });
  }

  //======CONVERTIR A ORGANIZADOR===========

  async convertirOrganizador() {
    return this.request('/convertirOrganizador', {
      method: 'POST'
    });
  }

  //======OBTENER TORNEOS DE CADA USUARIO==========
  async obtenerTorneosUsuario(userId) {
    return this.request(`/${userId}`);
  }

//  =========================
//GESTIONES CON LOS TOKENS
//==========================

  guardarToken(token) {
    localStorage.setItem('token', token);
  }

  obtenerToken() {
    return localStorage.getItem('token');
  }

  eliminarToken() {
    localStorage.removeItem('token');
  }

  async healthCheck() {
    const response = await fetch('http://localhost:5000/health');
    return response.json();
  }
}

export const usuarioApi = new apiUsuarios();

export default usuarioApi;