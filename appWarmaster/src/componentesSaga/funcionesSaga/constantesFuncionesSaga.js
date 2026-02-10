// funciones/constantesFuncionesSaga.js

/**
 * CONSTANTES SAGA
 */

export const EPOCAS_SAGA = [
  "Alejandro", 
  "Ánibal", 
  "Vikingos", 
  "Invasiones",
  "Cruzadas", 
  "Caballeria", 
  "Edad de la Magia",
  "Alejandro/Ánibal", 
  "Vikingos/Invasiones", 
  "Cruzadas/Caballeria",
];

 export const PARTICIPANTES_RANGO = {
        min: 4,
        max: 100,
        default: 16
    };

    export const EQUIPOS_RANGO = {
        min: 2,
        max: 20,
        default: 5
    };

export const PUNTOS_BANDA_RANGO = {
  min: 4,
  max: 8,
  default: 6
};

export const JUGADORES_EQUIPO_RANGO = {
  min: 2,
  max: 6,
  default: 3
};

export const TIPOS_PARTIDA_SAGA = [
       "Choque de Bandas",
       "Choque de Señores",
        "Conquista",
        "Avance",
        "Desacralización",
        "Captura",
        "Bienes de valor",
        "Reclamar el territorio",
        "Festines y saqueos",
        "Emboscada",
        "Mantener el botín",
        "Cambio de planes",
        "El cruce",
        "Vieja Disputa"
    ];

    export const ESTADOS_TORNEO_SAGA = [
        { valor: 'pendiente', nombre: 'Pendiente', emoji: '⏳' },
        { valor: 'en_curso', nombre: 'En Curso', emoji: '▶️' },
        { valor: 'finalizado', nombre: 'Finalizado', emoji: '🏁' }
    ];

    export const RONDAS_DISPONIBLES = [
        { valor: 3, nombre: '3 Rondas' },
        { valor: 4, nombre: '4 Rondas' },
        { valor: 5, nombre: '5 Rondas' }
    ];

/**
 * Bandas disponibles organizadas por época
 */

export const TIPOS_TROPAS = {
  GUARDIAS: 'guardias',
  GUERREROS: 'guerreros',
  LEVAS: 'levas',
  MERCENARIOS: 'mercenarios',
}

