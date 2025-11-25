// ==========================================
// REGISTRO UNIFICADO DE VISTAS POR JUEGO
// ==========================================

// ==========================================
// SAGA - Importar todas las vistas
// ==========================================
import VistaGeneralSaga from '../componentesSaga/administrarTorneo/VistaGeneralSaga';
import VistaJugadoresSaga from '../componentesSaga/administrarTorneo/VistaJugadoresSaga';
import VistaEmparejamientosSaga from '../componentesSaga/administrarTorneo/VistaEmparejamientosSaga';
import VistaClasificacionSaga from '../componentesSaga/administrarTorneo/VistaClasificacionSaga';


// SAGA - Vista Pública
import VistaInformacionPublicaSaga from '../componentesSaga/verTorneo/VistaInformacionPublicaSaga';
import VistaEmparejamientosPublicaSaga from '../componentesSaga/verTorneo/VistaEmparejamientosPublicaSaga';
import VistaClasificacionPublicaSaga from '../componentesSaga/verTorneo/VistaClasificacionPublicaSaga';


// ==========================================
// WARMASTER - Importar todas las vistas
// ==========================================
/*
import VistaGeneralWarmaster from '../componentesWarmaster/administrarTorneo/VistaGeneralWarmaster';
import VistaJugadoresWarmaster from '../componentesWarmaster/administrarTorneo/VistaJugadoresWarmaster';
import VistaEmparejamientosWarmaster from '../componentesWarmaster/administrarTorneo/VistaEmparejamientosWarmaster';
import VistaClasificacionWarmaster from '../componentesWarmaster/administrarTorneo/VistaClasificacionWarmaster';
*/

// ==========================================
// FLAMES OF WAR - Importar todas las vistas
// ==========================================
/*
import VistaGeneralFow from '../componentesFow/administrarTorneo/VistaGeneralFow';
import VistaJugadoresFow from '../componentesFow/administrarTorneo/VistaJugadoresFow';
import VistaEmparejamientosFow from '../componentesFow/administrarTorneo/VistaEmparejamientosFow';
import VistaClasificacionFow from '../componentesFow/administrarTorneo/VistaClasificacionFow';
*/

// ==========================================
// REGISTRO PRINCIPAL
// ==========================================
export const REGISTRO_VISTAS_TORNEOS = {
    "SAGA": {
        general: VistaGeneralSaga,
        jugadores: VistaJugadoresSaga,
        emparejamientos: VistaEmparejamientosSaga,
        clasificacion: VistaClasificacionSaga
    },
    /*
    "Warmaster": {
        general: VistaGeneralWarmaster,
        jugadores: VistaJugadoresWarmaster,
        emparejamientos: VistaEmparejamientosWarmaster,
        clasificacion: VistaClasificacionWarmaster
    },
    "Flames of War": {
        general: VistaGeneralFow,
        jugadores: VistaJugadoresFow,
        emparejamientos: VistaEmparejamientosFow,
        clasificacion: VistaClasificacionFow
    }
    */
};

// ==========================================
// REGISTRO VISTAS PÚBLICAS (Ver Torneo)
// ==========================================
export const REGISTRO_VISTAS_PUBLICAS = {
    "SAGA": {
        informacion: VistaInformacionPublicaSaga,
        emparejamientos: VistaEmparejamientosPublicaSaga,
        clasificacion: VistaClasificacionPublicaSaga
    }
};


export const obtenerVistaJuego = (tipoJuego, nombreVista) => {
    // Si tipoJuego es undefined, retornar null silenciosamente
    // (el portal ya manejará esto mostrando un loading)
    if (!tipoJuego) {
        return null;
    }
    
    const vistasJuego = REGISTRO_VISTAS_TORNEOS[tipoJuego];
    
    if (!vistasJuego) {
        console.warn(`⚠️ No se encontraron vistas para "${tipoJuego}".`);
        console.warn(`⚠️ Sistemas disponibles: ${Object.keys(REGISTRO_VISTAS_TORNEOS).join(', ')}`);
        return null;
    }
    
    const vista = vistasJuego[nombreVista];
    
    if (!vista) {
        console.warn(`⚠️ Vista "${nombreVista}" no encontrada para "${tipoJuego}"`);
        return null;
    }
    
    return vista;
};

export const obtenerVistaPublica = (tipoJuego, nombreVista) => {
    if (!tipoJuego) {
        return null;
    }
    
    const vistasJuego = REGISTRO_VISTAS_PUBLICAS[tipoJuego];
    
    if (!vistasJuego) {
        console.warn(`⚠️ No se encontraron vistas públicas para "${tipoJuego}".`);
        console.warn(`⚠️ Sistemas disponibles: ${Object.keys(REGISTRO_VISTAS_PUBLICAS).join(', ')}`);
        return null;
    }
    
    const vista = vistasJuego[nombreVista];
    
    if (!vista) {
        console.warn(`⚠️ Vista pública "${nombreVista}" no encontrada para "${tipoJuego}"`);
        return null;
    }
    
    return vista;
};