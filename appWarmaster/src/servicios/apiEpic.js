import API_URL from "./apiUrl";

const API_BASE_URL = API_URL

class TorneosEpicApi {
  constructor() {
    this.baseURL = `${API_BASE_URL}/torneosEpic`;
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

       if (response.status !== 404) {
          console.error("❌ Error del servidor:", errorData);
        }
      
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      
      if (!error.message.includes('404') && !error.message.includes('HTTP error! status: 404')) {
        console.error('API Error:', error);
      }
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
    return this.request(`${torneoId}/organizadores/${organizadorId}/reenviar`, {
      method: 'POST'
    });
  }

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

  async obtenerIncripcion(torneoId) {
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

  async actualizarPagoJugador(torneoId, jugadorId, pagado) {
    return this.request(`/${torneoId}/jugadores/${jugadorId}/pago`, {
      method: 'PATCH',
      body: { pagado }
    })
  }

  async verificarPagos(torneoId) {
    return this.request(`/${torneoId}/verificarPagos`, { 
      method: 'GET'
    });
  }

  // ====================================================
  // MÉTODOS PARA ACCEDER A JUGADORES DE LOS TORNEOS
  // ====================================================

  async eliminarJugadorTorneo(torneoId, jugadorId) {
    return this.request(`/${torneoId}/jugadores/${jugadorId}`, {
      method: 'DELETE',
    });
  }

  async obtenerJugadoresTorneo(torneoId) {
    return this.request(`/${torneoId}/jugadores`);
  }
 
  // ========================
  // MÉTODOS DE PARTIDAS
  // ========================

  async obtenerPartidasTorneo(torneoId, ronda) {
    const endpoint = ronda 
      ? `/${torneoId}/partidasTorneoEpic?ronda=${ronda}`
      : `/${torneoId}/partidasTorneoEpic`;
    
    const response = await this.request(endpoint);
    
    if (Array.isArray(response)) {
      return response;
    }
    
    return response.partidas || response.data?.partidas || [];
  }

  async obtenerPartida(torneoId, partidaId) {
    return this.request(`/${torneoId}/partidasTorneoEpic/${partidaId}`);
  }

  async registrarPartida(torneoId, partidaId, partida) {
    return this.request(`/${torneoId}/partidasTorneoEpic/${partidaId}`, {
      method: 'PUT',
      body: JSON.stringify(partida)
    });
  }

  async confirmarResultado(torneoId, partidaId, confirmar) {
    return this.request(`/${torneoId}/partidasTorneoEpic/${partidaId}/confirmar`, {
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

  async actualizarPartida(partidaId, torneoId, partida) {
    return this.request(`/${torneoId}/partidasTorneoEpic/${partidaId}`, {
      method: 'PUT',
      body: partida,
    });
  }

  async eliminarPartida(partidaId, torneoId) {
    return this.request(`/${torneoId}/partidasTorneoEpic/${partidaId}`, {
      method: 'DELETE',
    });
  }

    async obtenerJugadoresCorreos(torneoId) {
  return this.request(`/${torneoId}/jugadores-correos`, {
    method: 'GET'
  });
}

// Enviar correos a participantes
async enviarCorreoParticipantes(torneoId, datos) {
  return this.request(`/${torneoId}/enviar-correo`, {
    method: 'POST',
    body: datos
  });
}

  // ==================
  // CLASIFICACIÓN
  // ==================

  async obtenerClasificacionIndividual(torneoId) {
    return this.request(`/${torneoId}/obtenerClasificacionIndividual`, {
      method: 'GET'
    });
  }

  // ==================
  // ARCHIVOS PDF
  // ==================

  // Descargar bases del torneo
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

  // ✅ NUEVO: Ver lista de ejército PDF en el navegador
  async verListaPDFJugador(torneoId, jugadorId) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/${torneoId}/jugadores/${jugadorId}/lista-pdf`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error al visualizar la lista');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear URL temporal para el blob
      const pdfUrl = window.URL.createObjectURL(blob);
      
      // Abrir en nueva pestaña
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (!newWindow) {
        throw new Error('Por favor, permite ventanas emergentes para ver el PDF');
      }

      // Limpiar URL después de 30 segundos
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 30000);

      return { success: true };
    } catch (error) {
      console.error('❌ Error al visualizar lista de ejército:', error);
      throw error;
    }
  }

  // DESCARGAR lista de ejército PDF
  async descargarListaEjercito(torneoId, jugadorId) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/${torneoId}/listasEjercitos-pdf/${jugadorId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al descargar la lista de ejército');
      }

      const blob = await response.blob();
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `lista_ejercito_jugador_${jugadorId}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
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
      console.error('❌ Error al descargar lista de ejército:', error);
      throw error;
    }
  }

  // VER lista de ejército PDF (método antiguo, mantener por compatibilidad)
  async verListaEjercito(torneoId, jugadorId) {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}/${torneoId}/listasEjercitos-pdf/${jugadorId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al abrir la lista de ejército');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (!newWindow) {
        throw new Error('Por favor, permite ventanas emergentes para ver el PDF');
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 30000);

      return { success: true };
    } catch (error) {
      console.error('❌ Error al ver lista de ejército:', error);
      throw error;
    }
  }
}

export const torneosEpicApi = new TorneosEpicApi();
export default torneosEpicApi;