export const BANDAS_POR_EPOCA = {
  "Vikingos": [
    { nombre: "VIKINGOS", permiteBerserkers: true },
    { nombre: "JOMSVIKINGS"},
    { nombre: "GALESES"},
    { nombre: "ANGLO-DANESES" },
    { nombre: "ANGLO-SAJONES" },
    { nombre: "NORSE-GAELS" },
    { nombre: "CAROLINGIOS -CAPETOS" },
    { nombre: "CAROLINGIOS -MEROVINGIOS" },
    { nombre: "NORMANDOS" },
    { nombre: "IRLANDESES", permiteCuraids: true, permitePerros: true },
    { nombre: "PAGAN RUSS"},
    { nombre: "ESCOTOS"},
    { nombre: "ÚLTIMOS ROMANOS"},
    { nombre: "PUEBLOS GERMÁNICOS" },
    { nombre: "LOMBARDOS"},
    { nombre: "PUEBLOS DE LAS ESTEPAS" },
    { nombre: "OMEYAS" }
  ],
  "Invasiones": [
    { 
      nombre: "ROMANOS",
      unidadesEspeciales: [
        { nombre: "manubalista", label: "Manubalista", puntos: 0.5, step: 0.5 }
      ]
    }, 
    { nombre: "GODOS-OSTROGODOS" },
    { nombre: "GODOS-VISIGODOS" },
    { nombre: "FRANCOS" },
    { nombre: "BRITANOS",
      unidadesEspeciales: [
        { nombre: "los_compañeros", label: "Los Compañeros",  puntos: 0.5, step: 0.5 }
      ]
     }, 
    { nombre: "SAJONES" },
    { nombre: "PICTOS" },
    { nombre: "HUNOS"}, 
    { nombre: "SASÁNIDAS", permiteElefantes: true }, 
    { nombre: "ESCOTOS"}, 
    { nombre: "ALT CLUT Y MANACO GODODDIN" },
    { nombre: "CYMRY" },
    { nombre: "VÁNDALOS" }
  ],
  "Ánibal": [
    { nombre: "IBEROS", 
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "viriato", nombre: "Viriato",
              costeEnPuntos: 1,
             },
            { valor: "punicus", nombre: "Punicus",
              costeEnPuntos: 1,
             }
          ],
        }
      ]
     },
    { nombre: "CARTAGINESES", permiteElefantes: true, permiteCarros: true,
      restricciones: {
        mutuamenteExcluyentes: [
          ["elefantes", "carros"]
        ]
      },
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "anibal", nombre: "Aníbal Barca, el General tuerto, Némesis de Roma",
              costeEnPuntos: 1,
             },
            { valor: "amilcar", nombre: "Amílcar Barca",
              costeEnPuntos: 1,
              restriccionesAdicionales : {
                prohibido : ["elefantes", "carros", "levas"]
              }
             }
          ],
        }
      ]
    }, 
    { nombre: "REPÚBLICA DE ROMA",
      opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "consul", nombre: "Cónsul" },
            { valor: "tribuno", nombre: "Tribuno" }
          ],
          valorPorDefecto: "consul"
        }
      ],
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "publio", nombre: "PUBLIO CORNELIO ESCIPIÓN, El Africano",
              costeEnPuntos: 1,
             },
            { valor: "marcus", nombre: "MARCUS CLAUDIUS MARCELLUS, la Espada de Roma",
              costeEnPuntos: 1,
             }
          ],
        }
      ]
    },
    { nombre: "GALOS",
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "ducario", nombre: "DUCARIO el Ínsubro",
              costeEnPuntos: 1,
             },
            { valor: "viridomaros", nombre: "VIRIDÓMAROS, Rey de los Gaesati",
              costeEnPuntos: 1,
              nombreBandaDesbloqueada: "GALOS -UNIDADES GAESATIS",
              composicionBanda: null,
              restriccionesAdicionales : {
                prohibido : ["carros"]
              }
             }
          ],
        }
      ] 
     },
    { nombre: "NÚMIDAS", permiteElefantes: true,
       tiposTropaPermitidos: ['guerreros', 'levas', 'mercenarios' ],
       unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "masinisa", nombre: "MASINISA",
              costeEnPuntos: 1,
            },
            { valor: "yugurta", nombre: "YUGURTA",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     },
    { nombre: "GRAECULI-SIRACUSSA",
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "pirro", nombre: "PIRRO, Rey de Epiro",
              costeEnPuntos: 0,
             },
            { valor: "hieron", nombre: "HIERÓN II, Tirano de Siracusa",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     },
    { nombre: "GRAECULI-EPIRO", permiteElefantes: true,
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "pirro", nombre: "PIRRO, Rey de Epiro",
              costeEnPuntos: 0,
             },
            { valor: "hieron", nombre: "HIERÓN II, Tirano de Siracusa",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
    },
    { nombre: "GRAECULI-ITALIOTAS",
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "pirro", nombre: "PIRRO, Rey de Epiro",
              costeEnPuntos: 0,
             },
            { valor: "hieron", nombre: "HIERÓN II, Tirano de Siracusa",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     }
  ],
  "Alejandro": [
    { nombre: "PERSAS-MEDOS",
       unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "jerjes", nombre: "JERJES, Rey de Reyes",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     },
    { nombre: "PERSAS-AQUEMÉNIDAS", permiteCarros: true, permiteElefantes: true,
       unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "dario", nombre: "DARIO III",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     },
    { nombre: "TRACIOS",
       unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "seuytes", nombre: "SEUYTES III",
              costeEnPuntos: 1,
             },
             {costeEnPuntos: 1,
              nombreBandaDesbloqueada: "TRACIOS -ESCORDISCOS",
              composicionBanda: null
             }
          ]
        }
      ] 
     },
    { nombre: "MACEDONIOS",
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "alejandro", nombre: "ALEJANDRO MAGNO ",
              costeEnPuntos: 1,
             },
            { valor: "filipo", nombre: "FILIPO II",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     },
    { nombre: "INDIOS", permiteElefantes: true,
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "poros", nombre: "POROS",
              costeEnPuntos: 2,
             },
            { valor: "chandragupta", nombre: "CHANDRAGUPTA MAURYA, El primer Emperador",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     }, 
    { nombre: "SUCESORES-GRECIA",
      opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "legatum", nombre: "Legatum" },
            { valor: "hubris", nombre: "Hubris" },
            { valor: "divitiae", nombre: "Divitiae"}
          ],
          valorPorDefecto: "legatum"
        }
      ],
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "filipo", nombre: "FILIPO V",
              costeEnPuntos: 1,
              opcionesRequeridas: {
                tipoWarlord: "legatum"
              }
             }
          ],
        }
      ] 
     },
    { nombre: "SUCESORES-EGIPTO", permiteElefantes: true,
      opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "legatum", nombre: "Legatum" },
            { valor: "hubris", nombre: "Hubris" },
            { valor: "divitiae", nombre: "Divitiae"}
          ],
          valorPorDefecto: "legatum"
        }
      ],
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "ptolomeo", nombre: "PTOLOMEO II FILADELFOS, El Rey Faraón",
              costeEnPuntos: 1,
              opcionesRequeridas: {
                tipoWarlord: "divitiae"
              }
             }
          ],
        }
      ] 
     },
    { nombre: "SUCESORES-ASIA", permiteElefantes: true, permiteCarros: true,
      opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "legatum", nombre: "Legatum" },
            { valor: "hubris", nombre: "Hubris" },
            { valor: "divitiae", nombre: "Divitiae"}
          ],
          valorPorDefecto: "legatum"
        }
      ],
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "mitriades", nombre: "MITRÍADES VI EUPATOR, Enemigo de Roma",
              costeEnPuntos: 1,
              opcionesRequeridas: {
                tipoWarlord: "divitiae"
              }
             },
             { valor: "antioco", nombre: "ANTÍOCO III, El Grande",
              costeEnPuntos: 1,
              opcionesRequeridas: {
                tipoWarlord: "hubris"
              }
             }
          ],
        }
      ] 
     }, 
    { nombre: "CIUDADES GRIEGAS-ATENAS",
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "FILOPEMEN", nombre: "FILOPEMÉN, El último de los Griegos",
              costeEnPuntos: 1,
             }
          ],
        }
      ] 
     },
    { nombre: "CIUDADES GRIEGAS-LACEDEMONIOS",
      unidadesLegendarias: [
        {
          id:"warlord_legendario",
          label:"Warlord Legendario",
          tipo: "select",
          obligatorio: false,
          opciones:[
            { valor: "leonidas", nombre: "LEÓNIDAS, Rey de Esparta",
              costeEnPuntos: 0,
             unidadesEspecialesDesbloqueadas: [
              { valor: "batallon_sagrado", 
                nombre: "Batallón Sagrado", 
                label: " Batallón Sagrado, (tienes que indicar los dos puntos)", puntos: 2, step: 1 }
             ]
             }
          ],
        }
      ] 
     },
    { nombre: "CIUDADES GRIEGAS-TESALIOS" },
    { nombre: "CIUDADES GRIEGAS-TEBANOS" }
  ],
  "Cruzadas": [
    { nombre: "BIZANTINOS" },
    { nombre: "CRUZADOS" },
    { nombre: "ORDENSTAAT" },
    { nombre: "MOROS" },
    { nombre: "MILITES CHRISTI",
      tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios' ]
    },
    { nombre: "MUTTATAWI'A",
      tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios' ]
     },
    { nombre: "PRINCIPES DEL ESTE", permiteCarros: true },
    { nombre: "PUEBLOS PAGANOS" },
    { nombre: "POLACOS" },
    { nombre: "SARRACERNOS" },
    { nombre: "ESPAÑOLES" },
    { nombre: "MONGOLES", permiteTambor: true },
    { nombre: "CUMANOS" },
    { nombre: "INCURSORES PAGANOS", 
      tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios' ]
    },
    { nombre: "ARMENIOS DE CILICIA" },
    { nombre: "HÚNGAROS DE ÁRPÁD" },
    { nombre: "CRUZADOS DE MONTFORT",
      tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios' ]
     },
    { nombre: "CÁTAROS", 
      tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios' ]
     }
  ],
  "Caballeria": [
    { nombre: "INGLESES" },
    { nombre: "INGLESES-GALESES" },
    { nombre: "FRANCESES" },
    { nombre: "FRANCESES-COMPAÑIA DE ORDENANZA" },
    { nombre: "COMPAÑIAS LIBRES" },
    { nombre: "BORGOÑESES" },
    { nombre: "BORGOÑESES-COMPAÑIA DE ORDENANZA" },
    { nombre: "FLAMENCOS",
      unidadesEspeciales: [
        { nombre: "carro_flamenco", label: "Carro Flamenco", puntos: 0.5, step: 0.5 }
      ]
     },
    { nombre: "ESCOCESES-SCHILTRONS" },
    { nombre: "ESCOCESES-COMPAÑIAS PROFESIONALES" },
    { nombre: "SUIZOS" ,
      tiposTropaPermitidos: ['guerreros', 'levas', 'mercenarios' ]
    },
    { nombre: "BRETONES" },
    { nombre: "CASTELLANOS" },
    { nombre: "GERMANOS" },
    { nombre: "HUSITAS",
      unidadesEspeciales: [
        { nombre: "carro_husita", label: "Carro Husita", puntos: 1, step: 1 }
      ]
     },
    { nombre: "CONDOTIEROS-FLORENCIA" },
    { nombre: "CONDOTIEROS-ESTADOS PONTIFICIOS",
       unidadesEspeciales: [
        { nombre: "carrocio", label: "Carrocio", puntos: 0.5, step: 0.5 }
      ]
     },
    { nombre: "CONDOTIEROS-MILÁN" },
    { nombre: "CONDOTIEROS-REINO DE NÁPOLES" },
    { nombre: "CONDOTIEROS-VENECIA" },
    { nombre: "YORK" },
    { nombre: "LANCASTER" }
  ],
  "Edad de la Magia": [
    { nombre: "GRANDES REINOS",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "lugarteniente", label: "Capitán", puntos: 1, step: 1 },
        { id: "paladin", label: "Paladín", puntos: 0.5, step: 0.5 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ]
     },
     { nombre: "GRANDES REINOS - LOS ELFOS ZAFIRO",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "lugarteniente", label: "Capitán", puntos: 1, step: 1 },
        { id: "paladin", label: "Paladín", puntos: 0.5, step: 0.5 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ] 
    },
    { nombre: "GRANDES REINOS - LA ORDEN MILITANTE",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "lugarteniente", label: "Capitán", puntos: 1, step: 1 },
        { id: "paladin", label: "Paladín", puntos: 0.5, step: 0.5 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
       ] ,
      unidadesEspeciales: [ 
        { nombre: "fanaticos_entusiastas", label: "Fanáticos Entusiastas", puntos: 1, step: 0.5 }
      ]     
    },
    { nombre: "SEÑORES DE LA NATURALEZA",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "lugarteniente", label: "Ranger", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
      ]
     },
     { nombre: "SEÑORES DE LA NATURALEZA - MINOTAUROS DE LAS COLINAS NEGRAS",
      tiposTropaPersonalizados: [
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
       ] 
    },
    { nombre: "SEÑORES DE LA NATURALEZA - LA JUNGLA DE LAS ARAÑAS",
      tiposTropaPersonalizados: [
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
       ] ,
      unidadesEspeciales: [ 
        { nombre: "fanaticos_entusiastas", label: "Fanáticos Entusiastas", puntos: 1, step: 0.5 }
      ]     
    },
    { nombre: "LEGIONES DE LOS NO MUERTOS",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "descerebrados", label: "Descerebrados", puntos: 1, step: 1 },
        { id: "lugarteniente", label: "Caballero Negro", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ],
       opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "señor", nombre: "Señor" },
            { valor: "nigromante", nombre: "Nigromante" }
          ],
          valorPorDefecto: "señor"
        }
      ]
     },
     { nombre: "LEGIONES DE LOS NO MUERTOS - LA DINASTIA REAL DE NEPHREN-KA", permiteCarros: true,
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ],
       opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "señor", nombre: "Señor" },
            { valor: "nigromante", nombre: "Nigromante" }
          ],
          valorPorDefecto: "señor"
        }
      ]
     },
     { nombre: "LEGIONES DE LOS NO MUERTOS - EL REINO DE LOS NECRÓFAGOS",
      tiposTropaPersonalizados: [
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
      ],
       opcionesBanda: [
        {
          id:"tipoWarlord",
          label:"tipo de Warlord",
          tipo: "select",
          obligatorio: true,
          opciones:[
            { valor: "señor", nombre: "Señor" },
            { valor: "nigromante", nombre: "Nigromante" }
          ],
          valorPorDefecto: "señor"
        }
      ]
     },
    { nombre: "LA HORDA",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "carros_guerra", label: "Carros de Guerra", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "lugarteniente", label: "Campeón", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5},
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ]
     },
     { nombre: "LA HORDA - LOS RUFIANES DE RH' UM",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "carros_guerra", label: "Carros de Guerra", puntos: 1, step: 1 },
        { id: "lugarteniente", label: "Campeón", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5},
      ]
     },
     { nombre: "LA HORDA - LA ISLA DE MORROW",
      tiposTropaPersonalizados: [
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
      ]
     },
    { nombre: "OTROS MUNDOS",
      tiposTropaPersonalizados: [
       { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "lugarteniente", label: "Conjurador", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
      ]
     },
      { nombre: "OTROS MUNDOS - LA MAREA DE LAS PROFUNDIDADES",
      tiposTropaPersonalizados: [
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
      ]
     },
      { nombre: "OTROS MUNDOS - LA TEOCRACIA DE QWAN T 'ANG",
      tiposTropaPersonalizados: [
       { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "lugarteniente", label: "Conjurador", puntos: 1, step: 1 },
      ]
     },
    { nombre: "PUEBLOS SUBTERRÁNEOS",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "lugartenientes", label: "Alquimista", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ]
    },
    { nombre: "PUEBLOS SUBTERRÁNEOS - LOS ENANOS DE LAS MONTAÑAS DE PLATA",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "lugartenientes", label: "Alquimista", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ]
    },
    { nombre: "PUEBLOS SUBTERRÁNEOS- LAS ALIMAÑAS",
      tiposTropaPersonalizados: [
        { id: "guardias", label: "Guardias", puntos: 1, step: 0.5 },
        { id: "hechicero", label: "Hechicero", puntos: 1, step: 1 },
        { id: "levas", label: "Levas", puntos: 1, step: 0.5 },
        { id: "lugartenientes", label: "Alquimista", puntos: 1, step: 1 },
        { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
        { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
        { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1 }
      ]
    }
  ],
};

