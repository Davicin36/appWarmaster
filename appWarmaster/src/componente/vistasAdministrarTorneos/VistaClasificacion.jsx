import React from 'react';
import { useTranslation } from 'react-i18next';
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';

/**
 * PORTAL: Vista Clasificación
 * Carga dinámicamente el componente específico del sistema de juego
 */
function VistaClasificacion({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    const ComponenteVista = obtenerVistaJuego(tipoJuego, 'clasificacion');

    if (!ComponenteVista) {
        return (
            <div className="vista-clasificacion">
                <div className="error-message">
                    ⚠️ {t('vistas_general.sin_clasificacion', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaClasificacion;