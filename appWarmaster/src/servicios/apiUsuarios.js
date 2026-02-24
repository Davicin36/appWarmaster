import API_URL from "./apiUrl";

const API_BASE_URL = API_URL

class apiUsuarios {
  constructor() {
    this.baseURL = `${API_BASE_URL}/usuarios`;
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

  //======CONTACTO===========

  async enviarContacto(datos) {
    return this.request('/contacto', {
      method: 'POST',
      body: datos
    });
  }

  //======OBTENER TORNEOS DE CADA USUARIO==========

  async obtenerTorneosUsuario(userId) {
    return this.request(`/${userId}`);
  }

  //=====OBTENER TODOS LOS TORNEOS DEL SISTEMA=====

  async obtenerTodosTorneos() {
    return this.request('/torneos')
  }

  async obtenerSistema(torneoId) {
    return this.request (`/torneos/sistema/${torneoId}`, {
      method:'GET'
    })
  }

  //====== OBTENER USUARIOS POR EMAIL=====

  async verificarUsuario(email) {
    return this.request(`/verificarUsuario/${email}`, {
      method: 'GET'
    });
  }

  //======VERIFICAR SI ES ORGANIZADOR DEL TORNEO===========
  async verificarOrganizador(torneoId) {
      return this.request(`/${torneoId}/verificar-organizador`, {
        method: 'GET'
      });
  }

  //===================
  //MODULOS PARA RECUPERACION CONTRASEÑA
  //===================

  async verificarTokenRecuperar (token) {
    return this.request (`/verificar-token/${token}`, {
      method: 'GET'
    })
  }

  async recuperarPassword (email){
    return this.request (`/recuperar-password`, {
      method: 'POST',
      body: { email }
    })
  }

  async resetPassword (token, password) {
    return this.request(`/reset-password`, {
      method: 'POST',
      body: { token, password } 
    })
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