/**
 * Obtiene las bandas disponibles según la época del torneo.
 */
export const obtenerBandasDisponibles = (epocaTorneo) => {
  if (!epocaTorneo) {
    console.warn('⚠️ obtenerBandasDisponibles: época vacía');
    return [];
  }

  // Época combinada
  if (epocaTorneo.includes('/')) {
    const epocas = epocaTorneo.split('/').map(e => e.trim());
    
    const bandasCombinadas = [];
    
    epocas.forEach(epoca => {
      const bandas = BANDAS_POR_EPOCA[epoca] || [];
      bandasCombinadas.push(...bandas);
    });
    
    // Eliminar duplicados
    const bandasUnicas = bandasCombinadas.filter((banda, index, self) =>
      index === self.findIndex(b => b.nombre === banda.nombre)
    );

    return bandasUnicas;
  }

  // Época simple
  const bandas = BANDAS_POR_EPOCA[epocaTorneo] || [];
  
  if (bandas.length === 0) {
    console.warn(`⚠️ No se encontraron bandas para la época: "${epocaTorneo}"`);
  }
  
  return bandas;
};

/**
 * ✅ Obtiene la configuración completa de una banda específica
 */
export const obtenerConfiguracionBanda = (nombreBanda) => {
  if (!nombreBanda) {
    return {
      nombre: '',
      epoca: '',
      permiteElefantes: false,
      permiteCarros: false,
      permiteTambor: false,
      permiteCuraids: false,
      permitePerros: false,
      permiteBerserkers: false,
      unidadesEspeciales: [],
      tiposTropaPermitidos: null,
      opcionesBanda: [],
      tiposTropaPersonalizados: null
    };
  }

  // Buscar la banda en todas las épocas
  for (const epoca in BANDAS_POR_EPOCA) {
    const banda = BANDAS_POR_EPOCA[epoca].find(b => b.nombre === nombreBanda);
    if (banda) {
      return {
        nombre: banda.nombre,
        epoca: epoca,
        permiteElefantes: banda.permiteElefantes || false,
        permiteCarros: banda.permiteCarros || false,
        permiteTambor: banda.permiteTambor || false,
        permiteCuraids: banda.permiteCuraids || false,
        permitePerros: banda.permitePerros || false,
        permiteBerserkers: banda.permiteBerserkers || false,
        unidadesEspeciales: banda.unidadesEspeciales || [],
        tiposTropaPermitidos: banda.tiposTropaPermitidos || null,
        opcionesBanda: banda.opcionesBanda || [],
        tiposTropaPersonalizados: banda.tiposTropaPersonalizados || null
      };
    }
  }

  // Si no se encuentra, devolver configuración por defecto
  console.warn(`⚠️ No se encontró configuración para la banda: "${nombreBanda}"`);
  return {
    nombre: nombreBanda,
    permiteElefantes: false,
    permiteCarros: false,
    permiteTambor: false,
    permiteCuraids: false,
    permitePerros: false,
    permiteBerserkers: false,
    unidadesEspeciales: [],
    tiposTropaPermitidos: null,
    opcionesBanda: [],
    tiposTropaPersonalizados: null
  };
};

