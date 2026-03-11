import React, { useState, useEffect } from 'react';

import torneosSagaApi from '@/servicios/apiSaga';
import torneosWarmasterApi from '@/servicios/apiWarmaster';
import torneosFowApi from '@/servicios/apiFow';
import torneosEpicApi from '@/servicios/apiEpic';

import '@/estilos/enviarCorreos.css';

const VistaEnviarCorreos = ({ torneoId, torneo, tipoJuego }) => {
  const [participantes, setParticipantes] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [seleccionTodos, setSeleccionTodos] = useState(false);
  const [mensaje_estado, setMensajeEstado] = useState({ tipo: '', texto: '' });

  // Determinar si es torneo por equipos
  const esTorneoEquipos = torneo.tipo_torneo === 'Por equipos';

  // Obtener la API correcta según el tipo de juego
  const obtenerApiCorrecta = () => {
    switch(tipoJuego?.toLowerCase()) {
      case 'saga':
      case 'SAGA':
        return torneosSagaApi;
      case 'warmaster':
      case 'WARMASTER':
        return torneosWarmasterApi;
      case 'flames of war':
      case 'FOW':
      case 'fow':
        return torneosFowApi;
      case 'epic':
      case 'EPIC':
        return torneosEpicApi;
      default:
        console.warn(`Tipo de juego no reconocido: ${tipoJuego}, usando SAGA por defecto`);
        return torneosSagaApi;
    }
  };

  const api = obtenerApiCorrecta();

  useEffect(() => {
    cargarParticipantes();
  }, [torneoId, esTorneoEquipos, tipoJuego]);

  const cargarParticipantes = async () => {
    try {
      const response = esTorneoEquipos 
        ? await api.obtenerCapitanesCorreos(torneoId)
        : await api.obtenerJugadoresCorreos(torneoId);

      // La respuesta viene en formato successResponse
      const data = response.data || response;
      setParticipantes(data);

    } catch (error) {
      console.error('Error al cargar participantes:', error);
      setMensajeEstado({
        tipo: 'error',
        texto: error.message || 'Error al cargar la lista de participantes'
      });
    }
  };

  const handleSeleccionarTodos = () => {
    if (seleccionTodos) {
      setDestinatarios([]);
    } else {
      const todosIds = participantes.map(p => p.id);
      setDestinatarios(todosIds);
    }
    setSeleccionTodos(!seleccionTodos);
  };

  const handleSeleccionarParticipante = (id) => {
    if (destinatarios.includes(id)) {
      setDestinatarios(destinatarios.filter(d => d !== id));
      setSeleccionTodos(false);
    } else {
      const nuevosDestinatarios = [...destinatarios, id];
      setDestinatarios(nuevosDestinatarios);
      
      if (nuevosDestinatarios.length === participantes.length) {
        setSeleccionTodos(true);
      }
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();

    if (destinatarios.length === 0) {
      setMensajeEstado({
        tipo: 'error',
        texto: 'Debes seleccionar al menos un destinatario'
      });
      return;
    }

    if (!asunto.trim() || !mensaje.trim()) {
      setMensajeEstado({
        tipo: 'error',
        texto: 'El asunto y el mensaje son obligatorios'
      });
      return;
    }

    try {
      setEnviando(true);

      const response = await api.enviarCorreoParticipantes(torneoId, {
        destinatarios,
        asunto,
        mensaje,
        tipoTorneo: esTorneoEquipos ? 'equipos' : 'individual'
      });

      const respuestaData = response.data || response;
      const mensajeExito = response.message || 'Correos enviados correctamente';

      setMensajeEstado({
        tipo: 'exito',
        texto: mensajeExito
      });

      // Limpiar formulario
      setAsunto('');
      setMensaje('');
      setDestinatarios([]);
      setSeleccionTodos(false);

      // Mostrar detalles si hay fallos
      if (respuestaData.fallidos > 0) {
        setTimeout(() => {
          setMensajeEstado({
            tipo: 'warning',
            texto: `⚠️ ${respuestaData.exitosos} enviados, ${respuestaData.fallidos} fallidos. Revisa la consola para más detalles.`
          });
        }, 3000);
      }

    } catch (error) {
      console.error('Error al enviar correos:', error);
      setMensajeEstado({
        tipo: 'error',
        texto: error.message || 'Error al enviar los correos'
      });
    } finally {
      setEnviando(false);
    }
  };

  const getNombreParticipante = (participante) => {
    if (esTorneoEquipos) {
      return `${participante.nombre_equipo} - ${participante.nombre_completo}`;
    }
    return participante.nombre_completo || `${participante.nombre} ${participante.apellidos}`;
  };


  // Obtener detalles adicionales del participante según el juego
  const getDetallesParticipante = (participante) => {
    const detalles = [];

    // Para SAGA: época y facción
    if (tipoJuego?.toLowerCase() === 'saga') {
      if (participante.epoca && participante.faccion) {
        detalles.push(
          <span key="epoca-faccion" className="badge">
            🎭 {participante.epoca} - {participante.faccion}
          </span>
        );
      }
    }

    // Para Warmaster: ejército
    if (tipoJuego?.toLowerCase() === 'warmaster') {
      if (participante.ejercito) {
        detalles.push(
          <span key="ejercito" className="badge">
            🏰 {participante.ejercito}
          </span>
        );
      }
    }

    // Para Flames of War: nación y año
    if (tipoJuego?.toLowerCase() === 'flames of war' || tipoJuego?.toLowerCase() === 'flames') {
      if (participante.nacion) {
        detalles.push(
          <span key="nacion" className="badge">
            🔥 {participante.nacion}
          </span>
        );
      }
      if (participante.periodo) {
        detalles.push(
          <span key="periodo" className="badge">
            📅 {participante.periodo}
          </span>
        );
      }
    }

    return detalles;
  };

  return (
    <div className="enviar-correos-container">
      <div className="enviar-correos-header">
        <h2>📧 Enviar Correo a Participantes</h2>
        <p className="subtitulo">
          Comunica información importante a {esTorneoEquipos ? 'los capitanes de equipo' : 'los jugadores'}
        </p>
      </div>

      {mensaje_estado.texto && (
        <div className={`mensaje-estado ${mensaje_estado.tipo}`}>
          <span className="icono">
            {mensaje_estado.tipo === 'exito' && '✅'}
            {mensaje_estado.tipo === 'error' && '❌'}
            {mensaje_estado.tipo === 'warning' && '⚠️'}
          </span>
          <span className="texto">{mensaje_estado.texto}</span>
          <button 
            className="cerrar-mensaje"
            onClick={() => setMensajeEstado({ tipo: '', texto: '' })}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleEnviar} className="form-correo">
        {/* Sección de selección de destinatarios */}
        <div className="seccion-destinatarios">
          <h3>
            Destinatarios {esTorneoEquipos ? '(Capitanes de Equipo)' : '(Jugadores)'}
          </h3>
          
          <div className="seleccionar-todos">
            <label>
              <input
                type="checkbox"
                checked={seleccionTodos}
                onChange={handleSeleccionarTodos}
                disabled={participantes.length === 0}
              />
              <span>Seleccionar todos ({participantes.length})</span>
            </label>
          </div>

          <div className="lista-participantes">
            {participantes.length === 0 ? (
              <div className="sin-participantes">
                <div className="icono-vacio">📭</div>
                <p>No hay participantes {esTorneoEquipos ? 'con equipos formados' : 'inscritos'} en este torneo</p>
                <small>Agrega participantes antes de enviar correos</small>
              </div>
            ) : (
              participantes.map(participante => (
                <div key={participante.id} className="participante-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={destinatarios.includes(participante.id)}
                      onChange={() => handleSeleccionarParticipante(participante.id)}
                    />
                    <div className="participante-info">
                      <span className="nombre">
                        {getNombreParticipante(participante)}
                      </span>
                      <span className="email">{participante.email}</span>
                      <div className="detalles-extra">
                        {esTorneoEquipos && participante.num_miembros && (
                          <span className="badge">
                            👥 {participante.num_miembros} miembros
                          </span>
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
            <span className="texto">seleccionados</span>
          </div>
        </div>

        {/* Sección del correo */}
        <div className="seccion-mensaje">
          <div className="form-group">
            <label htmlFor="asunto">
              Asunto *
              <span className="contador-caracteres">{asunto.length}/200</span>
            </label>
            <input
              type="text"
              id="asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: Recordatorio - Fecha límite de inscripción"
              required
              disabled={enviando}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mensaje">Mensaje *</label>
            <textarea
              id="mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu mensaje aquí...

Puedes incluir:
• Información importante del torneo
• Recordatorios de fechas y horarios
• Instrucciones para el día del evento
• Enlaces o recursos adicionales"
              rows="12"
              required
              disabled={enviando}
            />
          </div>

          <div className="info-mensaje">
            <div className="info-header">
              <span className="icono">💡</span>
              <strong>Información sobre el envío</strong>
            </div>
            <ul>
              <li>El correo incluirá automáticamente el nombre del torneo</li>
              <li>Se enviará con diseño profesional adaptado a {tipoJuego}</li>
              <li>Cada destinatario recibirá un correo individual</li>
              <li>Los saltos de línea se respetarán en el formato final</li>
              <li>El remitente será: Gestiona Tus Torneos - {tipoJuego}</li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="btn-enviar"
            disabled={enviando || destinatarios.length === 0 || participantes.length === 0}
          >
            {enviando ? (
              <>
                <span className="spinner"></span>
                Enviando correos...
              </>
            ) : (
              <>
                ✉️ Enviar Correo
                {destinatarios.length > 0 && ` (${destinatarios.length})`}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VistaEnviarCorreos;