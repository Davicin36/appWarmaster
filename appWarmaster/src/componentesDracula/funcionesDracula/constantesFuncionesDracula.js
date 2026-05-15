/**
 * CONSTANTES WARMASTER
 */
export const PARTICIPANTES_RANGO = {
    min: 4,
    max: 100,
    default: 16
};

export const PUNTOS_BANDA_DRACULA = {
  min: 50,
  max: 200,
  default: 100
};

export const ESTADOS_TORNEO_DRACULA = [
    { valor: 'pendiente', nombre: 'Pendiente', emoji: '⏳' },
    { valor: 'en_curso', nombre: 'En Curso', emoji: '▶️' },
    { valor: 'finalizado', nombre: 'Finalizado', emoji: '🏁' }
];

export const RONDAS_DISPONIBLES = [
    { valor: 3, nombre: '3 Rondas' },
    { valor: 4, nombre: '4 Rondas' },
    { valor: 5, nombre: '5 Rondas' }    
];

export const BANDAS_DRACULA = [
    {nombre: 'LA ORDEN CREPUSCULAR'},
    {nombre: 'EL AQUELARRE DE LA MANO ROJA'},
    {nombre: 'LAS TRIBUS CAMBIAPIELES'},
    {nombre: 'LA SECTA DE LA ENCRUCIJADA'},
    {nombre: 'LA CONGREGACIÓN'},
    {nombre: 'LA CONFEDERACIÓN OSCURA'},
    {nombre: 'LOS PARIENTES'},
    {nombre: 'BANDA DE FORAJIDOS'},
    {nombre: 'BANDA DE DESESPERADOS'},
    {nombre: 'BANDA DE HOMBRES DE LA LEY'},
    {nombre: 'BANDA DE BANDIDOS MEXICANOS'},
    {nombre: 'LOS RECHAZADOS'},
    {nombre: 'TRÍADA DEL DRAGÓN SOMBRÍO'},
    {nombre: 'LOS FORAJIDOS'},
    {nombre: 'DESESPERADOS'},
    {nombre: 'SORORIDAD DE SALEM'},
    {nombre: 'IGLESIA DE DAGOM'}
]

export const validarPuntosEjercito = (puntos) => {
    return puntos >= PUNTOS_BANDA_DRACULA.min && puntos <= PUNTOS_BANDA_DRACULA.max;
};