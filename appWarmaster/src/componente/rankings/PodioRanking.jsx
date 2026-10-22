// componente/rankings/PodioRanking.jsx
import { useTranslation } from 'react-i18next';
import { obtenerCategoria } from '@/funciones/rankingHelper';

const MEDALLAS = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Mismo mapeo que TarjetaJugador (la categoría viene de rankingHelper, no de i18next)
const traducirCategoria = (nombre, t) => {
  const mapa = {
    'Gran Maestro': t('ranking.cat.gran_maestro'),
    'Maestro':      t('ranking.cat.maestro'),
    'Experto':      t('ranking.cat.experto'),
    'Avanzado':     t('ranking.cat.avanzado'),
    'Intermedio':   t('ranking.cat.intermedio'),
    'Principiante': t('ranking.cat.principiante'),
    'Novato':       t('ranking.cat.novato'),
  };
  return mapa[nombre] || nombre;
};

/**
 * Lista de estadísticas a mostrar según el sistema de juego.
 * Es la misma información que enseña TarjetaJugador.
 */
const obtenerEstadisticas = (j, t) => {
  const sistema  = j.sistema_juego?.toLowerCase();
  const sinDatos = t('tarjeta_jugador.sin_datos');

  const comunes = [
    { clave: 'pj',  label: t('perfil.stat_pj'),  valor: j.partidas_jugadas ?? 0 },
    { clave: 'vde', label: 'V/D/E',              vde: true },
    { clave: 'pct', label: t('perfil.stat_pct'), valor: `${j.porcentaje_victorias ?? 0}%` },
  ];

  const sanguinario = { clave: 'sang',  label: t('tarjeta_jugador.mas_sanguinario'),    valor: j.warlords_muertos ?? 0 };
  const epoca       = { clave: 'epoca', label: t('tarjeta_jugador.epoca_mas_usada'),    valor: j.epoca_favorita || sinDatos,   texto: true };
  const banda       = { clave: 'banda', label: t('tarjeta_jugador.banda_mas_usada'),    valor: j.faccion_favorita || sinDatos, texto: true };
  const ejercito    = { clave: 'ejer',  label: t('tarjeta_jugador.ejercito_mas_usado'), valor: j.faccion_favorita || sinDatos, texto: true };

  const extras = {
    saga:      [sanguinario, epoca, banda],
    warmaster: [sanguinario, ejercito],
    fow:       [epoca, ejercito],
    epic:      [ejercito],
  };

  return [...comunes, ...(extras[sistema] || [])];
};

/**
 * Podio con los 3 primeros del ranking.
 * Orden visual: 2º a la izquierda, 1º en el centro, 3º a la derecha.
 * Recibe los jugadores ya ordenados: [primero, segundo, tercero].
 */
function PodioRanking({ jugadores }) {
  const { t } = useTranslation();

  if (!jugadores || jugadores.length === 0) return null;

  const huecos = [
    { puesto: 2, jugador: jugadores[1] },
    { puesto: 1, jugador: jugadores[0] },
    { puesto: 3, jugador: jugadores[2] },
  ];

  return (
    <div className="podio-ranking">
      {huecos.map(({ puesto, jugador }) => {
        if (!jugador) return <div key={puesto} className="podio-hueco" />;

        const categoria = obtenerCategoria(jugador.elo_actual);
        const estadisticas = obtenerEstadisticas(jugador, t);

        return (
          <div key={puesto} className={`podio-card podio-${puesto}`}>
            <div className="podio-medalla">{MEDALLAS[puesto]}</div>

            <h3 className="podio-nombre">
              {`${jugador.nombre} ${jugador.apellidos}${jugador.nombre_alias ? ` - ${jugador.nombre_alias}` : ''}`}
            </h3>
            {jugador.club && <p className="podio-club">{jugador.club}</p>}

            <div className="podio-elo">
              <span className="podio-elo-valor">{jugador.elo_actual}</span>
              <span className="podio-elo-label">ELO</span>
              <span className="podio-elo-max">{t('tarjeta_jugador.max')}: {jugador.elo_maximo}</span>
            </div>

            <span className="podio-categoria">
              <span className="podio-categoria-icono">{categoria.icono}</span>
              {traducirCategoria(categoria.nombre, t)}
            </span>

            <div className="podio-stats">
              {estadisticas.map(stat => (
                <div key={stat.clave}>
                  <span className="podio-stat-label">{stat.label}</span>
                  {stat.vde ? (
                    <span className="podio-stat-valor">
                      <span className="victoria">{jugador.victorias ?? 0}</span>/
                      <span className="derrota">{jugador.derrotas ?? 0}</span>/
                      <span className="empate">{jugador.empates ?? 0}</span>
                    </span>
                  ) : (
                    <span className={`podio-stat-valor ${stat.texto ? 'podio-stat-texto' : ''}`}>
                      {stat.valor}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="podio-base">{puesto}º</div>
          </div>
        );
      })}
    </div>
  );
}

export default PodioRanking;