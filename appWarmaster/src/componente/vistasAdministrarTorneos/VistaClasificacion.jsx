import React from 'react';
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL: Vista Clasificación
 * Carga dinámicamente el componente específico del sistema de juego
 */
function VistaClasificacion({ tipoJuego, ...props }) {
    const ComponenteVista = obtenerVistaJuego(tipoJuego, 'clasificacion');

    if (!ComponenteVista) {
        return (
            <div className="vista-clasificacion">
                <div className="error-message">
                    ⚠️ No existe vista de clasificación para el juego "{tipoJuego}"
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaClasificacion;