// ✅ AuthContext.jsx - OPTIMIZADO para evitar múltiples renders
import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================================================
  // 🔐 Verificar token al cargar
  // ==================================================
  useEffect(() => {
    const inicializarAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            console.log('🧠 Usuario restaurado desde localStorage');
          } catch (error) {
            console.error('Error parseando usuario:', error);
            localStorage.removeItem('user');
          }
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/authRutas/verificar`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const usuarioBackend = data.data.usuario;
          setUser(usuarioBackend);
          localStorage.setItem('user', JSON.stringify(usuarioBackend));
          console.log('✅ Usuario verificado desde backend');
        } else {
          console.warn('⚠️ Token inválido');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error verificando token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    inicializarAuth();
  }, []);

  // ==================================================
  // 🔑 Login
  // ==================================================
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/authRutas/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok &&  data.data?.token) {
        const userData = data.data.usuario;
        const token = data.data.token;

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
        setLoading(false);

        return userData;
      } else {
        setLoading(false);
        return data.mensaje || 'Credenciales inválidas' ;
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      setLoading(false);
      throw new error (error.message ||  'Error de conexión con el servidor') ;
    }
  };

  // ==================================================
  // 🧍 Registro
  // ==================================================
  const registro = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/authRutas/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          nombre_alias: userData.nombre_alias,
          club: userData.club,
          email: userData.email,
          password: userData.password
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'Error al registrar usuario');

      return data.data ;
    } catch (error) {
      console.error('❌ Error en registro:', error);
       throw new error (error.message ||  'Error de conexión con el servidor') ;
    }
  };

  // ==================================================
  // 🔒 Cambiar contraseña
  // ==================================================
  const cambiarPassword = async (passwordActual, passwordNueva) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { error: 'No hay sesión activa' };

      const response = await fetch(`${API_BASE_URL}/authRutas/cambiar-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ passwordActual, passwordNueva })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'Error al cambiar contraseña');

      return { message: data.mensaje };
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
       throw new error (error.message ||  'Error de conexión con el servidor') ;
    }
  };

  // ⭐ Convertir jugador a organizador
const convertirOrganizador = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return { error: 'No hay sesión activa' };
    }
    
    const response = await fetch(`${API_BASE_URL}/authRutas/convertir-organizador`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data?.data?.usuario) {
      const usuarioActualizado = data.data.usuario;
      
      // Actualizar localStorage
      localStorage.setItem('user', JSON.stringify(usuarioActualizado));
      
      // Actualizar estado
      setUser (usuarioActualizado);
      
      console.log('✅ Rol actualizado a organizador:', usuarioActualizado.rol);
      
      return usuarioActualizado ;
    } else {
      const errorMsg = data?.mensaje || 'Error al cambiar rol';
      return { error: errorMsg };
    }
  } catch (error) {
    console.error('❌ Error cambiando rol:', error);
    return { error: 'Error de conexión' };
  }
};

  // ==================================================
  // 🚪 Logout
  // ==================================================
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('👋 Sesión cerrada');
  };

  // ==================================================
  // ⚡ CRÍTICO: Memorizar el valor del contexto
  // ==================================================
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      registro,
      cambiarPassword,
      convertirOrganizador
    }),
    [user, loading] // ✅ Solo recalcula cuando user o loading cambien
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};