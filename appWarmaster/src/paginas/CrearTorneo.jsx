import React from "react";
import { useParams } from "react-router-dom";

// Importa cada creador de torneos
import CrearTorneoSaga from "../componentesSaga/CrearTorneoSaga.jsx";
import CrearTorneoWarmaster from "../componentesWarmaster/CrearTorneoWarmaster.jsx";
import CrearTorneoFow from "../componentesFow/CrearTorneoFow.jsx";

function CrearTorneoGeneral() {
    const { juego } = useParams();

    switch (juego) {
        case "saga":
            return <CrearTorneoSaga />;

        case "warmaster":
            return <CrearTorneoWarmaster />;

        case "flames":
            return <CrearTorneoFow />;
/*
        case "bolt-action":
            return <CrearTorneoBolt />;
*/

        default:
            return (
                <div style={{ padding: "20px" }}>
                    <h2>❌ Juego no reconocido</h2>
                    <p>Verifica la URL.</p>
                </div>
            );
    }
}

export default CrearTorneoGeneral;