/**
 * ✅ Procesa las épocas disponibles del torneo
 */
export const procesarEpocasYBandas = (epocasDisponibles) => {
  if (!epocasDisponibles) {
    return {
      epocasArray: [],
      todasLasBandas: [],
      mapaBandaAEpoca: {},
      mapaBandaAConfig: {}
    };
  }

  let epocas = [];

  // Detectar tipo de separador
  if (epocasDisponibles.includes('|')) {
    epocas = epocasDisponibles.split('|');
  } else if (epocasDisponibles.includes(',')) {
    epocas = epocasDisponibles.split(',');
  } else {
    epocas = [epocasDisponibles];
  }

  const epocasLimpias = epocas.map(e => e.trim()).filter(e => e.length > 0);
  
  const mapaBandaAEpoca = {};
  const mapaBandaAConfig = {};
  let todasLasBandas = [];

  epocasLimpias.forEach(epoca => {
    const bandas = obtenerBandasDisponibles(epoca);
    
    bandas.forEach(banda => {
      const nombreBanda = banda.nombre;
      const config = obtenerConfiguracionBanda(nombreBanda);
      
      mapaBandaAEpoca[nombreBanda] = epoca;
      mapaBandaAConfig[nombreBanda] = config;
      
      todasLasBandas.push(config);
    });
  });

  return {
    epocasArray: epocasLimpias,
    todasLasBandas,
    mapaBandaAEpoca,
    mapaBandaAConfig
  };
};

