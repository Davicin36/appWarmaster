import { Link } from 'react-router-dom';

import  '../estilos/principal.css';

function Principal() {

    const torneosJugados = [
        { id: 1, nombre: 'Torneo Saga ReinoDelNorte', fecha: '2025-10-18', Organizador: 'Reino del Norte', ganador: 'Nacho Berzal' }
    ]

    return (
        <div>
            <h1>TUS TORNEOS GESTIONADOS</h1>
            <nav>
                <Link to="/">Inicio</Link>
                <Link to="/login">Ir a Login</Link>
                <Link to="/registrarse">Registrarse</Link>
            </nav>

            <section>
                <h2>Bienvenido a la página principal de gestión de torneos de WARGAMES</h2>
                <p>Aquí podrás crear, gestionar y seguir tus torneos de WARGAMES de manera sencilla y eficiente.</p>
            </section>
       

            <section>
                <h2>Torneos finalizados</h2>
                <p>Consulta los torneos que ya se han disputado y sus ganadores.</p>

                <table className="tabla-torneos">
                    <thead>
                        <tr>
                        <th>#</th>
                        <th>Nombre del torneo</th>
                        <th>Fecha</th>
                        <th>Organizador</th>
                        <th>Ganador</th>
                        </tr>
                    </thead>
                    <tbody>
                        {torneosJugados.map((torneo) => (
                        <tr key={torneo.id}>
                            <td>{torneo.id}</td>
                            <td>{torneo.nombre}</td>
                            <td>{torneo.fecha}</td>
                            <td>{torneo.Organizador}</td>
                            <td>{torneo.ganador}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </section>
       </div>
    )
}

export default Principal;