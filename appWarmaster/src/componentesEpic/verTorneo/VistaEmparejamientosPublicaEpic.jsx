import React from 'react';
import VistaEmparejamientosEpic  from '../administrarTorneo/VistaEmparejamientosEpic';

/**
 * Vista pública de emparejamientos para EPIC
 * Por ahora reutiliza el componente existente
 */
function VistaEmparejamientosPublicaEpic({ torneoId }) {
    return <VistaEmparejamientosEpic torneoId={torneoId} esVistaPublica={true} />;
}

export default VistaEmparejamientosPublicaEpic;