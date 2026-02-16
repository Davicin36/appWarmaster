import React from 'react';
import VistaClasificacionFow from '../administrarTorneo/VistaClasificacionFow';

/**
 * Vista pública de clasificación para SAGA
 * Reutiliza el componente de administración (es de solo lectura)
 */
function VistaClasificacionPublicaFow({ torneoId }) {
    return <VistaClasificacionFow torneoId={torneoId} />;
}

export default VistaClasificacionPublicaFow;