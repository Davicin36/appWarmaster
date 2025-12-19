// Función para validar código postal según país
const validarCodigoPostal = (codigo_postal, pais)=> {
  if (!codigo_postal || !pais) {
    return {
      valido: false,
      mensaje: 'Código postal y país son requeridos'
    };
  }

  const codigoStr = String(codigo_postal).trim();

  // Patrones de código postal por país
  const patronesPorPais = {
    // España: 5 dígitos (01000-52999)
    'España': {
      patron: /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/,
      ejemplo: '28001, 08001, 41001'
    },
    'ES': {
      patron: /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/,
      ejemplo: '28001, 08001, 41001'
    },

    // Francia: 5 dígitos
    'Francia': {
      patron: /^[0-9]{5}$/,
      ejemplo: '75001, 69001'
    },
    'FR': {
      patron: /^[0-9]{5}$/,
      ejemplo: '75001, 69001'
    },

    // Reino Unido: Formato complejo
    'Reino Unido': {
      patron: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
      ejemplo: 'SW1A 1AA, EC1A 1BB'
    },
    'UK': {
      patron: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
      ejemplo: 'SW1A 1AA, EC1A 1BB'
    },
    'GB': {
      patron: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
      ejemplo: 'SW1A 1AA, EC1A 1BB'
    },

    // Alemania: 5 dígitos
    'Alemania': {
      patron: /^[0-9]{5}$/,
      ejemplo: '10115, 80331'
    },
    'DE': {
      patron: /^[0-9]{5}$/,
      ejemplo: '10115, 80331'
    },

    // Italia: 5 dígitos
    'Italia': {
      patron: /^[0-9]{5}$/,
      ejemplo: '00118, 20121'
    },
    'IT': {
      patron: /^[0-9]{5}$/,
      ejemplo: '00118, 20121'
    },

    // Portugal: 4 dígitos + guión + 3 dígitos
    'Portugal': {
      patron: /^[0-9]{4}-[0-9]{3}$/,
      ejemplo: '1000-001, 4000-007'
    },
    'PT': {
      patron: /^[0-9]{4}-[0-9]{3}$/,
      ejemplo: '1000-001, 4000-007'
    },

    // Estados Unidos: 5 dígitos o 5+4
    'Estados Unidos': {
      patron: /^[0-9]{5}(-[0-9]{4})?$/,
      ejemplo: '10001, 90210-1234'
    },
    'USA': {
      patron: /^[0-9]{5}(-[0-9]{4})?$/,
      ejemplo: '10001, 90210-1234'
    },
    'US': {
      patron: /^[0-9]{5}(-[0-9]{4})?$/,
      ejemplo: '10001, 90210-1234'
    },

    // Canadá: Formato A1A 1A1
    'Canadá': {
      patron: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i,
      ejemplo: 'K1A 0B1, M5W 1E6'
    },
    'CA': {
      patron: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i,
      ejemplo: 'K1A 0B1, M5W 1E6'
    },

    // México: 5 dígitos
    'México': {
      patron: /^[0-9]{5}$/,
      ejemplo: '01000, 64000'
    },
    'MX': {
      patron: /^[0-9]{5}$/,
      ejemplo: '01000, 64000'
    },

    // Argentina: 4 dígitos o formato A####AAA
    'Argentina': {
      patron: /^([0-9]{4}|[A-Z][0-9]{4}[A-Z]{3})$/i,
      ejemplo: '1000, C1425BAA'
    },
    'AR': {
      patron: /^([0-9]{4}|[A-Z][0-9]{4}[A-Z]{3})$/i,
      ejemplo: '1000, C1425BAA'
    },

    // Brasil: 8 dígitos con guión opcional
    'Brasil': {
      patron: /^[0-9]{5}-?[0-9]{3}$/,
      ejemplo: '01310-100, 01310100'
    },
    'BR': {
      patron: /^[0-9]{5}-?[0-9]{3}$/,
      ejemplo: '01310-100, 01310100'
    },

    // Chile: 7 dígitos
    'Chile': {
      patron: /^[0-9]{7}$/,
      ejemplo: '8320000'
    },
    'CL': {
      patron: /^[0-9]{7}$/,
      ejemplo: '8320000'
    },

    // Países Bajos: 4 dígitos + espacio + 2 letras
    'Países Bajos': {
      patron: /^[0-9]{4}\s?[A-Z]{2}$/i,
      ejemplo: '1012 AB, 1012AB'
    },
    'NL': {
      patron: /^[0-9]{4}\s?[A-Z]{2}$/i,
      ejemplo: '1012 AB, 1012AB'
    },

    // Bélgica: 4 dígitos
    'Bélgica': {
      patron: /^[0-9]{4}$/,
      ejemplo: '1000, 9000'
    },
    'BE': {
      patron: /^[0-9]{4}$/,
      ejemplo: '1000, 9000'
    },

    // Suiza: 4 dígitos
    'Suiza': {
      patron: /^[0-9]{4}$/,
      ejemplo: '8001, 1200'
    },
    'CH': {
      patron: /^[0-9]{4}$/,
      ejemplo: '8001, 1200'
    },

    // Austria: 4 dígitos
    'Austria': {
      patron: /^[0-9]{4}$/,
      ejemplo: '1010, 5020'
    },
    'AT': {
      patron: /^[0-9]{4}$/,
      ejemplo: '1010, 5020'
    }
  };

  // Buscar patrón para el país
  const configuracion = patronesPorPais[pais];

  if (!configuracion) {
    // País no soportado - validación genérica
    if (codigoStr.length < 3 || codigoStr.length > 10) {
      return {
        valido: false,
        mensaje: 'El código postal debe tener entre 3 y 10 caracteres'
      };
    }
    return { valido: true }; // Aceptar si el país no está en la lista
  }

  // Validar contra el patrón específico del país
  if (!configuracion.patron.test(codigoStr)) {
    return {
      valido: false,
      mensaje: `Código postal inválido para ${pais}. Ejemplos válidos: ${configuracion.ejemplo}`
    };
  }

  return { valido: true };
}

module.exports = {
    validarCodigoPostal
  }