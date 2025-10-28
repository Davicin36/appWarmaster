import React  from "react";
import {  useNavigate } from "react-router-dom";

function Inscripcion(){

    const navigate = useNavigate();

    const volverInicio = () => {
        navigate('/');
    };
    return(
        <div>
            <h1>Gestionar Inscripción al torneo de </h1>
            <button type="button" onClick={volverInicio} >
                Atrás
            </button>
        </div>
    )   
}

export default Inscripcion;