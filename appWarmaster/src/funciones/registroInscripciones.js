//SAGA
import InscripcionSagaIndividual from '../componentesSaga/inscripciones/InscripcionSagaIndividual';
import InscripcionSagaEquipos from '../componentesSaga/inscripciones/InscripcionSagaEquipos';


//WARMASTER
import InscripcionWarmasterIndividual from '@/componentesWarmaster/inscripcionWarmasterIndividual';

/*
//FOW
import inscripcionFowIndividual from '../componentesFow/inscripciones/inscripcionFowIndividual';

//BOLT ACTION
import inscripcionBoltIndividual from '../componentesBolt/inscripciones/inscripcionBoltIndividual';
*/


export const REGISTRO_INSCRIPCIONES ={
    "SAGA": {
        "Individual" : InscripcionSagaIndividual,
        "Por equipos" : InscripcionSagaEquipos
    },
    "WARMASTER": {
        "Individual": InscripcionWarmasterIndividual,
        "Por equipos": null
    },
    /*
    "FOW": {
        "Individual": InscripcionFowIndividual,
        "Por equipos": null
    },
     "BOLT": {
        "Individual": InscripcionBoltIndividual,
        "Por equipos": null
    }
    */
}
