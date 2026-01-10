import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Obtener rol del estado o localStorage
  const userRole = user?.rol || localStorage.getItem('userRole');
  
  console.log('🔒 PrivateRoute verificación:', {
    isAuthenticated,
    userRole,
    requiredRole,
    loading,
    location: location.pathname
  });
  
  // Mostrar loading mientras se verifica
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }
  
  // Si no está autenticado, redirigir a home
  if (!isAuthenticated) {
    console.log('❌ No autenticado, redirigiendo a home');
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  
  // Si se requiere un rol específico, verificar
  if (requiredRole) {
    console.log('🔍 Verificando rol:', {
      actual: userRole,
      requerido: requiredRole
    });
    
    if (!userRole) {
      console.log('❌ No se encontró rol del usuario');
      return <Navigate to="/" replace />;
    }
    
    if (userRole !== requiredRole) {
      console.log('❌ Rol insuficiente');
      
      // Si es organizador pero intenta acceder a superadmin
      if (userRole === 'organizador' && requiredRole === 'superadmin') {
        console.log('↪️ Redirigiendo organizador a su panel');
        return <Navigate to="/organizador" replace />;
      }
      
      // Si es superadmin pero intenta acceder a organizador, permitir
      if (userRole === 'superadmin' && requiredRole === 'organizador') {
        console.log('✅ Superadmin tiene acceso a panel de organizador');
        return children;
      }
      
      // Para cualquier otro caso, redirigir a home
      return <Navigate to="/" replace />;
    }
  }
  
  console.log('✅ Acceso permitido a:', location.pathname);
  return children;
};

export default PrivateRoute;