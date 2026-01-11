import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Obtener rol del estado o localStorage
  const userRole = user?.rol || localStorage.getItem('userRole');
  
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
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  
  // Si se requiere un rol específico, verificar
  if (requiredRole) {
    
    if (!userRole) {
      return <Navigate to="/" replace />;
    }
    
    if (userRole !== requiredRole) {
      
      // Si es organizador pero intenta acceder a superadmin
      if (userRole === 'organizador' && requiredRole === 'superadmin') {
        return <Navigate to="/organizador" replace />;
      }
      
      // Si es superadmin pero intenta acceder a organizador, permitir
      if (userRole === 'superadmin' && requiredRole === 'organizador') {
        return children;
      }
      
      // Para cualquier otro caso, redirigir a home
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

export default PrivateRoute;