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
    { nombre: "GODOS" },
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
  "Anibal": [
    { nombre: "IBEROS" },
    { nombre: "CARTAGINESES" },
    { nombre: "GALESES" },
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
    { nombre: "CRUZADAS" },
    { nombre: "ORDENSTAAT" },
    { nombre: "MOROS" },
    { nombre: "MILITES CHRISTI" },
    { nombre: "MUTTATAWI'A" },
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
 * 
 * @param {string} epocaTorneo - Época del torneo (simple o combinada con "/")
 * @returns {Array} Array de objetos con formato {nombre: "NOMBRE_BANDA"}
 */
export const obtenerBandasDisponibles = (epocaTorneo) => {
  if (!epocaTorneo) return [];
  
  // Si la época contiene "/", es una época combinada
  if (epocaTorneo.includes('/')) {
    const epocas = epocaTorneo.split('/').map(e => e.trim());
    
    // Combinar bandas de ambas épocas
    const bandasCombinadas = [];
    
    epocas.forEach(epoca => {
      const bandas = BANDAS_POR_EPOCA[epoca] || [];
      bandasCombinadas.push(...bandas);
    });
    
    // Eliminar duplicados (por si hay bandas repetidas entre épocas)
    const bandasUnicas = bandasCombinadas.filter((banda, index, self) =>
      index === self.findIndex(b => b.nombre === banda.nombre)
    );
    
    return bandasUnicas;
  }
  
  // Si es una época simple, devolver directamente
  return BANDAS_POR_EPOCA[epocaTorneo] || [];
};

/**
 * Obtiene la lista de todas las épocas disponibles
 * @returns {Array<string>} Array con los nombres de las épocas
 */
export const obtenerEpocasDisponibles = () => {
  return Object.keys(BANDAS_POR_EPOCA); 
};

/**
 * Verifica si una época es válida
 * @param {string} epoca - Nombre de la época a validar
 * @returns {boolean} true si la época existe
 */
export const esEpocaValida = (epoca) => {
  if (!epoca) return false;
  
  // Si es época combinada, verificar ambas
  if (epoca.includes('/')) {
    const epocas = epoca.split('/').map(e => e.trim());
    return epocas.every(e => BANDAS_POR_EPOCA[e] !== undefined);
  }
  
  return BANDAS_POR_EPOCA[epoca] !== undefined;
};