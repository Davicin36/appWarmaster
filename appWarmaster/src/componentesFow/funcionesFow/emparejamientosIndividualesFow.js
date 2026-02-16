import torneosFowApi from '@/servicios/apiFow';

// ==========================================
// EMPAREJAMIENTOS RONDA 1 - ALEATORIOS
// ==========================================

/**
 * Genera emparejamientos aleatorios para la primera ronda
 * PRIORIZA: Eje vs Aliados, evita mismo club
 */
const generarEmparejamientosIniciales = async (torneoId) => {
  try {
    const dataJugadores = await torneosFowApi.obtenerJugadoresTorneo(torneoId);
    const jugadores = Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || [];

    if (jugadores.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para generar emparejamientos');
    }

    console.log('📊 Total jugadores:', jugadores.length);

    // 🎯 PASO 1: Separar por bandos
    const eje = jugadores.filter(j => j.bando === 'Eje');
    const aliados = jugadores.filter(j => j.bando === 'Aliados');

    console.log(`🔴 Eje: ${eje.length} | 🔵 Aliados: ${aliados.length}`);

    // Mezclar aleatoriamente cada bando
    const ejeAleatorio = [...eje].sort(() => Math.random() - 0.5);
    const aliadosAleatorio = [...aliados].sort(() => Math.random() - 0.5);

    const emparejamientos = [];
    const emparejados = new Set();

    // 🎯 PASO 2: Emparejar Eje vs Aliados (evitando mismo club)
    let indexEje = 0;
    let indexAliados = 0;

    while (indexEje < ejeAleatorio.length && indexAliados < aliadosAleatorio.length) {
      const jugEje = ejeAleatorio[indexEje];
      let jugAliado = null;

      // Buscar un Aliado que NO sea del mismo club
      for (let i = indexAliados; i < aliadosAleatorio.length; i++) {
        const candidato = aliadosAleatorio[i];
        
        if (emparejados.has(candidato.jugador_id)) {
          continue;
        }

        // ✅ Evitar mismo club
        if (jugEje.club && candidato.club && jugEje.club === candidato.club) {
          continue;
        }

        jugAliado = candidato;
        indexAliados = i + 1;
        break;
      }

      // Si no encontró aliado sin mismo club, tomar el primero disponible
      if (!jugAliado) {
        for (let i = indexAliados; i < aliadosAleatorio.length; i++) {
          if (!emparejados.has(aliadosAleatorio[i].jugador_id)) {
            jugAliado = aliadosAleatorio[i];
            indexAliados = i + 1;
            console.warn(`⚠️ Mismo club forzado: ${jugEje.jugador_nombre} (${jugEje.club}) vs ${jugAliado.jugador_nombre} (${jugAliado.club})`);
            break;
          }
        }
      }

      if (jugAliado) {
        emparejamientos.push(crearEmparejamiento(jugEje, jugAliado, emparejamientos.length + 1, 1));
        emparejados.add(jugEje.jugador_id);
        emparejados.add(jugAliado.jugador_id);
      }

      indexEje++;
    }

    // 🎯 PASO 3: Emparejar sobrantes del mismo bando
    const sobrantes = jugadores.filter(j => !emparejados.has(j.jugador_id));

    for (let i = 0; i < sobrantes.length - 1; i += 2) {
      const jug1 = sobrantes[i];
      const jug2 = sobrantes[i + 1];

      if (jug1.club && jug2.club && jug1.club === jug2.club) {
        console.warn(`⚠️ Mismo bando Y mismo club: ${jug1.jugador_nombre} vs ${jug2.jugador_nombre} (${jug1.club})`);
      }

      emparejamientos.push(crearEmparejamiento(jug1, jug2, emparejamientos.length + 1, 1));
      emparejados.add(jug1.jugador_id);
      emparejados.add(jug2.jugador_id);
    }

    // 🎯 PASO 4: Asignar BYE si quedó alguien sin emparejar
    const sinEmparejar = jugadores.filter(j => !emparejados.has(j.jugador_id));

    if (sinEmparejar.length === 1) {
      const jugBye = sinEmparejar[0];
      emparejamientos.push(crearEmparejamientoBye(jugBye, emparejamientos.length + 1, 1));
    }

    console.log(`✅ Emparejamientos R1: ${emparejamientos.length}`);
    return emparejamientos;

  } catch (error) {
    console.error('❌ Error al generar emparejamientos iniciales:', error);
    throw error;
  }
};

// ==========================================
// EMPAREJAMIENTOS SISTEMA SUIZO (R2+)
// ==========================================

/**
 * Genera emparejamientos para rondas 2 en adelante
 * PRIORIZA: Mismo puntaje, bandos diferentes, sin rematches
 */
