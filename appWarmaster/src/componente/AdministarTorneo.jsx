import React  from "react";
import {  useNavigate } from "react-router-dom";

function AdministarTorneo(){

    const navigate = useNavigate();

    const volverInicio = () => {
        navigate('/');
    };
    return(
        <div>
            <h1>Administar Torneo</h1>
            <button type="button" onClick={volverInicio} >
                Atrás
            </button>
        </div>
    )   
}

export default AdministarTorneo;