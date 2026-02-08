// components/Ranking/TarjetaJugador.jsx
//import { useNavigate } from 'react-router-dom';

import { obtenerCategoria, obtenerMedalla } from '@/funciones/rankingHelper';

import '@/estilos/ranking.css';

const TarjetaJugador = ({ jugador, mostrarSistema = false }) => {
  //const navigate = useNavigate();
  const categoria = obtenerCategoria(jugador.elo_actual);
  const esSaga = jugador.sistema_juego?.toLowerCase() === 'saga'
  const esWarmaster = jugador.sistema_juego?.toLowerCase() === 'warmaster'

  /*
  const handleClick = () => {
    navigate(`/perfil`);
  }
    */

  return (
    <div 
      className={`tarjeta-jugador categoria-${categoria.clase}`}
    >
      <div className="jugador-posicion">
        {obtenerMedalla(jugador.posicion)}
      </div>

      <div className="jugador-info">
        <h3 className="jugador-nombre">
          {`${jugador.nombre} ${jugador.apellidos}${jugador.nombre_alias ? ` - ${jugador.nombre_alias}` : ''}`}
        </h3>

        {jugador.club && (
          <p className="jugador-club">{jugador.club}</p>
        )}
        {mostrarSistema && (
          <span className="jugador-sistema">{jugador.sistema_juego.toUpperCase()}</span>
        )}
      </div>

      <div className="jugador-elo">
        <div className="elo-principal">
          <span className="elo-valor">{jugador.elo_actual}</span>
          <span className="elo-label">ELO</span>
        </div>
        <div className="elo-secundario">
          <span className="elo-max">Máx: {jugador.elo_maximo}</span>
        </div>
      </div>

      <div className="jugador-categoria">
        <span className="categoria-icono">{categoria.icono}</span>
        <span className="categoria-nombre">{categoria.nombre}</span>
      </div>

      <div className="jugador-estadisticas">
        <div className="stat">
          <span className="stat-label">Partidas</span>
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
          <span className="stat-label">% Victoria</span>
          <span className="stat-valor">{jugador.porcentaje_victorias}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Él más sanguinario</span>
          <span className="stat-valor">{jugador.warlords_muertos}</span>
        </div>
        {esSaga && (
          <div className="stat">
            <span className="stat-label">Epoca más usada</span>
            <span className="stat-valor epoca-stat">
                {jugador.epoca_favorita || 'Sin Datos'}
            </span>
          </div>
        )}
         {esSaga && (
          <div className="stat">
            <span className="stat-label">Banda más usado</span>
            <span className="stat-valor epoca-stat">
                {jugador.faccion_favorita || 'Sin Datos'}
            </span>
          </div>
        )}
        {esWarmaster && (
          <div className="stat">
            <span className="stat-label">Ejercito más usado</span>
            <span className="stat-valor epoca-stat">
                {jugador.faccion_favorita  || 'Sin Datos'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TarjetaJugador;