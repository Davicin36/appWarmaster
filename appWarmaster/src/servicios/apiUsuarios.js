import API_URL from "./apiUrl";

const API_BASE_URL = API_URL

class apiUsuarios {
  constructor() {
    this.baseURL = `${API_BASE_URL}/usuarios`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      // ✅ Log para debugging (quitar en producción)
      console.log('📤 API Request:', {
        url,
        method: config.method || 'GET',
        hasBody: !!config.body,
        hasToken: !!token
      });

      const response = await fetch(url, config);

      console.log('📥 API Response:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json().catch(() => ({}));
      console.log('📦 Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  //======REGISTRO===========

  async registro(userData) {
    return this.request('/registro', {
      method: 'POST',
      body: userData,
    });
  }

  //======LOGIN===========

  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: credentials,
    });
  }

    //======VERIFICAR TOKEN===========

  async verificarToken(token) {
    return this.request('/verificar', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

    //======ACTUALIZAR USUARIOS===========

  async actualizarPerfil(datosUsuario) {
    return this.request('/actualizarPerfil', {
      method: 'PUT',
      body: datosUsuario,
    });
  }

  //======CAMBIAR PASSWORD USUARIO===========

  async cambiarPassword(data) {
    return this.request('/cambiarPassword', {
      method: 'POST',
      body: data
    });
  }

  //======CONVERTIR A ORGANIZADOR===========

  async convertirOrganizador() {
    return this.request('/convertirOrganizador', {
      method: 'POST'
    });
  }

  //======OBTENER TORNEOS DE CADA USUARIO==========

  async obtenerTorneosUsuario(userId) {
    return this.request(`/${userId}`);
  }

  //====== OBTENER USUARIOS POR EMAIL=====

  async verificarUsuario(email) {
    return this.request(`/verificarUsuario/${email}`, {
      method: 'GET'
    });
  }
  
//  =========================
//GESTIONES CON LOS TOKENS
//==========================

  guardarToken(token) {
    localStorage.setItem('token', token);
  }

  obtenerToken() {
    return localStorage.getItem('token');
  }

  eliminarToken() {
    localStorage.removeItem('token');
  }

  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export const usuarioApi = new apiUsuarios();

export default usuarioApi;