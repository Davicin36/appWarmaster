const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class TorneosSagaApi {
  constructor() {
    this.baseURL = `${API_BASE_URL}/torneosSaga`;
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

  async obtenerTorneos() {
    return this.request('/obtenerTorneos');
  }

  async obtenerTorneo(torneoId) {
    return this.request(`/torneo/${torneoId}`);
  }

  async crearTorneo(torneoData) {
    return this.request('/creandoTorneo', {
      method: 'POST',
      body: torneoData,
    });
  }

  async actualizarTorneo(torneoId, torneoData) {
    return this.request(`/${torneoId}/actualizarTorneo`, {
      method: 'PUT',
      body: torneoData,
    });
  }
  //metodo para que cambie el estado del torneo
  async cambiarEstadoTorneo(torneoId, estado) {
    return this.request(`/${torneoId}/estado`, { 
      method: 'PUT',
      body: { estado },
    });
  }
   async eliminarTorneo(torneoId) {
    return this.request(`/${torneoId}/eliminarTorneo`, {
      method: 'DELETE',
    });
  }

  // ==================
  // INSCRIPCIONES
  // ==================

  async inscribirse(torneoId, inscripcionData) {
    return this.request(`/${torneoId}/inscripcion`, {
      method: 'POST',
      body: inscripcionData,
    });
  }

  async IncripcionEquipo (torneoId, inscripcionData){
    return this.request(`/${torneoId}/inscripcionEquipo`, {
      method: 'POST',
      body: inscripcionData,
    });
  }

  async obtenerIncripcion (torneoId){
    return this.request(`/${torneoId}/obtenerInscripcion`);
  }

  async obtenerInscripcionEquipo(torneoId) {
    return this.request(`/${torneoId}/obtenerInscripcionEquipo`);
}

async actualizarInscripcion(torneoId, datosInscripcion) {
    return this.request(`/${torneoId}/actualizarInscripcion`, {
        method: 'PUT',
        body: datosInscripcion
    });
}

async actualizarInscripcionEquipos(torneoId, datosInscripcion) {
    return this.request(`/${torneoId}/actualizarInscripcionEquipo`, {
        method: 'PUT',
        body: datosInscripcion
    });
}

async actualizarPagoJugador (torneoId, jugadorId, pagado){
  return this.request(`/${torneoId}/jugadores/${jugadorId}/pago`, {
      method: 'PATCH',
      body: { pagado }
  })
}

async actualizarPagoEquipo (torneoId, equipoId, pagado){
  return this.request (`/${torneoId}/equipos/${equipoId}/pago`, {
    method : 'PATCH',
    body : { pagado }
  })
}

async verificarPagos (torneoId){
  return this.request (`/${torneoId}/verificarPagos`, { 
    method : 'GET'
  });
}

//====================================================
// //METODOS PARA ACCEDER A JUGADORES DE LOS TORNEOS SAGA
//====================================================

  async eliminarJugadorTorneo(torneoId, jugadorId) {
    return this.request(`/${torneoId}/jugadores/${jugadorId}`, {
      method: 'DELETE',
    });
  }

   async eliminarEquipoTorneo(torneoId, equipoId) {
    return this.request(`/${torneoId}/equipos/${equipoId}`, {
      method: 'DELETE',
    });
  }

  //jugadores que hay en cada torneo
  async obtenerJugadoresTorneo(torneoId) {
    return this.request(`/${torneoId}/jugadores`);
  }

    //equipos que hay en cada torneo
  async obtenerEquiposTorneo(torneoId) {
    return this.request(`/${torneoId}/equipos`);
  }

  
// ========================
// // MÉTODOS DE PARTIDAS
// ========================

// Obtener TODAS las partidas de un torneo (con filtro opcional de ronda)
async obtenerPartidasTorneo(torneoId, ronda) {
  const endpoint = ronda 
    ? `/${torneoId}/partidasTorneoSaga?ronda=${ronda}`
    : `/${torneoId}/partidasTorneoSaga`;
  
  const response = await this.request(endpoint);
  
  // ✅ EL BACKEND DEVUELVE UN ARRAY DIRECTO
  if (Array.isArray(response)) {
    return response;
  }
  
  // Si por alguna razón viene envuelto
  return response.partidas || response.data?.partidas || [];
}

//obtener partidas de un torneo
  async obtenerPartida(torneoId, partidaId) {
      return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}`);
  }

  //crear una partida nueva
  async registrarPartida(torneoId, partidaId, partida) {
    return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}`, {
      method: 'PUT',
      body : partida
    });
  }

  async confirmarResultado(torneoId, partidaId, confirmar) {
  return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}/confirmar`, {
    method: 'PATCH',
    body: { confirmar }
  });
}

async confirmarResultadoEquipo(torneoId, partidaId, confirmar) {
  return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}/confirmarEquipo`, {
    method: 'PATCH',
    body: { confirmar }
  });
}

async obtenerEmparejamientosIndividuales(torneoId, ronda = null) {
  const params = new URLSearchParams();
  if (ronda) params.append('ronda', ronda);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return this.request(`/${torneoId}/obtenerEmparejamientosIndividuales${queryString}`, {
    method: 'GET'
  });
}

async guardarEmparejamientosIndividuales(torneoId, emparejamientos, ronda) {
  return this.request(`/${torneoId}/guardarEmparejamientosIndividuales`, {
    method: 'POST',
    body: {
      emparejamientos: emparejamientos,
      ronda: ronda
    }
  });
}

async obtenerEmparejamientosEquipos(torneoId, ronda = null) {
  const params = new URLSearchParams();
  if (ronda) params.append('ronda', ronda);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return this.request(`/${torneoId}/obtenerEmparejamientosEquipos${queryString}`, {
    method: 'GET'
  });
}

async guardarEmparejamientosEquipos(torneoId, emparejamientos, ronda) {
  return this.request(`/${torneoId}/guardarEmparejamientosEquipos`, {
    method: 'POST',
    body: {
      emparejamientos: emparejamientos,
      ronda: ronda
    }
  });
}

  async actualizarPartida(partidaId, torneoId, partida) {
    return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}`, {
      method: 'PUT',
      body: partida,
    });
  }

async actualizarPrimerJugador (torneoId, jugadorId, partidaId ){
  return this.request (`/${torneoId}/partidasTorneoSaga/${partidaId}/primer-jugador`, {
    method: 'PUT ',
    body: { jugador_id: jugadorId }
  })
}

 async eliminarPartida(partidaId, torneoId) {
    return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}`, {
      method: 'DELETE',
    });
  }

// ==================
  // CLASIFICACIÓN
  // ==================

  //clasificacion de los torneos
  async obtenerClasificacionIndividual(torneoId) {
  return this.request(`/${torneoId}/obtenerClasificacionIndividual`, {
    method: 'GET'
  });
}

async obtenerClasificacionEquipos(torneoId) {
  return this.request(`/${torneoId}/obtenerClasificacionEquipos`, {
    method: 'GET'
  });
}

//=======================================================================
//=======================================================================

  //metodo para la descarga de bases en PDF
  async descargarBasesPDF(torneoId) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/${torneoId}/bases-pdf`; 
    
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