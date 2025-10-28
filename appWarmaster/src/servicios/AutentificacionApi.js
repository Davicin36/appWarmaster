const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AutentificacionApi {
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

  async login(credentials) {
    return this.request('/authRutas/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async registro(userData) {
    return this.request('/authRutas/registro', {
      method: 'POST',
      body: userData,
    });
  }

  async verificarToken(token) {
    return this.request('/authRutas/verificar', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async cambiarPassword(data) {
    return this.request('/authRutas/cambiar-password', {
      method: 'POST',
      body: data
    });
  }

  async convertirOrganizador() {
    return this.request('/authRutas/convertir-organizador', {
      method: 'POST'
    });
  }

  async healthCheck() {
    const response = await fetch('http://localhost:5000/health');
    return response.json();
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
}

export const autentificacionApi = new AutentificacionApi();

export default autentificacionApi;