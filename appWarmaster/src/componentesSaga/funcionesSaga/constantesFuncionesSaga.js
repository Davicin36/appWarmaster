// funciones/constantesFuncionesSaga.js
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES — arrays y rangos
// ═══════════════════════════════════════════════════════════════════════════

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

export const EPOCAS_SAGA_EN = [
    "Alexander",
    "Hannibal",
    "Vikings",
    "Invasions",
    "Crusades",
    "Age of Chivalry",
    "Age of Magic",
    "Alexander/Hannibal",
    "Vikings/Invasions",
    "Crusades/Age of Chivalry",
];

export const PARTICIPANTES_RANGO = {
    min: 4,
    max: 100,
    default: 16,
};

export const EQUIPOS_RANGO = {
    min: 2,
    max: 20,
    default: 5,
};

export const PUNTOS_BANDA_RANGO = {
    min: 4,
    max: 8,
    default: 6,
};

export const JUGADORES_EQUIPO_RANGO = {
    min: 2,
    max: 6,
    default: 3,
};

export const TIPOS_PARTIDA_SAGA = [
    "Choque de Bandas",
    "Captura",
    "Conquista",
    "Avance",
    "Desacralización",
    "Bienes de valor",
    "Reclamar el territorio",
    "Festines y saqueos",
    "Una historia de Desafios",
    "¡Emboscada!",
    "Mantener el botín",
    "Vieja Disputa",
    "El cruce",
    "Cambio de planes",
    "¡Átrapalos a Todos!",
    "El rio Helado",
    "Choque de Señores",
    "Escenario Inventado",
];

export const TIPOS_PARTIDAS_SAGA_EN = [
    "Clash of Warbands",
    "Capture",
    "Conquest",
    "Advance",
    "Desecration",
    "Prized Possessions",
    "Claiming Territory",
    "Feasting and Pillaging",
    "A Tale of Challenger",
    "Ambush!",
    "Guard the Loot",
    "Old Feud",
    "The Crossing",
    "Change of Plans",
    "Catch them All!",
    "The Frozen River",
    "Clash of Lords",
    "Custom Scenario",
];

export const ESTADOS_TORNEO_SAGA = [
    { valor: 'pendiente',  nombre: 'Pendiente',  emoji: '⏳' },
    { valor: 'en_curso',   nombre: 'En Curso',   emoji: '▶️' },
    { valor: 'finalizado', nombre: 'Finalizado', emoji: '🏁' },
];

export const RONDAS_DISPONIBLES = [
    { valor: 3, nombre: '3 Rondas' },
    { valor: 4, nombre: '4 Rondas' },
    { valor: 5, nombre: '5 Rondas' },
];

