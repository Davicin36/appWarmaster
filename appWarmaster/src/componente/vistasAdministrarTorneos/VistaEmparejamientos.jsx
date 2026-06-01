import React from 'react';
import { useTranslation } from 'react-i18next';
import { obtenerVistaJuego } from '@/funciones/registroVistasTorneos';

function VistaEmparejamientos({ tipoJuego, ...props }) {
    const { t } = useTranslation();
    const ComponenteVista = obtenerVistaJuego(tipoJuego, 'emparejamientos');

    if (!ComponenteVista) {
        return (
            <div className="vista-general">
                <div className="error-message">
                    ⚠️ {t('vistas_general.sin_emparejamientos', { juego: tipoJuego })}
                </div>
            </div>
        );
    }

    return <ComponenteVista {...props} />;
}

export default VistaEmparejamientos;