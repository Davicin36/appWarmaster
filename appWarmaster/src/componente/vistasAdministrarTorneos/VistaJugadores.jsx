import React from 'react';
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL de Vista General
 * Este componente actúa como router y carga dinámicamente
 * la vista general específica del sistema de juego
 */
function VistaJugadores({ tipoJuego, ...props }) {
    // Obtener el componente específico del juego
    const ComponenteVista = obtenerVistaJuego(tipoJuego,  'jugadores');

    // Si no existe componente para ese juego, mostrar error
    if (!ComponenteVista) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ No existe vista general para el juego "{tipoJuego}"
                </div>
            </div>
        );
    }

    // Renderizar el componente específico del juego
    return <ComponenteVista {...props} />;
}

export default VistaJugadores;