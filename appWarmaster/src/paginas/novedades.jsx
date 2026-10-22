import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Footer from '@/paginas/Footer.jsx';
import '../estilos/novedades.css';

// ─────────────────────────────────────────────────────────────
// LISTA DE NOVEDADES
// Para añadir una nueva, agrega un objeto aquí (la más reciente arriba).
//   estado:   'nuevo' | 'proximamente'
//   sistema:  opcional, se muestra como etiqueta
//   features: opcional, lista de puntos destacados
//   boton:    opcional, { texto, ruta }
// ─────────────────────────────────────────────────────────────
const NOVEDADES = [
  {
    id: 'escenarios-proximamente',
    estado: 'proximamente',
    titulo: 'novedades.escenarios_titulo',
    texto: 'novedades.escenarios_texto',
  },
  {
    id: 'dracula',
    estado: 'nuevo',
    sistema: 'Dracula',
    titulo: 'novedades.dracula_titulo',
    texto: 'novedades.dracula_texto',
    boton: { texto: 'novedades.dracula_boton', ruta: '/crearTorneo/dracula' },
  },
  {
    id: 'gakis',
    estado: 'nuevo',
    sistema: 'SAGA',
    titulo: 'novedades.gakis_titulo',
    subtitulo: 'novedades.gakis_subtitulo',
    texto: 'novedades.gakis_intro',
    features: [1, 2, 3, 4].map(n => ({
      titulo: `novedades.gakis_f${n}_titulo`,
      texto: `novedades.gakis_f${n}_texto`,
    })),
    boton: { texto: 'novedades.gakis_boton', ruta: '/crearTorneo/saga' },
  },
  {
    id: 'escenarios-nuevos',
    estado: 'nuevo',
    titulo: 'novedades.escenarios_titulo2',
    texto: 'novedades.escenarios_texto2',
  },
];

const FILTROS = ['todas', 'nuevo', 'proximamente'];

function Novedades() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todas');

  const location = useLocation();

const handleVolver = () => {
  // Si se entró directamente a /novedades no hay página anterior: ir a la principal
  if (location.key === 'default') {
    navigate('/');
  } else {
    navigate(-1);
  }
};

  const novedadesFiltradas = filtro === 'todas'
    ? NOVEDADES
    : NOVEDADES.filter(n => n.estado === filtro);

  return (
    <div className="pagina-novedades">
      <header className="novedades-header">
        <h1>✨ {t('novedades.pagina_titulo')}</h1>
        <p>{t('novedades.pagina_subtitulo')}</p>
      </header>

      {/* Filtros */}
      <div className="novedades-filtros">
        {FILTROS.map(f => (
          <button
            key={f}
            className={`novedades-filtro-btn ${filtro === f ? 'activo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {t(`novedades.filtro_${f}`)}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="novedades-lista">
        {novedadesFiltradas.length === 0 ? (
          <p className="novedades-vacio">{t('novedades.ninguna')}</p>
        ) : (
          novedadesFiltradas.map(n => (
            <article key={n.id} className={`novedad-card novedad-card-${n.estado}`}>
              <div className="novedad-card-etiquetas">
                <span className={`novedad-badge novedad-badge-${n.estado}`}>
                  {n.estado === 'nuevo'
                    ? t('novedades.nuevo_label')
                    : t('novedades.proximamente_label')}
                </span>
                {n.sistema && <span className="novedad-sistema">{n.sistema}</span>}
              </div>

              <div className="novedad-contenido">
                <h3>{t(n.titulo)}</h3>
                {n.subtitulo && <p><strong>{t(n.subtitulo)}</strong></p>}
                {n.texto && <p>{t(n.texto)}</p>}

                {n.features && (
                  <ul className="gakis-features">
                    {n.features.map(f => (
                      <li key={f.titulo}>
                        <strong>{t(f.titulo)}</strong>
                        <p>{t(f.texto)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {n.boton && (
                <button className="btn-ver-saga" onClick={() => navigate(n.boton.ruta)}>
                  {t(n.boton.texto)}
                </button>
              )}
            </article>
          ))
        )}

      </div>
      <div className="novedades-volver">
        <button className="btn-volver-novedades" onClick={handleVolver}>
           {t('botones.volver')}
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default Novedades;