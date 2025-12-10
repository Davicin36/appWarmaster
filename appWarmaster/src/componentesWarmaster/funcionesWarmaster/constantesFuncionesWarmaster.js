/**
 * CONSTANTES WARMASTER
 */
export const PARTICIPANTES_RANGO = {
    min: 4,
    max: 100,
    default: 16
};

export const PUNTOS_EJERCITO_WARMASTER = {
  min: 1000,
  max: 3000,
  default: 2000
};

export const TIPOS_PARTIDA_WARMASTER = [
   "Batalla Campal",
   "Tras las lineas enemigas",
   "A por el botín"
];

export const ESTADOS_TORNEO_WARMASTER = [
    { valor: 'pendiente', nombre: 'Pendiente', emoji: '⏳' },
    { valor: 'en_curso', nombre: 'En Curso', emoji: '▶️' },
    { valor: 'finalizado', nombre: 'Finalizado', emoji: '🏁' }
];

export const RONDAS_DISPONIBLES = [
    { valor: 2, nombre: '2 Rondas'},
    { valor: 3, nombre: '3 Rondas' },
    { valor: 4, nombre: '4 Rondas' },
    { valor: 5, nombre: '5 Rondas' }    
];

export const EJERCITOS_WARMASTER = [
    {nombre: 'Imperio'},
    {nombre: 'Caos'},
    {nombre: 'Altos Elfos'},
    {nombre: 'Reyes Funerarios'},
    {nombre: 'Condes Vampiro'},
    {nombre: 'Orcos y Goblins'},
    {nombre: 'Reinos Ogros'},
    {nombre: 'Enanos'},
    {nombre: 'Enanos del Caos'},
    {nombre: 'Elfos Oscuros'},
    {nombre: 'Elfos Silvanos'},
    {nombre: 'Nippon'},
    {nombre: 'Cathay'},
    {nombre: 'Cazadores de Brujas'},
    {nombre: 'Skaven'},
    {nombre: 'Bretonia'},
    {nombre: 'Hombres Lagarto'},
    {nombre: 'Kislev'},
    {nombre: 'Demonios'},
    {nombre: 'Mercenarios'},
    {nombre: 'Arabia'},
    {nombre: 'Hombres Bestia'},
    {nombre: 'Norse'},
    {nombre: 'Ejercito Goblin'},
    {nombre: 'Albion'}
]

export const validarPuntosEjercito = (puntos) => {
    return puntos >= PUNTOS_EJERCITO_WARMASTER.min && puntos <= PUNTOS_EJERCITO_WARMASTER.max;
};