export const RONDAS_DISPONIBLES_EN = [
    { valor: 3, nombre: '3 Rounds' },
    { valor: 4, nombre: '4 Rounds' },
    { valor: 5, nombre: '5 Rounds' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS DE TROPA — labels bilingües
// Clave = id usado en tiposTropaPersonalizados / tiposTropaPermitidos
// Nombres oficiales SAGA EN: Hearthguard / Warriors / Levies
// ═══════════════════════════════════════════════════════════════════════════

export const TROOP_LABELS = {
    es: {
        guardias: 'Guardias',
        guerreros: 'Guerreros',
        levas: 'levas',
        mercenarios: 'Mercenarios',
        hechicero: 'Hechicero',
        lugarteniente: 'Lugarteniente',
        lugartenientes: 'Lugarteniente',
        paladin: 'Paladín',
        criaturas: 'Criaturas',
        monstruo: 'Monstruo',
        maquinas: 'Máquinas de Guerra',
        descerebrados: 'Descerebrados',
        carros_guerra: 'Carros de Guerra',
        perros: "Perros de Guerra",
        elefantes: "Elefantes",
        carros: "Carros",
        tambor: "Tambor de Guerra",
        manubalista: "Manubalista",
        carro_flamenco: "Carro Flamenco",
        carro_husita: "Carro Husita",
        carrocio: "Carrocio",
    },
    en: {
        guardias: 'Hearthguard',
        guerreros: 'Warriors',
        levas: 'Levies',
        mercenarios: 'Mercenaries',
        hechicero: 'Sorcerer',
        lugarteniente:  'Lieutenant',
        lugartenientes: 'Lieutenant',
        paladin: 'Paladin',
        criaturas: 'Creatures',
        monstruo: 'Monster',
        maquinas: 'War Machines',
        descerebrados:  'Mindless',
        carros_guerra:  'War Chariots',
        perros: "War Dogs",
        elefantes: "Elephants",
        carros: "War Chariots",
        tambor: "War Drum",
        manubalista: "Manuballista",
        carro_flamenco: "Flamenco War Chariot",
        carro_husita: "Husite War Chariot",
        carrocio: "Carroccio",
    },
};

export const WARLORD_TYPE_LABELS = {
    es: {
        consul:     'Cónsul',
        tribuno:    'Tribuno',
        legatum:    'Legatum',
        hubris:     'Hubris',
        divitiae:   'Divitiae',
        señor:      'Señor',
        nigromante: 'Nigromante',
    },
    en: {
        consul:     'Consul',
        tribuno:    'Tribune',
        legatum:    'Legatum',
        hubris:     'Hubris',
        divitiae:   'Divitiae',
        señor:      'Lord',
        nigromante: 'Necromancer',
    },
};

export const TIPOS_TROPAS = {
    GUARDIAS: 'guardias',
    GUERREROS: 'guerreros',
    LEVAS: 'levas',
    MERCENARIOS: 'mercenarios',
};

export const BANDA_LABELS = {
    // ── Vikingos ──────────────────────────────────────────
    "VIKINGOS": { en: "VIKINGS" },
    "JOMSVIKINGS": { en: "JOMSVIKINGS" },
    "GALESES": { en: "WELSH" },
    "ANGLO-DANESES": { en: "ANGLO-DANES" },
    "ANGLO-SAJONES": { en: "ANGLO-SAXONS" },
    "NORSE-GAELS": { en: "NORSE-GAELS" },
    "CAROLINGIOS -CAPETOS": { en: "CAROLINGIANS -CAPETIANS" },
    "CAROLINGIOS -MEROVINGIOS": { en: "CAROLINGIANS -MEROVINGIANS" },
    "NORMANDOS": { en: "NORMANS" },
    "IRLANDESES": { en: "IRISH" },
    "PAGAN RUSS": { en: "PAGAN RUSS" },
    "ESCOTOS": { en: "SCOTS" },
    "ÚLTIMOS ROMANOS": { en: "LAST ROMANS" },
    "PUEBLOS GERMÁNICOS": { en: "GERMANIC PEOPLES" },
    "LOMBARDOS": { en: "LOMBARDS" },
    "PUEBLOS DE LAS ESTEPAS": { en: "STEPPE PEOPLES" },
    "OMEYAS": { en: "UMAYYADS" },

    // ── Invasiones ────────────────────────────────────────
    "ROMANOS": { en: "ROMANS" },
    "GODOS-OSTROGODOS": { en: "GOTHS-OSTROGOTHS" },
    "GODOS-VISIGODOS": { en: "GOTHS-VISIGOTHS" },
    "FRANCOS": { en: "FRANKS" },
    "BRITANOS": { en: "BRITONS" },
    "SAJONES": { en: "SAXONS" },
    "PICTOS": { en: "PICTS" },
    "HUNOS": { en: "HUNS" },
    "SASÁNIDAS": { en: "SASSANIDS" },
    "ALT CLUT Y MANACO GODODDIN": { en: "ALT CLUT AND MANAW GODODDIN" },
    "CYMRY": { en: "CYMRY" },
    "VÁNDALOS": { en: "VANDALS" },

    // ── Ánibal ────────────────────────────────────────────
    "IBEROS": { en: "IBERIANS" },
    "CARTAGINESES": { en: "CARTHAGINIANS" },
    "REPÚBLICA DE ROMA": { en: "ROMAN REPUBLIC" },
    "GALOS": { en: "GAULS" },
    "GALOS -UNIDADES GAESATIS": { en: "GAULS -GAESATAE UNITS" },
    "NÚMIDAS": { en: "NUMIDIANS" },
    "GRAECULI-SIRACUSSA": { en: "GRAECULI-SYRACUSE" },
    "GRAECULI-EPIRO": { en: "GRAECULI-EPIRUS" },
    "GRAECULI-ITALIOTAS": { en: "GRAECULI-ITALIOTES" },

    // ── Alejandro ─────────────────────────────────────────
    "PERSAS-MEDOS": { en: "PERSIANS-MEDES" },
    "PERSAS-AQUEMÉNIDAS": { en: "PERSIANS-ACHAEMENIDS" },
    "TRACIOS": { en: "THRACIANS" },
    "TRACIOS -ESCORDISCOS": { en: "THRACIANS -SCORDISCI" },
    "MACEDONIOS": { en: "MACEDONIANS" },
    "INDIOS": { en: "INDIANS" },
    "SUCESORES-GRECIA": { en: "SUCCESSORS-GREECE" },
    "SUCESORES-EGIPTO": { en: "SUCCESSORS-EGYPT" },
    "SUCESORES-ASIA": { en: "SUCCESSORS-ASIA" },
    "CIUDADES GRIEGAS-ATENAS": { en: "GREEK CITIES-ATHENS" },
    "CIUDADES GRIEGAS-LACEDEMONIOS": { en: "GREEK CITIES-LACEDAEMONIANS" },
    "CIUDADES GRIEGAS-TESALIOS": { en: "GREEK CITIES-THESSALIANS" },
    "CIUDADES GRIEGAS-TEBANOS":  { en: "GREEK CITIES-THEBANS" },

    // ── Cruzadas ──────────────────────────────────────────
    "BIZANTINOS": { en: "BYZANTINES" },
    "CRUZADOS": { en: "CRUSADERS" },
    "ORDENSTAAT": { en: "ORDENSTAAT" },
    "MOROS": { en: "MOORS" },
    "MILITES CHRISTI": { en: "MILITES CHRISTI" },
    "MUTTATAWI'A": { en: "MUTTATAWI'A" },
    "PRINCIPES DEL ESTE": { en: "PRINCES OF THE EAST" },
    "PUEBLOS PAGANOS": { en: "PAGAN PEOPLES" },
    "POLACOS": { en: "POLISH" },
    "SARRACERNOS": { en: "SARRACENS" },
    "ESPAÑOLES": { en: "SPANISH" },
    "MONGOLES": { en: "MONGOLS" },
    "CUMANOS": { en: "CUMANS" },
    "INCURSORES PAGANOS": { en: "PAGAN RAIDERS" },
    "ARMENIOS DE CILICIA": { en: "ARMENIANS OF CILICIA" },
    "HÚNGAROS DE ÁRPÁD": { en: "ÁRPÁD HUNGARIANS" },
    "CRUZADOS DE MONTFORT": { en: "CRUSADERS OF MONTFORT" },
    "CÁTAROS": { en: "CATHARS" },

    // ── Caballeria ────────────────────────────────────────
    "INGLESES": { en: "ENGLISH" },
    "INGLESES-GALESES": { en: "ENGLISH-WELSH" },
    "FRANCESES": { en: "FRENCH" },
    "FRANCESES-COMPAÑIA DE ORDENANZA":  { en: "FRENCH-ORDONNANCE COMPANY" },
    "COMPAÑIAS LIBRES": { en: "FREE COMPANIES" },
    "BORGOÑESES": { en: "BURGUNDIANS" },
    "BORGOÑESES-COMPAÑIA DE ORDENANZA": { en: "BURGUNDIANS-ORDONNANCE COMPANY" },
    "FLAMENCOS": { en: "FLEMISH" },
    "ESCOCESES-SCHILTRONS": { en: "SCOTS-SCHILTRONS" },
    "ESCOCESES-COMPAÑIAS PROFESIONALES": { en: "SCOTS-PROFESSIONAL COMPANIES" },
    "SUIZOS": { en: "SWISS" },
    "BRETONES": { en: "BRETONS" },
    "CASTELLANOS": { en: "CASTILIANS" },
    "GERMANOS": { en: "GERMANS" },
    "HUSITAS": { en: "HUSSITES" },
    "CONDOTIEROS-FLORENCIA": { en: "CONDOTTIERI-FLORENCE" },
    "CONDOTIEROS-ESTADOS PONTIFICIOS": { en: "CONDOTTIERI-PAPAL STATES" },
    "CONDOTIEROS-MILÁN": { en: "CONDOTTIERI-MILAN" },
    "CONDOTIEROS-REINO DE NÁPOLES": { en: "CONDOTTIERI-KINGDOM OF NAPLES" },
    "CONDOTIEROS-VENECIA": { en: "CONDOTTIERI-VENICE" },
    "YORK": { en: "YORK" },
    "LANCASTER": { en: "LANCASTER" },

    // ── Edad de la Magia ──────────────────────────────────
    "GRANDES REINOS": { en: "GREAT KINGDOMS" },
    "GRANDES REINOS - LOS ELFOS ZAFIRO": { en: "GREAT KINGDOMS - THE SAPPHIRE ELVES" },
    "GRANDES REINOS - LA ORDEN MILITANTE": { en: "GREAT KINGDOMS - THE MILITANT ORDER" },
    "SEÑORES DE LA NATURALEZA": { en: "LORDS OF NATURE" },
    "SEÑORES DE LA NATURALEZA - MINOTAUROS DE LAS COLINAS NEGRAS": { en: "LORDS OF NATURE - MINOTAURS OF THE BLACK HILLS" },
    "SEÑORES DE LA NATURALEZA - LA JUNGLA DE LAS ARAÑAS": { en: "LORDS OF NATURE - THE SPIDER JUNGLE" },
    "LEGIONES DE LOS NO MUERTOS": { en: "LEGIONS OF THE UNDEAD" },
    "LEGIONES DE LOS NO MUERTOS - LA DINASTIA REAL DE NEPHREN-KA": { en: "LEGIONS OF THE UNDEAD - THE ROYAL DYNASTY OF NEPHREN-KA" },
    "LEGIONES DE LOS NO MUERTOS - EL REINO DE LOS NECRÓFAGOS": { en: "LEGIONS OF THE UNDEAD - THE KINGDOM OF THE GHOULS" },
    "LA HORDA": { en: "THE HORDE" },
    "LA HORDA - LOS RUFIANES DE RH' UM": { en: "THE HORDE - THE RUFFIANS OF RH'UM" },
    "LA HORDA - LA ISLA DE MORROW": { en: "THE HORDE - THE ISLE OF MORROW" },
    "OTROS MUNDOS": { en: "OTHER WORLDS" },
    "OTROS MUNDOS - LA MAREA DE LAS PROFUNDIDADES": { en: "OTHER WORLDS - THE TIDE OF THE DEEP" },
    "OTROS MUNDOS - LA TEOCRACIA DE QWAN T 'ANG": { en: "OTHER WORLDS - THE THEOCRACY OF QWAN T'ANG" },
    "PUEBLOS SUBTERRÁNEOS": { en: "UNDERGROUND PEOPLES" },
    "PUEBLOS SUBTERRÁNEOS - LOS ENANOS DE LAS MONTAÑAS DE PLATA": { en: "UNDERGROUND PEOPLES - THE DWARVES OF THE SILVER MOUNTAINS" },
    "PUEBLOS SUBTERRÁNEOS- LAS ALIMAÑAS": { en: "UNDERGROUND PEOPLES - THE VERMIN" },
};

// ═══════════════════════════════════════════════════════════════════════════
// BANDAS POR ÉPOCA
// IMPORTANTE: los `nombre` son claves de base de datos — NO se traducen.
// ═══════════════════════════════════════════════════════════════════════════

export const BANDAS_POR_EPOCA = {
    "Vikingos": [
        { nombre: "VIKINGOS", permiteBerserkers: true },
        { nombre: "JOMSVIKINGS",
             restricciones: { prohibido: ["levas"] } },
        { nombre: "GALESES" },
        { nombre: "ANGLO-DANESES" },
        { nombre: "ANGLO-SAJONES" },
        { nombre: "NORSE-GAELS" },
        { nombre: "CAROLINGIOS -CAPETOS" },
        { nombre: "CAROLINGIOS -MEROVINGIOS" },
        { nombre: "NORMANDOS" },
        { nombre: "IRLANDESES", permiteCuraids: true, permitePerros: true },
        { nombre: "PAGAN RUSS" },
        { nombre: "ESCOTOS" },
        { nombre: "ÚLTIMOS ROMANOS" },
        { nombre: "PUEBLOS GERMÁNICOS" },
        { nombre: "LOMBARDOS" },
        { nombre: "PUEBLOS DE LAS ESTEPAS" },
        { nombre: "OMEYAS" },
    ],
    "Invasiones": [
        {
            nombre: "ROMANOS",
            unidadesEspeciales: [
                { nombre: "manubalista", label: "Manubalista", puntos: 0.5, step: 0.5 },
            ],
        },
        { nombre: "GODOS-OSTROGODOS" },
        { nombre: "GODOS-VISIGODOS" },
        { nombre: "FRANCOS" },
        {
            nombre: "BRITANOS",
            unidadesEspeciales: [
                { nombre: "los_compañeros", label: "Los Compañeros", puntos: 0.5, step: 0.5 },
            ],
        },
        { nombre: "SAJONES" },
        { nombre: "PICTOS" },
        { nombre: "HUNOS" },
        { nombre: "SASÁNIDAS", permiteElefantes: true },
        { nombre: "ESCOTOS" },
        { nombre: "ALT CLUT Y MANACO GODODDIN" },
        { nombre: "CYMRY" },
        { nombre: "VÁNDALOS" },
    ],
    "Ánibal": [
        {
            nombre: "IBEROS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "viriato", nombre: "Viriato",  costeEnPuntos: 1 },
                    { valor: "punicus", nombre: "Punicus",  costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "CARTAGINESES", permiteElefantes: true, permiteCarros: true,
            restricciones: { mutuamenteExcluyentes: [["elefantes", "carros"]] },
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "anibal",  nombre: "Aníbal Barca, el General tuerto, Némesis de Roma", costeEnPuntos: 1 },
                    { valor: "amilcar", nombre: "Amílcar Barca", costeEnPuntos: 1,
                      restriccionesAdicionales: { prohibido: ["elefantes", "carros", "levas"] } },
                ],
            }],
        },
        {
            nombre: "REPÚBLICA DE ROMA",
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "consul",  nombre: "Cónsul" },
                    { valor: "tribuno", nombre: "Tribuno" },
                ],
                valorPorDefecto: "consul",
            }],
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "publio", nombre: "PUBLIO CORNELIO ESCIPIÓN, El Africano",
                      opcionesRequeridas: { tipoWarlord: "consul ", otroSelect: "tribuno" }, costeEnPuntos: 1 },
                    { valor: "marcus", nombre: "MARCUS CLAUDIUS MARCELLUS, la Espada de Roma",
                      opcionesRequeridas: { tipoWarlord: "consul" }, costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "GALOS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "ducario",    nombre: "DUCARIO el Ínsubro", costeEnPuntos: 1 },
                    { valor: "viridomaros", nombre: "VIRIDÓMAROS, Rey de los Gaesati", costeEnPuntos: 1,
                      nombreBandaDesbloqueada: "GALOS -UNIDADES GAESATIS", composicionBanda: null,
                      restriccionesAdicionales: { prohibido: ["carros"] } },
                ],
            }],
        },
        {
            nombre: "NÚMIDAS", permiteElefantes: true,
            tiposTropaPermitidos: ['guerreros', 'levas', 'mercenarios'],
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "masinisa", nombre: "MASINISA", costeEnPuntos: 1 },
                    { valor: "yugurta",  nombre: "YUGURTA",  costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "GRAECULI-SIRACUSSA",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "pirro",  nombre: "PIRRO, Rey de Epiro",        costeEnPuntos: 0 },
                    { valor: "hieron", nombre: "HIERÓN II, Tirano de Siracusa", costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "GRAECULI-EPIRO", permiteElefantes: true,
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "pirro",  nombre: "PIRRO, Rey de Epiro",           costeEnPuntos: 0 },
                    { valor: "hieron", nombre: "HIERÓN II, Tirano de Siracusa", costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "GRAECULI-ITALIOTAS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "pirro",  nombre: "PIRRO, Rey de Epiro",           costeEnPuntos: 0 },
                    { valor: "hieron", nombre: "HIERÓN II, Tirano de Siracusa", costeEnPuntos: 1 },
                ],
            }],
        },
    ],
    "Alejandro": [
        {
            nombre: "PERSAS-MEDOS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [{ valor: "jerjes", nombre: "JERJES, Rey de Reyes", costeEnPuntos: 1 }],
            }],
        },
        {
            nombre: "PERSAS-AQUEMÉNIDAS", permiteCarros: true, permiteElefantes: true,
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [{ valor: "dario", nombre: "DARIO III", costeEnPuntos: 1 }],
            }],
        },
        {
            nombre: "TRACIOS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "seuytes", nombre: "SEUYTES III", costeEnPuntos: 1 },
                    { costeEnPuntos: 1, nombreBandaDesbloqueada: "TRACIOS -ESCORDISCOS", composicionBanda: null },
                ],
            }],
        },
        {
            nombre: "MACEDONIOS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "alejandro", nombre: "ALEJANDRO MAGNO", costeEnPuntos: 1 },
                    { valor: "filipo", nombre: "FILIPO II", costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "INDIOS", permiteElefantes: true,
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "poros", nombre: "POROS", costeEnPuntos: 2 },
                    { valor: "chandragupta", nombre: "CHANDRAGUPTA MAURYA, El primer Emperador", costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "SUCESORES-GRECIA",
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "legatum",  nombre: "Legatum" },
                    { valor: "hubris",   nombre: "Hubris" },
                    { valor: "divitiae", nombre: "Divitiae" },
                ],
                valorPorDefecto: "legatum",
            }],
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "filipo", nombre: "FILIPO V", costeEnPuntos: 1,
                      opcionesRequeridas: { tipoWarlord: "legatum" } },
                ],
            }],
        },
        {
            nombre: "SUCESORES-EGIPTO", permiteElefantes: true,
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "legatum",  nombre: "Legatum" },
                    { valor: "hubris",   nombre: "Hubris" },
                    { valor: "divitiae", nombre: "Divitiae" },
                ],
                valorPorDefecto: "legatum",
            }],
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "ptolomeo", nombre: "PTOLOMEO II FILADELFOS, El Rey Faraón", costeEnPuntos: 1,
                      opcionesRequeridas: { tipoWarlord: "divitiae" } },
                ],
            }],
        },
        {
            nombre: "SUCESORES-ASIA", permiteElefantes: true, permiteCarros: true,
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "legatum", nombre: "Legatum" },
                    { valor: "hubris", nombre: "Hubris" },
                    { valor: "divitiae", nombre: "Divitiae" },
                ],
                valorPorDefecto: "legatum",
            }],
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "mitriades", nombre: "MITRÍADES VI EUPATOR, Enemigo de Roma", costeEnPuntos: 1,
                      opcionesRequeridas: { tipoWarlord: "divitiae" } },
                    { valor: "antioco",   nombre: "ANTÍOCO III, El Grande", costeEnPuntos: 1,
                      opcionesRequeridas: { tipoWarlord: "hubris" } },
                ],
            }],
        },
        {
            nombre: "CIUDADES GRIEGAS-ATENAS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "FILOPEMEN", nombre: "FILOPEMÉN, El último de los Griegos", costeEnPuntos: 1 },
                ],
            }],
        },
        {
            nombre: "CIUDADES GRIEGAS-LACEDEMONIOS",
            unidadesLegendarias: [{
                id: "warlord_legendario", label: "Warlord Legendario", tipo: "select", obligatorio: false,
                opciones: [
                    { valor: "leonidas", nombre: "LEÓNIDAS, Rey de Esparta", costeEnPuntos: 0,
                      unidadesEspecialesDesbloqueadas: [{
                          valor: "batallon_sagrado",
                          nombre: "Batallón Sagrado",
                          label: " Batallón Sagrado, (tienes que indicar los dos puntos)",
                          puntos: 2, step: 1,
                      }],
                    },
                ],
            }],
        },
        { nombre: "CIUDADES GRIEGAS-TESALIOS" },
        { nombre: "CIUDADES GRIEGAS-TEBANOS" },
    ],
    "Cruzadas": [
        { nombre: "BIZANTINOS" },
        { nombre: "CRUZADOS" },
        { nombre: "ORDENSTAAT" },
        { nombre: "MOROS" },
        { nombre: "MILITES CHRISTI", tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios'] },
        { nombre: "MUTTATAWI'A", tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios'] },
        { nombre: "PRINCIPES DEL ESTE", permiteCarros: true },
        { nombre: "PUEBLOS PAGANOS" },
        { nombre: "POLACOS" },
        { nombre: "SARRACERNOS" },
        { nombre: "ESPAÑOLES" },
        { nombre: "MONGOLES", permiteTambor: true },
        { nombre: "CUMANOS" },
        { nombre: "INCURSORES PAGANOS", tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios'] },
        { nombre: "ARMENIOS DE CILICIA" },
        { nombre: "HÚNGAROS DE ÁRPÁD" },
        { nombre: "CRUZADOS DE MONTFORT", tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios'] },
        { nombre: "CÁTAROS", tiposTropaPermitidos: ['guardias', 'guerreros', 'mercenarios'] },
    ],
    "Caballeria": [
        { nombre: "INGLESES" },
        { nombre: "INGLESES-GALESES" },
        { nombre: "FRANCESES" },
        { nombre: "FRANCESES-COMPAÑIA DE ORDENANZA" },
        { nombre: "COMPAÑIAS LIBRES" },
        { nombre: "BORGOÑESES" },
        { nombre: "BORGOÑESES-COMPAÑIA DE ORDENANZA" },
        {
            nombre: "FLAMENCOS",
            unidadesEspeciales: [{ nombre: "carro_flamenco", label: "Carro Flamenco", puntos: 0.5, step: 0.5 }],
        },
        { nombre: "ESCOCESES-SCHILTRONS" },
        { nombre: "ESCOCESES-COMPAÑIAS PROFESIONALES" },
        { nombre: "SUIZOS", tiposTropaPermitidos: ['guerreros', 'levas', 'mercenarios'] },
        { nombre: "BRETONES" },
        { nombre: "CASTELLANOS" },
        { nombre: "GERMANOS" },
        {
            nombre: "HUSITAS",
            unidadesEspeciales: [{ nombre: "carro_husita", label: "Carro Husita", puntos: 1, step: 1 }],
        },
        { nombre: "CONDOTIEROS-FLORENCIA" },
        {
            nombre: "CONDOTIEROS-ESTADOS PONTIFICIOS",
            unidadesEspeciales: [{ nombre: "carrocio", label: "Carrocio", puntos: 0.5, step: 0.5 }],
        },
        { nombre: "CONDOTIEROS-MILÁN" },
        { nombre: "CONDOTIEROS-REINO DE NÁPOLES" },
        { nombre: "CONDOTIEROS-VENECIA" },
        { nombre: "YORK" },
        { nombre: "LANCASTER" },
    ],
    "Edad de la Magia": [
        {
            nombre: "GRANDES REINOS",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",          puntos: 1,   step: 0.5 },
                { id: "guerreros",     label: "Guerreros",         puntos: 1,   step: 0.5 },
                { id: "hechicero",     label: "Hechicero",         puntos: 1,   step: 1   },
                { id: "levas",         label: "Levas",             puntos: 1,   step: 0.5 },
                { id: "lugarteniente", label: "Capitán",           puntos: 1,   step: 1   },
                { id: "paladin",       label: "Paladín",           puntos: 0.5, step: 0.5 },
                { id: "criaturas",     label: "Criaturas",         puntos: 1,   step: 0.5 },
                { id: "monstruo",      label: "Monstruo",          puntos: 1,   step: 1   },
                { id: "maquinas",      label: "Máquinas de Guerra",puntos: 1,   step: 1   },
            ],
        },
        {
            nombre: "GRANDES REINOS - LOS ELFOS ZAFIRO",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",          puntos: 1,   step: 0.5 },
                { id: "guerreros",     label: "Guerreros",         puntos: 1,   step: 0.5 },
                { id: "hechicero",     label: "Hechicero",         puntos: 1,   step: 1   },
                { id: "lugarteniente", label: "Capitán",           puntos: 1,   step: 1   },
                { id: "paladin",       label: "Paladín",           puntos: 0.5, step: 0.5 },
                { id: "criaturas",     label: "Criaturas",         puntos: 1,   step: 0.5 },
                { id: "monstruo",      label: "Monstruo",          puntos: 1,   step: 1   },
                { id: "maquinas",      label: "Máquinas de Guerra",puntos: 1,   step: 1   },
            ],
        },
        {
            nombre: "GRANDES REINOS - LA ORDEN MILITANTE",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",          puntos: 1,   step: 0.5 },
                { id: "guerreros",     label: "Guerreros",         puntos: 1,   step: 0.5 },
                { id: "levas",         label: "Levas",             puntos: 1,   step: 0.5 },
                { id: "hechicero",     label: "Hechicero",         puntos: 1,   step: 1   },
                { id: "lugarteniente", label: "Capitán",           puntos: 1,   step: 1   },
                { id: "paladin",       label: "Paladín",           puntos: 0.5, step: 0.5 },
                { id: "maquinas",      label: "Máquinas de Guerra",puntos: 1,   step: 1   },
            ],
            unidadesEspeciales: [
                { nombre: "fanaticos_entusiastas", label: "Fanáticos Entusiastas", puntos: 1, step: 0.5 },
            ],
        },
        {
            nombre: "SEÑORES DE LA NATURALEZA",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",  puntos: 1, step: 0.5 },
                { id: "guerreros",     label: "Guerreros", puntos: 1, step: 0.5 },
                { id: "hechicero",     label: "Hechicero", puntos: 1, step: 1   },
                { id: "levas",         label: "Levas",     puntos: 1, step: 0.5 },
                { id: "lugarteniente", label: "Ranger",    puntos: 1, step: 1   },
                { id: "criaturas",     label: "Criaturas", puntos: 1, step: 0.5 },
                { id: "monstruo",      label: "Monstruo",  puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "SEÑORES DE LA NATURALEZA - MINOTAUROS DE LAS COLINAS NEGRAS",
            tiposTropaPersonalizados: [
                { id: "hechicero", label: "Hechicero", puntos: 1, step: 1   },
                { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
                { id: "monstruo",  label: "Monstruo",  puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "SEÑORES DE LA NATURALEZA - LA JUNGLA DE LAS ARAÑAS",
            tiposTropaPersonalizados: [
                { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
                { id: "hechicero", label: "Hechicero", puntos: 1, step: 1   },
                { id: "monstruo",  label: "Monstruo",  puntos: 1, step: 1   },
            ],
            unidadesEspeciales: [
                { nombre: "fanaticos_entusiastas", label: "Fanáticos Entusiastas", puntos: 1, step: 0.5 },
            ],
        },
        {
            nombre: "LEGIONES DE LOS NO MUERTOS",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",           puntos: 1, step: 0.5 },
                { id: "guerreros",     label: "Guerreros",          puntos: 1, step: 0.5 },
                { id: "hechicero",     label: "Hechicero",          puntos: 1, step: 1   },
                { id: "levas",         label: "Levas",              puntos: 1, step: 0.5 },
                { id: "descerebrados", label: "Descerebrados",      puntos: 1, step: 1   },
                { id: "lugarteniente", label: "Caballero Negro",    puntos: 1, step: 1   },
                { id: "criaturas",     label: "Criaturas",          puntos: 1, step: 0.5 },
                { id: "monstruo",      label: "Monstruo",           puntos: 1, step: 1   },
                { id: "maquinas",      label: "Máquinas de Guerra", puntos: 1, step: 1   },
            ],
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "señor",      nombre: "Señor" },
                    { valor: "nigromante", nombre: "Nigromante" },
                ],
                valorPorDefecto: "señor",
            }],
        },
        {
            nombre: "LEGIONES DE LOS NO MUERTOS - LA DINASTIA REAL DE NEPHREN-KA", permiteCarros: true,
            tiposTropaPersonalizados: [
                { id: "guardias",  label: "Guardias",           puntos: 1, step: 0.5 },
                { id: "guerreros", label: "Guerreros",          puntos: 1, step: 0.5 },
                { id: "hechicero", label: "Hechicero",          puntos: 1, step: 1   },
                { id: "levas",     label: "Levas",              puntos: 1, step: 0.5 },
                { id: "criaturas", label: "Criaturas",          puntos: 1, step: 0.5 },
                { id: "monstruo",  label: "Monstruo",           puntos: 1, step: 1   },
                { id: "maquinas",  label: "Máquinas de Guerra", puntos: 1, step: 1   },
            ],
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "señor",      nombre: "Señor" },
                    { valor: "nigromante", nombre: "Nigromante" },
                ],
                valorPorDefecto: "señor",
            }],
        },
        {
            nombre: "LEGIONES DE LOS NO MUERTOS - EL REINO DE LOS NECRÓFAGOS",
            tiposTropaPersonalizados: [
                { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
                { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
                { id: "monstruo",  label: "Monstruo",  puntos: 1, step: 1   },
            ],
            opcionesBanda: [{
                id: "tipoWarlord", label: "tipo de Warlord", tipo: "select", obligatorio: true,
                opciones: [
                    { valor: "señor",      nombre: "Señor" },
                    { valor: "nigromante", nombre: "Nigromante" },
                ],
                valorPorDefecto: "señor",
            }],
        },
        {
            nombre: "LA HORDA",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",           puntos: 1, step: 0.5 },
                { id: "guerreros",     label: "Guerreros",          puntos: 1, step: 0.5 },
                { id: "hechicero",     label: "Hechicero",          puntos: 1, step: 1   },
                { id: "carros_guerra", label: "Carros de Guerra",   puntos: 1, step: 1   },
                { id: "levas",         label: "Levas",              puntos: 1, step: 0.5 },
                { id: "lugarteniente", label: "Campeón",            puntos: 1, step: 1   },
                { id: "criaturas",     label: "Criaturas",          puntos: 1, step: 0.5 },
                { id: "monstruo",      label: "Monstruo",           puntos: 1, step: 1   },
                { id: "maquinas",      label: "Máquinas de Guerra", puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "LA HORDA - LOS RUFIANES DE RH' UM",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",         puntos: 1, step: 0.5 },
                { id: "hechicero",     label: "Hechicero",        puntos: 1, step: 1   },
                { id: "carros_guerra", label: "Carros de Guerra", puntos: 1, step: 1   },
                { id: "lugarteniente", label: "Campeón",          puntos: 1, step: 1   },
                { id: "criaturas",     label: "Criaturas",        puntos: 1, step: 0.5 },
            ],
        },
        {
            nombre: "LA HORDA - LA ISLA DE MORROW",
            tiposTropaPersonalizados: [
                { id: "monstruo", label: "Monstruo", puntos: 1, step: 1 },
            ],
        },
        {
            nombre: "OTROS MUNDOS",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",   puntos: 1, step: 0.5 },
                { id: "guerreros",     label: "Guerreros",  puntos: 1, step: 0.5 },
                { id: "hechicero",     label: "Hechicero",  puntos: 1, step: 1   },
                { id: "lugarteniente", label: "Conjurador", puntos: 1, step: 1   },
                { id: "criaturas",     label: "Criaturas",  puntos: 1, step: 0.5 },
                { id: "monstruo",      label: "Monstruo",   puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "OTROS MUNDOS - LA MAREA DE LAS PROFUNDIDADES",
            tiposTropaPersonalizados: [
                { id: "guerreros", label: "Guerreros", puntos: 1, step: 0.5 },
                { id: "criaturas", label: "Criaturas", puntos: 1, step: 0.5 },
                { id: "monstruo",  label: "Monstruo",  puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "OTROS MUNDOS - LA TEOCRACIA DE QWAN T 'ANG",
            tiposTropaPersonalizados: [
                { id: "guardias",      label: "Guardias",   puntos: 1, step: 0.5 },
                { id: "guerreros",     label: "Guerreros",  puntos: 1, step: 0.5 },
                { id: "hechicero",     label: "Hechicero",  puntos: 1, step: 1   },
                { id: "lugarteniente", label: "Conjurador", puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "PUEBLOS SUBTERRÁNEOS",
            tiposTropaPersonalizados: [
                { id: "guardias",       label: "Guardias",           puntos: 1, step: 0.5 },
                { id: "guerreros",      label: "Guerreros",          puntos: 1, step: 0.5 },
                { id: "hechicero",      label: "Hechicero",          puntos: 1, step: 1   },
                { id: "levas",          label: "Levas",              puntos: 1, step: 0.5 },
                { id: "lugartenientes", label: "Alquimista",         puntos: 1, step: 1   },
                { id: "criaturas",      label: "Criaturas",          puntos: 1, step: 0.5 },
                { id: "monstruo",       label: "Monstruo",           puntos: 1, step: 1   },
                { id: "maquinas",       label: "Máquinas de Guerra", puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "PUEBLOS SUBTERRÁNEOS - LOS ENANOS DE LAS MONTAÑAS DE PLATA",
            tiposTropaPersonalizados: [
                { id: "guardias",       label: "Guardias",           puntos: 1, step: 0.5 },
                { id: "guerreros",      label: "Guerreros",          puntos: 1, step: 0.5 },
                { id: "hechicero",      label: "Hechicero",          puntos: 1, step: 1   },
                { id: "lugartenientes", label: "Alquimista",         puntos: 1, step: 1   },
                { id: "criaturas",      label: "Criaturas",          puntos: 1, step: 0.5 },
                { id: "maquinas",       label: "Máquinas de Guerra", puntos: 1, step: 1   },
            ],
        },
        {
            nombre: "PUEBLOS SUBTERRÁNEOS- LAS ALIMAÑAS",
            tiposTropaPersonalizados: [
                { id: "guardias", label: "Guardias",           puntos: 1, step: 0.5 },
                { id: "hechicero", label: "Hechicero",          puntos: 1, step: 1   },
                { id: "levas", label: "Levas",              puntos: 1, step: 0.5 },
                { id: "lugartenientes", label: "Alquimista",         puntos: 1, step: 1   },
                { id: "criaturas", label: "Criaturas",          puntos: 1, step: 0.5 },
                { id: "monstruo", label: "Monstruo",           puntos: 1, step: 1   },
                { id: "maquinas", label: "Máquinas de Guerra", puntos: 1, step: 1   },
            ],
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS PUROS — traducción sin React
// ═══════════════════════════════════════════════════════════════════════════

/** Label de época según idioma */
export const getEpocaLabel = (epoca, lang = 'es') => {
    if (lang !== 'en') return epoca;
    const idx = EPOCAS_SAGA.indexOf(epoca);
    return idx >= 0 ? (EPOCAS_SAGA_EN[idx] ?? epoca) : epoca;
};

/** Nombre de escenario según idioma */
export const getEscenarioLabel = (escenario, lang = 'es') => {
    if (lang !== 'en') return escenario;
    const idx = TIPOS_PARTIDA_SAGA.indexOf(escenario);
    return idx >= 0 ? (TIPOS_PARTIDAS_SAGA_EN[idx] ?? escenario) : escenario;
};

/** Label de tipo de tropa según idioma */
export const getTroopLabel = (id, lang = 'es') => {
    const l = lang === 'en' ? 'en' : 'es';
    return TROOP_LABELS[l][id] ?? id;
};

/** Label de opción de tipo de warlord según idioma */
export const getWarlordTypeLabel = (valor, lang = 'es') => {
    const l = lang === 'en' ? 'en' : 'es';
    return WARLORD_TYPE_LABELS[l][valor] ?? valor;
};

// Helper puro — añadir junto a getEpocaLabel, getEscenarioLabel, etc.
export const getBandaLabel = (nombre, lang = 'es') => {
    if (lang !== 'en') return nombre;
    return BANDA_LABELS[nombre]?.en ?? nombre;
};

/**
 * Formatea una cadena de épocas para mostrar en el idioma dado.
 * Acepta separadores | , /
 * Llamadas sin `lang` siguen funcionando igual (retrocede a 'es').
 */
export const formatearEpocas = (epocasString, lang = 'es') => {
    if (!epocasString) return lang === 'en' ? 'Not specified' : 'No especificadas';

    let tokens;
    if      (epocasString.includes('|')) tokens = epocasString.split('|');
    else if (epocasString.includes(',')) tokens = epocasString.split(',');
    else                                 tokens = [epocasString];

    return tokens
        .map(t => getEpocaLabel(t.trim(), lang))
        .filter(Boolean)
        .join(', ');
};

/**
 * Devuelve una copia de tiposTropaPersonalizados con los labels traducidos.
 */
export const traducirTiposTropa = (tiposTropa, lang = 'es') => {
    if (!tiposTropa) return null;
    return tiposTropa.map(t => ({ ...t, label: getTroopLabel(t.id, lang) }));
};

/**
 * Devuelve una copia de opcionesBanda con labels y nombres de opciones traducidos.
 */
export const traducirOpcionesBanda = (opcionesBanda, lang = 'es') => {
    if (!opcionesBanda) return [];
    return opcionesBanda.map(opcion => ({
        ...opcion,
        label: lang === 'en' ? 'Warlord type' : 'tipo de Warlord',
        opciones: opcion.opciones.map(o => ({
            ...o,
            nombre: getWarlordTypeLabel(o.valor, lang),
        })),
    }));
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK REACT — useSagaI18n
// getEstado usa t() porque estado.* ya está en common.json
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Devuelve todos los datos de SAGA localizados según el idioma activo.
 *
 * Uso:
 *   const { epocas, escenarios, rondas, getEstado, getEpoca, formatEpocas } = useSagaI18n();
 *
 *   // Arrays para <select>
 *   {EPOCAS_SAGA.map((era, i) => <option key={era} value={era}>{epocas[i]}</option>)}
 *   // value = clave ES de BD, display = label localizado
 *
 *   // Valores de BD → display
 *   <span>{getEstado(torneo.estado)}</span>           // "In Progress" / "En Curso"
 *   <span>{formatEpocas(torneo.epocas_disponibles)}</span>
 *
 *   // Formulario de inscripción
 *   const tropas = traducirTiposT(config.tiposTropaPersonalizados);
 */
export const useSagaI18n = () => {
    const { i18n, t } = useTranslation();
    const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

    return useMemo(() => ({
        lang,

        // Arrays estables indexados para componentes <select>
        epocas: lang === 'en' ? EPOCAS_SAGA_EN : EPOCAS_SAGA,
        escenarios: lang === 'en' ? TIPOS_PARTIDAS_SAGA_EN : TIPOS_PARTIDA_SAGA,
        rondas: lang === 'en' ? RONDAS_DISPONIBLES_EN : RONDAS_DISPONIBLES,

        // Traducción vía diccionario common.json
        getEstado: (valor) => t(`estado.${valor}`, { defaultValue: valor }),

        // Resolutores directos de Base de Datos -> UI Localizada
        getEpoca:       (v)  => getEpocaLabel(v, lang),
        getEscenario:   (v)  => getEscenarioLabel(v, lang),
        getTropa:       (id) => getTroopLabel(id, lang),
        getWarlordType: (v)  => getWarlordTypeLabel(v, lang),

        // Helpers de transformación estructural bajo demanda
        traducirTiposT:   (arr) => traducirTiposTropa(arr, lang),
        traducirOpciones: (arr) => traducirOpcionesBanda(arr, lang),
        formatEpocas:     (str) => formatearEpocas(str, lang),
        getBanda: (nombre) => getBandaLabel(nombre, lang),
        
        // 🌟 NUEVO: Inyección de traducción en configuraciones dinámicas de la banda
        traducirOpcionesLegendarias: (configLegendaria) => {
            if (!configLegendaria) return null;
            return {
                ...configLegendaria,
                label: lang === 'en' ? 'Legendary Warlord' : 'Warlord Legendario',
                opciones: configLegendaria.opciones.map(o => {
                    const esPunto = o.costePuntos === 1;
                    const sufijo = lang === 'en' 
                        ? `(${o.costePuntos} ${esPunto ? 'point' : 'points'})`
                        : `(${o.costePuntos} ${esPunto ? 'punto' : 'puntos'})`;
                        
                    return {
                        ...o,
                        // Traduce los nombres largos autogenerados manteniendo el coste visualizado
                        nombreCompleto: o.costePuntos > 0 ? `${o.nombre} ${sufijo}` : o.nombre,
                        unidadesEspecialesDesbloqueadas: (o.unidadesEspecialesDesbloqueadas || []).map(u => ({
                            ...u,
                            label: lang === 'en' && u.valor === 'batallon_sagrado' 
                                ? 'Sacred Band (you must select the two points)' 
                                : u.label
                        }))
                    };
                })
            };
        }
    }), [lang, t]);
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES DE DATOS (sin cambios respecto al original)
// ═══════════════════════════════════════════════════════════════════════════

export const obtenerBandasDisponibles = (epocaTorneo) => {
    if (!epocaTorneo) {
        console.warn('⚠️ obtenerBandasDisponibles: época vacía');
        return [];
    }
    if (epocaTorneo.includes('/')) {
        const epocas = epocaTorneo.split('/').map(e => e.trim());
        const bandasCombinadas = [];
        epocas.forEach(epoca => bandasCombinadas.push(...(BANDAS_POR_EPOCA[epoca] || [])));
        return bandasCombinadas.filter((banda, index, self) =>
            index === self.findIndex(b => b.nombre === banda.nombre)
        );
    }
    const bandas = BANDAS_POR_EPOCA[epocaTorneo] || [];
    if (bandas.length === 0) console.warn(`⚠️ No se encontraron bandas para la época: "${epocaTorneo}"`);
    return bandas;
};

export const obtenerConfiguracionBanda = (nombreBanda) => {
    if (!nombreBanda) {
        return {
            nombre: '', epoca: '',
            permiteElefantes: false, 
            permiteCarros: false, 
            permiteTambor: false,
            permiteCuraids: false, 
            permitePerros: false, 
            permiteBerserkers: false,
            unidadesEspeciales: [], 
            tiposTropaPermitidos: null,
            opcionesBanda: [], 
            tiposTropaPersonalizados: null,
            restricciones: null,
        };
    }
    for (const epoca in BANDAS_POR_EPOCA) {
        const banda = BANDAS_POR_EPOCA[epoca].find(b => b.nombre === nombreBanda);
        if (banda) {
            return {
                nombre: banda.nombre,
                epoca,
                permiteElefantes: banda.permiteElefantes || false,
                permiteCarros: banda.permiteCarros || false,
                permiteTambor: banda.permiteTambor || false,
                permiteCuraids: banda.permiteCuraids || false,
                permitePerros: banda.permitePerros || false,
                permiteBerserkers: banda.permiteBerserkers || false,
                unidadesEspeciales: banda.unidadesEspeciales || [],
                tiposTropaPermitidos: banda.tiposTropaPermitidos || null,
                opcionesBanda: banda.opcionesBanda || [],
                tiposTropaPersonalizados: banda.tiposTropaPersonalizados || null,
                restricciones: banda.restricciones || null,
            };
        }
    }
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
        tiposTropaPersonalizados: null,
        restricciones: null,
    };
};

export const procesarEpocasYBandas = (epocasDisponibles) => {
    if (!epocasDisponibles) return { epocasArray: [], todasLasBandas: [], mapaBandaAEpoca: {}, mapaBandaAConfig: {} };
    let epocas = [];
    if (epocasDisponibles.includes('|')) epocas = epocasDisponibles.split('|');
    else if (epocasDisponibles.includes(',')) epocas = epocasDisponibles.split(',');
    else epocas = [epocasDisponibles];

    const epocasLimpias = epocas.map(e => e.trim()).filter(e => e.length > 0);
    const mapaBandaAEpoca = {}, mapaBandaAConfig = {};
    let todasLasBandas = [];

    epocasLimpias.forEach(epoca => {
        obtenerBandasDisponibles(epoca).forEach(banda => {
            const config = obtenerConfiguracionBanda(banda.nombre);
            mapaBandaAEpoca[banda.nombre] = epoca;
            mapaBandaAConfig[banda.nombre] = config;
            todasLasBandas.push(config);
        });
    });
    return { epocasArray: epocasLimpias, todasLasBandas, mapaBandaAEpoca, mapaBandaAConfig };
};

export const permiteTipoTropa = (configuracionBanda, tipoTropa) => {
    if (configuracionBanda.tiposTropaPersonalizados) return true;
    // Comprobar lista negra de restricciones de banda
    if (configuracionBanda.restricciones?.prohibido?.includes(tipoTropa)) return false;
    if (!configuracionBanda.tiposTropaPermitidos) return true;
    return configuracionBanda.tiposTropaPermitidos.includes(tipoTropa);
};

export const esEpocaValida = (epoca) => {
    if (!epoca) return false;
    if (epoca.includes('/')) return epoca.split('/').map(e => e.trim()).every(e => BANDAS_POR_EPOCA[e] !== undefined);
    return BANDAS_POR_EPOCA[epoca] !== undefined;
};

export const validarPuntosBanda = (puntos) =>
    puntos >= PUNTOS_BANDA_RANGO.min && puntos <= PUNTOS_BANDA_RANGO.max;

export const validarJugadoresEquipo = (jugadores) =>
    jugadores >= JUGADORES_EQUIPO_RANGO.min && jugadores <= JUGADORES_EQUIPO_RANGO.max;

export const obtenerUnidadesLegendarias = (epoca, nombreBanda) => {
    if (!epoca || !nombreBanda) return null;
    if (epoca.includes('/')) {
        for (const epocaIndividual of epoca.split('/').map(e => e.trim())) {
            const bandas = BANDAS_POR_EPOCA[epocaIndividual];
            if (!bandas) continue;
            const banda = bandas.find(b => b.nombre === nombreBanda);
            if (banda?.unidadesLegendarias) return banda.unidadesLegendarias;
        }
        return null;
    }
    const bandas = BANDAS_POR_EPOCA[epoca];
    if (!bandas) return null; 
    const banda = bandas.find(b => b.nombre === nombreBanda);
    return banda.unidadesLegendarias || null;
};

export const obtenerOpcionesWarlordLegendario = (epoca, nombreBanda) => {
    const unidadesLegendarias = obtenerUnidadesLegendarias(epoca, nombreBanda);
    if (!unidadesLegendarias?.length) return null;
    const configuracion = unidadesLegendarias[0];
    if (!configuracion?.opciones) return null;
    return {
        id: configuracion.id,
        label: configuracion.label,
        tipo: configuracion.tipo,
        obligatorio:configuracion.obligatorio || false,
        opciones: configuracion.opciones.map(opcion => ({
            valor: opcion.valor,
            nombre: opcion.nombre,
            costePuntos:opcion.costeEnPuntos || 0,
            nombreCompleto: opcion.costeEnPuntos > 0
                ? `${opcion.nombre} (${opcion.costeEnPuntos} ${opcion.costeEnPuntos === 1 ? 'punto' : 'puntos'})`
                : opcion.nombre,
            bandaDesbloqueada: opcion.nombreBandaDesbloqueada || null,
            tieneBandaDesbloqueada: !!opcion.nombreBandaDesbloqueada,
            composicionDiferente: !!opcion.composicionBanda,
            restriccionesAdicionales: opcion.restriccionesAdicionales || null,
            tieneRestricciones: !!opcion.restriccionesAdicionales,
            unidadesEspecialesDesbloqueadas: opcion.unidadesEspecialesDesbloqueadas || [],
            restricciones: opcion.restricciones || null,
            opcionesRequeridas: opcion.opcionesRequeridas 
            ? Object.fromEntries(Object.entries(opcion.opcionesRequeridas).map(([k, v]) => [k, v.trim()]))
            : null,
        })),
    };
};

export const validarWarlordLegendario = (epoca, nombreBanda, warlordSeleccionado) => {
    if (!warlordSeleccionado) return { valido: true };
    const opciones = obtenerOpcionesWarlordLegendario(epoca, nombreBanda);
    if (!opciones) return { valido: false, error: 'Esta banda no tiene warlords legendarios disponibles' };
    const opcionValida = opciones.opciones.find(o => o.valor === warlordSeleccionado);
    if (!opcionValida) return { valido: false, error: 'Warlord legendario no válido para esta banda' };
    return {
        valido: true,
        opcion: opcionValida,
        costePuntos: opcionValida.costePuntos,
        bandaDesbloqueada: opcionValida.bandaDesbloqueada,
        restriccionesAdicionales: opcionValida.restriccionesAdicionales,
        unidadesEspecialesDesbloqueadas: opcionValida.unidadesEspecialesDesbloqueadas || [],
    };
};

export const obtenerRestriccionesBanda = (epoca, nombreBanda) => {
    if (!epoca) return null;
    if (epoca.includes('/')) {
        for (const epocaIndividual of epoca.split('/').map(e => e.trim())) {
            const bandas = BANDAS_POR_EPOCA[epocaIndividual];
            if (!bandas) continue;
            const banda = bandas.find(b => b.nombre === nombreBanda);
            if (banda) return banda?.restricciones || null;
        }
        return null;
    }
    const bandas = BANDAS_POR_EPOCA[epoca];
    if (!bandas) return null;
    const banda = bandas.find(b => b.nombre === nombreBanda);
    return banda?.restricciones || null;
};

export const obtenerRestriccionesCombinadas = (epoca, nombreBanda, warlordSeleccionado) => {
    const restriccionesBanda = obtenerRestriccionesBanda(epoca, nombreBanda);
    const restriccionesCombinadas = {
        mutuamenteExcluyentes: restriccionesBanda?.mutuamenteExcluyentes || [],
        prohibido: restriccionesBanda?.prohibido || [],
        mensaje: null,
    };
    if (warlordSeleccionado) {
        const validacion = validarWarlordLegendario(epoca, nombreBanda, warlordSeleccionado);
        if (validacion.valido && validacion.restriccionesAdicionales) {
            const prohibidosWarlord = validacion.restriccionesAdicionales.prohibido || [];
            restriccionesCombinadas.prohibido = [
                ...new Set([...restriccionesCombinadas.prohibido, ...prohibidosWarlord])
            ];
            restriccionesCombinadas.mensaje = validacion.restriccionesAdicionales.mensaje || null;
        }
    }
    return restriccionesCombinadas;
};

export const estaProhibido = (tipoUnidad, restricciones) => {
    if (!restricciones?.prohibido) return false;
    return restricciones.prohibido.includes(tipoUnidad);
};

export const sonMutuamenteExcluyentes = (tipo1, tipo2, restricciones) => {
    if (!restricciones?.mutuamenteExcluyentes) return false;
    return restricciones.mutuamenteExcluyentes.some(par => par.includes(tipo1) && par.includes(tipo2));
};

export const validarComposicionBanda = (composicion, restricciones) => {
    const errores = [];
    if (!composicion || !restricciones) return { valido: true, errores: [] };
    if (restricciones.prohibido?.length > 0) {
        Object.keys(composicion).forEach(tipoUnidad => {
            if (composicion[tipoUnidad] > 0 && restricciones.prohibido.includes(tipoUnidad))
                errores.push(`${tipoUnidad} está prohibido por el warlord seleccionado`);
        });
    }
    if (restricciones.mutuamenteExcluyentes?.length > 0) {
        restricciones.mutuamenteExcluyentes.forEach(([tipo1, tipo2]) => {
            if (composicion[tipo1] > 0 && composicion[tipo2] > 0)
                errores.push(`No puedes tener ${tipo1} y ${tipo2} en la misma banda`);
        });
    }
    return { valido: errores.length === 0, errores };
};

export const obtenerNombreBandaFinal = (epoca, nombreBandaBase, warlordSeleccionado) => {
    if (!warlordSeleccionado) return nombreBandaBase;
    const validacion = validarWarlordLegendario(epoca, nombreBandaBase, warlordSeleccionado);
    return (validacion.valido && validacion.bandaDesbloqueada) ? validacion.bandaDesbloqueada : nombreBandaBase;
};

export const calcularPuntosDisponibles = (puntosBanda, epoca, nombreBanda, warlordSeleccionado) => {
    if (!warlordSeleccionado) return puntosBanda;
    const validacion = validarWarlordLegendario(epoca, nombreBanda, warlordSeleccionado);
    return validacion.valido ? puntosBanda - validacion.costePuntos : puntosBanda;
};

export const obtenerInfoCompletaWarlord = (epoca, nombreBanda, warlordSeleccionado) => {
    if (!warlordSeleccionado) {
        return {
            tieneWarlord: false, nombreBandaFinal: nombreBanda, costePuntos: 0,
            restricciones: obtenerRestriccionesCombinadas(epoca, nombreBanda, null),
            unidadesDesbloqueadas: [],
        };
    }
    const validacion = validarWarlordLegendario(epoca, nombreBanda, warlordSeleccionado);
    if (!validacion.valido) {
        return {
            tieneWarlord: false, error: validacion.error, nombreBandaFinal: nombreBanda, costePuntos: 0,
            restricciones: obtenerRestriccionesCombinadas(epoca, nombreBanda, null),
            unidadesDesbloqueadas: [],
        };
    }
    return {
        tieneWarlord: true,
        nombreWarlord: validacion.opcion.nombre,
        nombreBandaFinal: validacion.bandaDesbloqueada || nombreBanda,
        costePuntos: validacion.costePuntos,
        tieneBandaDesbloqueada:!!validacion.bandaDesbloqueada,
        restricciones: obtenerRestriccionesCombinadas(epoca, nombreBanda, warlordSeleccionado),
        unidadesDesbloqueadas: validacion.unidadesEspecialesDesbloqueadas || [],
    };
};

export const tieneWarlordLegendario = (epoca, nombreBanda) => {
    const unidades = obtenerUnidadesLegendarias(epoca, nombreBanda);
    return unidades !== null && unidades.length > 0;
};