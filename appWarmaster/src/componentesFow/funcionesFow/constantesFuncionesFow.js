/**
 * CONSTANTES FLAMES OF WAR
 */
export const PARTICIPANTES_RANGO = {
    min: 4,
    max: 100,
    default: 16
};

export const PUNTOS_EJERCITO_FOW = {
  min: 1000,
  max: 3000,
  default: 1750
};

export const EPOCAS_HISTORICA = [
    'Early-war',
    'Mid-war',
    'Late-war'
];

// ✅ CORRECCIONES HISTÓRICAS DE BANDOS
export const FACCIONES_EPOCAS_BANDO = {
    "Early_war": [
        {nombre: "ALEMANES", bando: "EJE"},
        {nombre: "EJERCITO BRITÁNICO", bando: "ALIADOS"},
        {nombre: "UNIÓN SOVIÉTICA", bando: "ALIADOS"},
        {nombre: "FRANCESES", bando: "ALIADOS"},
        {nombre: "ITALIANOS", bando: "EJE"},
        {nombre: "POLACOS", bando: "ALIADOS"},
        {nombre: "FINLANDESES", bando: "EJE"}, // Aliados de Alemania contra URSS
        {nombre: "GRIEGOS", bando: "ALIADOS"},
        {nombre: "HÚNGAROS", bando: "EJE"}, // ✅ CORREGIDO: Era ALIADOS, ahora EJE
        {nombre: "JAPONESES", bando: "EJE"},
        {nombre: "ESLOVACOS", bando: "EJE"}, // ✅ CORREGIDO: Era ALIADOS, ahora EJE
        {nombre: "RUMANOS", bando: "EJE"}, // ✅ CORREGIDO: Era ALIADOS, ahora EJE
    ],
    "Mid_war": [
        {nombre: "ALEMANES", bando: "EJE"},
        {nombre: "ITALIANOS", bando: "EJE"},
        {nombre: "EJERCITO BRITÁNICO", bando: "ALIADOS"},
        {nombre: "UNIÓN SOVIÉTICA", bando: "ALIADOS"},
        {nombre: "FRANCESES", bando: "ALIADOS"},
        {nombre: "USA", bando: "ALIADOS"},
        {nombre: "HÚNGAROS", bando: "EJE"},
        {nombre: "RUMANOS", bando: "EJE"},
        {nombre: "FINLANDESES", bando: "EJE"},
    ],
    "Late_war": [
        {nombre: "ALEMANES", bando: "EJE"},
        {nombre: "EJERCITO BRITÁNICO", bando: "ALIADOS"},
        {nombre: "EJERCITO BELGA", bando: "ALIADOS"},
        {nombre: "UNIÓN SOVIÉTICA", bando: "ALIADOS"},
        {nombre: "USA", bando: "ALIADOS"},
        {nombre: "JAPONESES", bando: "EJE"},
        {nombre: "HÚNGAROS", bando: "EJE"},
        {nombre: "RUMANOS", bando: "EJE"},
        {nombre: "FINLANDESES", bando: "EJE"}, // ✅ CORREGIDO: Era "FINLANDIA"
        {nombre: "GRIEGOS", bando: "ALIADOS"}, // ✅ Grecia ocupada por Alemania en Late War
        {nombre: "EJERCITO BRASILEÑO", bando: "ALIADOS"},
        {nombre: "EJERCITO CANADIENSE", bando: "ALIADOS"},
        {nombre: "FRANCESES", bando: "ALIADOS"},
        {nombre: "POLACOS", bando: "ALIADOS"},
        {nombre: "ITALIANOS", bando: "EJE"},
        {nombre: "EJERCITO CHECO", bando: "ALIADOS"},
    ],
};

export const TIPOS_PARTIDA_FOW = [
    'Batalla Campal - Free for All',
    'Batalla Imprevista - Encounter Battle',
    'Zafarrancho - Dust up',
    'Ni un paso atrás - No Retreat',
    'Sostener la línea - Hold the Line',
    'Tenaza - Pincer',
    'Cercados - Surrounded',
    'Retirada ordenada - Fighting Withdrawal',
    'Ataque Precipitado - Hasty Attack',
    'La Ratonera - Cauldron',
    'Ruptura - Breakthrough',
    'Contraataque - Counterattack',
];

export const ESTADOS_TORNEO_FOW = [
    { valor: 'pendiente', nombre: 'Pendiente', emoji: '⏳' },
    { valor: 'en_curso', nombre: 'En Curso', emoji: '▶️' },
    { valor: 'finalizado', nombre: 'Finalizado', emoji: '🏁' }
];

export const RONDAS_DISPONIBLES = [
    { valor: 3, nombre: '3 Rondas' },
    { valor: 4, nombre: '4 Rondas' },
    { valor: 5, nombre: '5 Rondas' }    
];

export const BANDO_DEL_TORNEO = [
    'Aliados',
    'Eje'
];

export const validarPuntosEjercito = (puntos) => {
    return puntos >= PUNTOS_EJERCITO_FOW.min && puntos <= PUNTOS_EJERCITO_FOW.max;
};

/**
 * Obtiene las facciones disponibles según la época del torneo.
 * ✅ ACTUALIZADO: Maneja separador | (pipe) del backend
 */
export const obtenerBandasDisponibles = (epocaTorneo) => {
  if (!epocaTorneo) {
    console.warn('⚠️ obtenerBandasDisponibles: época vacía');
    return [];
  }

  // Normalizar entrada: reemplazar guiones por underscores
  let epocaNormalizada = epocaTorneo.trim();
  
  // ✅ Época combinada (separadas por | o /)
  if (epocaNormalizada.includes('|') || epocaNormalizada.includes('/')) {
    // Separar por | o /
    const separador = epocaNormalizada.includes('|') ? '|' : '/';
    const epocas = epocaNormalizada.split(separador).map(e => {
      // Normalizar cada época
      return e.trim().replace(/-/g, '_');
    });
    
    const bandasCombinadas = [];
    
    epocas.forEach(epoca => {
      const bandas = FACCIONES_EPOCAS_BANDO[epoca] || [];
      if (bandas.length === 0) {
        console.warn(`⚠️ No se encontraron bandas para la época: "${epoca}"`);
      }
      bandasCombinadas.push(...bandas);
    });
    
    // ✅ Eliminar duplicados por nombre
    const bandasUnicas = bandasCombinadas.filter((ejercito, index, self) =>
      index === self.findIndex(b => b.nombre === ejercito.nombre)
    );
    
    return bandasUnicas;
  }

  // ✅ Época simple - normalizar guiones a underscores
  const epocaKey = epocaNormalizada.replace(/-/g, '_');
  const bandas = FACCIONES_EPOCAS_BANDO[epocaKey] || [];

  return bandas;
};

/**
 * ✅ NUEVA FUNCIÓN: Normaliza formato de épocas para mostrar
 */
export const formatearEpocas = (epocas) => {
  if (!epocas) return '';
  
  return epocas
    .replace(/\|/g, ' / ')      // Pipe a slash con espacios
    .replace(/_/g, '-')         // Underscore a guión
    .replace(/Early-war/g, 'Early War')
    .replace(/Mid-war/g, 'Mid War')
    .replace(/Late-war/g, 'Late War');
};