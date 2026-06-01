import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../servicios/AuthContext';
import { MenuNavBar } from '../assets/icons/menu-navbar';

import '../estilos/navBarLogin.css';

function NavbarLogin() {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const { isSuperAdmin } = useAuth();
    const { t } = useTranslation();

    const alternarMenu = () => setMenuAbierto(!menuAbierto);
    const cerrarMenu   = () => setMenuAbierto(false);

    return (
        <nav className="navbar-login">
            <div className="navbar-login-container">
                <button
                    className="menu-hamburguesa"
                    onClick={alternarMenu}
                    aria-label={t('navbar_login.menu')}
                >
                    <MenuNavBar />
                </button>

                <div className={`navbar-menu ${menuAbierto ? 'activo' : ''}`}>
                    <Link to="/perfil" className="navbar-link" onClick={cerrarMenu}>
                        👤 {t('navbar_login.perfil')}
                    </Link>
                    <Link to="/seleccionarJuegos" className="navbar-link" onClick={cerrarMenu}>
                        ➕ {t('navbar_login.crear_torneo')}
                    </Link>
                    <Link to="/ranking" className="navbar-link" onClick={cerrarMenu}>
                        📋 {t('navbar_login.ranking')}
                    </Link>

                    {isSuperAdmin() && (
                        <>
                            <div className="navbar-separator" />
                            <Link to="/administrador" className="navbar-link navbar-link-admin" onClick={cerrarMenu}>
                                👑 {t('navbar_login.administrador')}
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {menuAbierto && <div className="menu-overlay" onClick={cerrarMenu} />}
        </nav>
    );
}

export default NavbarLogin;