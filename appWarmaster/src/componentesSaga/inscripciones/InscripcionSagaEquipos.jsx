// componentesSaga/inscripciones/InscripcionSagaEquipos.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { torneosSagaApi } from '@/servicios/apiSaga';
import { usuarioApi } from '@/servicios/apiUsuarios';
import { 
  JUGADORES_EQUIPO_RANGO,
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

  const jugadoresPorEquipo = torneo?.num_jugadores_equipo
  const puntosMaximos = torneo?.puntos_banda || PUNTOS_BANDA_RANGO.default;
  

  //PROCESAR LAS EPOCAS DISPONIBLES

  const epocasArray = React.useMemo(() => {
    if (!torneo?.epocas_disponibles) {
      console.warn ('⚠️ No hay épocas disponibles definidas en el torneo');  
      return [];
    }

    const epocasString = torneo.epocas_disponibles
    
    let epocas = []

    //DETECTAR TIPO DE SEPARADOR
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
    
    // Si cambia época, resetear banda
    if (campo === 'epoca') {
      nuevosMiembros[index].banda = "";
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

    // ✅ VALIDAR QUE EL TORNEO TIENE CONFIGURACIÓN
    if (!jugadoresPorEquipo) {
      setError("Error: El torneo no tiene configurado el número de jugadores por equipo");
      return;
    }

    const miembrosValidos = miembrosEquipo.filter(
      m => m.nombre.trim() && m.email.trim() && m.epoca && m.banda
    );
    
    // 🔍 LOGS DE DEBUG
    console.log('📊 Estado actual del equipo:');
    console.log('  - Total en formulario:', miembrosEquipo.length);
    console.log('  - Miembros válidos:', miembrosValidos.length);
    console.log('  - Jugadores por equipo (torneo):', jugadoresPorEquipo);
    console.log('  - Yo incluido:', miembrosValidos.some(m => m.esYo));
    
    // ✅ CORRECCIÓN: La sintaxis estaba mal
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

    // Validar puntos de cada miembro
    const miembrosSinPuntosCorrectos = miembrosValidos.filter(m => !validarPuntosMiembro(m));
    if (miembrosSinPuntosCorrectos.length > 0) {
      setError(`Todos los jugadores deben tener exactamente ${puntosMaximos} puntos distribuidos`);
      return;
    }

    // Validar mercenarios
    for (const miembro of miembrosValidos) {
      if (miembro.puntos.mercenarios > 0 && !miembro.detalleMercenarios.trim()) {
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

      const inscripcionData = {
        nombreEquipo: nombreEquipo.trim(),
        miembros: modoEdicion 
          ? miembrosValidos.map(m => ({
              nombre: m.nombre.trim(),
              email: m.email.toLowerCase().trim(),
              epoca: m.epoca,
              banda: m.banda,
              puntos: m.puntos,
              detalleMercenarios: m.detalleMercenarios || null,
              esCapitan: m.esCapitan
            }))
          : otrosMiembros.map(m => ({
              email: m.email.toLowerCase().trim(),
              epoca: m.epoca,
              banda: m.banda,
              puntos: m.puntos,
              detalleMercenarios: m.detalleMercenarios || null
            }))
      };

      // En modo creación, añadir mis propios datos
      if (!modoEdicion) {
        inscripcionData.miEpoca = misDatos.epoca;
        inscripcionData.miBanda = misDatos.banda;
        inscripcionData.misPuntos = misDatos.puntos;
        inscripcionData.miDetalleMercenarios = misDatos.detalleMercenarios || null;
      }

      // 🔍 LOG CRÍTICO
      console.log('📤 Datos a enviar:');
      console.log('  - Nombre equipo:', inscripcionData.nombreEquipo);
      console.log('  - Otros miembros:', inscripcionData.miembros.length);
      console.log('  - Mi época:', inscripcionData.miEpoca);
      console.log('  - Mi banda:', inscripcionData.miBanda);
      console.log('  - Total jugadores:', inscripcionData.miembros.length + 1);

      let resultado;
      
      if (modoEdicion) {
        resultado = await torneosSagaApi.actualizarInscripcionEquipos(torneoId, inscripcionData);
        alert("✅ Equipo actualizado");
      } else {
        resultado = await torneosSagaApi.IncripcionEquipo(torneoId, inscripcionData);
        alert("✅ Equipo inscrito");
      }
      
      if (resultado.success) {
        navigate('/');
      }
      
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || "Error al procesar");
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
      
      <div className="info-message info-equipos">
        ℹ️ Serás el capitán inicial. Cada jugador debe configurar su banda con {puntosMaximos} puntos.
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
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={miembro.nombre}
                        onChange={(e) => actualizarMiembro(index, 'nombre', e.target.value)}
                        required
                        disabled={loading || miembro.esYo}
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="form-group">
                      <label>Email *</label>
                      <div className="input-con-badge">
                        <input
                          type="email"
                          value={miembro.email}
                          onChange={(e) => actualizarMiembro(index, 'email', e.target.value)}
                          onBlur={() => !miembro.esYo && verificarUsuario(miembro.email, index)}
                          required
                          disabled={loading || miembro.esYo}
                          className={
                            miembro.usuarioValido === false ? 'input-error' :
                            miembro.usuarioValido === true ? 'input-success' : ''
                          }
                        />
                        {!miembro.esYo && miembro.email && miembro.usuarioValido === true && (
                          <span className="badge-registro registrado">✅</span>
                        )}
                        {!miembro.esYo && miembro.email && miembro.usuarioValido === false && (
                          <span className="badge-registro no-registrado">❌</span>
                        )}
                      </div>
                    </div>

                    {/* ÉPOCA */}
                    <div className="form-group">
                      <label htmlFor={`epoca-${index}`}>
                        Época *
                        <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}> ({epocasArray.length} disponible{epocasArray.length !== 1 ? 's' : ' '})</span>
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

                    {/* BANDA - Solo si hay época seleccionada */}
                    {miembro.epoca && (
                      <div className="form-group">
                        <label htmlFor = {`banda-${index}`}>
                          Banda * ({miembro.epoca})
                          <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                            ({bandasDisponibles.length} disponible{bandasDisponibles.length !== 1 ? 's' : ''})
                          </span>
                        </label>
                        <select
                          id={`banda-${index}`}
                          value={miembro.banda}
                          onChange={(e) => actualizarMiembro(index, 'banda', e.target.value)}
                          required
                          disabled={loading}
                        >
                          <option value="">-- Selecciona banda --</option>
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

                    {/* DISTRIBUCIÓN DE PUNTOS - Solo si hay banda seleccionada */}
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
                              placeholder="Ej: Arqueros Cretenses, Caballería..."
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
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="button-group">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Procesando...' : (modoEdicion ? '✅ Guardar' : '✅ Inscribir')}
          </button>
          
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default InscripcionSagaEquipos;