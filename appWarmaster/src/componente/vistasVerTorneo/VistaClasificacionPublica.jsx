import React from 'react';
import { obtenerVistaPublica } from '@/funciones/registroVistasTorneos';
import { useTranslation } from 'react-i18next';

/**
 * PORTAL: Vista Clasificación Pública
 */
function VistaClasificacionPublica({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    if (!tipoJuego) {
        return (
            <div className="vista-clasificacion-publica">
                <div className="empty-message">
                    ⏳ {t('vistas_publica.cargando_clasificacion')}
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaPublica(tipoJuego, 'clasificacion');

    if (!ComponenteVista) {
        return (
            <div className="vista-clasificacion-publica">
                <div className="error-message">
                    ⚠️ {t('vistas_general.sin_clasificacion', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaClasificacionPublica;