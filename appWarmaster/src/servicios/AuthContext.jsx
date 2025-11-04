/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from './UsoContexto';

import { autentificacionApi } from './AutentificacionApi';

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

  useEffect(() => {
    const inicializarAuth = async () => {
      const token = autentificacionApi.obtenerToken();
      
      if (!token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            console.log('Usuario restaurado desde localStorage');
          } catch (error) {
            console.error('Error parseando usuario:', error);
            localStorage.removeItem('user');
          }
        }
        setLoading(false);
        return;
      }

      try {
        const response = await autentificacionApi.verificarToken(token);

        if (response.success && response.data?.usuario) {
          const usuarioBackend = response.data.usuario;
          setUser(usuarioBackend);
          localStorage.setItem('user', JSON.stringify(usuarioBackend));
          console.log('Usuario verificado desde backend:', usuarioBackend.email);
        } else {
          console.warn('Token invalido');
          autentificacionApi.eliminarToken();
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        autentificacionApi.eliminarToken();
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    inicializarAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await autentificacionApi.login({ email, password });

      if (response.success && response.data?.token && response.data?.usuario) {
        const { token, usuario } = response.data;

        autentificacionApi.guardarToken(token);
        localStorage.setItem('user', JSON.stringify(usuario));
        setUser(usuario);

        console.log('Login exitoso:', usuario.email);
        return usuario;
      } else {
        throw new Error(response.error || 'Credenciales invalidas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const registro = async (userData) => {
    try {
      const response = await autentificacionApi.registro(userData);

      if (response.success) {
        console.log('Usuario registrado:', response.data);
        return { success: true, data: response.data };
      } else {
        return { 
          success: false, 
          error: response.error || 'Error al registrar usuario' 
        };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        error: error.message || 'Error de conexion con el servidor' 
      };
    }
  };

  const cambiarPassword = async (passwordActual, passwordNueva) => {
    try {
      const token = autentificacionApi.obtenerToken();
      
      if (!token) {
        return { 
          success: false, 
          error: 'No hay sesion activa' 
        };
      }

      const response = await autentificacionApi.cambiarPassword({
        passwordActual,
        passwordNueva
      });

      if (response.success) {
        console.log('Contraseña cambiada exitosamente');
        return { 
          success: true, 
          message: response.message || 'Contraseña actualizada' 
        };
      } else {
        return { 
          success: false, 
          error: response.error || 'Error al cambiar contraseña' 
        };
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return { 
        success: false, 
        error: error.message || 'Error de conexion con el servidor' 
      };
    }
  };

  const convertirOrganizador = async () => {
    try {
      const token = autentificacionApi.obtenerToken();
      
      if (!token) {
        return { 
          success: false, 
          error: 'No hay sesion activa' 
        };
      }
      
      const response = await autentificacionApi.convertirOrganizador();

      if (response.success && response.data?.usuario) {
        const usuarioActualizado = response.data.usuario;
        
        localStorage.setItem('user', JSON.stringify(usuarioActualizado));
        setUser(usuarioActualizado);
        
        console.log('Rol actualizado a organizador:', usuarioActualizado.rol);
        
        return { 
          success: true, 
          usuario: usuarioActualizado 
        };
      } else {
        return { 
          success: false, 
          error: response.error || 'Error al cambiar rol' 
        };
      }
    } catch (error) {
      console.error('Error cambiando rol:', error);
      return { 
        success: false, 
        error: error.message || 'Error de conexion' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    autentificacionApi.eliminarToken();
    localStorage.removeItem('user');
    console.log('Sesion cerrada');
  };

  const actualizarUsuario = (nuevosDatos) => {
    const usuarioActualizado = { ...user, ...nuevosDatos };
    setUser(usuarioActualizado);
    localStorage.setItem('user', JSON.stringify(usuarioActualizado));
    console.log('Usuario actualizado:', usuarioActualizado);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      registro,
      cambiarPassword,
      convertirOrganizador,
      actualizarUsuario
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;