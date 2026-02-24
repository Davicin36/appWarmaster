import React, { useState } from 'react';
import torneosFowApi from '../servicios/apiFow.js';
import '@/estilos/modalPartidas.css';

import { calcularPuntosTorneoFow, TIPOS_PARTIDA_FOW } from './funcionesFow/constantesFuncionesFow.js';

const MISIONES_EQUILIBRADAS = TIPOS_PARTIDA_FOW.filter(tipo => tipo.tipo === 'Batalla Equilibrada').map(tipo => tipo.nombre);

function ModalRegistroPartidaFow({ partida, onClose, onGuardar, esOrganizador = false }) {

  const resultadoConfirmado = partida.resultado_confirmado === 1;
  const esBye = !partida.jugador2_id || partida.es_bye === 1;

  const permiteEmpate = MISIONES_EQUILIBRADAS.includes(partida.nombre_partida);

  const [resultado, setResultado] = useState(null); // 'victoria_j1' | 'victoria_j2' | 'empate'
  const [pelotonesVencedor, setPelotonesVencedor] = useState(0);
   const [pelotonesJ1, setPelotonesJ1] = useState(0);             // para empate
  const [pelotonesJ2, setPelotonesJ2] = useState(0); 
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(null);

  const nombreJ1 = partida.jugador1_nombre;
  const nombreJ2 = partida.jugador2_nombre;

 // puntosVencedor/puntosPerdedor = score real del juego (ej: 6 y 0)
  // ptVencedor/ptPerdedor = puntos de torneo (3 victoria, 0 derrota)
   const getPreview = () => {
      if (!resultado) return null;

      if (resultado === 'empate') {
        const { puntosPerdedor: pvJ1 } = calcularPuntosTorneoFow(pelotonesJ1);
        const { puntosPerdedor: pvJ2 } = calcularPuntosTorneoFow(pelotonesJ2);
        return { esEmpate: true, pvJ1, pvJ2, ptJ1: 1, ptJ2: 1 };
      }

      const esJ1 = resultado === 'victoria_j1';
      const { puntosVencedor, puntosPerdedor } = calcularPuntosTorneoFow(pelotonesVencedor);
      return {
        esEmpate: false,
        nombreGanador: esJ1 ? nombreJ1 : nombreJ2,
        nombrePerdedor: esJ1 ? nombreJ2 : nombreJ1,
        ptVencedor: puntosVencedor,
        ptPerdedor: puntosPerdedor,
        pvVencedor: 3,
        pvPerdedor: 0,
      };
    };

  const preview = getPreview();

  const resetResultado = () => {
    setResultado(null);
    setPelotonesVencedor(0);
    setPelotonesJ1(0);
    setPelotonesJ2(0);
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);
      setError(null);

      if (!resultado) throw new Error('Debes seleccionar el ganador de la partida');

      let datosPartida

       if (resultado === 'empate') {
        const { puntosPerdedor: ptJ1 } = calcularPuntosTorneoFow(pelotonesJ1);
        const { puntosPerdedor: ptJ2 } = calcularPuntosTorneoFow(pelotonesJ2);
        datosPartida = {
          resultado_pf: 'empate',
          puntos_victoria_j1: 1,
          puntos_victoria_j2: 1,
          puntos_torneo_j1: ptJ1,
          puntos_torneo_j2: ptJ2,
          pelotones_destruidos_vencedor: pelotonesJ1 + pelotonesJ2,
        };
      } else {
        const esJ1 = resultado === 'victoria_j1';
        const { puntosVencedor, puntosPerdedor } = calcularPuntosTorneoFow(pelotonesVencedor);
        datosPartida = {
          resultado_pf: resultado,
          puntos_torneo_j1: esJ1 ? puntosVencedor : puntosPerdedor,
          puntos_torneo_j2: esJ1 ? puntosPerdedor : puntosVencedor,
          puntos_victoria_j1: esJ1 ? 3 : 0,
          puntos_victoria_j2: esJ1 ? 0 : 3,
          pelotones_destruidos_vencedor: pelotonesVencedor,
        };
      }

      await torneosFowApi.registrarPartida(partida.torneo_id, partida.id, datosPartida);

      const resumen = resultado === 'empate'
        ? `🤝 Empate\n${nombreJ1}: ${datosPartida.puntos_victoria_j1} PV | ${datosPartida.puntos_torneo_j1} PT\n${nombreJ2}: ${datosPartida.puntos_victoria_j2} PV | ${datosPartida.puntos_torneo_j2} PT`
        : `🏆 ${preview.nombreGanador}: ${preview.pvVencedor} PV |  ${preview.ptVencedor} PT\n❌ ${preview.nombrePerdedor}: ${preview.pvPerdedor} PV |  ${preview.ptPerdedor} PT`;

      alert(`✅ Resultado guardado\n\n${resumen}\n\n⚠️ Pendiente de confirmación del organizador`);

      if (onGuardar) onGuardar();
      onClose();

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmar = async (confirmar) => {
    try {
      setConfirmando(true);
      if (!window.confirm(
        confirmar
          ? '¿Confirmar resultado definitivamente?'
          : '¿Desconfirmar este resultado?'
      )) return;

      await torneosFowApi.confirmarResultado(partida.torneo_id, partida.id, confirmar);
      alert(confirmar ? '✅ Resultado confirmado' : '⚠️ Resultado desconfirmado');
      if (onGuardar) onGuardar();
      onClose();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setConfirmando(false);
    }
  };

  // ─── BYE ────────────────────────────────────────────────────────────────────
  if (esBye) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className={`modal-header ${resultadoConfirmado ? 'confirmado' : ''}`}>
            <h3>{resultadoConfirmado ? '✅' : '⚠️'} Partida BYE — Mesa {partida.mesa}</h3>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="bye-info">
              <h3>⭐ Victoria Automática</h3>
              <p><strong>{nombreJ1}</strong></p>
              <p className="puntos-bye">2 Puntos de Victoria</p>
              <p className="puntos-bye">3 Puntos de Torneo</p>
              <p className="ronda-info">Ronda: {partida.ronda}</p>
            </div>
            {!resultadoConfirmado && esOrganizador && (
              <div className="info-bye-explicacion">
                <p>💡 Como organizador debes confirmar esta victoria para que sea definitiva.</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {esOrganizador && (
              <button
                onClick={() => handleConfirmar(!resultadoConfirmado)}
                disabled={confirmando}
                className={resultadoConfirmado ? 'btn-desconfirmar' : 'btn-confirmar-bye'}
              >
                {confirmando
                  ? '⏳ Procesando...'
                  : resultadoConfirmado
                    ? '🔓 Desconfirmar'
                    : '✅ Confirmar BYE'}
              </button>
            )}
            <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── CONFIRMADO (solo lectura) ───────────────────────────────────────────────
  if (resultadoConfirmado) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header confirmado">
            <h3>✅ Resultado Confirmado — Mesa {partida.mesa}</h3>
            <button className="btn-close confirmado" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="alerta-confirmado">
              <p>✅ Confirmado por el organizador</p>
              <p className="nota-no-editable">Los datos ya no se pueden modificar</p>
            </div>

            <div className="partida-info">
              <p><strong>Escenario:</strong> {partida.nombre_partida || 'Por definir'}</p>
              <p><strong>Ronda:</strong> {partida.ronda}</p>
              <p><strong>Resultado:</strong> {
                  partida.resultado_pf === 'empate' ? '🤝 Empate'
                  : partida.resultado_pf === 'victoria_j1' ? `🏆 Victoria de ${nombreJ1}`
                  : `🏆 Victoria de ${nombreJ2}`
              }</p>
            </div>

            <div className="resultados-grid">
              <div className="jugador-stats">
                <h4>{nombreJ1}</h4>
                <p><strong>Puntos de Victoria:</strong> {partida.puntos_victoria_j1 ?? '—'}</p>
                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j1 ?? '-'}</p>
              </div>
              <div className="vs-divider">VS</div>
              <div className="jugador-stats">
                <h4>{nombreJ2}</h4>
               <p><strong>Puntos de Victoria:</strong> {partida.puntos_victoria_j2 ?? '—'}</p>
                <p><strong>Puntos Torneo:</strong> {partida.puntos_torneo_j2 ?? '-'}</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {esOrganizador && (
              <button
                onClick={() => handleConfirmar(false)}
                disabled={confirmando}
                className="btn-desconfirmar"
              >
                {confirmando ? '⏳ Procesando...' : '🔓 Desconfirmar Resultado'}
              </button>
            )}
            <button className="btn-cerrar" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── EDICIÓN ─────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-edicion" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📝 Registrar Resultado — Mesa {partida.mesa}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          <div className="partida-info">
            <p><strong>Escenario:</strong> {partida.nombre_partida || 'Por definir'}</p>
            <p><strong>Ronda:</strong> {partida.ronda}</p>
            {permiteEmpate && (
              <p className="info-empate">🤝 Misión de Batalla Equilibrada — el empate es posible</p>
            )}
          </div>

          {/* PASO 1: Resultado */}
          <div className="seccion-primer-jugador">
            <h4>🏆 Paso 1 — ¿Resultado de la partida?</h4>
            {resultado ? (
              <div className="primer-jugador-seleccionado">
                <p>
                  {resultado === 'empate'
                    ? '🤝 Empate'
                    : <> ✅ Gana: <strong>{resultado === 'victoria_j1' ? nombreJ1 : nombreJ2}</strong></>
                  }
                </p>
                <button type="button" onClick={resetResultado} className="btn-limpiar-seleccion">
                  ✕ Cambiar
                </button>
              </div>
            ) : (
              <div className="botones-primer-jugador">
                <button onClick={() => setResultado('victoria_j1')} className="btn-seleccionar-jugador">
                  🏆 {nombreJ1}
                </button>
                {permiteEmpate && (
                  <button onClick={() => setResultado('empate')} className="btn-seleccionar-jugador">
                    🤝 Empate
                  </button>
                )}
                <button onClick={() => setResultado('victoria_j2')} className="btn-seleccionar-jugador">
                  🏆 {nombreJ2}
                </button>
              </div>
            )}
          </div>

          {/* PASO 2: Pelotones del vencedor */}
          {resultado && resultado !== 'empate' && (
            <div className="seccion-pelotones">
              <h4>💥 Paso 2 — Pelotones perdidos por {resultado === 'victoria_j1' ? nombreJ1 : nombreJ2}</h4>
              <div className="form-group">
                <input
                  type="number"
                  min="0"
                  value={pelotonesVencedor}
                  onChange={e => setPelotonesVencedor(parseInt(e.target.value) || 0)}
                  disabled={guardando}
                />
              </div>
            </div>
          )}

          {/* PASO 2: Pelotones — Empate (uno por jugador) */}
          {resultado === 'empate' && (
            <div className="seccion-pelotones">
              <h4>💥 Paso 2 — Pelotones perdidos por el rival</h4>
              <div className="empate-pelotones-grid">
                <div className="form-group">
                  <label>{nombreJ1} perdió:</label>
                  <input
                    type="number"
                    min="0"
                    value={pelotonesJ2}
                    onChange={e => setPelotonesJ2(parseInt(e.target.value) || 0)}
                    disabled={guardando}
                  />
                </div>
                <div className="form-group">
                  <label>{nombreJ2} perdió:</label>
                  <input
                    type="number"
                    min="0"
                    value={pelotonesJ1}
                    onChange={e => setPelotonesJ1(parseInt(e.target.value) || 0)}
                    disabled={guardando}
                  />
                </div>
              </div>
            </div>
          )}

         {/* PREVIEW : */}
        {preview && (
          <div className="resultado-preview">
            <h4>Resultado calculado:</h4>
            {preview.esEmpate ? (
              <div className="resultados-grid">
                <div className="jugador-stats empate">
                  <h4>🤝 {nombreJ1}</h4>
                  <strong>PT:</strong> {preview.pvJ1} / <strong>PV:</strong> {preview.ptJ1}
                </div>
                <div className="vs-divider">VS</div>
                <div className="jugador-stats empate">
                  <h4>🤝 {nombreJ2}</h4>
                  <strong>PT:</strong> {preview.pvJ2} / <strong>PV:</strong> {preview.ptJ2}
                </div>
              </div>
            ) : (
              <div className="resultados-grid">
                <div className="jugador-stats ganador">
                  <h4>🏆 {preview.nombreGanador}</h4>
                  <strong>PT:</strong> {preview.ptVencedor} / <strong>PV:</strong> {preview.pvVencedor}
                </div>
                <div className="vs-divider">VS</div>
                <div className="jugador-stats perdedor">
                  <h4>❌ {preview.nombrePerdedor}</h4>
                  <p><strong>PT:</strong> {preview.ptPerdedor} / <strong>PV:</strong> {preview.pvPerdedor}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || !resultado}
            className="btn-guardar"
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar Resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalRegistroPartidaFow;