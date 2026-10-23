// paises.js
// Países por código ISO 3166-1 alfa-2 (ES, FR, GB...).
// En la base de datos se guarda solo el código; el nombre se genera en el idioma
// de la web con Intl.DisplayNames, así sale "Francia" en español y "France" en inglés.
// Sirve igual en el backend (utilsRanking/) y en el frontend (src/funciones/).

export const CODIGOS_PAISES = [
  'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ',
  'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS',
  'BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN',
  'CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE',
  'EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF',
  'GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM',
  'HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM',
  'JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC',
  'LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK',
  'ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA',
  'NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG',
  'PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW',
  'SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS',
  'ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO',
  'TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI',
  'VN','VU','WF','WS','YE','YT','ZA','ZM','ZW',
];

/**
 * Países que se ofrecen en los formularios de registro y perfil
 * (el resto se puede añadir aquí cuando haga falta).
 */
export const PAISES_FORMULARIO = [
  'ES', 'PT', 'FR', 'IT', 'DE', 'GB', 'NL', 'BE', 'CH', 'AT',
  'US', 'CA', 'MX', 'AR', 'BR',
];

/** ¿Es un código de país válido? */
export function esPaisValido(codigo) {
  return CODIGOS_PAISES.includes(String(codigo || '').toUpperCase());
}

/** Emoji de bandera a partir del código (ES → 🇪🇸) */
export function banderaPais(codigo) {
  if (!esPaisValido(codigo)) return '';
  return String(codigo)
    .toUpperCase()
    .split('')
    .map(letra => String.fromCodePoint(127397 + letra.charCodeAt(0)))
    .join('');
}

/** Nombre del país en el idioma indicado ('es', 'en'...) */
export function nombrePais(codigo, idioma = 'es') {
  if (!esPaisValido(codigo)) return codigo || '';
  try {
    return new Intl.DisplayNames([idioma], { type: 'region' }).of(String(codigo).toUpperCase());
  } catch {
    return String(codigo).toUpperCase();
  }
}

/**
 * Convierte lo que venga (código o nombre) a código ISO:
 *   'ES' → 'ES' | 'es' → 'ES' | 'España' → 'ES' | 'españa' → 'ES' | 'Spain' → 'ES'
 * Sirve para datos antiguos guardados como nombre. Devuelve null si no lo reconoce.
 */
export function normalizarPais(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();

  if (esPaisValido(texto)) return texto.toUpperCase();

  const buscado = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita tildes: "españa" → "espana"

  for (const idioma of ['es', 'en']) {
    for (const codigo of CODIGOS_PAISES) {
      const nombre = nombrePais(codigo, idioma)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (nombre === buscado) return codigo;
    }
  }

  // Variantes mal escritas de España ("españ", "espa")
  if (/^espa/.test(buscado)) return 'ES';

  return null;
}

/**
 * Lista para un <select>: [{ codigo, nombre, bandera }], ordenada por nombre.
 * Si se pasan códigos, solo devuelve esos (p. ej. los países que tienen jugadores).
 */
export function listaPaises(idioma = 'es', codigos = CODIGOS_PAISES) {
  return codigos
    .filter(esPaisValido)
    .map(c => {
      const codigo = String(c).toUpperCase();
      return { codigo, nombre: nombrePais(codigo, idioma), bandera: banderaPais(codigo) };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, idioma));
}