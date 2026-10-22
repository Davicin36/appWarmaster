// componente/rankings/Filtrozona.jsx
import { useTranslation } from 'react-i18next';
import { listaComunidades } from '@/funciones/provinciasES';
import { listaPaises } from '@/funciones/paises';

/**
 * Filtro geográfico del ranking: País → (solo España) Comunidad → Provincia.
 *
 * Props:
 *   paisesDisponibles: ['ES', 'FR', ...]  (solo países que tienen jugadores)
 *   zona:              { pais, comunidad, provincia }
 *   onCambiar:         (nuevaZona) => void
 */
function FiltroZona({ paisesDisponibles = [], zona, onCambiar }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language?.slice(0, 2) || 'es';
  const { pais, comunidad, provincia } = zona;

  // Si nadie ha indicado su país todavía, no tiene sentido mostrar el filtro
  if (paisesDisponibles.length === 0) return null;

  const hayFiltro = pais || comunidad || provincia;

  return (
    <div className="filtro-zona">
      <span className="filtro-zona-titulo">📍 {t('ranking_zona.titulo', 'Zona')}</span>

      <div className="filtro-zona-selects">
        {/* País */}
        <select
          value={pais}
          onChange={(e) => onCambiar({ pais: e.target.value, comunidad: '', provincia: '' })}
          aria-label={t('ranking_zona.pais', 'País')}
        >
          <option value="">🌍 {t('ranking_zona.todos_paises', 'Todos los países')}</option>
          {listaPaises(idioma, paisesDisponibles).map(p => (
            <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>
          ))}
        </select>

        {/* Comunidad (solo España) */}
        {pais === 'ES' && (
          <select
            value={comunidad}
            onChange={(e) => onCambiar({ pais, comunidad: e.target.value, provincia: '' })}
            aria-label={t('ranking_zona.comunidad', 'Comunidad')}
          >
            <option value="">{t('ranking_zona.toda_espana', 'Toda España')}</option>
            {listaComunidades().map(c => (
              <option key={c.clave} value={c.clave}>{c.nombre}</option>
            ))}
          </select>
        )}

        {hayFiltro && (
          <button
            type="button"
            className="filtro-zona-limpiar"
            onClick={() => onCambiar({ pais: '', comunidad: '', provincia: '' })}
          >
            ✖ {t('ranking_zona.quitar', 'Quitar filtro')}
          </button>
        )}
      </div>
    </div>
  );
}

export default FiltroZona;