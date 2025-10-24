import { Link } from 'react-router-dom';

function NavbarLogin (){
    return (
        <nav className="navbar">
            <div className="navbar-container">
                    <Link to="/perfil" className="navbar-home">
                        Perfil
                    </Link>
                    <Link to="/crearTorneo" className="navbar-home">
                        Crear Torneo
                    </Link>                  
            </div>
        </nav>
    )
}

export default NavbarLogin;