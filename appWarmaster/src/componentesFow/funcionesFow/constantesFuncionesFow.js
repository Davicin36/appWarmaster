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
    { valor: 2, nombre: '2 Rondas'},
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