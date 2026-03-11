import React from 'react';
import VistaClasificacionEpic from '../administrarTorneo/VistaClasificacionEpic';

/**
 * Vista pública de clasificación para SAGA
 * Reutiliza el componente de administración (es de solo lectura)
 */
function VistaClasificacionPublicaEpic({ torneoId }) {
    return <VistaClasificacionEpic torneoId={torneoId} />;
}

export default VistaClasificacionPublicaEpic;