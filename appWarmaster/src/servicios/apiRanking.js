// services/eloService.js
import API_URL from "./apiUrl";

const API_BASE_URL = API_URL;

class RankingApi {
  constructor() {
    this.baseURL = `${API_BASE_URL}/ranking`;
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
        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ====================
  // SISTEMAS DE JUEGO
  // ====================

  async obtenerSistemasDisponibles() {
    return this.request('/sistemas-juego');
  }

  // ====================
  // TEMPORADAS
  // ====================

  async obtenerTemporadaActual(sistemaJuego) {
    return this.request(`/temporada-actual/${sistemaJuego}`);
  }

  async obtenerTemporadas(sistemaJuego) {
    return this.request(`/temporadas/${sistemaJuego}`);
  }

  // ====================
  // RANKING
  // ====================

  async obtenerRanking(sistemaJuego, params = {}) {
    const { limit = 100, minPartidas = 0, año } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      minPartidas: minPartidas.toString(),
      ...(año && { año: año.toString() })
    });
    
    return this.request(`/ranking/${sistemaJuego}?${queryParams}`);
  }

  async obtenerRankingGlobal(params = {}) {
    const { limit = 100, minPartidas = 0 } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      minPartidas: minPartidas.toString()
    });
    
    return this.request(`/ranking-global?${queryParams}`);
  }

  async obtenerRankingPorCategoria(sistemaJuego) {
    return this.request(`/ranking-por-categoria/${sistemaJuego}`);
  }

  // ====================
  // JUGADORES
  // ====================

  async obtenerPerfilJugador(jugadorId) {
    return this.request(`/jugador/${jugadorId}`);
  }

  async obtenerPerfilJugadorPorSistema(jugadorId, sistemaJuego) {
    return this.request(`/jugador/${jugadorId}/${sistemaJuego}`);
  }

  async obtenerHistorialJugador(jugadorId, sistemaJuego, limit = 50) {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    return this.request(`/jugador/${jugadorId}/${sistemaJuego}/historial?${queryParams}`);
  }

  // ====================
  // ESTADÍSTICAS
  // ====================

  async obtenerEstadisticasSistema(sistemaJuego) {
    return this.request(`/estadisticas/${sistemaJuego}`);
  }

  async obtenerEstadisticasGlobales() {
    return this.request('/estadisticas-globales');
  }

  // ====================
  // ESTADÍSTICAS DETALLADAS
  // ====================

  async obtenerEstadisticasCompletas(jugadorId, sistemaJuego) {
    return this.request(`/jugador/${jugadorId}/${sistemaJuego}/estadisticas-completas`);
  }

  async obtenerEpocasPopulares(sistemaJuego) {
    return this.request(`/estadisticas/${sistemaJuego}/epocas-populares`);
  }

  async obtenerFaccionesPopulares(sistemaJuego) {
    return this.request(`/estadisticas/${sistemaJuego}/facciones-populares`);
  }

  // ====================
  // ADMIN - ACTUALIZACIÓN DE ELO
  // ====================

  async actualizarEloTorneo(torneoId) {
    return this.request(`/actualizar-torneo/${torneoId}`, {
      method: 'POST'
    });
  }
}

// Exportar instancia única
const apiRanking = new RankingApi();
export default apiRanking;

// También exportar métodos individuales para compatibilidad
export const {
  obtenerSistemasDisponibles,
  obtenerTemporadaActual,
  obtenerTemporadas,
  obtenerRanking,
  obtenerRankingGlobal,
  obtenerRankingPorCategoria,
  obtenerPerfilJugador,
  obtenerPerfilJugadorPorSistema,
  obtenerHistorialJugador,
  obtenerEstadisticasSistema,
  obtenerEstadisticasGlobales,
  actualizarEloTorneo,
  obtenerEstadisticasCompletas,
  obtenerEpocasPopulares,
  obtenerFaccionesPopulares
} = apiRanking;