/**
 * ✅ Verifica si un tipo de tropa está permitido para una banda
 */
export const permiteTipoTropa = (configuracionBanda, tipoTropa) => {
  // Si tiene tipos de tropa personalizados, todo está permitido según su configuración
  if (configuracionBanda.tiposTropaPersonalizados) {
    return true;
  }
  
  // Si no hay restricciones, permite todo
  if (!configuracionBanda.tiposTropaPermitidos) {
    return true;
  }
  
  // Si hay restricciones, verificar si está en la lista
  return configuracionBanda.tiposTropaPermitidos.includes(tipoTropa);
};

/**
 * Verifica si una época es válida
 */
export const esEpocaValida = (epoca) => {
  if (!epoca) return false;
  
  if (epoca.includes('/')) {
    const epocas = epoca.split('/').map(e => e.trim());
    return epocas.every(e => BANDAS_POR_EPOCA[e] !== undefined);
  }
  
  return BANDAS_POR_EPOCA[epoca] !== undefined;
};

/**
 * Formatea el string de épocas para mostrar
 */
export const formatearEpocas = (epocasString) => {
  if (!epocasString) return 'No especificadas';
  return epocasString.split('/').map(e => e.trim()).filter(e => e).join(', ');
};

/**
 * Valida que los puntos estén dentro del rango permitido
 */
