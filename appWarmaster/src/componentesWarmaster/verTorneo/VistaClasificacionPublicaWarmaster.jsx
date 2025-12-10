import React from 'react';
import VistaClasificacionWarmaster from '../administrarTorneo/VistaClasificacionWarmaster';

/**
 * Vista pública de clasificación para SAGA
 * Reutiliza el componente de administración (es de solo lectura)
 */
function VistaClasificacionPublicaWarmaster({ torneoId }) {
    return <VistaClasificacionWarmaster torneoId={torneoId} />;
}

export default VistaClasificacionPublicaWarmaster;