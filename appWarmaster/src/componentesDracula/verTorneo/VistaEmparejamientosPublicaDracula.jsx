import React from 'react';
import VistaEmparejamientosDracula  from '../administrarTorneo/VistaEmparejamientosDracula';

/**
 * Vista pública de emparejamientos para EPIC
 * Por ahora reutiliza el componente existente
 */
function VistaEmparejamientosPublicaDracula({ torneoId }) {
    return <VistaEmparejamientosDracula torneoId={torneoId} esVistaPublica={true} />;
}

export default VistaEmparejamientosPublicaDracula;