export const validarPuntosBanda = (puntos) => {
  return puntos >= PUNTOS_BANDA_RANGO.min && puntos <= PUNTOS_BANDA_RANGO.max;
};

/**
 * Valida que el número de jugadores por equipo esté en el rango
 */
export const validarJugadoresEquipo = (jugadores) => {
  return jugadores >= JUGADORES_EQUIPO_RANGO.min && jugadores <= JUGADORES_EQUIPO_RANGO.max;
};

/**
 * ✅ Obtiene las unidades legendarias disponibles para una banda
 */
export const obtenerUnidadesLegendarias = (epoca, nombreBanda) => {
  if (!epoca || !nombreBanda) {
    return null;
  }

  // Manejar épocas combinadas (ej: "Alejandro/Ánibal")
  if (epoca.includes('/')) {
    const epocas = epoca.split('/').map(e => e.trim());
    
    // Buscar en cada época individual
    for (const epocaIndividual of epocas) {
      const bandas = BANDAS_POR_EPOCA[epocaIndividual];
      if (!bandas) continue;
      
      const banda = bandas.find(b => b.nombre === nombreBanda);
      if (banda && banda.unidadesLegendarias) {
        return banda.unidadesLegendarias;
      }
    }
    
    // Si no se encontró en ninguna época
    console.warn(`⚠️ Banda "${nombreBanda}" no encontrada en épocas combinadas: "${epoca}"`);
    return null;
  }

  const bandas = BANDAS_POR_EPOCA[epoca];
  if (!bandas) {
    console.warn(`⚠️ Época no encontrada: "${epoca}"`);
    return null;
  }

  const banda = bandas.find(b => b.nombre === nombreBanda);
  if (!banda) {
    console.warn(`⚠️ Banda no encontrada: "${nombreBanda}" en época "${epoca}"`);
    return null;
  }

  return banda.unidadesLegendarias || null;
};

