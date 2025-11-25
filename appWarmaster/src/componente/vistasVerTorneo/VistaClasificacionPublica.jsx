import React from 'react';
import { obtenerVistaPublica } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL: Vista Clasificación Pública
 */
function VistaClasificacionPublica({ tipoJuego, ...props }) {
    if (!tipoJuego) {
        return (
            <div className="vista-clasificacion-publica">
                <div className="empty-message">
                    ⏳ Cargando clasificación...
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaPublica(tipoJuego, 'clasificacion');

    if (!ComponenteVista) {
        return (
            <div className="vista-clasificacion-publica">
                <div className="error-message">
                    ⚠️ No existe vista de clasificación para "{tipoJuego}"
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaClasificacionPublica;