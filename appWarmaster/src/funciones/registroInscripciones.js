//SAGA
import InscripcionSagaIndividual from '../componentesSaga/inscripciones/InscripcionSagaIndividual';
import InscripcionSagaEquipos from '../componentesSaga/inscripciones/InscripcionSagaEquipos';

/*
//WARMASTER
import inscripcionWarmasterIndividual from '../componentesWarmaster/inscripciones/inscripcionWarmasterIndividual';

//FOW
import inscripcionFowIndividual from '../componentesFow/inscripciones/inscripcionFowIndividual';
*/


export const REGISTRO_INSCRIPCIONES ={
    "SAGA": {
        "Individual" : InscripcionSagaIndividual,
        "Por equipos" : InscripcionSagaEquipos
    },
    /*
    "Warmaster": {
        "Individual": InscripcionWarmasterIndividual,
        "Por equipos": null
    },
    "Flames of War": {
        "Individual": InscripcionFowIndividual,
        "Por equipos": null
    }
    */
}
