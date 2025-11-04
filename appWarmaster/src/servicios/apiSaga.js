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
  // MÉTODOS DE TORNEOS ✅ TODOS OK
  // ====================

  async obtenerTorneos() {
    return this.request('/torneosSaga');
  }

  async obtenerTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}`);
  }

  async crearTorneo(torneoData) {
    return this.request('/torneosSaga', {
      method: 'POST',
      body: torneoData,
    });
  }

  async actualizarTorneo(torneoId, torneoData) {
    return this.request(`/torneosSaga/${torneoId}`, {
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

  async obtenerMiInscripcion(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/mi-inscripcion`);
}

async actualizarInscripcion(torneoId, datosInscripcion) {
    return this.request(`/torneosSaga/${torneoId}/inscripcion`, {
        method: 'PUT',
        body: datosInscripcion
    });
}

  async eliminarTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}`, {
      method: 'DELETE',
    });
  }

  async eliminarParticipante(torneoId, jugadorId) {
    return this.request(`/torneosSaga/${torneoId}/participantes/${jugadorId}`, {
      method: 'DELETE',
    });
  }

//====================================================
// //METODOS PARA ACCEDER A JUGADORES DE LOS TORNEOS SAGA
//====================================================

  //Torneos de cada usuario
  async obtenerTorneosUsuario(userId) {
    return this.request(`/torneosSaga/usuario/${userId}`);
  }

  //jugadores que hay en cada torneo
  async obtenerJugadoresTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/jugadores`);
  }

  //partidas de los torneos
  async obtenerPartidasTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/partidas`);
  }

  //clasificacion de los torneos
  async obtenerClasificacionTorneo(torneoId) {
    return this.request(`/torneosSaga/${torneoId}/clasificacion`);
  }

  //para cambiar el estado de los torneos
  async cambiarEstadoTorneo(torneoId, estado) {
    return this.request(`/torneosSaga/${torneoId}/estado/${estado}`, {
      method: 'PUT',
      body: { estado },
    });
  }

// ========================
// // MÉTODOS DE PARTIDAS
// ========================
//obtener partidas de un torneo
  async obtenerPartidas(torneoId = null) {
    return this.request (`/torneosSaga/${torneoId}/partidas`)
  }

  //obtener una partida concreta
  async obtenerPartida(partidaId, torneoId) {
    return this.request(`/torneosSaga/${torneoId}partidas/${partidaId}`);
  }

  //crear una partida nueva
  async registrarPartida(partida) {
    return this.request('/partidas', {
      method: 'POST',
      body: partida,
    });
  }

  async saveEmparejamientosRondas(torneoId, emparejamientos, ronda ) {
  return this.request(`/torneosSaga/${torneoId}/emparejamientos`, {
    method: 'POST',
    body: {
      torneo_id: torneoId,
      emparejamientos: emparejamientos,
      ronda: ronda
    }
  });
}

  async actualizarPartida(partidaId, torneoId, partida) {
    return this.request(`/torneosSaga/${torneoId}/partidas/${partidaId}`, {
      method: 'PUT',
      body: partida,
    });
  }

  async eliminarPartida(partidaId, torneoId) {
    return this.request(`/torneosSaga/${torneoId}/partidas/${partidaId}`, {
      method: 'DELETE',
    });
  }

  async obtenerHistorialPartidas(torneoId) {
  return this.request(`/torneosSaga/${torneoId}/partidasTorneoSaga`);
}

async actualizarPrimerJugador (torneoId, jugadorId, partidaId ){
  return this.request (`/torneosSaga/${torneoId}/partidasTorneoSaga/${partidaId}/primer-jugador/${jugadorId}`, {
    method: 'PUT ',
  })
}


//=======================================================================
//=======================================================================

  //metodo para la descarga de bases en PDF
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
}

export const torneosSagaApi = new TorneosSagaApi();
export default torneosSagaApi;