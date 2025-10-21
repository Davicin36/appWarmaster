// utils/helpers.js

// Función para calcular el resultado de una partida
const calcularResultado = (puntosJ1, puntosJ2) => {
  if (puntosJ1 > puntosJ2) return 'victoria_j1';
  if (puntosJ2 > puntosJ1) return 'victoria_j2';
  return 'empate';
};

// Función para calcular puntos de torneo basado en el resultado
const calcularPuntosTorneo = (resultado, jugador) => {
  if (resultado === 'empate') return 1;
  if (
    (resultado === 'victoria_j1' && jugador === 1) ||
    (resultado === 'victoria_j2' && jugador === 2)
  ) {
    return 3; // Victoria
  }
  return 0; // Derrota
};

// Función para validar email
const validarEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar que una fecha no sea en el pasado
const validarFecha = (fecha) => {
  const fechaInput = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
  return fechaInput >= hoy;
};

// Función para formatear respuesta de error
const errorResponse = (message, details = null) => {
  const response = { error: message };
  if (details) response.details = details;
  return response;
};

// Función para formatear respuesta de éxito
const successResponse = (message, data = null) => {
  const response = { mensaje: message };
  if (data) response.data = data;
  return response;
};

// Función para validar campos requeridos
const validarCamposRequeridos = (objeto, camposRequeridos) => {
  const camposFaltantes = [];
  
  camposRequeridos.forEach(campo => {
    if (!objeto[campo] || objeto[campo].toString().trim() === '') {
      camposFaltantes.push(campo);
    }
  });
  
  return camposFaltantes;
};

// Función para limpiar objeto de campos undefined/null
const limpiarObjeto = (objeto) => {
  const objetoLimpio = {};
  Object.keys(objeto).forEach(key => {
    if (objeto[key] !== undefined && objeto[key] !== null) {
      objetoLimpio[key] = objeto[key];
    }
  });
  return objetoLimpio;
};

// Función para generar slug único
const generarSlug = (texto) => {
  return texto
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover múltiples guiones
    .trim('-'); // Remover guiones al inicio/final
};

// Función para manejar errores de base de datos
const manejarErrorDB = (error) => {
  console.error('Error de base de datos:', error);
  
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return 'Ya existe un registro con esos datos.';
    case 'ER_NO_REFERENCED_ROW_2':
      return 'Referencia a datos que no existen.';
    case 'ER_ROW_IS_REFERENCED_2':
      return 'No se puede eliminar porque está siendo usado por otros registros.';
    case 'ER_DATA_TOO_LONG':
      return 'Uno de los campos es demasiado largo.';
    case 'ER_BAD_NULL_ERROR':
      return 'Campo requerido no puede estar vacío.';
    default:
      return 'Error interno del servidor.';
  }
};

// Función para paginar resultados
const paginar = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

module.exports = {
  calcularResultado,
  calcularPuntosTorneo,
  validarEmail,
  validarFecha,
  errorResponse,
  successResponse,
  validarCamposRequeridos,
  limpiarObjeto,
  generarSlug,
  manejarErrorDB,
  paginar
};