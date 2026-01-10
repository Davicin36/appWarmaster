import React, { useState, useEffect } from 'react';

import torneosSagaApi from '@/servicios/apiSaga';
import usuarioApi from '@/servicios/apiUsuarios';

import '@/estilos/anadirParticipantesTorneos.css';

const AnadirParticipantesTorneos = ({ 
  torneoId,
  onClose, 
  onSuccess,
  mode = 'modal'
}) => {
  // Estados para la información del torneo
  const [torneo, setTorneo] = useState(null);
  const [loadingTorneo, setLoadingTorneo] = useState(true);
  const [errorTorneo, setErrorTorneo] = useState('');
  
  // Estados del formulario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para usuario individual
  const [individualData, setIndividualData] = useState({
    nombre: '',
    email: '',
    usuarioRegistrado: null,
    usuarioExistente: null
  });

  // Estados para equipo
  const [teamData, setTeamData] = useState({
    nombreEquipo: '',
    miembros: []
  });

  // Cargar información del torneo al montar el componente
  useEffect(() => {
    if (torneoId) {
      cargarTorneo();
    } else {
      setErrorTorneo('No se proporcionó un ID de torneo');
      setLoadingTorneo(false);
    }
  }, [torneoId]);

  // Inicializar miembros del equipo cuando se carga el torneo
  useEffect(() => {
    if (torneo && torneo.tipo_torneo === 'Por equipos') {
      const numJugadores = torneo.num_jugadores_equipo || 2;

      if (teamData.miembros.length === 0) {
        const miembrosIniciales = Array(numJugadores).fill(null).map((_, index) => ({
          nombre: '',
          email: '',
          esCapitan: index === 0,
          usuarioRegistrado: null,
          usuarioExistente: null
        }));
        
        setTeamData({
          nombreEquipo: '',
          miembros: miembrosIniciales
        });
      }
    }
  }, [torneo]);

  const cargarTorneo = async () => {
    try {
      setLoadingTorneo(true);
      
      const response = await torneosSagaApi.obtenerTorneo(torneoId);
      const torneoData = response.data?.torneo || response.torneo || response;
      
      setTorneo(torneoData);
      setErrorTorneo('');
    } catch (err) {
      console.error('Error al cargar torneo:', err);
      setErrorTorneo('Error de conexión al cargar el torneo');
    } finally {
      setLoadingTorneo(false);
    }
  };

  const handleIndividualChange = (e) => {
    const { name, value } = e.target;
    setIndividualData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si cambia email, verificar usuario
    if (name === 'email' && value && value.includes('@')) {
      verificarUsuarioIndividual(value);
    }
    
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
        setIndividualData(prev => ({
          ...prev,
          usuarioRegistrado: false,
          usuarioExistente: null
        }));
      }
    } catch (err) {
      console.error('Error al verificar usuario:', err);
    }
  };

  const handleTeamChange = (e) => {
    const { name, value } = e.target;
    setTeamData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleMemberChange = (index, field, value) => {
    const newMiembros = [...teamData.miembros];
    newMiembros[index][field] = value;
    
    // Si cambia email, resetear validación y verificar
    if (field === 'email') {
      newMiembros[index].usuarioRegistrado = null;
      newMiembros[index].usuarioExistente = null;
    }
    
    setTeamData(prev => ({
      ...prev,
      miembros: newMiembros
    }));
    
    // Verificar email cuando se completa
    if (field === 'email' && value && value.includes('@')) {
      verificarUsuarioRegistrado(value, index);
    }
    
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
        
        // Autocompletar nombre si está vacío
        if (!newMiembros[index].nombre.trim()) {
          newMiembros[index].nombre = data.usuario.nombre;
        }
      } else {
        newMiembros[index].usuarioRegistrado = false;
        newMiembros[index].usuarioExistente = null;
      }
      
      setTeamData(prev => ({
        ...prev,
        miembros: newMiembros
      }));
    } catch (err) {
      console.error('Error al verificar usuario:', err);
    }
  };

  const handleCapitanChange = (index) => {
    const newMiembros = teamData.miembros.map((miembro, i) => ({
      ...miembro,
      esCapitan: i === index
    }));
    setTeamData(prev => ({
      ...prev,
      miembros: newMiembros
    }));
  };

  const validateIndividualData = () => {
    if (!individualData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (individualData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(individualData.email)) {
      setError('El email no es válido');
      return false;
    }
    return true;
  };

  const validateTeamData = () => {
    if (!teamData.nombreEquipo.trim()) {
      setError('El nombre del equipo es obligatorio');
      return false;
    }
    
    const capitanes = teamData.miembros.filter(m => m.esCapitan);
    if (capitanes.length !== 1) {
      setError('Debe haber exactamente un capitán');
      return false;
    }
    
    for (let i = 0; i < teamData.miembros.length; i++) {
      const miembro = teamData.miembros[i];
      if (!miembro.nombre.trim()) {
        setError(`El nombre del miembro ${i + 1} es obligatorio`);
        return false;
      }
      if (miembro.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(miembro.email)) {
        setError(`El email del miembro ${i + 1} no es válido`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!torneo) {
      setError('Error: No se ha cargado la información del torneo');
      return;
    }

    const esIndividual = torneo.tipo_torneo === 'Individual';

    if (esIndividual) {
      if (!validateIndividualData()) return;
    } else {
      if (!validateTeamData()) return;
    }

    setLoading(true);

    try {
      let resultado;

      if (esIndividual) {
        // ✅ ENVIAR SOLO NOMBRE Y EMAIL
        const participanteNormalizado = {
          nombre: individualData.nombre,
          email: individualData.email || null
        };

        console.log('📤 Enviando participante:', participanteNormalizado);
        resultado = await torneosSagaApi.añadirJugadorIndividual(torneoId, participanteNormalizado);
        
      } else {
        // ✅ ENVIAR SOLO NOMBRE Y EMAIL POR CADA MIEMBRO
        const equipoNormalizado = {
          nombreEquipo: teamData.nombreEquipo,
          miembros: teamData.miembros.map(miembro => ({
            nombre: miembro.nombre,
            email: miembro.email || null,
            esCapitan: miembro.esCapitan
          }))
        };

        console.log('📤 Enviando equipo:', equipoNormalizado);
        resultado = await torneosSagaApi.añadirEquipo(torneoId, equipoNormalizado);
      }

      if (resultado.success) {
        setSuccess(resultado.message || 'Participante añadido correctamente');
        
        // Resetear formularios
        if (esIndividual) {
          setIndividualData({
            nombre: '',
            email: '',
            usuarioRegistrado: null,
            usuarioExistente: null
          });
        } else {
          const numJugadores = torneo.num_jugadores_equipo || 2;
          const miembrosVacios = Array(numJugadores).fill(null).map((_, index) => ({
            nombre: '',
            email: '',
            esCapitan: index === 0,
            usuarioRegistrado: null,
            usuarioExistente: null
          }));
          
          setTeamData({
            nombreEquipo: '',
            miembros: miembrosVacios
          });
        }

        if (onSuccess) {
          setTimeout(() => {
            onSuccess(resultado);
          }, 1500);
        }
      } else {
        setError(resultado.message || 'Error al añadir participante');
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras carga el torneo
  if (loadingTorneo) {
    return (
      <div className={`add-participants-container ${mode === 'page' ? 'add-participants-page' : ''}`}>
        <div className="loading-container">
          <p>⏳ Cargando información del torneo...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si no se pudo cargar el torneo
  if (errorTorneo) {
    return (
      <div className={`add-participants-container ${mode === 'page' ? 'add-participants-page' : ''}`}>
        <div className="add-participants-header">
          <h2>Error</h2>
          {onClose && mode === 'modal' && (
            <button className="close-btn" onClick={onClose} type="button">✕</button>
          )}
        </div>
        <div className="error-message">⚠️ {errorTorneo}</div>
      </div>
    );
  }

  if (!torneo) {
    return (
      <div className="loading-container">
        <p>⏳ Cargando información del torneo...</p>
      </div>
    );
  }

  const esIndividual = torneo?.tipo_torneo === 'Individual';

  return (
    <div className={`add-participants-container ${mode === 'page' ? 'add-participants-page' : ''}`}>
      <div className="add-participants-header">
        <h2>
          {esIndividual ? '👤 Añadir Jugador' : '👥 Añadir Equipo'}
        </h2>
        {onClose && mode === 'modal' && (
          <button className="close-btn" onClick={onClose} type="button">✕</button>
        )}
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      {/* Información del torneo */}
      <div className="tournament-info">
        <h3>{torneo.nombre_torneo}</h3>
        <p>
          <strong>Sistema:</strong> {torneo.sistema} | <strong>Tipo:</strong> {torneo.tipo_torneo}
          {!esIndividual && ` | ${torneo.num_jugadores_equipo} jugadores por equipo`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="add-participants-form">
        {/* FORMULARIO INDIVIDUAL */}
        {esIndividual && (
          <div className="individual-form">
            <h4>Datos del Jugador</h4>
            
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={individualData.nombre}
                onChange={handleIndividualChange}
                placeholder="Nombre del jugador"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-con-badge">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={individualData.email}
                  onChange={handleIndividualChange}
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                  className={
                    individualData.usuarioRegistrado === true ? 'input-success' :
                    individualData.usuarioRegistrado === false ? 'input-warning' : ''
                  }
                />
                {individualData.email && individualData.usuarioRegistrado === true && (
                  <span className="badge-registro registrado" title="Usuario ya registrado">
                    ✅ Registrado
                  </span>
                )}
                {individualData.email && individualData.usuarioRegistrado === false && (
                  <span className="badge-registro pendiente" title="Usuario nuevo - se creará cuenta pendiente">
                    ⏳ Nuevo usuario
                  </span>
                )}
              </div>
              {individualData.usuarioRegistrado === false && individualData.email && (
                <small style={{ 
                  color: '#0284c7', 
                  fontSize: '0.85rem', 
                  marginTop: '0.25rem', 
                  display: 'block',
                  fontWeight: '500'
                }}>
                  ℹ️ Se creará una cuenta pendiente de registro y se enviará un email
                </small>
              )}
            </div>
          </div>
        )}

        {/* FORMULARIO POR EQUIPOS */}
        {!esIndividual && (
          <div className="team-form">
            <h4>Datos del Equipo</h4>
            
            <div className="form-group">
              <label htmlFor="nombreEquipo">Nombre del Equipo *</label>
              <input
                type="text"
                id="nombreEquipo"
                name="nombreEquipo"
                value={teamData.nombreEquipo}
                onChange={handleTeamChange}
                placeholder="Nombre del equipo"
                required
                disabled={loading}
              />
            </div>

            <div className="members-section">
              <h5>Miembros del Equipo ({torneo.num_jugadores_equipo} jugadores)</h5>

              {teamData.miembros.map((miembro, index) => (
                <div key={index} className="member-card">
                  <div className="member-card-header">
                    <h6>Jugador {index + 1}</h6>
                    <label className="capitan-checkbox">
                      <input
                        type="radio"
                        name="capitan"
                        checked={miembro.esCapitan}
                        onChange={() => handleCapitanChange(index)}
                        disabled={loading}
                      />
                      <span>Capitán</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={miembro.nombre}
                      onChange={(e) => handleMemberChange(index, 'nombre', e.target.value)}
                      placeholder="Nombre"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-con-badge">
                      <input
                        type="email"
                        value={miembro.email}
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        disabled={loading}
                        className={
                          miembro.usuarioRegistrado === true ? 'input-success' :
                          miembro.usuarioRegistrado === false ? 'input-warning' : ''
                        }
                      />
                      {miembro.email && miembro.usuarioRegistrado === true && (
                        <span className="badge-registro registrado" title="Usuario ya registrado">
                          ✅ Registrado
                        </span>
                      )}
                      {miembro.email && miembro.usuarioRegistrado === false && (
                        <span className="badge-registro pendiente" title="Usuario nuevo - se creará cuenta pendiente">
                          ⏳ Nuevo usuario
                        </span>
                      )}
                    </div>
                    {miembro.usuarioRegistrado === false && miembro.email && (
                      <small style={{ 
                        color: '#0284c7', 
                        fontSize: '0.85rem', 
                        marginTop: '0.25rem', 
                        display: 'block',
                        fontWeight: '500'
                      }}>
                        ℹ️ Se enviará un email de invitación
                      </small>
                    )}
                    {miembro.usuarioRegistrado === true && miembro.usuarioExistente && (
                      <small style={{ 
                        color: '#16a34a', 
                        fontSize: '0.85rem', 
                        marginTop: '0.25rem', 
                        display: 'block',
                        fontWeight: '500'
                      }}>
                        ✓ Usuario: {miembro.usuarioExistente.nombre}
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
              Cancelar
            </button>
          )}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Añadiendo...' : `✅ Añadir ${esIndividual ? 'Jugador' : 'Equipo'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnadirParticipantesTorneos;