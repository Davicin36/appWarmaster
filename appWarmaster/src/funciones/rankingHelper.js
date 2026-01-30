// utils/eloHelpers.js

/**
 * Obtiene la información de categoría según el ELO
 */
export const obtenerCategoria = (elo) => {
  if (elo >= 2400) return { 
    nombre: 'Gran Maestro', 
    clase: 'gran-maestro',
    color: '#FFD700',
    icono: '👑'
  };
  if (elo >= 2200) return { 
    nombre: 'Maestro', 
    clase: 'maestro',
    color: '#C0C0C0',
    icono: '🥇'
  };
  if (elo >= 2000) return { 
    nombre: 'Experto', 
    clase: 'experto',
    color: '#CD7F32',
    icono: '🥈'
  };
  if (elo >= 1800) return { 
    nombre: 'Avanzado', 
    clase: 'avanzado',
    color: '#3498db',
    icono: '🥉'
  };
  if (elo >= 1600) return { 
    nombre: 'Intermedio', 
    clase: 'intermedio',
    color: '#2ecc71',
    icono: '⭐'
  };
  if (elo >= 1400) return { 
    nombre: 'Principiante', 
    clase: 'principiante',
    color: '#95a5a6',
    icono: '📚'
  };
  return { 
    nombre: 'Novato', 
    clase: 'novato',
    color: '#7f8c8d',
    icono: '🌱'
  };
};

/**
 * Formatea el nombre del sistema de juego
 */
export const formatearSistemaJuego = (sistema) => {
  const nombres = {
    'saga': 'SAGA',
    'warmaster': 'Warmaster',
    'fow': 'Flames of War',
    'bolt_action': 'Bolt Action'
  };
  return nombres[sistema.toLowerCase()] || sistema.toUpperCase();
};

/**
 * Obtiene el color para el cambio de ELO
 */
export const obtenerColorCambio = (cambio) => {
  if (cambio > 0) return '#2ecc71'; // Verde
  if (cambio < 0) return '#e74c3c'; // Rojo
  return '#95a5a6'; // Gris
};

/**
 * Obtiene el icono para el resultado
 */
export const obtenerIconoResultado = (resultado) => {
  const iconos = {
    'victoria': '✅',
    'derrota': '❌',
    'empate': '🤝'
  };
  return iconos[resultado] || '❓';
};

/**
 * Formatea la fecha
 */
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Obtiene la medalla según la posición
 */
export const obtenerMedalla = (posicion) => {
  if (posicion === 1) return '🥇';
  if (posicion === 2) return '🥈';
  if (posicion === 3) return '🥉';
  return posicion;
};

/**
 * Calcula el porcentaje de victorias
 */
export const calcularPorcentajeVictorias = (victorias, totalPartidas) => {
  if (totalPartidas === 0) return 0;
  return ((victorias / totalPartidas) * 100).toFixed(1);
};