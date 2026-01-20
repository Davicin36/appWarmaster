import API_URL from "./apiUrl";

const API_BASE_URL = API_URL

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

  // Obtener organizadores del torneo
  async obtenerOrganizadores(torneoId) {
    return this.request(`/${torneoId}/organizadores`);
  }

  // Agregar organizador
  async agregarOrganizador(torneoId, datos) {
    return this.request(`/${torneoId}/organizadores`, {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  // Eliminar organizador
  async eliminarOrganizador(torneoId, organizadorId) {
    return this.request(
      `/${torneoId}/organizadores/${organizadorId}`,
      { method: 'DELETE' }
    );
  }

  async reenviarInvitacion(torneoId, organizadorId) {
    return this.request(`/torneos/${torneoId}/organizadores/${organizadorId}/reenviar`, {
      method: 'POST'
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

    async obtenerIncripcion (torneoId){
    return this.request(`/${torneoId}/obtenerInscripcion`);
  }
  
  async actualizarInscripcion(torneoId, datosInscripcion) {
      return this.request(`/${torneoId}/actualizarInscripcion`, {
          method: 'PUT',
          body: datosInscripcion
      });
  }

  async añadirJugadorIndividual(torneoId, participante) {
    return this.request(`/${torneoId}/add-individual-participant`, {
      method: 'POST',
      body: { participante }
    });
  }

  async reenviarInscripcionTodosJugadores (torneoId) {
    return this.request (`/${torneoId}/reenviarInscripciontodosIndividual`, {
      method: 'POST'
    })
  }

  async reenviarInscripcionIndivivual (torneoId, jugadorId) {
      return this.request(`/${torneoId}/jugadores/${jugadorId}/reenviarInvitacionInd`, {
        method: 'POST'
      })
    }

  async actualizarPagoJugador (torneoId, jugadorId, pagado){
    return this.request(`/${torneoId}/jugadores/${jugadorId}/pago`, {
        method: 'PATCH',
        body: { pagado }
    })
  }

  async IncripcionEquipo (torneoId, inscripcionData){
    return this.request(`/${torneoId}/inscripcionEquipo`, {
      method: 'POST',
      body: inscripcionData,
    });
  }

  async obtenerInscripcionEquipo(torneoId) {
    return this.request(`/${torneoId}/obtenerInscripcionEquipo`);
  }

  async actualizarInscripcionEquipos(torneoId, datosInscripcion) {
      return this.request(`/${torneoId}/actualizarInscripcionEquipo`, {
          method: 'PUT',
          body: datosInscripcion
      });
  }

  async añadirEquipo(torneoId, equipo) {
    return this.request(`/${torneoId}/add-team`, {
      method: 'POST',
      body:  equipo 
    });
  }

  async reenviarInscripcionEquipo (torneoId, equipoId) {
    return this.request(`/${torneoId}/equipos/${equipoId}/reenviarInvitacionEq`, {
      method: 'POST'
    })
  }

  async reenviarInscripcionTodosEquipos (torneoId) {
    return this.request(`/${torneoId}/reenviarTodasInvitaciones`, {
      method: 'POST'
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
    return this.request(`/${torneoId}/equipo/${equipoId}`, {
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

//obtener partidas de un torneo
  async obtenerPartidaEspecifica(torneoId, partidaId) {
      return this.request(`/${torneoId}/partidasTorneoSaga/${partidaId}`);
  }

  // ENDPOINT PÚBLICO para obtener todas las partidas del torneo
  async obtenerPartidasTorneoPublico(torneoId) {
      return this.request(`/${torneoId}/partidasTorneoSaga/publico`, {
          method: 'GET',
          requiresAuth: false
      });
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

async obtenerEmparejamientosIndividualesPublico(torneoId, ronda) {
    return this.request(`/${torneoId}/emparejamientos/publico/${ronda}`, {
        method: 'GET',
        requiresAuth: false // ⭐ NO requiere autenticación
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

// ENDPOINT PÚBLICO para obtener emparejamientos de equipos
async obtenerEmparejamientosEquiposPublico(torneoId, ronda) {
    return this.request(`/${torneoId}/emparejamientos-equipos/publico?ronda=${ronda}`, {
        method: 'GET',
        requiresAuth: false // ⭐ NO requiere autenticación
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