/**
 * ✅ Obtiene las opciones de warlord legendario con sus costes y características
 */
export const obtenerOpcionesWarlordLegendario = (epoca, nombreBanda) => {
  const unidadesLegendarias = obtenerUnidadesLegendarias(epoca, nombreBanda);
  
  if (!unidadesLegendarias || unidadesLegendarias.length === 0) {
    return null;
  }

  // Asumiendo que solo hay un slot de warlord legendario
  const configuracion = unidadesLegendarias[0];
  
  if (!configuracion || !configuracion.opciones) {
    return null;
  }

  return {
    id: configuracion.id,
    label: configuracion.label,
    tipo: configuracion.tipo,
    obligatorio: configuracion.obligatorio || false,
    opciones: configuracion.opciones.map(opcion => ({
      valor: opcion.valor,
      nombre: opcion.nombre,
      costePuntos: opcion.costeEnPuntos || 0,
      nombreCompleto: opcion.costeEnPuntos > 0 
        ? `${opcion.nombre} (${opcion.costeEnPuntos} ${opcion.costeEnPuntos === 1 ? 'punto' : 'puntos'})`
        : opcion.nombre,
      bandaDesbloqueada: opcion.nombreBandaDesbloqueada || null,
      tieneBandaDesbloqueada: !!opcion.nombreBandaDesbloqueada,
      composicionDiferente: !!opcion.composicionBanda,
      restriccionesAdicionales: opcion.restriccionesAdicionales || opcion.restriccionesAdicionales || null, // Soporte para ambos spellings
      tieneRestricciones: !!(opcion.restriccionesAdicionales || opcion.restriccionesAdicionales),
      unidadesEspecialesDesbloqueadas: opcion.unidadesEspecialesDesbloqueadas || [],
      opcionesRequeridas: opcion.opcionesRequeridas || null
    }))
  };
};

/**
 * ✅ Valida la selección de un warlord legendario
 */
export const validarWarlordLegendario = (epoca, nombreBanda, warlordSeleccionado) => {
  if (!warlordSeleccionado) {
    return { valido: true }; // No es obligatorio tener warlord
  }

  const opciones = obtenerOpcionesWarlordLegendario(epoca, nombreBanda);
  
  if (!opciones) {
    return { 
      valido: false, 
      error: 'Esta banda no tiene warlords legendarios disponibles' 
    };
  }

  const opcionValida = opciones.opciones.find(o => o.valor === warlordSeleccionado);
  
  if (!opcionValida) {
    return { 
      valido: false, 
      error: 'Warlord legendario no válido para esta banda' 
    };
  }

  return {
    valido: true,
    opcion: opcionValida,
    costePuntos: opcionValida.costePuntos,
    bandaDesbloqueada: opcionValida.bandaDesbloqueada,
    restriccionesAdicionales: opcionValida.restriccionesAdicionales,
    unidadesEspecialesDesbloqueadas: opcionValida.unidadesEspecialesDesbloqueadas || []
  };
};

/**
 * ✅ Obtiene las restricciones de la banda base
 */
export const obtenerRestriccionesBanda = (epoca, nombreBanda) => {
  const bandas = BANDAS_POR_EPOCA[epoca];
  if (!bandas) return null;
  
  const banda = bandas.find(b => b.nombre === nombreBanda);
  if (!banda) return null;
  
  return banda.restricciones || null;
};

/**
 * ✅ Obtiene todas las restricciones combinadas (banda base + warlord)
 */
export const obtenerRestriccionesCombinadas = (epoca, nombreBanda, warlordSeleccionado) => {
  const restriccionesBanda = obtenerRestriccionesBanda(epoca, nombreBanda);
  
  const restriccionesCombinadas = {
    mutuamenteExcluyentes: restriccionesBanda?.mutuamenteExcluyentes || [],
    prohibido: [],
    mensaje: null
  };

  // Si hay warlord seleccionado, añadir sus restricciones
  if (warlordSeleccionado) {
    const validacion = validarWarlordLegendario(epoca, nombreBanda, warlordSeleccionado);
    
    if (validacion.valido && validacion.restriccionesAdicionales) {
      restriccionesCombinadas.prohibido = validacion.restriccionesAdicionales.prohibido || [];
      restriccionesCombinadas.mensaje = validacion.restriccionesAdicionales.mensaje || null;
    }
  }

  return restriccionesCombinadas;
};

/**
 * ✅ Verifica si un tipo de unidad está prohibido
 */
