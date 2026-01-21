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
export const BANDAS_POR_EPOCA = {
  "Vikingos": [
    { nombre: "VIKINGOS" },
    { nombre: "JOMSVIKINGS" },
    { nombre: "GALESES" },
    { nombre: "ANGLO-DANESES" },
    { nombre: "ANGLO-SAJONES" },
    { nombre: "NORSE-GAELS" },
    { nombre: "CAROLINGIOS" },
    { nombre: "NORMANDOS" },
    { nombre: "IRLANDESES" },
    { nombre: "PAGAN RUSS" },
    { nombre: "ESCOTOS" },
    { nombre: "ÚLTIMOS ROMANOS" },
    { nombre: "PUEBLOS GERMÁNICOS" },
    { nombre: "LOMBARDOS" },
    { nombre: "PUEBLOS DE LAS ESTEPAS" },
    { nombre: "OMEYAS" }
  ],
  "Invasiones": [
    { nombre: "ROMANOS" },
    { nombre: "GODOS-OSTROGODOS" },
    { nombre: "GODOS-VISIGODOS" },
    { nombre: "GALESES" },
    { nombre: "FRANCOS" },
    { nombre: "BRITANOS" },
    { nombre: "SAJONES" },
    { nombre: "PICTOS" },
    { nombre: "HUNOS" },
    { nombre: "SASÁNIDAS" },
    { nombre: "ESCOTOS" },
    { nombre: "ALT CLUT Y MANACO GODODDIN" },
    { nombre: "CYMRY" },
    { nombre: "VÁNDALOS" }
  ],
  "Edad de la Magia": [
    { nombre: "GRANDES REINOS" },
    { nombre: "SEÑORES DE LA NATURALEZA" },
    { nombre: "LEGIONES DE LOS NO MUERTOS" },
    { nombre: "LA HORDA" },
    { nombre: "OTROS MUNDOS" },
    { nombre: "PUEBLOS SUBTERRÁNEOS" }
  ],
  "Ánibal": [
    { nombre: "IBEROS" },
    { nombre: "CARTAGINESES" },
    { nombre: "REPÚBLICA DE ROMA" },
    { nombre: "GALOS" },
    { nombre: "NÚMIDAS" },
    { nombre: "GRAECULI-SIRACUSSA" },
    { nombre: "GRAECULI-EPIRO" },
    { nombre: "GRAECULI-ITALIOTAS" }
  ],
  "Alejandro": [
    { nombre: "PERSAS-MEDOS" },
    { nombre: "PERSAS-AQUEMÉNIDAS" },
    { nombre: "TRACIOS" },
    { nombre: "MACEDONIOS" },
    { nombre: "INDIOS" },
    { nombre: "SUCESORES-GRECIA" },
    { nombre: "SUCESORES-EGIPTO" },
    { nombre: "SUCESORES-ASIA" },
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
    { nombre: "MILITES CHRISTI" },
    { nombre: "MUTTATAWI'A" },
    { nombre: "PRINCIPES DEL ESTE" },
    { nombre: "PUEBLOS PAGANOS" },
    { nombre: "POLACOS" },
    { nombre: "SARRACERNOS" },
    { nombre: "ESPAÑOLES" },
    { nombre: "MONGOLES" },
    { nombre: "CUMANOS" },
    { nombre: "INCURSORES PAGANOS" },
    { nombre: "ARMENIOS DE CILICIA" },
    { nombre: "HÚNGAROS DE ÁRPÁD" },
    { nombre: "CRUZADOS DE MONTFORT" },
    { nombre: "CÁTAROS" }
  ],
  "Caballeria": [
    { nombre: "INGLESES" },
    { nombre: "INGLESES-GALESES" },
    { nombre: "FRANCESES" },
    { nombre: "FRANCESES-COMPAÑIA DE ORDENANZA" },
    { nombre: "COMPAÑIAS LIBRES" },
    { nombre: "BORGOÑESES" },
    { nombre: "BORGOÑESES-COMPAÑIA DE ORDENANZA" },
    { nombre: "FLAMENCOS" },
    { nombre: "ESCOCESES-SCHILTRONS" },
    { nombre: "ESCOCESES-COMPAÑIAS PROFESIONALES" },
    { nombre: "SUIZOS" },
    { nombre: "BRETONES" },
    { nombre: "CASTELLANOS" },
    { nombre: "GERMANOS" },
    { nombre: "HUSITAS" },
    { nombre: "CONDOTIEROS-FLORENCIA" },
    { nombre: "CONDOTIEROS-ESTADOS PONTIFICIOS" },
    { nombre: "CONDOTIEROS-MILÁN" },
    { nombre: "CONDOTIEROS-REINO DE NÁPOLES" },
    { nombre: "CONDOTIEROS-VENECIA" },
    { nombre: "YORK" },
    { nombre: "LANCASTER" }
  ]
};

/**
 * Obtiene las bandas disponibles según la época del torneo.
 * Si la época es combinada (ej: "Alejandro/Ánibal"), devuelve bandas de ambas épocas.
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

 // ✅ Época simple
  const bandas = BANDAS_POR_EPOCA[epocaTorneo] || [];
  
  if (bandas.length === 0) {
    console.warn(`⚠️ No se encontraron bandas para la época: "${epocaTorneo}"`);
  }
  
  return bandas;
};

/**
 * Verifica si una época es válida
 */
export const esEpocaValida = (epoca) => {
  if (!epoca) return false;
  
  // Época combinada
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