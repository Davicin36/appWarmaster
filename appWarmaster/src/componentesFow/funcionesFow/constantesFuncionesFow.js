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

export const FRENTES_HISTORICOS= [
    'Frente Occidental',
    'Frente Oriental',
    'Frente del Pacífico',
    'Operacion Market Garden',
    'Operacion Overlord',
    'Frente de África',
]

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
    {nombre:"Batalla Campal - Free for All", tipo: 'Batalla Equilibrada'},
    {nombre:"Batalla Imprevista - Encounter Battle", tipo: 'Batalla Equilibrada'},
    {nombre:"Zafarrancho - Dust up", tipo: 'Batalla Equilibrada'},
    {nombre:"Ni un paso atrás - No Retreat", tipo: 'Misiones Defensivas'},
    {nombre:"Sostener la línea - Hold the Line", tipo: 'Misiones Defensivas'},
    {nombre:"Tenaza - Pincer", tipo: 'Misiones de Defensivas'},
    {nombre:"Cercados - Surrounded", tipo: 'Misiones de Defensivas'},
    {nombre:"Retirada ordenada - Fighting Withdrawal", tipo: 'Misiones de Defensivas'},
    {nombre:"Ataque Precipitado - Hasty Attack", tipo: 'Misiones de Maniobra'},
    {nombre:"La Ratonera - Cauldron", tipo: 'Misiones de Maniobra'},
    {nombre:"Ruptura - Breakthrough", tipo: 'Misiones de Maniobra'},
    {nombre:"Contraataque - Counterattack", tipo: 'Misiones de Maniobra'}
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

export const tablaPuntuacionFow = [
  { rango: 0, vencedor: 6, perdedor: 1 },
  { rango: 1, vencedor: 5, perdedor: 2 },
  { rango: [2, Infinity], vencedor: 4, perdedor: 3 }
];

export const calcularPuntosTorneoFow = (pelotonesMuertosVencedor) => {
  const fila = tablaPuntuacionFow.find(p => {
    if (Array.isArray(p.rango)) {
      const [min, max] = p.rango;
      return pelotonesMuertosVencedor >= min && pelotonesMuertosVencedor <= max;
    }
    return p.rango === pelotonesMuertosVencedor;
  });

  return fila
    ? { puntosVencedor: fila.vencedor, puntosPerdedor: fila.perdedor }
    : { puntosVencedor: 0, puntosPerdedor: 0 };
};