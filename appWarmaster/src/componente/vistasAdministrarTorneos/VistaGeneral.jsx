import React from 'react';
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';
import { useTranslation } from 'react-i18next';


/**
 * PORTAL: Vista General
 */
function VistaGeneral({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    // ⬅️ VALIDACIÓN: No renderizar si no hay tipoJuego
    if (!tipoJuego) {
        console.warn('⚠️ VistaGeneral: tipoJuego es undefined, no renderizando componente');
        return (
            <div className="vista-general">
                <div className="empty-message">
                    {t('vistas_general.cargando_info', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaJuego(tipoJuego, 'general');

    if (!ComponenteVista) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ {t('vistas_general.sin_general', { juego: tipoJuego })}
                </div>
            </div>
        );
    }
    return <ComponenteVista {...props} />;
}

export default VistaGeneral;