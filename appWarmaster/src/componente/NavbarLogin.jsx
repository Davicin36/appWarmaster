import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../servicios/AuthContext';
import { MenuNavBar } from '../assets/icons/menu-navbar';

import '../estilos/navBarLogin.css';

function NavbarLogin() {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const { user, isSuperAdmin } = useAuth();

    // 🧪 DEBUG - Ver qué está pasando
    useEffect(() => {
        console.log('🔍 NavbarLogin - Debug:');
        console.log('   User:', user);
        console.log('   User.rol:', user?.rol);
        console.log('   isSuperAdmin():', isSuperAdmin());
        console.log('   localStorage rol:', localStorage.getItem('userRole'));
    }, [user]);

    const alternarMenu = () => {
        setMenuAbierto(!menuAbierto);
    };

    const cerrarMenu = () => {
        setMenuAbierto(false);
    };

    return (
        <nav className="navbar-login">
            <div className="navbar-login-container">
                <button 
                    className="menu-hamburguesa"
                    onClick={alternarMenu}
                    aria-label="Menú"
                >
                    <MenuNavBar />
                </button>
                
                <div className={`navbar-menu ${menuAbierto ? 'activo' : ''}`}>
                    <Link 
                        to="/perfil" 
                        className="navbar-link"
                        onClick={cerrarMenu}
                    >
                        👤 Perfil
                    </Link>
                    
                    <Link 
                        to="/seleccionarJuegos" 
                        className="navbar-link"
                        onClick={cerrarMenu}
                    >
                        ➕ Crear Torneo
                    </Link>

                    {/* Mostrar si es superadmin */}
                    {isSuperAdmin() && (
                        <>
                            <div className="navbar-separator" />
                            <Link 
                                to="/administrador" 
                                className="navbar-link navbar-link-admin"
                                onClick={cerrarMenu}
                            >
                                👑 Administrador
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {menuAbierto && (
                <div 
                    className="menu-overlay"
                    onClick={cerrarMenu}
                />
            )}
        </nav>
    );
}

export default NavbarLogin;