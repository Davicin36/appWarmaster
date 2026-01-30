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
    { nombre: "IBEROS" },
    { nombre: "CARTAGINESES", permiteElefantes: true }, 
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
      ]
    },
    { nombre: "GALOS", permiteCarros: true },
    { nombre: "NÚMIDAS", permiteElefantes: true,
       tiposTropaPermitidos: ['guerreros', 'levas', 'mercenarios' ]
     },
    { nombre: "GRAECULI-SIRACUSSA" },
    { nombre: "GRAECULI-EPIRO", permiteElefantes: true},
    { nombre: "GRAECULI-ITALIOTAS" }
  ],
  "Alejandro": [
    { nombre: "PERSAS-MEDOS" },
    { nombre: "PERSAS-AQUEMÉNIDAS", permiteCarros: true, permiteElefantes: true },
    { nombre: "TRACIOS" },
    { nombre: "MACEDONIOS" },
    { nombre: "INDIOS", permiteElefantes: true }, 
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
      ]
     },
    { nombre: "SUCESORES-EGIPTO",
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
      ]
     }, 
    { nombre: "CIUDADES GRIEGAS-ATENAS" },
    { nombre: "CIUDADES GRIEGAS-LACEDEMONIOS" },
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