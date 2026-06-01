import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import torneosSagaApi from '@/servicios/apiSaga';
import torneosWarmasterApi from '../../servicios/apiWarmaster';
import usuarioApi from '@/servicios/apiUsuarios';

import '@/estilos/anadirParticipantesTorneos.css';

const AnadirParticipantesTorneos = ({
  torneoId,
  sistema = 'SAGA',
  onClose,
  onSuccess,
  mode = 'modal'
}) => {
  const { t } = useTranslation();
  const api = sistema === 'WARMASTER' ? torneosWarmasterApi : torneosSagaApi;

  const [torneo, setTorneo] = useState(null);
  const [loadingTorneo, setLoadingTorneo] = useState(true);
  const [errorTorneo, setErrorTorneo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [individualData, setIndividualData] = useState({
    nombre: '', email: '', usuarioRegistrado: null, usuarioExistente: null
  });

  const [teamData, setTeamData] = useState({ nombreEquipo: '', miembros: [] });

  useEffect(() => {
    if (torneoId) {
      cargarTorneo();
    } else {
      setErrorTorneo(t('añadir_participantes.error_sin_id'));
      setLoadingTorneo(false);
    }
  }, [torneoId]);

  useEffect(() => {
    if (torneo && torneo.tipo_torneo === 'Por equipos') {
      const numJugadores = torneo.num_jugadores_equipo || 2;
      if (teamData.miembros.length === 0) {
        setTeamData({
          nombreEquipo: '',
          miembros: Array(numJugadores).fill(null).map((_, i) => ({
            nombre: '', email: '', esCapitan: i === 0,
            usuarioRegistrado: null, usuarioExistente: null
          }))
        });
      }
    }
  }, [torneo]);

  const cargarTorneo = async () => {
    try {
      setLoadingTorneo(true);
      const response = await api.obtenerTorneo(torneoId);
      setTorneo(response.data?.torneo || response.torneo || response);
      setErrorTorneo('');
    } catch (err) {
      console.error('Error al cargar torneo:', err);
      setErrorTorneo(t('añadir_participantes.error_carga_torneo'));
    } finally {
      setLoadingTorneo(false);
    }
  };

  const handleIndividualChange = (e) => {
    const { name, value } = e.target;
    setIndividualData(prev => ({ ...prev, [name]: value }));
    if (name === 'email' && value && value.includes('@')) verificarUsuarioIndividual(value);
    if (error) setError('');
  };

  const verificarUsuarioIndividual = async (email) => {
    if (!email || !email.includes('@')) return;
    try {
      const data = await usuarioApi.verificarUsuario(email.toLowerCase());
      if (data.success && data.existe && data.usuario) {
        setIndividualData(prev => ({
          ...prev,
          usuarioRegistrado: true,
          usuarioExistente: data.usuario,
          nombre: prev.nombre || data.usuario.nombre
        }));
      } else {
        setIndividualData(prev => ({ ...prev, usuarioRegistrado: false, usuarioExistente: null }));
      }
    } catch (err) { console.error('Error al verificar usuario:', err); }
  };

  const handleTeamChange = (e) => {
    const { name, value } = e.target;
    setTeamData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleMemberChange = (index, field, value) => {
    const newMiembros = [...teamData.miembros];
    newMiembros[index][field] = value;
    if (field === 'email') {
      newMiembros[index].usuarioRegistrado = null;
      newMiembros[index].usuarioExistente = null;
    }
    setTeamData(prev => ({ ...prev, miembros: newMiembros }));
    if (field === 'email' && value && value.includes('@')) verificarUsuarioRegistrado(value, index);
    if (error) setError('');
  };

  const verificarUsuarioRegistrado = async (email, index) => {
    if (!email || !email.includes('@')) return;
    try {
      const data = await usuarioApi.verificarUsuario(email.toLowerCase());
      const newMiembros = [...teamData.miembros];
      if (data.success && data.existe && data.usuario) {
        newMiembros[index].usuarioRegistrado = true;
        newMiembros[index].usuarioExistente = data.usuario;
        if (!newMiembros[index].nombre.trim()) newMiembros[index].nombre = data.usuario.nombre;
      } else {
        newMiembros[index].usuarioRegistrado = false;
        newMiembros[index].usuarioExistente = null;
      }
      setTeamData(prev => ({ ...prev, miembros: newMiembros }));
    } catch (err) { console.error('Error al verificar usuario:', err); }
  };

  const handleCapitanChange = (index) => {
    setTeamData(prev => ({
      ...prev,
      miembros: prev.miembros.map((m, i) => ({ ...m, esCapitan: i === index }))
    }));
  };

  const validateIndividualData = () => {
    if (!individualData.nombre.trim()) { setError(t('añadir_participantes.val_nombre')); return false; }
    if (individualData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(individualData.email)) {
      setError(t('registro.errores.email_invalido')); return false;
    }
    return true;
  };

  const validateTeamData = () => {
    if (!teamData.nombreEquipo.trim()) { setError(t('añadir_participantes.val_nombre_equipo')); return false; }
    if (teamData.miembros.filter(m => m.esCapitan).length !== 1) {
      setError(t('añadir_participantes.val_capitan')); return false;
    }
    for (let i = 0; i < teamData.miembros.length; i++) {
      const m = teamData.miembros[i];
      if (!m.nombre.trim()) { setError(t('añadir_participantes.val_nombre_miembro', { num: i + 1 })); return false; }
      if (m.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
        setError(t('añadir_participantes.val_email_miembro', { num: i + 1 })); return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!torneo) { setError(t('añadir_participantes.error_sin_torneo')); return; }

    const esIndividual = torneo.tipo_torneo === 'Individual';
    if (esIndividual) { if (!validateIndividualData()) return; }
    else { if (!validateTeamData()) return; }

    setLoading(true);
    try {
      let resultado;
      if (esIndividual) {
        resultado = await api.añadirJugadorIndividual(torneoId, {
          nombre: individualData.nombre,
          email: individualData.email || null
        });
      } else {
        resultado = await api.añadirEquipo(torneoId, {
          nombreEquipo: teamData.nombreEquipo,
          miembros: teamData.miembros.map(m => ({
            nombre: m.nombre, email: m.email || null, esCapitan: m.esCapitan
          }))
        });
      }

      if (resultado.success) {
        setSuccess(resultado.message || t('añadir_participantes.exito'));
        if (esIndividual) {
          setIndividualData({ nombre: '', email: '', usuarioRegistrado: null, usuarioExistente: null });
        } else {
          const num = torneo.num_jugadores_equipo || 2;
          setTeamData({
            nombreEquipo: '',
            miembros: Array(num).fill(null).map((_, i) => ({
              nombre: '', email: '', esCapitan: i === 0, usuarioRegistrado: null, usuarioExistente: null
            }))
          });
        }
        if (onSuccess) setTimeout(() => onSuccess(resultado), 1500);
      } else {
        setError(resultado.message || t('añadir_participantes.error_añadir'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || t('errores.generico'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingTorneo) return (
    <div className={`add-participants-container ${mode === 'page' ? 'add-participants-page' : ''}`}>
      <div className="loading-container">
        <p>⏳ {t('añadir_participantes.cargando')}</p>
      </div>
    </div>
  );

  if (errorTorneo) return (
    <div className={`add-participants-container ${mode === 'page' ? 'add-participants-page' : ''}`}>
      <div className="add-participants-header">
        <h2>{t('ver_torneo.error_titulo')}</h2>
        {onClose && mode === 'modal' && (
          <button className="close-btn" onClick={onClose} type="button">✕</button>
        )}
      </div>
      <div className="error-message">⚠️ {errorTorneo}</div>
    </div>
  );

  if (!torneo) return (
    <div className="loading-container">
      <p>⏳ {t('añadir_participantes.cargando')}</p>
    </div>
  );

  const esIndividual = torneo?.tipo_torneo === 'Individual';

  return (
    <div className={`add-participants-container ${mode === 'page' ? 'add-participants-page' : ''}`}>
      <div className="add-participants-header">
        <h2>{esIndividual ? `👤 ${t('añadir_participantes.titulo_jugador')}` : `👥 ${t('añadir_participantes.titulo_equipo')}`}</h2>
        {onClose && mode === 'modal' && (
          <button className="close-btn" onClick={onClose} type="button">✕</button>
        )}
      </div>

      {error   && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      {/* Info torneo */}
      <div className="tournament-info">
        <h3>{torneo.nombre_torneo}</h3>
        <p>
          <strong>{t('perfil.th_sistema')}:</strong> {torneo.sistema} | <strong>{t('torneos.tipo_individual').split(' ')[0]}:</strong> {torneo.tipo_torneo}
          {!esIndividual && ` | ${torneo.num_jugadores_equipo} ${t('añadir_participantes.jugadores_por_equipo')}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-participants-form">

        {/* INDIVIDUAL */}
        {esIndividual && (
          <div className="individual-form">
            <h4>{t('añadir_participantes.datos_jugador')}</h4>

            <div className="form-group">
              <label htmlFor="nombre">{t('registro.nombre')} *</label>
              <input type="text" id="nombre" name="nombre"
                value={individualData.nombre} onChange={handleIndividualChange}
                placeholder={t('añadir_participantes.placeholder_nombre')}
                required disabled={loading} />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('registro.email')}</label>
              <div className="input-con-badge">
                <input type="email" id="email" name="email"
                  value={individualData.email} onChange={handleIndividualChange}
                  placeholder={t('registro.email_placeholder')} disabled={loading}
                  className={
                    individualData.usuarioRegistrado === true ? 'input-success' :
                    individualData.usuarioRegistrado === false ? 'input-warning' : ''
                  }
                />
                {individualData.email && individualData.usuarioRegistrado === true && (
                  <span className="badge-registro registrado">✅ {t('añadir_participantes.registrado')}</span>
                )}
                {individualData.email && individualData.usuarioRegistrado === false && (
                  <span className="badge-registro pendiente">⏳ {t('añadir_participantes.nuevo_usuario')}</span>
                )}
              </div>
              {individualData.usuarioRegistrado === false && individualData.email && (
                <small style={{ color: '#0284c7', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>
                  ℹ️ {t('añadir_participantes.info_cuenta_pendiente')}
                </small>
              )}
            </div>
          </div>
        )}

        {/* EQUIPOS */}
        {!esIndividual && (
          <div className="team-form">
            <h4>{t('añadir_participantes.datos_equipo')}</h4>

            <div className="form-group">
              <label htmlFor="nombreEquipo">{t('añadir_participantes.nombre_equipo')} *</label>
              <input type="text" id="nombreEquipo" name="nombreEquipo"
                value={teamData.nombreEquipo} onChange={handleTeamChange}
                placeholder={t('añadir_participantes.placeholder_equipo')}
                required disabled={loading} />
            </div>

            <div className="members-section">
              <h5>{t('añadir_participantes.miembros_titulo', { num: torneo.num_jugadores_equipo })}</h5>

              {teamData.miembros.map((miembro, index) => (
                <div key={index} className="member-card">
                  <div className="member-card-header">
                    <h6>{t('añadir_participantes.jugador_num', { num: index + 1 })}</h6>
                    <label className="capitan-checkbox">
                      <input type="radio" name="capitan"
                        checked={miembro.esCapitan}
                        onChange={() => handleCapitanChange(index)}
                        disabled={loading} />
                      <span>{t('añadir_participantes.capitan')}</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label>{t('registro.nombre')} *</label>
                    <input type="text" value={miembro.nombre}
                      onChange={(e) => handleMemberChange(index, 'nombre', e.target.value)}
                      placeholder={t('registro.nombre_placeholder')}
                      required disabled={loading} />
                  </div>

                  <div className="form-group">
                    <label>{t('registro.email')}</label>
                    <div className="input-con-badge">
                      <input type="email" value={miembro.email}
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                        placeholder={t('registro.email_placeholder')} disabled={loading}
                        className={
                          miembro.usuarioRegistrado === true ? 'input-success' :
                          miembro.usuarioRegistrado === false ? 'input-warning' : ''
                        }
                      />
                      {miembro.email && miembro.usuarioRegistrado === true && (
                        <span className="badge-registro registrado">✅ {t('añadir_participantes.registrado')}</span>
                      )}
                      {miembro.email && miembro.usuarioRegistrado === false && (
                        <span className="badge-registro pendiente">⏳ {t('añadir_participantes.nuevo_usuario')}</span>
                      )}
                    </div>
                    {miembro.usuarioRegistrado === false && miembro.email && (
                      <small style={{ color: '#0284c7', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>
                        ℹ️ {t('añadir_participantes.info_invitacion')}
                      </small>
                    )}
                    {miembro.usuarioRegistrado === true && miembro.usuarioExistente && (
                      <small style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>
                        ✓ {t('añadir_participantes.usuario_encontrado')}: {miembro.usuarioExistente.nombre}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          {onClose && mode === 'modal' && (
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              {t('botones.cancelar')}
            </button>
          )}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? `⏳ ${t('añadir_participantes.añadiendo')}`
              : `✅ ${t('añadir_participantes.btn_añadir', { tipo: esIndividual ? t('añadir_participantes.jugador') : t('añadir_participantes.equipo') })}`
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnadirParticipantesTorneos;