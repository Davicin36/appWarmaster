//SAGA
import InscripcionSagaIndividual from '@/componentesSaga/inscripciones/InscripcionSagaIndividual';
import InscripcionSagaEquipos from '@/componentesSaga/inscripciones/InscripcionSagaEquipos';

//WARMASTER
import InscripcionWarmasterIndividual from '@/componentesWarmaster/inscripcionWarmasterIndividual';

//FOW
import InscripcionFowIndividual from '@/componentesFow/InscripcionFowIndividual';

/*
//BOLT ACTION
import inscripcionBoltIndividual from '../componentesBolt/inscripciones/inscripcionBoltIndividual';
*/

//EPIC ARMAGEDON
import InscripcionEpicIndividual from '@/componentesEpic/InscripcionEpicIndividual';


export const REGISTRO_INSCRIPCIONES ={
    "SAGA": {
        "Individual" : InscripcionSagaIndividual,
        "Por equipos" : InscripcionSagaEquipos
    },
    "WARMASTER": {
        "Individual": InscripcionWarmasterIndividual,
        "Por equipos": null
    },
    "FOW": {
        "Individual": InscripcionFowIndividual,
        "Por equipos": null
    },
     "EPIC": {
        "Individual": InscripcionEpicIndividual,
        "Por equipos": null
    },
    /*
     "BOLT": {
        "Individual": InscripcionBoltIndividual,
        "Por equipos": null
    }
    */
   /*
     "PUNKA": {
        "Individual": InscripcionPunkaIndividual,
        "Por equipos": null
    }
    */
}
