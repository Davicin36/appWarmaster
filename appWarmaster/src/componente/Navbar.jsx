import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../servicios/AuthContext";

import NavbarLogin from "./NavbarLogin";
import BotonIdioma from "@/i18n/componentes/BotonIdioma";

import '../estilos/navbar.css';

function Navbar({ onOpenLogin }) {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/', { replace: true });
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link to="/" className="navbar-home">🏠</Link>
                    <h1 className="navbar-title">{t('navbar.titulo')}</h1>
                    <BotonIdioma />
                </div>

                <div className="navbar-right">

                    {isAuthenticated ? (
                        <>
                            <div className="user-section">
                                <div className="user-info">
                                    <span className="welcome-message">
                                        {t('navbar.bienvenido')}, <strong>{user.nombre_alias || user.nombre}</strong>
                                    </span>
                                    <div className="user-details">
                                        <span className="user-name">{user.nombre} {user.apellidos}</span>
                                        {user.club && (
                                            <span className="club-info">
                                                {t('navbar.club')}: <strong>{user.club}</strong>
                                            </span>
                                        )}
                                        {user.rol && user.rol !== 'usuario' && (
                                            <span className="role-info">
                                                {t('navbar.rol')}: <strong>{user.rol}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button className="logout-btn" onClick={handleLogout} title={t('navbar.cerrar_sesion')}>
                                    {t('navbar.cerrar_sesion')}
                                </button>
                            </div>
                            <div className="navbar-login-container">
                                <NavbarLogin />
                            </div>
                        </>
                    ) : (
                        <div className="auth-links">
                            <button onClick={onOpenLogin} className="nav-link login-link" type="button">
                                {t('navbar.iniciar_sesion')}
                            </button>
                            <Link to="/registrarse" className="nav-link register-link">
                                {t('navbar.registrarse')}
                            </Link>
                            <div className="navbar-idioma-container">
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;