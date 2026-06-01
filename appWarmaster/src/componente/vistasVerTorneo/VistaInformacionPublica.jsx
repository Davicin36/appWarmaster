import React from 'react';
import { obtenerVistaPublica } from '@/funciones/registroVistasTorneos';
import { useTranslation } from 'react-i18next';

/**
 * PORTAL: Vista Información Pública
 */
function VistaInformacion({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    if (!tipoJuego) {
        return (
            <div className="vista-informacion">
                <div className="empty-message">
                    ⏳  {t('vistas_publica.cargando_info')}
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaPublica(tipoJuego, 'informacion');

    if (!ComponenteVista) {
        return (
            <div className="vista-informacion">
                <div className="error-message">
                    ⚠️  {t('vistas_general.sin_informacion', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaInformacion;