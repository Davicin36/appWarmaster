import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

import '../estilos/navbar.css';

// ✅ MEMO: Solo se re-renderiza si cambian sus props o el contexto
function Navbar () {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true})
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link to="/" className="navbar-home">
                        🏠
                    </Link>
                    <h1 className="navbar-title">Gestión de Torneos WARGAMES</h1>
                </div>

                <div className="navbar-right">
                    {isAuthenticated ? (
                        <div className="user-section">
                            <div className="user-info">
                                <span className="welcome-message">
                                    Bienvenido, <strong>{user.nombre_alias || user.nombre}</strong>
                                </span>
                                <div className="user-details">
                                    <span className="user-name">
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
                                </div>
                            </div>
                            <button 
                                className="logout-btn" 
                                onClick={handleLogout}
                                title="Cerrar Sesión"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="nav-link login-link">
                                Iniciar Sesión
                            </Link>
                            <Link to="/registrarse" className="nav-link register-link">
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;