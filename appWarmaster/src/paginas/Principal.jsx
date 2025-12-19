import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import PrincipalSaga from '@/componentesSaga/PrincipalSaga';
import PrincipalWarmaster from '@/componentesWarmaster/PrincipalWarmaster';
import PrincipalFow from '@/componentesFow/PrincipalFow';

import vikingo from '../assets/vikingo.png';

import '../estilos/principal.css';

function Principal({ onOpenLogin }) {
    const [juegoActivo, setJuegoActivo] = useState('saga');

    return (
        <div>      
            <section className="imagenes-principales">
                <img src={vikingo} alt="logo de Web" />
                <div>
                    <h2>Bienvenido a la página principal de gestión de torneos de WARGAMES</h2>
                    <p>Aquí podrás crear, gestionar y seguir tus torneos de WARGAMES de manera sencilla y eficiente.</p>
                </div>
                <img src={vikingo} alt="logo de Web" />
            </section>

            <nav className="navegacion-juegos">
                <button 
                    className={juegoActivo === 'saga' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('saga')}
                >
                    SAGA
                </button>
                <button 
                    className={juegoActivo === 'warmaster' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('warmaster')}
                >
                    WARMASTER
                </button>
                <button 
                    className={juegoActivo === 'fow' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('fow')}
                >
                    FLAMES OF WAR
                </button>
                <button 
                    className={juegoActivo === 'bolt' ? 'activo' : ''}
                    onClick={() => setJuegoActivo('bolt')}
                >
                    BOLT ACTION
                </button>
            </nav>

            {juegoActivo === 'saga' && <PrincipalSaga onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'warmaster' && <PrincipalWarmaster onOpenLogin={onOpenLogin} />}
            {juegoActivo === 'fow' && <PrincipalFow onOpenLogin={onOpenLogin} />}

            <footer>
                <Link to="/ayudaTorneos">
                    Como Crear Un Torneo y gestionarlo
                </Link>
            </footer>
        </div>
    );
}

export default Principal;