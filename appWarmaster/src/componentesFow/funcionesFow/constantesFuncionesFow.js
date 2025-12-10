/**
 * CONSTANTES WARMASTER
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

export const EPOCA_HISTORICA = [
    {nombre: 'Early-war'},
    {nombre: 'Mid-war'},
    {nombre: 'Late-war'}
]

export const TIPOS_PARTIDA_FOW = [
   "Batalla Campal"
];

export const ESTADOS_TORNEO_FOW = [
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

export const EJERCITOS_FOW = [
    {nombre: 'Imperio Britanico'},
    {nombre: 'Americanos'},
    {nombre: 'Alemania'},
    {nombre: 'Rusos'},
    {nombre: 'japoneses'}
]

export const validarPuntosEjercito = (puntos) => {
    return puntos >= PUNTOS_EJERCITO_FOW.min && puntos <= PUNTOS_EJERCITO_FOW.max;
};