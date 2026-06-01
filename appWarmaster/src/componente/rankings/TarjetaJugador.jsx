// components/Ranking/TarjetaJugador.jsx

import { useTranslation } from 'react-i18next';
import { obtenerCategoria, obtenerMedalla } from '@/funciones/rankingHelper';
import '@/estilos/ranking.css';

const TarjetaJugador = ({ jugador }) => {
  const { t } = useTranslation();
  const categoria    = obtenerCategoria(jugador.elo_actual);
  const esSaga       = jugador.sistema_juego?.toLowerCase() === 'saga';
  const esWarmaster  = jugador.sistema_juego?.toLowerCase() === 'warmaster';
  const esFow        = jugador.sistema_juego?.toLowerCase() === 'fow';
  const esEpic       = jugador.sistema_juego?.toLowerCase() === 'epic';

  const sinDatos = t('tarjeta_jugador.sin_datos');

  return (
    <div className={`tarjeta-jugador categoria-${categoria.clase}`}>

      {/* FILA SUPERIOR */}
      <div className="tarjeta-top-row">
        <div className="jugador-posicion">
          {obtenerMedalla(jugador.posicion)}
        </div>

        <div className="jugador-info">
          <h3 className="jugador-nombre">
            {`${jugador.nombre} ${jugador.apellidos}${jugador.nombre_alias ? ` - ${jugador.nombre_alias}` : ''}`}
          </h3>
          {jugador.club && <p className="jugador-club">{jugador.club}</p>}
        </div>

        <div className="jugador-elo">
          <div className="elo-principal">
            <span className="elo-valor">{jugador.elo_actual}</span>
            <span className="elo-label">ELO</span>
          </div>
          <div className="elo-secundario">
            <span className="elo-max">{t('tarjeta_jugador.max')}: {jugador.elo_maximo}</span>
          </div>
        </div>

        <div className="jugador-categoria">
          <span className="categoria-icono">{categoria.icono}</span>
          <span className="categoria-nombre">{traducirCategoria(categoria.nombre, t)}</span>
        </div>
      </div>

      {/* FILA INFERIOR: estadísticas */}
      <div className="jugador-estadisticas">
        <div className="stat">
          <span className="stat-label">{t('perfil.stat_pj')}</span>
          <span className="stat-valor">{jugador.partidas_jugadas}</span>
        </div>
        <div className="stat">
          <span className="stat-label">V/D/E</span>
          <span className="stat-valor">
            <span className="victoria">{jugador.victorias}</span>/
            <span className="derrota">{jugador.derrotas}</span>/
            <span className="empate">{jugador.empates}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">{t('perfil.stat_pct')}</span>
          <span className="stat-valor">{jugador.porcentaje_victorias}%</span>
        </div>

        {/* SAGA */}
        {esSaga && <>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.mas_sanguinario')}</span>
            <span className="stat-valor">{jugador.warlords_muertos}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.epoca_mas_usada')}</span>
            <span className="stat-valor epoca-stat">{jugador.epoca_favorita || sinDatos}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.banda_mas_usada')}</span>
            <span className="stat-valor epoca-stat">{jugador.faccion_favorita || sinDatos}</span>
          </div>
        </>}

        {/* WARMASTER */}
        {esWarmaster && <>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.mas_sanguinario')}</span>
            <span className="stat-valor">{jugador.warlords_muertos}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.ejercito_mas_usado')}</span>
            <span className="stat-valor epoca-stat">{jugador.faccion_favorita || sinDatos}</span>
          </div>
        </>}

        {/* FOW */}
        {esFow && <>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.epoca_mas_usada')}</span>
            <span className="stat-valor epoca-stat">{jugador.epoca_favorita || sinDatos}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.ejercito_mas_usado')}</span>
            <span className="stat-valor epoca-stat">{jugador.faccion_favorita || sinDatos}</span>
          </div>
        </>}

        {/* EPIC */}
        {esEpic && (
          <div className="stat">
            <span className="stat-label">{t('tarjeta_jugador.ejercito_mas_usado')}</span>
            <span className="stat-valor epoca-stat">{jugador.faccion_favorita || sinDatos}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Mapeador de categorías (viene de rankingHelper, no de i18next)
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

export default TarjetaJugador;