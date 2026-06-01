import React from 'react';
import { obtenerVistaPublica } from '@/funciones/registroVistasTorneos';
import { useTranslation } from 'react-i18next';

/**
 * PORTAL: Vista Emparejamientos Pública
 */
function VistaEmparejamientosPublica({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    if (!tipoJuego) {
        return (
            <div className="vista-emparejamientos-publica">
                <div className="empty-message">
                    ⏳ {t('vistas_publica.cargando_emparejamientos')}
                </div>
            </div>
        );
    }

    const ComponenteVista = obtenerVistaPublica(tipoJuego, 'emparejamientos');

    if (!ComponenteVista) {
        return (
            <div className="vista-emparejamientos-publica">
                <div className="error-message">
                    ⚠️ {t('vistas_general.sin_emparejamientos', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaEmparejamientosPublica;