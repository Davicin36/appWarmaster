import React from 'react';
import VistaClasificacionSaga from '../administrarTorneo/VistaClasificacionSaga';

/**
 * Vista pública de clasificación para SAGA
 * Reutiliza el componente de administración (es de solo lectura)
 */
function VistaClasificacionPublicaSaga({ torneoId }) {
    return <VistaClasificacionSaga torneoId={torneoId} />;
}

export default VistaClasificacionPublicaSaga;