export const estaProhibido = (tipoUnidad, restricciones) => {
  if (!restricciones || !restricciones.prohibido) {
    return false;
  }
  
  return restricciones.prohibido.includes(tipoUnidad);
};

/**
 * ✅ Verifica si dos tipos de unidad son mutuamente excluyentes
 */
export const sonMutuamenteExcluyentes = (tipo1, tipo2, restricciones) => {
  if (!restricciones || !restricciones.mutuamenteExcluyentes) {
    return false;
  }
  
  return restricciones.mutuamenteExcluyentes.some(par => 
    (par.includes(tipo1) && par.includes(tipo2))
  );
};

export const validarComposicionBanda = (composicion, restricciones) => {
  const errores = [];
  
  if (!composicion || !restricciones) {
    return { valido: true, errores: [] };
  }
  
  // Verificar tipos prohibidos
  if (restricciones.prohibido && restricciones.prohibido.length > 0) {
    Object.keys(composicion).forEach(tipoUnidad => {
      if (composicion[tipoUnidad] > 0 && restricciones.prohibido.includes(tipoUnidad)) {
        errores.push(`${tipoUnidad} está prohibido por el warlord seleccionado`);
      }
    });
  }
  
  // Verificar mutuamente excluyentes
  if (restricciones.mutuamenteExcluyentes && restricciones.mutuamenteExcluyentes.length > 0) {
    restricciones.mutuamenteExcluyentes.forEach(par => {
      const [tipo1, tipo2] = par;
      if (composicion[tipo1] > 0 && composicion[tipo2] > 0) {
        errores.push(`No puedes tener ${tipo1} y ${tipo2} en la misma banda`);
      }
    });
  }
  
  return {
    valido: errores.length === 0,
    errores: errores
  };
};

/**
 * ✅ Obtiene el nombre de banda final (desbloqueada o base)
 */
export const obtenerNombreBandaFinal = (epoca, nombreBandaBase, warlordSeleccionado) => {
  if (!warlordSeleccionado) {
    return nombreBandaBase;
  }
  
  const validacion = validarWarlordLegendario(epoca, nombreBandaBase, warlordSeleccionado);
  
  if (validacion.valido && validacion.bandaDesbloqueada) {
    return validacion.bandaDesbloqueada;
  }
  
  return nombreBandaBase;
};

/**
 * ✅ Calcula puntos disponibles después del coste del warlord
 */
export const calcularPuntosDisponibles = (puntosBanda, epoca, nombreBanda, warlordSeleccionado) => {
  if (!warlordSeleccionado) {
    return puntosBanda;
  }
  
  const validacion = validarWarlordLegendario(epoca, nombreBanda, warlordSeleccionado);
  
  if (!validacion.valido) {
    return puntosBanda;
  }
  
  return puntosBanda - validacion.costePuntos;
};

/**
 * ✅ Obtiene información completa del warlord para mostrar en UI
 */
export const obtenerInfoCompletaWarlord = (epoca, nombreBanda, warlordSeleccionado) => {
  if (!warlordSeleccionado) {
    return {
      tieneWarlord: false,
      nombreBandaFinal: nombreBanda,
      costePuntos: 0,
      restricciones: obtenerRestriccionesCombinadas(epoca, nombreBanda, null),
      unidadesDesbloqueadas: []
    };
  }
  
  const validacion = validarWarlordLegendario(epoca, nombreBanda, warlordSeleccionado);
  
  if (!validacion.valido) {
    return {
      tieneWarlord: false,
      error: validacion.error,
      nombreBandaFinal: nombreBanda,
      costePuntos: 0,
      restricciones: obtenerRestriccionesCombinadas(epoca, nombreBanda, null),
      unidadesDesbloqueadas: []
    };
  }
  
  return {
    tieneWarlord: true,
    nombreWarlord: validacion.opcion.nombre,
    nombreBandaFinal: validacion.bandaDesbloqueada || nombreBanda,
    costePuntos: validacion.costePuntos,
    tieneBandaDesbloqueada: !!validacion.bandaDesbloqueada,
    restricciones: obtenerRestriccionesCombinadas(epoca, nombreBanda, warlordSeleccionado),
    unidadesDesbloqueadas: validacion.unidadesEspecialesDesbloqueadas || []
  };
};

/**
 * ✅ Verifica si una banda tiene warlords legendarios disponibles
 */
export const tieneWarlordLegendario = (epoca, nombreBanda) => {
  const unidades = obtenerUnidadesLegendarias(epoca, nombreBanda);
  return unidades !== null && unidades.length > 0;
};