export const generarEmparejamientosIndividuales = async (torneoId, ronda) => {
  try {
    if (!ronda || ronda < 1) {
      throw new Error('Número de ronda no válido');
    }

    // Primera ronda = aleatorio
    if (ronda === 1) {
      return await generarEmparejamientosIniciales(torneoId);
    }

    // 🎯 Obtener clasificación y jugadores
    const responseClasificacion = await torneosFowApi.obtenerClasificacionIndividual(torneoId);
    const clasificacionData = responseClasificacion?.data || responseClasificacion || [];

    if (!Array.isArray(clasificacionData) || clasificacionData.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para realizar emparejamientos');
    }

    // Obtener datos completos de jugadores (con bando)
    const dataJugadores = await torneosFowApi.obtenerJugadoresTorneo(torneoId);
    const jugadoresCompletos = Array.isArray(dataJugadores) ? dataJugadores : dataJugadores.data || [];

    // Combinar clasificación + datos de jugadores
    const clasificacion = clasificacionData.map(c => {
      const jugador = jugadoresCompletos.find(j => j.jugador_id === c.jugador_id);
      return {
        ...c,
        bando: jugador?.bando || null,
        club: jugador?.club || null,
        ejercito: jugador?.ejercito || null,
        nombre_ejercito: jugador?.nombre_ejercito || null,
        // Normalizar campos de puntos
        puntos_victoria: c.puntos_victoria_totales || c.puntos_victoria || 0,
        puntos_torneo: c.puntos_torneo_totales || c.puntos_torneo || 0
      };
    });

    // 🎯 Obtener historial
    const { historialSet, jugadoresConBye } = await obtenerHistorial(torneoId);

    // 🎯 Ordenar por puntos (Victoria primero, luego Torneo)
    const jugadoresOrdenados = [...clasificacion].sort((a, b) => {
      if (b.puntos_victoria !== a.puntos_victoria) {
        return b.puntos_victoria - a.puntos_victoria;
      }
      return b.puntos_torneo - a.puntos_torneo;
    });

    const emparejamientos = [];
    const emparejados = new Set();

    // 🎯 PASO 1: Asignar BYE si hay número impar
    if (jugadoresOrdenados.length % 2 !== 0) {
      const jugadorBye = asignarBye(jugadoresOrdenados, jugadoresConBye);
      emparejamientos.push(crearEmparejamientoBye(jugadorBye, 0, ronda));
      emparejados.add(jugadorBye.jugador_id);
    }

    // 🎯 PASO 2: Emparejar resto con sistema suizo + bandos
    for (let i = 0; i < jugadoresOrdenados.length; i++) {
      const jugador1 = jugadoresOrdenados[i];

      if (emparejados.has(jugador1.jugador_id)) {
        continue;
      }

      const jugador2 = buscarMejorRival(
        jugador1,
        jugadoresOrdenados,
        emparejados,
        historialSet,
        i
      );

      if (jugador2) {
        emparejamientos.push(
          crearEmparejamiento(jugador1, jugador2, emparejamientos.length + 1, ronda)
        );
        emparejados.add(jugador1.jugador_id);
        emparejados.add(jugador2.jugador_id);
      } else {
        console.error(`🚨 ${jugador1.jugador_nombre} quedó sin rival`);
      }
    }

    // Asignar número de mesa
    emparejamientos.forEach((emp, index) => {
      emp.mesa = index + 1;
    });

    console.log(`✅ Emparejamientos R${ronda}: ${emparejamientos.length}`);
    return emparejamientos;

  } catch (error) {
    console.error('❌ Error al generar emparejamientos suizos:', error);
    return [];
  }
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Busca el mejor rival según: mismo puntaje > bando diferente > sin rematch
 */
const buscarMejorRival = (jugador1, jugadoresOrdenados, emparejados, historialSet, startIndex) => {
  let mejorRival = null;
  let prioridad = -1; // 0=rematch, 1=mismo bando, 2=bando diferente

  for (let j = startIndex + 1; j < jugadoresOrdenados.length; j++) {
    const candidato = jugadoresOrdenados[j];

    if (emparejados.has(candidato.jugador_id)) {
      continue;
    }

    const esRematch = historialSet.has(`${jugador1.jugador_id}-${candidato.jugador_id}`) ||
                      historialSet.has(`${candidato.jugador_id}-${jugador1.jugador_id}`);

    const bandoDiferente = jugador1.bando && candidato.bando && jugador1.bando !== candidato.bando;

    let prioridadCandidato = 0;

    if (!esRematch) {
      if (bandoDiferente) {
        prioridadCandidato = 3; // ✅ MEJOR: Sin rematch + bando diferente
      } else {
        prioridadCandidato = 2; // ⚠️ Sin rematch + mismo bando
      }
    } else {
      prioridadCandidato = 1; // 🚨 Rematch (último recurso)
    }

    if (prioridadCandidato > prioridad) {
      prioridad = prioridadCandidato;
      mejorRival = candidato;
    }

    // Si encontramos rival perfecto (sin rematch + bando diferente), parar búsqueda
    if (prioridad === 3) {
      break;
    }
  }

  if (prioridad === 1) {
    console.warn(`⚠️ REMATCH FORZADO: ${jugador1.jugador_nombre} vs ${mejorRival.jugador_nombre}`);
  }

  return mejorRival;
};

/**
 * Asigna BYE al jugador con menos puntos sin BYE previo
 */
const asignarBye = (jugadoresOrdenados, jugadoresConBye) => {
  // Filtrar jugadores sin BYE previo
  const sinBye = jugadoresOrdenados.filter(j => !jugadoresConBye.has(j.jugador_id));

  if (sinBye.length > 0) {
    // Ordenar por MENOS puntos
    const porMenosPuntos = [...sinBye].sort((a, b) => {
      if (a.puntos_victoria !== b.puntos_victoria) {
        return a.puntos_victoria - b.puntos_victoria;
      }
      return a.puntos_torneo - b.puntos_torneo;
    });
    return porMenosPuntos[0];
  }

  // Si todos ya tuvieron BYE, asignar al de menos puntos
  console.warn('⚠️ Todos ya tuvieron BYE. Asignando segundo BYE.');
  const porMenosPuntos = [...jugadoresOrdenados].sort((a, b) => {
    if (a.puntos_victoria !== b.puntos_victoria) {
      return a.puntos_victoria - b.puntos_victoria;
    }
    return a.puntos_torneo - b.puntos_torneo;
  });
  return porMenosPuntos[0];
};

/**
 * Obtiene historial de partidas y BYEs
 */
const obtenerHistorial = async (torneoId) => {
  let historialSet = new Set();
  let jugadoresConBye = new Set();

  try {
    const historial = await torneosFowApi.obtenerPartidasTorneo(torneoId);
    const historialArray = Array.isArray(historial) ? historial : [];

    // Construir set de enfrentamientos
    historialSet = new Set(
      historialArray.flatMap(e => [
        `${e.jugador1_usuario_id}-${e.jugador2_usuario_id}`,
        `${e.jugador2_usuario_id}-${e.jugador1_usuario_id}`
      ])
    );

    // Identificar jugadores con BYE
    historialArray.forEach(p => {
      if (p.jugador2_id === null || p.es_bye === 1 || p.es_bye === true) {
        jugadoresConBye.add(p.jugador1_usuario_id);
      }
    });

  } catch (error) {
    console.warn('⚠️ No se pudo obtener historial:', error.message);
  }

  return { historialSet, jugadoresConBye };
};

/**
 * Crea objeto de emparejamiento normal
 */
const crearEmparejamiento = (jug1, jug2, mesa, ronda) => ({
  mesa,
  ronda,
  jugador1_id: jug1.jugador_id,
  jugador2_id: jug2.jugador_id,
  es_bye: 0,
  jugador1: {
    id: jug1.id || jug1.jugador_id,
    jugador_id: jug1.jugador_id,
    nombre: jug1.jugador_nombre || jug1.nombre,
    jugador_nombre: jug1.jugador_nombre || jug1.nombre,
    apellidos: jug1.jugador_apellidos || jug1.apellidos || '',
    club: jug1.club || '-',
    ejercito: jug1.ejercito || '-',
    bando: jug1.bando || null,
    puntos_victoria: jug1.puntos_victoria || 0,
    puntos_torneo: jug1.puntos_torneo || 0
  },
  jugador2: {
    id: jug2.id || jug2.jugador_id,
    jugador_id: jug2.jugador_id,
    nombre: jug2.jugador_nombre || jug2.nombre,
    jugador_nombre: jug2.jugador_nombre || jug2.nombre,
    apellidos: jug2.jugador_apellidos || jug2.apellidos || '',
    club: jug2.club || '-',
    ejercito: jug2.ejercito || '-',
    bando: jug2.bando || null,
    puntos_victoria: jug2.puntos_victoria || 0,
    puntos_torneo: jug2.puntos_torneo || 0
  }
});

/**
 * Crea objeto de emparejamiento BYE
 */
const crearEmparejamientoBye = (jug, mesa, ronda) => ({
  mesa,
  ronda,
  jugador1_id: jug.jugador_id,
  jugador2_id: null,
  es_bye: 1,
  jugador1: {
    id: jug.id || jug.jugador_id,
    jugador_id: jug.jugador_id,
    nombre: jug.jugador_nombre || jug.nombre,
    jugador_nombre: jug.jugador_nombre || jug.nombre,
    apellidos: jug.jugador_apellidos || jug.apellidos || '',
    club: jug.club || '-',
    ejercito: jug.ejercito || '-',
    bando: jug.bando || null,
    puntos_victoria: jug.puntos_victoria || 0,
    puntos_torneo: jug.puntos_torneo || 0
  },
  jugador2: null
});