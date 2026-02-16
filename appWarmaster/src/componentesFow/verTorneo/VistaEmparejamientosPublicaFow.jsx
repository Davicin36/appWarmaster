import React from 'react';
import VistaEmparejamientosFow  from '../administrarTorneo/VistaEmparejamientosFow';

/**
 * Vista pública de emparejamientos para SAGA
 * Por ahora reutiliza el componente existente
 */
function VistaEmparejamientosPublicaFow({ torneoId }) {
    return <VistaEmparejamientosFow torneoId={torneoId} esVistaPublica={true} />;
}

export default VistaEmparejamientosPublicaFow;