import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MenuNavBar } from '../assets/icons/menu-navbar';

import '../estilos/navBarLogin.css';

function NavbarLogin() {
    const [menuAbierto, setMenuAbierto] = useState(false);

    const alternarMenu = () => {
        setMenuAbierto(!menuAbierto);
    };

    return (
        <nav className="navbar-login">
            <div className="navbar-login-container">
                {/* Botón del menú hamburguesa */}
                <button 
                    className="menu-hamburguesa"
                    onClick={alternarMenu}
                    aria-label="Menú"
                >
                    <MenuNavBar />
                </button>
                
                {/* Menú desplegable */}
                <div className={`navbar-menu ${menuAbierto ? 'activo' : ''}`}>
                    <Link 
                        to="/perfil" 
                        className="navbar-link"
                        onClick={() => setMenuAbierto(false)}
                    >
                        👤 Perfil
                    </Link>
                    <Link 
                        to="/crearTorneo" 
                        className="navbar-link"
                        onClick={() => setMenuAbierto(false)}
                    >
                        ➕ Crear Torneo
                    </Link>                  
                </div>
            </div>

            {/* Overlay para cerrar el menú al hacer click fuera */}
            {menuAbierto && (
                <div 
                    className="menu-overlay"
                    onClick={() => setMenuAbierto(false)}
                />
            )}
        </nav>
    );
}

export default NavbarLogin;