import React from 'react';
import { useTranslation } from 'react-i18next'; 
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL de Vista General
 * Este componente actúa como router y carga dinámicamente
 * la vista general específica del sistema de juego
 */
function VistaJugadores({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    // Obtener el componente específico del juego
    const ComponenteVista = obtenerVistaJuego(tipoJuego,  'jugadores');

    // Si no existe componente para ese juego, mostrar error
    if (!ComponenteVista) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ {t('vistas_general.sin_general', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    // Renderizar el componente específico del juego
    return <ComponenteVista {...props} />;
}

export default VistaJugadores;