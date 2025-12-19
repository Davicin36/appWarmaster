import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { torneosSagaApi } from '@/servicios/apiSaga';
import { usuarioApi } from '@/servicios/apiUsuarios';
import { 
  PUNTOS_BANDA_RANGO,
  obtenerBandasDisponibles
} from '../funcionesSaga/constantesFuncionesSaga';

import '../../estilos/inscripcionesEquipo.css';

function InscripcionSagaEquipos({ torneoId, torneo, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const modoEdicion = location.pathname.includes('editar-inscripcion');
  
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [miembrosEquipo, setMiembrosEquipo] = useState([
    { 
      nombre: `${user?.nombre} ${user?.apellidos}`,
      email: user?.email,
      epoca: "",
      banda: "",
      puntos: {
        guardias: 0,
        guerreros: 0,
        levas: 0,
        mercenarios: 0
      },
      detalleMercenarios: "",
      esCapitan: true,
      esYo: true,
      usuarioValido: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const jugadoresPorEquipo = torneo?.num_jugadores_equipo;
  const puntosMaximos = torneo?.puntos_banda || PUNTOS_BANDA_RANGO.default;
  
  // ==========================================
  // PROCESAR LAS ÉPOCAS DISPONIBLES
  // ==========================================
  const epocasArray = React.useMemo(() => {
    if (!torneo?.epocas_disponibles) {
      console.warn('⚠️ No hay épocas disponibles definidas en el torneo');  
      return [];
    }

    const epocasString = torneo.epocas_disponibles;
    
    let epocas = [];

    // DETECTAR TIPO DE SEPARADOR
    if (epocasString.includes('|')) {
      epocas = epocasString.split('|');
    } else if (epocasString.includes(',')) {
      epocas = epocasString.split(',');
    } else {
      epocas = [epocasString];
    }

    const epocasLimpias = epocas.map(e => e.trim()).filter(e => e.length > 0);
    return epocasLimpias;
  }, [torneo?.epocas_disponibles]);

  // ==========================================
  // CARGAR EQUIPO EXISTENTE
  // ==========================================
  useEffect(() => {
    const cargarEquipo = async () => {
      if (!modoEdicion) return;

      try {
        setLoading(true);
        const data = await torneosSagaApi.obtenerInscripcionEquipo(torneoId);
        
        if (data.success && data.data) {
          const equipo = data.data;
          
          setNombreEquipo(equipo.nombre_equipo || "");
          
          if (equipo.miembros && Array.isArray(equipo.miembros)) {
            setMiembrosEquipo(equipo.miembros.map(m => ({
              nombre: m.nombre,
              email: m.email,
              epoca: m.epoca,
              banda: m.banda || "",
              puntos: m.puntos || { guardias: 0, guerreros: 0, levas: 0, mercenarios: 0 },
              detalleMercenarios: m.detalle_mercenarios || "",
              esCapitan: m.es_capitan,
              esYo: m.usuario_id === user.id,
              usuarioValido: true
            })));
          }
        }
      } catch (err) {
        console.error("❌ Error:", err);
        setError("No se pudo cargar el equipo");
      } finally {
        setLoading(false);
      }
    };

    cargarEquipo();
  }, [modoEdicion, torneoId, user.id]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const agregarMiembro = () => {
    if (miembrosEquipo.length < jugadoresPorEquipo) {
      setMiembrosEquipo([
        ...miembrosEquipo,
        { 
          nombre: "", 
          email: "", 
          epoca: "",
          banda: "",
          puntos: { guardias: 0, guerreros: 0, levas: 0, mercenarios: 0 },
          detalleMercenarios: "",
          esCapitan: false,
          esYo: false,
          usuarioValido: null
        }
      ]);
      setError("");
    } else {
      setError(`Máximo ${jugadoresPorEquipo} jugadores`);
    }
  };

  const eliminarMiembro = (index) => {
    if (miembrosEquipo[index].esYo) {
      setError("No puedes eliminarte del equipo");
      return;
    }
    
    if (miembrosEquipo.length > 1) {
      const nuevosMiembros = miembrosEquipo.filter((_, i) => i !== index);
      setMiembrosEquipo(nuevosMiembros);
      setError("");
    }
  };

  const actualizarMiembro = (index, campo, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index][campo] = valor;
    
    // Si cambia época, resetear banda Y puntos
    if (campo === 'epoca') {
      nuevosMiembros[index].banda = "";
      nuevosMiembros[index].puntos = { guardias: 0, guerreros: 0, levas: 0, mercenarios: 0 };
      nuevosMiembros[index].detalleMercenarios = "";
    }
    
    // Si se borra la banda, resetear puntos
    if (campo === 'banda' && !valor) {
      nuevosMiembros[index].puntos = { guardias: 0, guerreros: 0, levas: 0, mercenarios: 0 };
      nuevosMiembros[index].detalleMercenarios = "";
    }
    
    // Si cambia email, resetear validación
    if (campo === 'email') {
      nuevosMiembros[index].usuarioValido = null;
    }
    
    setMiembrosEquipo(nuevosMiembros);
  };

  const actualizarPuntos = (index, tipoPunto, valor) => {
    const nuevosMiembros = [...miembrosEquipo];
    nuevosMiembros[index].puntos[tipoPunto] = parseFloat(valor) || 0;
    
    // Si mercenarios = 0, limpiar detalle
    if (tipoPunto === 'mercenarios' && parseFloat(valor) === 0) {
      nuevosMiembros[index].detalleMercenarios = "";
    }
    
    setMiembrosEquipo(nuevosMiembros);
  };

  const marcarComoCapitan = (index) => {
    const nuevosMiembros = miembrosEquipo.map((miembro, i) => ({
      ...miembro,
      esCapitan: i === index
    }));
    setMiembrosEquipo(nuevosMiembros);
  };

  const verificarUsuario = async (email, index) => {
    if (!email || !email.includes('@')) return;

    try {
      const resultado = await usuarioApi.verificarUsuario(email);
      
      if (resultado.existe && resultado.usuario) {
        if (!miembrosEquipo[index].nombre.trim()) {
          actualizarMiembro(index, 'nombre', 
            `${resultado.usuario.nombre} ${resultado.usuario.apellidos || ''}`.trim()
          );
        }
        actualizarMiembro(index, 'usuarioValido', true);
      } else {
        actualizarMiembro(index, 'usuarioValido', false);
      }
    } catch (err) {
      console.error("Error:", err);
      actualizarMiembro(index, 'usuarioValido', false);
    }
  };

  const calcularTotalPuntos = (puntos) => {
    return puntos.guardias + puntos.guerreros + puntos.levas + puntos.mercenarios;
  };

  const validarPuntosMiembro = (miembro) => {
    const total = calcularTotalPuntos(miembro.puntos);
    return Math.abs(total - puntosMaximos) < 0.01;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!nombreEquipo.trim()) {
      setError("Debes ingresar un nombre para el equipo");
      return;
    }

    // Validar que el torneo tiene configuración
    if (!jugadoresPorEquipo) {
      setError("Error: El torneo no tiene configurado el número de jugadores por equipo");
      return;
    }

    // Solo validar nombre, email y época (banda y puntos son opcionales)
    const miembrosValidos = miembrosEquipo.filter(
      m => m.nombre.trim() && m.email.trim() && m.epoca
    );
    
    if (miembrosValidos.length !== jugadoresPorEquipo) {
      setError(`El equipo debe tener exactamente ${jugadoresPorEquipo} jugadores (incluyéndote). Actualmente tienes ${miembrosValidos.length}.`);
      return;
    }

    // Validar usuarios registrados
    const usuariosNoValidos = miembrosValidos.filter(m => m.usuarioValido !== true);
    if (usuariosNoValidos.length > 0) {
      setError("Todos los jugadores deben estar registrados");
      return;
    }

    // Solo validar puntos si el miembro tiene banda seleccionada
    const miembrosConBanda = miembrosValidos.filter(m => m.banda && m.banda.trim());
    const miembrosSinPuntosCorrectos = miembrosConBanda.filter(m => !validarPuntosMiembro(m));
    
    if (miembrosSinPuntosCorrectos.length > 0) {
      setError(`Los jugadores con banda seleccionada deben tener exactamente ${puntosMaximos} puntos distribuidos`);
      return;
    }

    // Solo validar mercenarios si hay banda
    for (const miembro of miembrosValidos) {
      if (miembro.banda && miembro.puntos.mercenarios > 0 && !miembro.detalleMercenarios.trim()) {
        setError(`El jugador ${miembro.nombre} debe detallar sus mercenarios`);
        return;
      }
    }

    // Validar emails únicos
    const emails = miembrosValidos.map(m => m.email.toLowerCase());
    if (new Set(emails).size !== emails.length) {
      setError("No puede haber emails duplicados");
      return;
    }

    if (!miembrosValidos.some(m => m.esCapitan)) {
      setError("Debe haber un capitán");
      return;
    }

    try {
      setLoading(true);
      
      // Encontrar mis datos
      const misDatos = miembrosValidos.find(m => m.esYo);
      
      if (!misDatos) {
        setError("Error: No se encontraron tus datos en el equipo");
        return;
      }

      // Otros miembros (sin "yo")
      const otrosMiembros = miembrosValidos.filter(m => !m.esYo);
      
      // Contar usuarios no registrados ANTES de enviar
      const usuariosNoRegistrados = otrosMiembros.filter(m => m.usuarioValido === false);

      const inscripcionData = {
        nombreEquipo: nombreEquipo.trim(),
        miembros: modoEdicion 
          ? miembrosValidos.map(m => ({
              nombre: m.nombre.trim(),
              email: m.email.toLowerCase().trim(),
              epoca: m.epoca,
              banda: m.banda || null,
              puntos: m.banda ? m.puntos : null,
              detalleMercenarios: (m.banda && m.detalleMercenarios) ? m.detalleMercenarios : null,
              esCapitan: m.esCapitan
            }))
          : otrosMiembros.map(m => ({
              nombre: m.nombre.trim(),
              email: m.email.toLowerCase().trim(),
              epoca: m.epoca,
              banda: m.banda || null,
              puntos: m.banda ? m.puntos : null,
              detalleMercenarios: (m.banda && m.detalleMercenarios) ? m.detalleMercenarios : null
            }))
      };

      // En modo creación, añadir mis propios datos
      if (!modoEdicion) {
        inscripcionData.miEpoca = misDatos.epoca;
        inscripcionData.miBanda = misDatos.banda || null;
        inscripcionData.misPuntos = misDatos.banda ? misDatos.puntos : null;
        inscripcionData.miDetalleMercenarios = (misDatos.banda && misDatos.detalleMercenarios) ? misDatos.detalleMercenarios : null;
      }

      console.log('📤 Datos a enviar:');
      console.log('  - Nombre equipo:', inscripcionData.nombreEquipo);
      console.log('  - Otros miembros:', inscripcionData.miembros.length);
      console.log('  - Mi época:', inscripcionData.miEpoca);
      console.log('  - Mi banda:', inscripcionData.miBanda);

      let resultado;
      
      if (modoEdicion) {
        resultado = await torneosSagaApi.actualizarInscripcionEquipos(torneoId, inscripcionData);
        alert("✅ Equipo actualizado correctamente");
      } else {
        resultado = await torneosSagaApi.IncripcionEquipo(torneoId, inscripcionData);
        
        // Mensaje mejorado con info de invitaciones
        if (usuariosNoRegistrados.length > 0) {
          alert(
            `✅ Equipo inscrito correctamente\n\n` +
            `📧 Se han enviado ${usuariosNoRegistrados.length} invitación(es) por email:\n` +
            usuariosNoRegistrados.map(m => `• ${m.nombre} (${m.email})`).join('\n') +
            `\n\nLos jugadores recibirán instrucciones para completar su registro.`
          );
        } else {
          alert("✅ Equipo inscrito correctamente");
        }
      }
      
      if (resultado.success) {
        navigate('/');
      }
      
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || "Error al procesar la inscripción");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="inscripcion-container">
      
      <h1>
        {modoEdicion ? '✏️ Editar Equipo' : '👥 Inscribir Equipo'}: {torneo?.nombre_torneo}
      </h1>
      
      {/* Mensaje informativo principal */}
      <div className="info-message info-equipos">
        ℹ️ Cada jugador debe seleccionar su época. La banda y los puntos son opcionales, pero si se elige banda, los puntos deben sumar {puntosMaximos}.
      </div>

      {/* Aviso sobre invitaciones automáticas */}
      <div className="info-message info-invitaciones" style={{ 
        backgroundColor: '#e0f2fe', 
        borderLeft: '4px solid #0284c7',
        marginTop: '1rem'
      }}>
        📧 Los jugadores no registrados recibirán automáticamente un email de invitación para completar su registro en la plataforma.
      </div>

      <form onSubmit={handleSubmit} className="inscripcion-form">
        
        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="form-group">
          <label htmlFor="nombreEquipo">Nombre del Equipo *</label>
          <input
            type="text"
            id="nombreEquipo"
            value={nombreEquipo}
            onChange={(e) => setNombreEquipo(e.target.value)}
            placeholder="Ej: Los Guerreros del Norte"
            required
            disabled={loading}
            maxLength={50}
          />
        </div>

        <section className="miembros-section">
          <div className="miembros-header">
            <h3>Jugadores ({miembrosEquipo.length}/{jugadoresPorEquipo})</h3>
            {miembrosEquipo.length < jugadoresPorEquipo && (
              <button 
                type="button" 
                onClick={agregarMiembro}
                className="btn-agregar"
                disabled={loading}
              >
                ➕ Agregar
              </button>
            )}
          </div>

          <div className="miembros-lista">
            {miembrosEquipo.map((miembro, index) => {
              const totalPuntos = calcularTotalPuntos(miembro.puntos);
              const puntosCorrectos = Math.abs(totalPuntos - puntosMaximos) < 0.01;
              const bandasDisponibles = miembro.epoca 
                  ? obtenerBandasDisponibles(miembro.epoca)
                  : [];

              return (
                <div key={index} className="miembro-item">
                  <div className="miembro-header-row">
                    <div className="miembro-numero">
                      {miembro.esYo ? '👤 Tú' : `Jugador ${index + 1}`}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => marcarComoCapitan(index)}
                      className={`btn-capitan ${miembro.esCapitan ? 'activo' : ''}`}
                      disabled={loading}
                    >
                      {miembro.esCapitan ? '👑 Capitán' : 'Hacer Capitán'}
                    </button>
                  </div>
                  
                  <div className="miembro-campos">
                    {/* NOMBRE */}
                    <div className="form-group">
                      <label htmlFor={`nombre-${index}`}>Nombre *</label>
                      <input
                        type="text"
                        id={`nombre-${index}`}
                        value={miembro.nombre}
                        onChange={(e) => actualizarMiembro(index, 'nombre', e.target.value)}
                        required
                        disabled={loading || miembro.esYo}
                        placeholder="Nombre completo del jugador"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="form-group">
                      <label htmlFor={`email-${index}`}>Email *</label>
                      <div className="input-con-badge">
                        <input
                          type="email"
                          id={`email-${index}`}
                          value={miembro.email}
                          onChange={(e) => actualizarMiembro(index, 'email', e.target.value)}
                          onBlur={() => !miembro.esYo && verificarUsuario(miembro.email, index)}
                          required
                          disabled={loading || miembro.esYo}
                          placeholder="email@ejemplo.com"
                          className={
                            miembro.usuarioValido === false ? 'input-error' :
                            miembro.usuarioValido === true ? 'input-success' : ''
                          }
                        />
                        {!miembro.esYo && miembro.email && miembro.usuarioValido === true && (
                          <span className="badge-registro registrado">✅ Registrado</span>
                        )}
                        {!miembro.esYo && miembro.email && miembro.usuarioValido === false && (
                          <span 
                            className="badge-registro no-registrado" 
                            title="Recibirá invitación automática por email"
                          >
                            ⚠️ No registrado
                          </span>
                        )}
                      </div>
                      {!miembro.esYo && miembro.usuarioValido === false && miembro.email && (
                        <small style={{ 
                          color: '#0284c7', 
                          fontSize: '0.85rem', 
                          marginTop: '0.25rem', 
                          display: 'block',
                          fontWeight: '500'
                        }}>
                          📧 Se le enviará un email automáticamente para que complete su registro
                        </small>
                      )}
                    </div>

                    {/* ÉPOCA */}
                    <div className="form-group">
                      <label htmlFor={`epoca-${index}`}>
                        Época *
                        <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                          ({epocasArray.length} disponible{epocasArray.length !== 1 ? 's' : ''})
                        </span>
                      </label>
                      <select
                        id={`epoca-${index}`}
                        value={miembro.epoca}
                        onChange={(e) => actualizarMiembro(index, 'epoca', e.target.value)}
                        required
                        disabled={loading}
                      >
                        <option value="">-- Selecciona época --</option>
                        {epocasArray.length === 0 ? (
                          <option value="" disabled>⚠️ No hay épocas disponibles</option>
                        ) : (
                          epocasArray.map((epoca, i) => (
                            <option key={i} value={epoca}>
                              {epoca}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* BANDA - OPCIONAL */}
                    {miembro.epoca && (
                      <div className="form-group">
                        <label htmlFor={`banda-${index}`}>
                          Banda (Opcional) ({miembro.epoca})
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                            ({bandasDisponibles.length} disponible{bandasDisponibles.length !== 1 ? 's' : ''})
                          </span>
                        </label>
                        <select
                          id={`banda-${index}`}
                          value={miembro.banda}
                          onChange={(e) => actualizarMiembro(index, 'banda', e.target.value)}
                          disabled={loading}
                        >
                          <option value="">-- Selecciona banda (opcional) --</option>
                          {bandasDisponibles.length === 0 ? (
                            <option value="" disabled>⚠️ No hay bandas para esta época</option>
                          ) : (
                            bandasDisponibles.map((banda, i) => (
                              <option key={i} value={banda.nombre}>
                                {banda.nombre}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    {/* DISTRIBUCIÓN DE PUNTOS - Solo si hay BANDA */}
                    {miembro.banda && (
                      <div className="puntos-banda-section">
                        <h4>Distribución de Puntos</h4>
                        <p className="puntos-info">
                          Total: <strong>{totalPuntos.toFixed(1)}</strong> / {puntosMaximos}
                          {!puntosCorrectos && (
                            <span className="puntos-error">
                              {totalPuntos < puntosMaximos 
                                ? ` ⚠️ Faltan ${(puntosMaximos - totalPuntos).toFixed(1)}`
                                : ` ⚠️ Excede por ${(totalPuntos - puntosMaximos).toFixed(1)}`
                              }
                            </span>
                          )}
                          {puntosCorrectos && <span className="puntos-ok"> ✅</span>}
                        </p>

                        <div className="puntos-grid-mini">
                          <div className="punto-item-mini">
                            <label htmlFor={`guardias-${index}`}>Guardias</label>
                            <input
                              type="number"
                              id={`guardias-${index}`}
                              value={miembro.puntos.guardias}
                              onChange={(e) => actualizarPuntos(index, 'guardias', e.target.value)}
                              min="0"
                              max={puntosMaximos}
                              step="0.5"
                              disabled={loading}
                            />
                          </div>

                          <div className="punto-item-mini">
                            <label htmlFor={`guerreros-${index}`}>Guerreros</label>
                            <input
                              type="number"
                              id={`guerreros-${index}`}
                              value={miembro.puntos.guerreros}
                              onChange={(e) => actualizarPuntos(index, 'guerreros', e.target.value)}
                              min="0"
                              max={puntosMaximos}
                              step="0.5"
                              disabled={loading}
                            />
                          </div>

                          <div className="punto-item-mini">
                            <label htmlFor={`levas-${index}`}>Levas</label>
                            <input
                              type="number"
                              id={`levas-${index}`}
                              value={miembro.puntos.levas}
                              onChange={(e) => actualizarPuntos(index, 'levas', e.target.value)}
                              min="0"
                              max={puntosMaximos}
                              step="0.5"
                              disabled={loading}
                            />
                          </div>

                          <div className="punto-item-mini">
                            <label htmlFor={`mercenarios-${index}`}>Mercenarios</label>
                            <input
                              type="number"
                              id={`mercenarios-${index}`}
                              value={miembro.puntos.mercenarios}
                              onChange={(e) => actualizarPuntos(index, 'mercenarios', e.target.value)}
                              min="0"
                              max={puntosMaximos}
                              step="0.5"
                              disabled={loading}
                            />
                          </div>
                        </div>

                        {miembro.puntos.mercenarios > 0 && (
                          <div className="form-group">
                            <label htmlFor={`detalle-merc-${index}`}>Detalle Mercenarios *</label>
                            <textarea
                              id={`detalle-merc-${index}`}
                              value={miembro.detalleMercenarios}
                              onChange={(e) => actualizarMiembro(index, 'detalleMercenarios', e.target.value)}
                              placeholder="Ej: Arqueros Cretenses, Caballería Numida..."
                              rows="2"
                              required
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!miembro.esYo && miembrosEquipo.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarMiembro(index)}
                      className="btn-eliminar"
                      disabled={loading}
                      title="Eliminar jugador"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Procesando...' : (modoEdicion ? '✅ Guardar Cambios' : '✅ Inscribir Equipo')}
          </button>
          
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate(-1)} 
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default InscripcionSagaEquipos;