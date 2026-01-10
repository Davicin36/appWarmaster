import API_URL from "./apiUrl";

const API_BASE_URL = API_URL;

class AdminApi {
  constructor() {
    this.baseURL = `${API_BASE_URL}/administrador`;
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

  // =======ESTADÍSTICAS=============

  async obtenerEstadisticas() {
    return this.request('/estadisticas');
  }

  // ======== GESTIÓN DE TORNEOS========

  async obtenerTorneos(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.sistema) queryParams.append('sistema', params.sistema);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return this.request(`/torneos${queryString}`);
  }


  async actualizarTorneo(torneoId, torneoData) {
    return this.request(`/torneos/${torneoId}`, {
      method: 'PUT',
      body: torneoData,
    });
  }

  async eliminarTorneo(torneoId) {
    return this.request(`/torneos/${torneoId}`, {
      method: 'DELETE',
    });
  }

  // ========GESTIÓN DE USUARIOS==========

  async obtenerUsuarios() {
    return this.request('/usuarios');
  }

  async actualizarUsuario(usuarioId, userData) {
    return this.request(`/usuarios/${usuarioId}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async eliminarUsuario(usuarioId) {
    return this.request(`/usuarios/${usuarioId}`, {
      method: 'DELETE',
    });
  }

  async obtenerOrganizadores(torneoId) {
    return this.request(`/torneos/${torneoId}/organizadores`);
  }

  async agregarOrganizador(torneoId, email) {
    return this.request(`/torneos/${torneoId}/organizadores`, {
      method: 'POST',
      body: { email }
    });
  }

  async eliminarOrganizador(torneoId, organizadorId) {
    return this.request(`/torneos/${torneoId}/organizadores/${organizadorId}`, {
      method: 'DELETE'
    });
  }

  async reenviarInvitacion(torneoId, organizadorId) {
    return this.request(`/torneos/${torneoId}/organizadores/${organizadorId}/reenviar`, {
      method: 'POST'
    });
  }

  // ========================
  // MÉTODOS DE UTILIDAD
  // ========================

  esSuperAdmin() {
    const rol = localStorage.getItem('userRole');
    return rol === 'superadmin';
  }

  obtenerUsuarioActual() {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userId || !userRole) {
      return null;
    }
    
    return {
      id: parseInt(userId),
      rol: userRole,
      email: userEmail,
    };
  }

  /**
   * Cerrar sesión y limpiar datos
   */
  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  }
}

export const apiAdministrador = new AdminApi();
export default apiAdministrador;