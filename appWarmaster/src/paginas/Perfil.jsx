import React  from "react";
import {  useNavigate } from "react-router-dom";

function Perfil() {

    const navigate = useNavigate();

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div>
            <h2>Perfil de Usuario</h2>
            <p>Esta es la página de perfil del usuario.</p>
            <button type="button" onClick={volverInicio} >
                Atrás
            </button>
        </div>
    );
}

export default Perfil;