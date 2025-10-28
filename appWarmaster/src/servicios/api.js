const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


class TorneosApi {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`;
      
      // ✅ Obtener el token del localStorage
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // ✅ Agregar token si existe
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

// Obtener jugadores de un torneo
async getJugadoresTorneo(torneoId) {
  return this.request(`/torneos/${torneoId}/jugadores`);
}

// Obtener partidas de un torneo
async getPartidasTorneo(torneoId) {
  return this.request(`/torneos/${torneoId}/partidas`);
}

// Obtener clasificación de un torneo
async getClasificacionTorneo(torneoId) {
  return this.request(`/torneos/${torneoId}/clasificacion`);
}

// Cambiar estado del torneo
async cambiarEstadoTorneo(id, estado) {
  return this.request(`/torneos/${id}/estado`, {
    method: 'PUT',
    body: { estado },
  });
}

// ==========================================
// MÉTODOS DE PARTIDAS
// ==========================================
async getPartidas(torneoId = null) {
  const endpoint = torneoId ? `/partidas?torneo=${torneoId}` : '/partidas';
  return this.request(endpoint);
}

async getPartida(id) {
  return this.request(`/partidas/${id}`);
}

async createPartida(partida) {
  return this.request('/partidas', {
    method: 'POST',
    body: partida,
  });
}

async updatePartida(id, partida) {
  return this.request(`/partidas/${id}`, {
    method: 'PUT',
    body: partida,
  });
}

async deletePartida(id) {
  return this.request(`/partidas/${id}`, {
    method: 'DELETE',
  });
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
  // MÉTODOS DE ESCENARIO - CHOQUE DE BANDAS
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
  // MÉTODOS DE ESCENARIO - AVANCE
  // ==========================================
  async getAvances(torneoId = null) {
    const endpoint = torneoId ? `/avance?torneo=${torneoId}` : '/avance';
    return this.request(endpoint);
  }

  async getAvence(id) {
    return this.request(`/avance/${id}`);
  }

  async createAvance(avance) {
    return this.request('/avance', {
      method: 'POST',
      body: avance,
    });
  }

  async updateAvance(id, avance) {
    return this.request(`/avance/${id}`, {
      method: 'PUT',
      body: avance,
    });
  }

  async deleteAvance(id) {
    return this.request(`/avance/${id}`, {
      method: 'DELETE',
    });
  }


  // ==========================================
  // MÉTODOS DE ESCENARIO - CONQUISTA
  // ==========================================
  async getConquistas(torneoId = null) {
    const endpoint = torneoId ? `/conquista?torneo=${torneoId}` : '/conquista';
    return this.request(endpoint);
  }

  async getConquista(id) {
    return this.request(`/conquista/${id}`);
  }

  async createConquista(conquista) {
    return this.request('/conquista', {
      method: 'POST',
      body: conquista,
    });
  }

  async updateConquista(id, conquista) {
    return this.request(`/conquista/${id}`, {
      method: 'PUT',
      body: conquista,
    });
  }

  async deleteConquista(id) {
    return this.request(`/conquista/${id}`, {
      method: 'DELETE',
    });
  }

   // ==========================================
  // MÉTODOS DE ESCENARIO - DESACRALIZACIÓN
  // ==========================================
  async getDesacralizaciones(torneoId = null) {
    const endpoint = torneoId ? `/desacralizacion?torneo=${torneoId}` : '/desacralizacion';
    return this.request(endpoint);
  }

  async getDesacralizacion(id) {
    return this.request(`/desacralizacion/${id}`);
  }

  async createDesacralizacion(desacralizacion) {
    return this.request('/desacralizacion', {
      method: 'POST',
      body: desacralizacion,
    });
  }

  async updateDesacralizacion(id, desacralizacion) {
    return this.request(`/desacralizacion/${id}`, {
      method: 'PUT',
      body: desacralizacion,
    });
  }

  async deleteDesacralizacion(id) {
    return this.request(`/desacralizacion/${id}`, {
      method: 'DELETE',
    });
  }

   // ==========================================
  // MÉTODOS DE ESCENARIO - CAPTURA
  // ==========================================
  async getCapturas(torneoId = null) {
    const endpoint = torneoId ? `/captura?torneo=${torneoId}` : '/captura';
    return this.request(endpoint);
  }

  async getCaptura(id) {
    return this.request(`/captura/${id}`);
  }

  async createCaptura(captura) {
    return this.request('/captura', {
      method: 'POST',
      body: captura,
    });
  }

  async updateCaptura(id, captura) {
    return this.request(`/captura/${id}`, {
      method: 'PUT',
      body: captura,
    });
  }

  async deleteCaptura(id) {
    return this.request(`/captura/${id}`, {
      method: 'DELETE',
    });
  }
}

// Exportar instancia singleton
export const torneosApi = new TorneosApi();

export default torneosApi;