const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TorneosApi {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Para manejar cookies/sessions
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================
  async login(credentials) {
    return this.request('/authRutas/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async registros(userData) {
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

  async cambiarPassword(data, token) {
    return this.request('/authRutas/cambiar-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: data
    });
  }
/** 
  async logout() {
    return this.request('/authRutas/logout', {
      method: 'POST',
    });
  }
  */

  // ==========================================
  // MÉTODOS DE TORNEOS
  // ==========================================
  async getTorneos() {
    return this.request('/torneos');
  }

  async getTorneo(id) {
    return this.request(`/torneos/${id}`);
  }

  async createTorneo(torneo) {
    return this.request('/torneos', {
      method: 'POST',
      body: torneo,
    });
  }

  async updateTorneo(id, torneo) {
    return this.request(`/torneos/${id}`, {
      method: 'PUT',
      body: torneo,
    });
  }

  async deleteTorneo(id) {
    return this.request(`/torneos/${id}`, {
      method: 'DELETE',
    });
  }

  // Clasificación general
  async getClasificacionGeneral(torneoId) {
    return this.request(`/torneos/${torneoId}/clasificacion-general`);
  }

  // ==========================================
  // MÉTODOS DE PARTICIPANTES
  // ==========================================
  async getParticipantes(torneoId = null) {
    const endpoint = torneoId ? `/participantes?torneo=${torneoId}` : '/participantes';
    return this.request(endpoint);
  }

  async getParticipante(id) {
    return this.request(`/participantes/${id}`);
  }

  async createParticipante(participante) {
    return this.request('/participantes', {
      method: 'POST',
      body: participante,
    });
  }

  async updateParticipante(id, participante) {
    return this.request(`/participantes/${id}`, {
      method: 'PUT',
      body: participante,
    });
  }

  async deleteParticipante(id) {
    return this.request(`/participantes/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // MÉTODOS DE CHOQUE DE BANDAS
  // ==========================================
  async getChoqueBandas(torneoId = null) {
    const endpoint = torneoId ? `/choque-bandas?torneo=${torneoId}` : '/choque-bandas';
    return this.request(endpoint);
  }

  async getChoqueBanda(id) {
    return this.request(`/choque-bandas/${id}`);
  }

  async createChoqueBanda(choque) {
    return this.request('/choque-bandas', {
      method: 'POST',
      body: choque,
    });
  }

  async updateChoqueBanda(id, choque) {
    return this.request(`/choque-bandas/${id}`, {
      method: 'PUT',
      body: choque,
    });
  }

  async deleteChoqueBanda(id) {
    return this.request(`/choque-bandas/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // MÉTODO PARA HEALTH CHECK
  // ==========================================
  async healthCheck() {
    const response = await fetch('http://localhost:5000/health');
    return response.json();
  }
}

// Exportar instancia singleton
export const torneosApi = new TorneosApi();

export default torneosApi;