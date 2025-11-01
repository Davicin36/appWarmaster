const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TorneosSagaApi {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
  const url = `${this.baseURL}${endpoint}`;
  
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;
  
  const config = {
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // 👇 AÑADE ESTOS LOGS
      console.error("❌ Status:", response.status);
      console.error("❌ URL:", url);
      
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Error del servidor:", errorData); // 👈 IMPORTANTE

      
      
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
  // ====================
  // MÉTODOS DE TORNEOS
  // ====================

  async getTorneos() {
    return this.request('/torneosSaga');
  }

  async getTorneo(id) {
    return this.request(`/torneosSaga/${id}`);
  }

  async createTorneo(torneoData) {
    return this.request('/torneosSaga', {
      method: 'POST',
      body: torneoData,
    });
  }

  async updateTorneo(id, torneoData) {
    return this.request(`/torneosSaga/${id}`, {
      method: 'PUT',
      body: torneoData,
    });
  }

  async inscribirse(torneoId, inscripcionData) {
    return this.request(`/torneosSaga/${torneoId}/inscripcion`, {
      method: 'POST',
      body: inscripcionData,
    });
  }


  async deleteTorneo(id) {
    return this.request(`/torneosSaga/${id}`, {
      method: 'DELETE',
    });
  }

  async descargarBasesPDF(torneoId) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/torneosSaga/${torneoId}/bases-pdf`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar el PDF');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'bases_torneo.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, filename };
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      throw error;
    }
  }

  //====================================================
  //METODOS PARA ACCEDER A JUGADORES DE LOS TORNEOS SAGA
//====================================================

  //Torneos de cada usuario
  async getTorneosUsuario(userId) {
    return this.request(`/torneosSaga/usuario/${userId}`);
  }

  //jugadores que hay en cada torneo
  async getJugadoresTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/jugadores`);
  }

  //partidas de los torneos
  async getPartidasTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/partidas`);
  }

  //clasificacion de los torneos
  async getClasificacionTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/clasificacion`);
  }

  //para cambiar el estado de los torneos
  async cambiarEstadoTorneo(id, estado) {
    return this.request(`/torneosSaga/${id}/estado`, {
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

  async getHistorialPartidas(torneoId) {
  return this.request(`/torneosSaga/${torneoId}/partidasTorneoSaga`);
}

  // ==========================================
  // MÉTODOS DE PARTICIPANTES
  // ==========================================

  async getParticipantes(torneoId = null) {
    const endpoint = torneoId 
      ? `/torneosSaga/${torneoId}/participantes` 
      : '/participantes';
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

// El endpoint necesita tanto torneoId como jugadorId en la URL
  async deleteParticipante(torneoId, jugadorId) {
    return this.request(`/torneosSaga/${torneoId}/participantes/${jugadorId}`, {
      method: 'DELETE',
    });
  }
}

export const torneosSagaApi = new TorneosSagaApi();
export default torneosSagaApi;