// componente/rankings/botonRecalcularRanking.jsx
import { useState } from 'react';
import apiRanking from '@/servicios/apiRanking';

function BotonRecalcularRanking({ onRecalculado }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleRecalcular = async () => {
    const ok = window.confirm(
      '⚠️ Se borrará y recalculará desde cero el ranking de los sistemas ACTIVOS.\n\n' +
      'Los sistemas en standby no se tocan.\n\n¿Seguro que quieres continuar?'
    );
    if (!ok) return;

    setLoading(true);
    setResultado(null);
    try {
      const data = await apiRanking.recalcularTodo();
      setResultado(data);
      if (onRecalculado) await onRecalculado();
    } catch (error) {
      setResultado({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recalcular-ranking">
      <button onClick={handleRecalcular} disabled={loading} className="btn-actualizar">
        {loading ? '⏳ Recalculando...' : '🔄 Recalcular sistemas activos'}
      </button>

      {resultado && !resultado.error && (
        <div className="mensaje mensaje-exito">
          <p>
            ✅ {resultado.procesados.length} de {resultado.total} torneos procesados
            ({resultado.sistemas.map(s => s.toUpperCase()).join(', ')})
          </p>
          {resultado.errores.length > 0 && (
            <>
              <p>⚠️ Torneos no procesados:</p>
              <ul>
                {resultado.errores.map(e => (
                  <li key={e.torneoId}>{e.nombre}: {e.error}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {resultado?.error && (
        <div className="mensaje mensaje-error">❌ {resultado.error}</div>
      )}
    </div>
  );
}

export default BotonRecalcularRanking;