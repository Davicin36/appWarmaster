/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from './UsoContexto';

import { usuarioApi } from './apiUsuarios';

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
      const token = usuarioApi.obtenerToken();
      
      if (!token) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parseUser = JSON.parse(savedUser)
            setUser(parseUser)

            if (parseUser.rol) {
              localStorage.setItem ('userRole', parseUser.rol)
              localStorage.setItem('userId', parseUser.id?.toString())
              localStorage.setItem('userEmail', parseUser.email)
            }
          } catch (error) {
            console.error('Error parseando usuario:', error);
            localStorage.removeItem('user');
          }
        }
        setLoading(false);
        return;
      }

      try {
        const response = await usuarioApi.verificarToken(token);

        if (response.success && response.data?.usuario) {
          const usuarioBackend = response.data.usuario;
          setUser(usuarioBackend);
          localStorage.setItem('user', JSON.stringify(usuarioBackend))

          localStorage.setItem ('userRole', usuarioBackend.rol)
          localStorage.setItem('userId', usuarioBackend.id?.toString())
          localStorage.setItem('userEmail', usuarioBackend.email)

         } else {
          console.warn('Token invalido');
          usuarioApi.eliminarToken();
          localStorage.removeItem('user');
          localStorage.removeItem('userRole')
          localStorage.removeItem('userId')
          localStorage.removeItem('userEmail')
          setUser(null);
        }
      } catch (error) {
        console.error('Error verificando token:', error);
        usuarioApi.eliminarToken();
        localStorage.removeItem('user')
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    inicializarAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await usuarioApi.login({ email, password });

      if (response.success && response.data?.token && response.data?.usuario) {
        const { token, usuario } = response.data;

        usuarioApi.guardarToken(token);
        localStorage.setItem('user', JSON.stringify(usuario));
        localStorage.setItem('userRole', usuario.rol);
        localStorage.setItem('userId', usuario.id.toString());
        localStorage.setItem('userEmail', usuario.email);

        console.log('✅ Login exitoso:', {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          nombre: usuario.nombre
        });
        
        console.log('💾 Datos guardados en localStorage:');
        console.log('- Token:', !!usuarioApi.obtenerToken());
        console.log('- Role:', localStorage.getItem('userRole'));
        console.log('- UserId:', localStorage.getItem('userId'));

        setUser(usuario);

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
      const response = await usuarioApi.registro(userData);

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
      const token = usuarioApi.obtenerToken();
      
      if (!token) {
        return { 
          success: false, 
          error: 'No hay sesion activa' 
        };
      }

      const response = await usuarioApi.cambiarPassword({
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
      const token = usuarioApi.obtenerToken();
      
      if (!token) {
        return { 
          success: false, 
          error: 'No hay sesion activa' 
        };
      }
      
      const response = await usuarioApi.convertirOrganizador();

      if (response.success && response.data?.usuario) {
        const usuarioActualizado = response.data.usuario;
        
        localStorage.setItem('user', JSON.stringify(usuarioActualizado))
        localStorage.setItem('userRole', usuarioActualizado.rol);
        setUser(usuarioActualizado);
        
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
    usuarioApi.eliminarToken();
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
  };

  const actualizarUsuario = (nuevosDatos) => {
    const usuarioActualizado = { ...user, ...nuevosDatos };
    setUser(usuarioActualizado);
    localStorage.setItem('user', JSON.stringify(usuarioActualizado));

    if (nuevosDatos.rol) {
      localStorage.setItem('userRole', nuevosDatos.rol);
    }
  };

  const refrescarUsuario = async () => {
  try {
    const token = usuarioApi.obtenerToken();
    
    if (!token) {
      console.warn('No hay token para refrescar usuario');
      return { success: false, error: 'No hay sesión activa' };
    }

    const response = await usuarioApi.verificarToken(token);

    if (response.success && response.data?.usuario) {
      const usuarioBackend = response.data.usuario;
      setUser(usuarioBackend);
      localStorage.setItem('user', JSON.stringify(usuarioBackend));
      localStorage.setItem('userRole', usuarioBackend.rol);
      localStorage.setItem('userId', usuarioBackend.id?.toString());
      localStorage.setItem('userEmail', usuarioBackend.email);

      return { success: true, usuario: usuarioBackend };
    } else {
      return { success: false, error: 'Error al refrescar usuario' };
    }
  } catch (error) {
    console.error('❌ Error refrescando usuario:', error);
    return { success: false, error: error.message };
  }
};

const isOrganizador = () => {
    const role = user?.rol || localStorage.getItem('userRole');
    return role === 'organizador' || role === 'superadmin';
  };

  const isSuperAdmin = () => {
    const role = user?.rol || localStorage.getItem('userRole');
    return role === 'superadmin';
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
      actualizarUsuario,
      refrescarUsuario,
      isOrganizador,
      isSuperAdmin
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