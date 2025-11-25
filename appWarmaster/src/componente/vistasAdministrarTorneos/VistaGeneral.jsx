import React from 'react';
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL: Vista General
 */
function VistaGeneral({ tipoJuego, ...props }) {

    // ⬅️ VALIDACIÓN: No renderizar si no hay tipoJuego
    if (!tipoJuego) {
        console.warn('⚠️ VistaGeneral: tipoJuego es undefined, no renderizando componente');
        return (
            <div className="vista-general">
                <div className="empty-message">
                    ⏳ Cargando información del sistema de juego...
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaJuego(tipoJuego, 'general');

    if (!ComponenteVista) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ No existe vista general para el sistema "{tipoJuego}"
                </div>
            </div>
        );
    }
    return <ComponenteVista {...props} />;
}

export default VistaGeneral;