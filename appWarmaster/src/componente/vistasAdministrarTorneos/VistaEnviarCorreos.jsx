import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import torneosSagaApi from '@/servicios/apiSaga';
import torneosWarmasterApi from '@/servicios/apiWarmaster';
import torneosFowApi from '@/servicios/apiFow';
import torneosEpicApi from '@/servicios/apiEpic';

import '@/estilos/enviarCorreos.css';

const VistaEnviarCorreos = ({ torneoId, torneo, tipoJuego }) => {
  const { t } = useTranslation();

  const [participantes, setParticipantes] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [seleccionTodos, setSeleccionTodos] = useState(false);
  const [mensaje_estado, setMensajeEstado] = useState({ tipo: '', texto: '' });

  const esTorneoEquipos = torneo.tipo_torneo === 'Por equipos';

  const obtenerApiCorrecta = () => {
    switch (tipoJuego?.toLowerCase()) {
      case 'saga':     return torneosSagaApi;
      case 'warmaster':return torneosWarmasterApi;
      case 'fow':
      case 'flames of war': return torneosFowApi;
      case 'epic':     return torneosEpicApi;
      default:
        console.warn(`Tipo de juego no reconocido: ${tipoJuego}`);
        return torneosSagaApi;
    }
  };

  const api = obtenerApiCorrecta();

  useEffect(() => { cargarParticipantes(); }, [torneoId, esTorneoEquipos, tipoJuego]);

  const cargarParticipantes = async () => {
    try {
      const response = esTorneoEquipos
        ? await api.obtenerCapitanesCorreos(torneoId)
        : await api.obtenerJugadoresCorreos(torneoId);
      setParticipantes(response.data || response);
    } catch (error) {
      console.error('Error al cargar participantes:', error);
      setMensajeEstado({ tipo: 'error', texto: error.message || t('correos.error_cargar') });
    }
  };

  const handleSeleccionarTodos = () => {
    setDestinatarios(seleccionTodos ? [] : participantes.map(p => p.id));
    setSeleccionTodos(!seleccionTodos);
  };

  const handleSeleccionarParticipante = (id) => {
    if (destinatarios.includes(id)) {
      setDestinatarios(destinatarios.filter(d => d !== id));
      setSeleccionTodos(false);
    } else {
      const nuevos = [...destinatarios, id];
      setDestinatarios(nuevos);
      if (nuevos.length === participantes.length) setSeleccionTodos(true);
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();

    if (destinatarios.length === 0) {
      setMensajeEstado({ tipo: 'error', texto: t('correos.error_sin_destinatarios') });
      return;
    }
    if (!asunto.trim() || !mensaje.trim()) {
      setMensajeEstado({ tipo: 'error', texto: t('correos.error_campos_vacios') });
      return;
    }

    try {
      setEnviando(true);
      const response = await api.enviarCorreoParticipantes(torneoId, {
        destinatarios, asunto, mensaje,
        tipoTorneo: esTorneoEquipos ? 'equipos' : 'individual'
      });

      const respuestaData = response.data || response;
      setMensajeEstado({ tipo: 'exito', texto: response.message || t('correos.exito_envio') });
      setAsunto(''); setMensaje(''); setDestinatarios([]); setSeleccionTodos(false);

      if (respuestaData.fallidos > 0) {
        setTimeout(() => {
          setMensajeEstado({
            tipo: 'warning',
            texto: t('correos.aviso_fallidos', { exitosos: respuestaData.exitosos, fallidos: respuestaData.fallidos })
          });
        }, 3000);
      }
    } catch (error) {
      console.error('Error al enviar correos:', error);
      setMensajeEstado({ tipo: 'error', texto: error.message || t('correos.error_envio') });
    } finally {
      setEnviando(false);
    }
  };

  const getNombreParticipante = (participante) => {
    if (esTorneoEquipos) return `${participante.nombre_equipo} - ${participante.nombre_completo}`;
    return participante.nombre_completo || `${participante.nombre} ${participante.apellidos}`;
  };

  const getDetallesParticipante = (participante) => {
    const detalles = [];
    if (tipoJuego?.toLowerCase() === 'saga' && participante.epoca && participante.faccion) {
      detalles.push(<span key="epoca-faccion" className="badge">🎭 {participante.epoca} - {participante.faccion}</span>);
    }
    if (tipoJuego?.toLowerCase() === 'warmaster' && participante.ejercito) {
      detalles.push(<span key="ejercito" className="badge">🏰 {participante.ejercito}</span>);
    }
    if ((tipoJuego?.toLowerCase() === 'fow' || tipoJuego?.toLowerCase() === 'flames of war')) {
      if (participante.nacion)  detalles.push(<span key="nacion"  className="badge">🔥 {participante.nacion}</span>);
      if (participante.periodo) detalles.push(<span key="periodo" className="badge">📅 {participante.periodo}</span>);
    }
    return detalles;
  };

  return (
    <div className="enviar-correos-container">
      <div className="enviar-correos-header">
        <h2>📧 {t('correos.titulo')}</h2>
        <p className="subtitulo">
          {t('correos.subtitulo', { tipo: esTorneoEquipos ? t('correos.capitanes') : t('correos.jugadores') })}
        </p>
      </div>

      {mensaje_estado.texto && (
        <div className={`mensaje-estado ${mensaje_estado.tipo}`}>
          <span className="icono">
            {mensaje_estado.tipo === 'exito'   && '✅'}
            {mensaje_estado.tipo === 'error'   && '❌'}
            {mensaje_estado.tipo === 'warning' && '⚠️'}
          </span>
          <span className="texto">{mensaje_estado.texto}</span>
          <button className="cerrar-mensaje" onClick={() => setMensajeEstado({ tipo: '', texto: '' })}>✕</button>
        </div>
      )}

      <form onSubmit={handleEnviar} className="form-correo">

        {/* DESTINATARIOS */}
        <div className="seccion-destinatarios">
          <h3>
            {t('correos.destinatarios')} {esTorneoEquipos ? `(${t('correos.capitanes')})` : `(${t('correos.jugadores')})`}
          </h3>

          <div className="seleccionar-todos">
            <label>
              <input type="checkbox" checked={seleccionTodos}
                onChange={handleSeleccionarTodos} disabled={participantes.length === 0} />
              <span>{t('correos.seleccionar_todos', { count: participantes.length })}</span>
            </label>
          </div>

          <div className="lista-participantes">
            {participantes.length === 0 ? (
              <div className="sin-participantes">
                <div className="icono-vacio">📭</div>
                <p>{t('correos.sin_participantes', { tipo: esTorneoEquipos ? t('correos.equipos_formados') : t('correos.inscritos') })}</p>
                <small>{t('correos.sin_participantes_hint')}</small>
              </div>
            ) : (
              participantes.map(participante => (
                <div key={participante.id} className="participante-item">
                  <label>
                    <input type="checkbox"
                      checked={destinatarios.includes(participante.id)}
                      onChange={() => handleSeleccionarParticipante(participante.id)} />
                    <div className="participante-info">
                      <span className="nombre">{getNombreParticipante(participante)}</span>
                      <span className="email">{participante.email}</span>
                      <div className="detalles-extra">
                        {esTorneoEquipos && participante.num_miembros && (
                          <span className="badge">👥 {participante.num_miembros} {t('correos.miembros')}</span>
                        )}
                        {getDetallesParticipante(participante)}
                      </div>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="contador-seleccionados">
            <span className="numero">{destinatarios.length}</span>
            <span className="separador">/</span>
            <span className="total">{participantes.length}</span>
            <span className="texto">{t('correos.seleccionados')}</span>
          </div>
        </div>

        {/* MENSAJE */}
        <div className="seccion-mensaje">
          <div className="form-group">
            <label htmlFor="asunto">
              {t('correos.asunto')} *
              <span className="contador-caracteres">{asunto.length}/200</span>
            </label>
            <input type="text" id="asunto" value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder={t('correos.asunto_placeholder')}
              required disabled={enviando} maxLength={200} />
          </div>

          <div className="form-group">
            <label htmlFor="mensaje">{t('correos.mensaje')} *</label>
            <textarea id="mensaje" value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={t('correos.mensaje_placeholder')}
              rows="12" required disabled={enviando} />
          </div>

          <div className="info-mensaje">
            <div className="info-header">
              <span className="icono">💡</span>
              <strong>{t('correos.info_titulo')}</strong>
            </div>
            <ul>
              <li>{t('correos.info_1')}</li>
              <li>{t('correos.info_2', { juego: tipoJuego })}</li>
              <li>{t('correos.info_3')}</li>
              <li>{t('correos.info_4')}</li>
              <li>{t('correos.info_5', { juego: tipoJuego })}</li>
            </ul>
          </div>

          <button type="submit" className="btn-enviar"
            disabled={enviando || destinatarios.length === 0 || participantes.length === 0}>
            {enviando ? (
              <><span className="spinner"></span> {t('correos.enviando')}</>
            ) : (
              <>✉️ {t('correos.btn_enviar')}{destinatarios.length > 0 && ` (${destinatarios.length})`}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VistaEnviarCorreos;