import React from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext";

function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();

    const handleLogout = () => {
        logout();
        // Opcional: redirigir a la página de inicio
        window.location.href = '/';
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Gestión de Torneos WARGAMES</Link>
            </div>
            
            <div className="navbar-menu">
                {isAuthenticated ? (
                    <div className="user-info">
                        <span className="welcome-message">
                            Bienvenido, <strong>{user.nombre_alias || user.nombre}</strong>
                        </span>
                        <span className="user-details">
                            {user.nombre} {user.apellidos}
                        </span>
                        {user.club && (
                            <span className="club-info">
                                Club: <strong>{user.club}</strong>
                            </span>
                        )}
                        {user.rol && user.rol !== 'usuario' && (
                            <span className="role-info">
                                Rol: <strong>{user.rol}</strong>
                            </span>
                        )}
                        <button 
                            className="logout-btn" 
                            onClick={handleLogout}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                ) : (
                    <div className="auth-links">
                        <Link to="/login" className="nav-link">Iniciar Sesión</Link>
                        <Link to="/registrarse" className="nav-link">Registrarse</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;