import React from 'react';
import VistaEmparejamientosSaga  from '../administrarTorneo/VistaEmparejamientosSaga';

/**
 * Vista pública de emparejamientos para SAGA
 * Por ahora reutiliza el componente existente
 */
function VistaEmparejamientosPublicaSaga({ torneoId }) {
    return <VistaEmparejamientosSaga torneoId={torneoId} esVistaPublica={true} />;
}

export default VistaEmparejamientosPublicaSaga;