import React from 'react';
import { obtenerVistaPublica } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL: Vista Información Pública
 */
function VistaInformacion({ tipoJuego, ...props }) {
    if (!tipoJuego) {
        return (
            <div className="vista-informacion">
                <div className="empty-message">
                    ⏳ Cargando información...
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaPublica(tipoJuego, 'informacion');

    if (!ComponenteVista) {
        return (
            <div className="vista-informacion">
                <div className="error-message">
                    ⚠️ No existe vista de información para "{tipoJuego}"
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaInformacion;