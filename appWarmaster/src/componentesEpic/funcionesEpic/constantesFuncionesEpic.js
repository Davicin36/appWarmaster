/**
 * CONSTANTES WARMASTER
 */
export const PARTICIPANTES_RANGO = {
    min: 4,
    max: 100,
    default: 16
};

export const PUNTOS_EJERCITO_EPIC = {
  min: 1000,
  max: 6000,
  default: 3000
};

export const ESTADOS_TORNEO_EPIC = [
    { valor: 'pendiente', nombre: 'Pendiente', emoji: '⏳' },
    { valor: 'en_curso', nombre: 'En Curso', emoji: '▶️' },
    { valor: 'finalizado', nombre: 'Finalizado', emoji: '🏁' }
];

export const RONDAS_DISPONIBLES = [
    { valor: 3, nombre: '3 Rondas' },
    { valor: 4, nombre: '4 Rondas' },
    { valor: 5, nombre: '5 Rondas' }    
];

export const EJERCITOS_EPIC = [
    {nombre: 'MARINES ESPACIALES - BLOOD ANGELS'},
    {nombre: 'MARINES ESPACIALES - CODEX ASTARTES'},
    {nombre: 'MARINES ESPACIALES - IMPERIAL FISTS'},
    {nombre: 'MARINES ESPACIALES - RAVEN GUARD'},
    {nombre: 'MARINES ESPACIALES - SALAMANDERS'},
    {nombre: 'MARINES ESPACIALES - SPACE WOLVES'},
    {nombre: 'MARINES ESPACIALES - WHITE SCARS'},
    {nombre: 'MARINES ESPACIALES - IRON HANDS'},
    {nombre: 'MARINES ESPACIALES - SCIONS OF IRON'},
    {nombre: 'MARINES ESPACIALES - DARK ANGELS'},
    {nombre: 'GUARDIA IMPERIAL - BARAN SIEGE MASTERS'},
    {nombre: 'GUARDIA IMPERIAL - CADIAN SHOCK TROOPERS'},
    {nombre: 'GUARDIA IMPERIAL - CATACHAN VETERANS'},
    {nombre: 'GUARDIA IMPERIAL - DEATH KORPS OF KRIEG'},
    {nombre: 'GUARDIA IMPERIAL - ELYSIAN DROP REGIMENT'},
    {nombre: 'GUARDIA IMPERIAL - ULANI TANK REGIMENT'},
    {nombre: 'GUARDIA IMPERIAL - VANAHEIM AIR CAVALARY'},
    {nombre: 'GUARDIA IMPERIAL - MINERVA TANK LEGION'},
    {nombre: 'GUARDIA IMPERIAL - HARAKONI WARHAWKS'},
    {nombre: 'GUARDIA IMPERIAL - SARANES EXPANSE CRUZADE'},
    {nombre: 'GUARDIA IMPERIAL - STEEL LEGION'},
    {nombre: 'GUARDIA IMPERIAL - MOBILE CATACHANS'},
    {nombre: 'GUARDIA IMPERIAL - MIRALI SKYRAIDERS'},
    {nombre: 'GUARDIA IMPERIAL - TALLARN DESERT RAIDERS'},
    {nombre: 'ADEPTUS MECHANICUS - LEGIO GRYPHONICUS'},
    {nombre: 'ADEPTUS MECHANICUS - KNIGHT WOLRD'},
    {nombre: 'ADEPTUS MECHANICUS - KNIGHT CRUSADE'},
    {nombre: 'ADEPTUS MECHANICUS - SKITARII'},
    {nombre: 'ADEPTUS MECHANICUS - EXPLORADOR FLEET'},
    {nombre: 'SISTERS OF BATTLE'},
    {nombre: 'GREY KNIGHTS'},
    {nombre: 'DEATH WATCH'},
    {nombre: 'ORDO XENOS'},
    {nombre: 'ORK0S - FERAL ORKS'},
    {nombre: 'ORK0S - GARGANT BIG MOB'},
    {nombre: 'ORK0S - GHAZGKHULL´S WARHORDE'},
    {nombre: 'ORK0S - SPEED FREAKS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - BLACK LEGION'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - DEATH GUARD'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - EMPEROR´S CHILDREN'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - IRON WARRIORS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - LOST AND THE DAMNED'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - LOST AND THE DAMNED-REDUX'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - HOUSE DEVINE'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - VRAKSAIAN TRAITORS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - RED CORSAIRS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - THOUNSAND SONS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - CHAOS TITANS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - WORD BEARERS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - WORLD EATERS'},
    {nombre: 'MARINES ESPACIALES DEL CAOS - DAEMONIC INCURSION'},
    {nombre: 'ELDARS - ALAITOC'},
    {nombre: 'ELDARS - BIEL-TAN'},
    {nombre: 'ELDARS - EXODITES'},
    {nombre: 'ELDARS - FIR LOLARION'},
    {nombre: 'ELDARS - GREAT COURT'},
    {nombre: 'ELDARS - IYANDEN'},
    {nombre: 'ELDARS - LYBRAESIL'},
    {nombre: 'ELDARS - LUGGANATH'},
    {nombre: 'ELDARS - SAIM-HANN'},
    {nombre: 'ELDARS - ULTHWÉ'},
    {nombre: 'ELDARS - YME-LOC'},
    {nombre: 'DARK ELDAR'},
    {nombre: 'DARK ELDAR - PLAYTEST VERSION'},
    {nombre: 'DARK ELDAR 2017 DEVELOPMENT'},
    {nombre: 'TAU'},
    {nombre: 'TAU - VIORLA'},
    {nombre: 'TYRANIDS'},
    {nombre: 'NECRONS'},
    {nombre: 'NECRON SAUTEKH LEGION'},
    {nombre: 'SQUATS'}
]

export const validarPuntosEjercito = (puntos) => {
    return puntos >= PUNTOS_EJERCITO_EPIC.min && puntos <= PUNTOS_EJERCITO_EPIC.max;
};