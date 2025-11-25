import React from 'react';
import { obtenerVistaPublica } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL: Vista Emparejamientos Pública
 */
function VistaEmparejamientosPublica({ tipoJuego, ...props }) {
    if (!tipoJuego) {
        return (
            <div className="vista-emparejamientos-publica">
                <div className="empty-message">
                    ⏳ Cargando emparejamientos...
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaPublica(tipoJuego, 'emparejamientos');

    if (!ComponenteVista) {
        return (
            <div className="vista-emparejamientos-publica">
                <div className="error-message">
                    ⚠️ No existe vista de emparejamientos para "{tipoJuego}"
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaEmparejamientosPublica;