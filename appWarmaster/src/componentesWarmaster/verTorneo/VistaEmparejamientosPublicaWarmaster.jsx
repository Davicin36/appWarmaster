import React from 'react';
import VistaEmparejamientosWarmaster  from '../administrarTorneo/VistaEmparejamientosWarmaster';

/**
 * Vista pública de emparejamientos para SAGA
 * Por ahora reutiliza el componente existente
 */
function VistaEmparejamientosPublicaWarmaster({ torneoId }) {
    return <VistaEmparejamientosWarmaster torneoId={torneoId} esVistaPublica={true} />;
}

export default VistaEmparejamientosPublicaWarmaster;