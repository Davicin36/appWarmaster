// provinciasES.js
// Provincias de España según los 2 primeros dígitos del código postal,
// agrupadas por comunidad autónoma.
// Sirve igual en el backend (utilsRanking/) y en el frontend (src/funciones/).

export const COMUNIDADES = {
  andalucia:          'Andalucía',
  aragon:             'Aragón',
  asturias:           'Asturias',
  baleares:           'Illes Balears',
  canarias:           'Canarias',
  cantabria:          'Cantabria',
  castilla_la_mancha: 'Castilla-La Mancha',
  castilla_y_leon:    'Castilla y León',
  cataluna:           'Cataluña',
  ceuta:              'Ceuta',
  valenciana:         'Comunitat Valenciana',
  extremadura:        'Extremadura',
  galicia:            'Galicia',
  madrid:             'Comunidad de Madrid',
  melilla:            'Melilla',
  murcia:             'Región de Murcia',
  navarra:            'Navarra',
  pais_vasco:         'País Vasco',
  la_rioja:           'La Rioja',
};

// Clave = 2 primeros dígitos del código postal
export const PROVINCIAS = {
  '01': { nombre: 'Álava',                  comunidad: 'pais_vasco' },
  '02': { nombre: 'Albacete',               comunidad: 'castilla_la_mancha' },
  '03': { nombre: 'Alicante',               comunidad: 'valenciana' },
  '04': { nombre: 'Almería',                comunidad: 'andalucia' },
  '05': { nombre: 'Ávila',                  comunidad: 'castilla_y_leon' },
  '06': { nombre: 'Badajoz',                comunidad: 'extremadura' },
  '07': { nombre: 'Illes Balears',          comunidad: 'baleares' },
  '08': { nombre: 'Barcelona',              comunidad: 'cataluna' },
  '09': { nombre: 'Burgos',                 comunidad: 'castilla_y_leon' },
  '10': { nombre: 'Cáceres',                comunidad: 'extremadura' },
  '11': { nombre: 'Cádiz',                  comunidad: 'andalucia' },
  '12': { nombre: 'Castellón',              comunidad: 'valenciana' },
  '13': { nombre: 'Ciudad Real',            comunidad: 'castilla_la_mancha' },
  '14': { nombre: 'Córdoba',                comunidad: 'andalucia' },
  '15': { nombre: 'A Coruña',               comunidad: 'galicia' },
  '16': { nombre: 'Cuenca',                 comunidad: 'castilla_la_mancha' },
  '17': { nombre: 'Girona',                 comunidad: 'cataluna' },
  '18': { nombre: 'Granada',                comunidad: 'andalucia' },
  '19': { nombre: 'Guadalajara',            comunidad: 'castilla_la_mancha' },
  '20': { nombre: 'Gipuzkoa',               comunidad: 'pais_vasco' },
  '21': { nombre: 'Huelva',                 comunidad: 'andalucia' },
  '22': { nombre: 'Huesca',                 comunidad: 'aragon' },
  '23': { nombre: 'Jaén',                   comunidad: 'andalucia' },
  '24': { nombre: 'León',                   comunidad: 'castilla_y_leon' },
  '25': { nombre: 'Lleida',                 comunidad: 'cataluna' },
  '26': { nombre: 'La Rioja',               comunidad: 'la_rioja' },
  '27': { nombre: 'Lugo',                   comunidad: 'galicia' },
  '28': { nombre: 'Madrid',                 comunidad: 'madrid' },
  '29': { nombre: 'Málaga',                 comunidad: 'andalucia' },
  '30': { nombre: 'Murcia',                 comunidad: 'murcia' },
  '31': { nombre: 'Navarra',                comunidad: 'navarra' },
  '32': { nombre: 'Ourense',                comunidad: 'galicia' },
  '33': { nombre: 'Asturias',               comunidad: 'asturias' },
  '34': { nombre: 'Palencia',               comunidad: 'castilla_y_leon' },
  '35': { nombre: 'Las Palmas',             comunidad: 'canarias' },
  '36': { nombre: 'Pontevedra',             comunidad: 'galicia' },
  '37': { nombre: 'Salamanca',              comunidad: 'castilla_y_leon' },
  '38': { nombre: 'Santa Cruz de Tenerife', comunidad: 'canarias' },
  '39': { nombre: 'Cantabria',              comunidad: 'cantabria' },
  '40': { nombre: 'Segovia',                comunidad: 'castilla_y_leon' },
  '41': { nombre: 'Sevilla',                comunidad: 'andalucia' },
  '42': { nombre: 'Soria',                  comunidad: 'castilla_y_leon' },
  '43': { nombre: 'Tarragona',              comunidad: 'cataluna' },
  '44': { nombre: 'Teruel',                 comunidad: 'aragon' },
  '45': { nombre: 'Toledo',                 comunidad: 'castilla_la_mancha' },
  '46': { nombre: 'Valencia',               comunidad: 'valenciana' },
  '47': { nombre: 'Valladolid',             comunidad: 'castilla_y_leon' },
  '48': { nombre: 'Bizkaia',                comunidad: 'pais_vasco' },
  '49': { nombre: 'Zamora',                 comunidad: 'castilla_y_leon' },
  '50': { nombre: 'Zaragoza',               comunidad: 'aragon' },
  '51': { nombre: 'Ceuta',                  comunidad: 'ceuta' },
  '52': { nombre: 'Melilla',                comunidad: 'melilla' },
};

/** ¿Es un código postal español válido? (5 dígitos, provincia 01–52) */
export function validarCodigoPostal(cp) {
  return /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(String(cp || '').trim());
}

/** Provincia a partir del código postal: { codigo, nombre, comunidad } o null */
export function provinciaDeCP(cp) {
  if (!validarCodigoPostal(cp)) return null;
  const codigo = String(cp).trim().slice(0, 2);
  return { codigo, ...PROVINCIAS[codigo] };
}

/** Códigos de provincia (prefijos de CP) de una comunidad */
export function provinciasDeComunidad(comunidad) {
  return Object.entries(PROVINCIAS)
    .filter(([, p]) => p.comunidad === comunidad)
    .map(([codigo]) => codigo);
}

/** Lista de provincias para un <select>, opcionalmente filtrada por comunidad */
export function listaProvincias(comunidad = null) {
  return Object.entries(PROVINCIAS)
    .filter(([, p]) => !comunidad || p.comunidad === comunidad)
    .map(([codigo, p]) => ({ codigo, nombre: p.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Lista de comunidades para un <select> */
export function listaComunidades() {
  return Object.entries(COMUNIDADES)
    .map(([clave, nombre]) => ({ clave, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}