import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

// Importa cada creador de torneos
import CrearTorneoSaga from "../componentesSaga/CrearTorneoSaga.jsx";
import CrearTorneoWarmaster from "../componentesWarmaster/CrearTorneoWarmaster.jsx";
import CrearTorneoFow from "../componentesFow/CrearTorneoFow.jsx";
import CrearTorneoEpic from "../componentesEpic/CrearTorneoEpic.jsx"
import CrearTorneoDracula from "../componentesDracula/CrearTorneoDracula.jsx"

function CrearTorneoGeneral() {
    const { t } = useTranslation();
    const { juego } = useParams();

    switch (juego) {
        case "saga":
            return <CrearTorneoSaga />;

        case "warmaster":
            return <CrearTorneoWarmaster />;

        case "fow":
            return <CrearTorneoFow />;

        case "epic":
            return <CrearTorneoEpic />;

        case "dracula": 
            return <CrearTorneoDracula />;
            /*
        case "bolt-action":
            return <CrearTorneoBolt />;
*/

        default:
            return (
                <div style={{ padding: "20px" }}>
                    <h2>{t('crear_torneo.juego_no_reconocido')}</h2>
                    <p>{t('crear_torneo.verificar_url')}</p>
                </div>
            );
    }
}

export default CrearTorneoGeneral;
