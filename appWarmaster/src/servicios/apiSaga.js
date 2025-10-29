const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TorneosSagaApi {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // ✅ Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    // ✅ Detectar si el body es FormData
    const isFormData = options.body instanceof FormData;
    
    const config = {
      headers: {
        // ✅ NO agregar Content-Type si es FormData (el navegador lo hace automáticamente)
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // ✅ Solo convertir a JSON si NO es FormData
    if (config.body && typeof config.body === 'object' && !isFormData) {
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
    return this.request('/torneosSaga');
  }

  async getTorneo(id) {
    return this.request(`/torneosSaga/${id}`);
  }

  // ✅ Acepta tanto JSON como FormData
  async createTorneo(torneoData) {
    return this.request('/torneosSaga', {
      method: 'POST',
      body: torneoData,
    });
  }

  // ✅ Acepta tanto JSON como FormData
  async updateTorneo(id, torneoData) {
    return this.request(`/torneosSaga/${id}`, {
      method: 'PUT',
      body: torneoData,
    });
  }

  async deleteTorneo(id) {
    return this.request(`/torneosSaga/${id}`, {
      method: 'DELETE',
    });
  }

  // ✅ NUEVO - Descargar PDF de bases del torneo
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

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Obtener el nombre del archivo del header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'bases_torneo.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Crear un enlace temporal y descargarlo
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

  // Clasificación general
  async getClasificacionGeneral(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/clasificacion-general`);
  }

  // Obtener jugadores de un torneo
  async getJugadoresTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/jugadores`);
  }

  // Obtener partidas de un torneo
  async getPartidasTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/partidas`);
  }

  // Obtener clasificación de un torneo
  async getClasificacionTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/clasificacion`);
  }

  // Cambiar estado del torneo
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
}

// Exportar instancia singleton
export const torneosSagaApi = new TorneosSagaApi();

export default torneosSagaApi;