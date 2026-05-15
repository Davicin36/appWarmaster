import React from 'react';
import VistaClasificacionDracula from '../administrarTorneo/VistaClasificacionDracula';

/**
 * Vista pública de clasificación para SAGA
 * Reutiliza el componente de administración (es de solo lectura)
 */
function VistaClasificacionPublicaDracula({ torneoId }) {
    return <VistaClasificacionDracula torneoId={torneoId} />;
}

export default VistaClasificacionPublicaDracula;