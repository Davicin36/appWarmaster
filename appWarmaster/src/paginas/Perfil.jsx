import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

import usuarioApi from "../servicios/apiUsuarios.js";

import '../estilos/perfil.css'


function Perfil() {
    const { user, logout, cambiarPassword, convertirOrganizador, actualizarUsuario } = useAuth();
    const navigate = useNavigate();
    
    // Estados para edicion de perfil
    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({
        nombre: user?.nombre || "",
        apellidos: user?.apellidos || "",
        nombre_alias: user?.nombre_alias || "",
        club: user?.club || "",
        email: user?.email || "",
        localidad: user?.localidad || "",
        pais: user?.pais || ""
    });
    const [loadingEdicion, setLoadingEdicion] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState("");
    const [successEdicion, setSuccessEdicion] = useState("");
    
    // Estados para cambio de contraseña
    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        passwordActual: "",
        passwordNueva: "",
        confirmarPassword: ""
    });
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [errorPassword, setErrorPassword] = useState("");
    const [successPassword, setSuccessPassword] = useState("");
    
    // Estados para conversion a organizador
    const [loadingOrganizador, setLoadingOrganizador] = useState(false);
    const [errorOrganizador, setErrorOrganizador] = useState("");

    // Estados para torneos del usuario
    const [torneosCreados, setTorneosCreados] = useState([]);
    const [torneosParticipando, setTorneosParticipando] = useState([]);
    const [loadingTorneos, setLoadingTorneos] = useState(true);
    const [errorTorneos, setErrorTorneos] = useState("");

    // Sincronizar datos cuando cambia el usuario
    useEffect(() => {
        if (user) {
            setDatosEdicion({
                nombre: user.nombre || "",
                apellidos: user.apellidos || "",
                nombre_alias: user.nombre_alias || "",
                club: user.club || "",
                email: user.email || "",
                localidad: user.localidad || "",
                pais: user.pais || ""
            });
        }
    }, [user]);

    // Cargar torneos del usuario
    useEffect(() => {
    const cargarTorneosUsuario = async () => {
        if (!user?.id) return;

        try {
            setLoadingTorneos(true);
            setErrorTorneos("");

            console.log('📥 Cargando torneos del usuario:', user.id);

            const response = await usuarioApi.obtenerTorneosUsuario(user.id);
            
            console.log('✅ Respuesta de torneos:', response);

            // Verificar estructura de respuesta
            if (response.success || response.data) {
                const data = response.data || response;
                setTorneosCreados(data.torneosCreados || []);
                setTorneosParticipando(data.torneosParticipando || []);
            } else {
                setErrorTorneos(response.error || "Error al cargar torneos");
            }
        } catch (error) {
            console.error("❌ Error al cargar torneos:", error);
            setErrorTorneos(error.message || "Error de conexión");
        } finally {
            setLoadingTorneos(false);
        }
    };

    cargarTorneosUsuario();
}, [user]);

    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({
            ...prev,
            [name]: value
        }));
        if (errorEdicion) setErrorEdicion("");
        if (successEdicion) setSuccessEdicion("");
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errorPassword) setErrorPassword("");
        if (successPassword) setSuccessPassword("");
    };

    const validarEdicion = () => {
        if (!datosEdicion.nombre || !datosEdicion.apellidos) {
            setErrorEdicion("Nombre y apellidos son obligatorios");
            return false;
        }

        if (!datosEdicion.email) {
            setErrorEdicion("El email es obligatorio");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(datosEdicion.email)) {
            setErrorEdicion("Email invalido");
            return false;
        }

        return true;
    };

    const handleGuardarCambios = async () => {
    if (!validarEdicion()) return;

    setLoadingEdicion(true);
    setErrorEdicion("");
    setSuccessEdicion("");

    try {
        const data = await usuarioApi.actualizarPerfil(datosEdicion);

        if (data.success) {
            actualizarUsuario(data.data.usuario);
            setSuccessEdicion("✅ Perfil actualizado exitosamente");
            setModoEdicion(false);
            
            setTimeout(() => {
                setSuccessEdicion("");
            }, 3000);
        } else {
            setErrorEdicion(data.error || "Error al actualizar perfil");
        }
    } catch (error) {
        console.error("❌ Error:", error);
        setErrorEdicion(error.message || "Error de conexión");
    } finally {
        setLoadingEdicion(false);
    }
};

    const handleCancelarEdicion = () => {
        setModoEdicion(false);
        setDatosEdicion({
            nombre: user?.nombre || "",
            apellidos: user?.apellidos || "",
            nombre_alias: user?.nombre_alias || "",
            club: user?.club || "",
            email: user?.email || "",
            localidad: user?.localidad || "",
            pais: user?.pais || ""
        });
        setErrorEdicion("");
        setSuccessEdicion("");
    };

    const validarPasswordForm = () => {
        if (!passwordData.passwordActual || !passwordData.passwordNueva || !passwordData.confirmarPassword) {
            setErrorPassword("Completa todos los campos");
            return false;
        }

        if (passwordData.passwordNueva !== passwordData.confirmarPassword) {
            setErrorPassword("Las contraseñas nuevas no coinciden");
            return false;
        }

        if (passwordData.passwordNueva.length < 6) {
            setErrorPassword("La contraseña debe tener al menos 6 caracteres");
            return false;
        }

        return true;
    };

    const handleCambiarPassword = async (e) => {
        e.preventDefault();
        
        if (!validarPasswordForm()) return;

        setLoadingPassword(true);
        setErrorPassword("");
        setSuccessPassword("");

        try {
            const resultado = await cambiarPassword(
                passwordData.passwordActual,
                passwordData.passwordNueva
            );

            if (resultado.success) {
                setSuccessPassword("Contraseña cambiada exitosamente");
                setPasswordData({
                    passwordActual: "",
                    passwordNueva: "",
                    confirmarPassword: ""
                });
                setTimeout(() => {
                    setMostrarCambioPassword(false);
                    setSuccessPassword("");
                }, 2000);
            } else {
                setErrorPassword(resultado.error || "Error al cambiar contraseña");
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorPassword("Error de conexion");
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleConvertirOrganizador = async () => {
        const confirmacion = window.confirm(
            "Estas seguro de que quieres convertirte en organizador? " +
            "Podras crear y gestionar torneos."
        );

        if (!confirmacion) return;

        setLoadingOrganizador(true);
        setErrorOrganizador("");

        try {
            const resultado = await convertirOrganizador();

            if (resultado.success) {
                alert("Ahora eres organizador! Ya puedes crear torneos.");
            } else {
                setErrorOrganizador(resultado.error || "Error al cambiar rol");
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorOrganizador("Error de conexion");
        } finally {
            setLoadingOrganizador(false);
        }
    };

    const handleLogout = () => {
        const confirmacion = window.confirm("Seguro que quieres cerrar sesion?");
        if (confirmacion) {
            logout();
            navigate('/');
        }
    };

    // Función para formatear fechas
    const formatearFecha = (fecha) => {
        if (!fecha) return "Sin fecha";
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Función para obtener clase de estado
    const getEstadoClase = (estado) => {
        const estados = {
            'pendiente': 'estado-pendiente',
            'en_curso': 'estado-encurso',
            'finalizado': 'estado-finalizado'
        };
        return estados[estado] || 'estado-pendiente';
    };

    if (!user) {
        return null;
    }

    return (
        <div className="perfil-container">
            <h1>👤 Mi Perfil</h1>
            
            <div className="perfil-card">
                {/* 🆕 SECCIÓN COMBINADA: Info Personal y Seguridad */}
                <section className="info-security-combined">
                    {/* Headers en la misma fila */}
                    <div className="headers-combined-row">
                        <div className="section-header">
                            <h2>📋 Información Personal</h2>
                            {!modoEdicion && (
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setModoEdicion(true)}
                                >
                                    ✏️ Editar Perfil
                                </button>
                            )}
                        </div>

                        <div className="section-header">
                            <h2>🔒 Seguridad</h2>
                            {!mostrarCambioPassword && (
                                <button 
                                    className="btn-secondary"
                                    onClick={() => setMostrarCambioPassword(true)}
                                >
                                    🔑 Cambiar Contraseña
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mensajes de éxito/error */}
                    {errorEdicion && (
                        <div className="error-message">{errorEdicion}</div>
                    )}

                    {successEdicion && (
                        <div className="success-message">{successEdicion}</div>
                    )}

                    {/* Contenido de información personal */}
                    {modoEdicion ? (
                        <form className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="nombre">Nombre*:</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={datosEdicion.nombre}
                                        onChange={handleEdicionChange}
                                        placeholder="Tu nombre"
                                        disabled={loadingEdicion}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="apellidos">Apellidos*:</label>
                                    <input
                                        type="text"
                                        id="apellidos"
                                        name="apellidos"
                                        value={datosEdicion.apellidos}
                                        onChange={handleEdicionChange}
                                        placeholder="Tus apellidos"
                                        disabled={loadingEdicion}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="nombre_alias">Nombre Alias:</label>
                                    <input
                                        type="text"
                                        id="nombre_alias"
                                        name="nombre_alias"
                                        value={datosEdicion.nombre_alias}
                                        onChange={handleEdicionChange}
                                        placeholder="Tu alias (opcional)"
                                        disabled={loadingEdicion}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="club">Club:</label>
                                    <input
                                        type="text"
                                        id="club"
                                        name="club"
                                        value={datosEdicion.club}
                                        onChange={handleEdicionChange}
                                        placeholder="Tu club (opcional)"
                                        disabled={loadingEdicion}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email*:</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={datosEdicion.email}
                                    onChange={handleEdicionChange}
                                    placeholder="tu-email@ejemplo.com"
                                    disabled={loadingEdicion}
                                    required
                                />
                            </div>
                             <div className="form-group">
                                    <label htmlFor="localidad">Localidad*:</label>
                                    <input
                                        type="text"
                                        id="localidad"
                                        name="localidad"
                                        value={datosEdicion.localidad}
                                        onChange={handleEdicionChange}
                                        placeholder="Tu Localidad"
                                        disabled={loadingEdicion}
                                        required
                                    />
                                </div>
                                 <div className="form-group">
                                    <label htmlFor="pais">Pais*:</label>
                                    <input
                                        type="text"
                                        id="pais"
                                        name="pais"
                                        value={datosEdicion.pais}
                                        onChange={handleEdicionChange}
                                        placeholder="Tu Pais"
                                        disabled={loadingEdicion}
                                        required
                                    />
                                </div>

                            <div className="button-group">
                                <button 
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleGuardarCambios}
                                    disabled={loadingEdicion}
                                >
                                    {loadingEdicion ? "⏳ Guardando..." : "✅ Guardar Cambios"}
                                </button>
                                
                                <button 
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancelarEdicion}
                                    disabled={loadingEdicion}
                                >
                                    ❌ Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Nombre:</label>
                                <p>{user.nombre} {user.apellidos}</p>
                            </div>
                            
                            <div className="info-item">
                                <label>Alias:</label>
                                <p>{user.nombre_alias || "No especificado"}</p>
                            </div>
                            
                            <div className="info-item">
                                <label>Club:</label>
                                <p>{user.club || "No especificado"}</p>
                            </div>
                            
                            <div className="info-item">
                                <label>Email:</label>
                                <p>{user.email}</p>
                            </div>
                            
                            <div className="info-item">
                                <label>Rol:</label>
                                <p className={`rol-badge ${user.rol}`}>
                                    {user.rol === 'organizador' ? '⚔️ Organizador' : '🎮 Jugador'}
                                </p>
                            </div>
                             <div className="info-item">
                                <label>Localidad:</label>
                                <p>{user.localidad || "No especificado"}</p>
                            </div>
                             <div className="info-item">
                                <label>Pais:</label>
                                <p>{user.pais  || "No especificado"}</p>
                            </div>
                        </div>
                    )}

                    {/* Contenido de cambio de contraseña */}
                    {mostrarCambioPassword && (
                        <form onSubmit={handleCambiarPassword} className="password-form">
                            {errorPassword && (
                                <div className="error-message">{errorPassword}</div>
                            )}
                            
                            {successPassword && (
                                <div className="success-message">{successPassword}</div>
                            )}

                            <div className="form-group">
                                <label>Contraseña Actual:</label>
                                <input
                                    type="password"
                                    name="passwordActual"
                                    value={passwordData.passwordActual}
                                    onChange={handlePasswordChange}
                                    placeholder="Tu contraseña actual"
                                    disabled={loadingPassword}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Contraseña Nueva:</label>
                                <input
                                    type="password"
                                    name="passwordNueva"
                                    value={passwordData.passwordNueva}
                                    onChange={handlePasswordChange}
                                    placeholder="Minimo 6 caracteres"
                                    disabled={loadingPassword}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirmar Contraseña:</label>
                                <input
                                    type="password"
                                    name="confirmarPassword"
                                    value={passwordData.confirmarPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Repite la contraseña"
                                    disabled={loadingPassword}
                                    required
                                />
                            </div>

                            <div className="button-group">
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    disabled={loadingPassword}
                                >
                                    {loadingPassword ? "⏳ Actualizando..." : "✅ Actualizar Contraseña"}
                                </button>
                                
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => {
                                        setMostrarCambioPassword(false);
                                        setPasswordData({
                                            passwordActual: "",
                                            passwordNueva: "",
                                            confirmarPassword: ""
                                        });
                                        setErrorPassword("");
                                        setSuccessPassword("");
                                    }}
                                    disabled={loadingPassword}
                                >
                                    ❌ Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* Sección de Torneos Creados */}
                {user.rol === 'organizador' && (
                    <section className="torneos-section">
                        <div className="section-header">
                            <h2>🏆 Mis Torneos Creados ({torneosCreados.length})</h2>
                            <Link to="/crearTorneo" className="btn-primary">
                                ➕ Crear Torneo
                            </Link>
                        </div>

                        {loadingTorneos ? (
                            <div className="loading-message">⏳ Cargando torneos...</div>
                        ) : errorTorneos ? (
                            <div className="error-message">{errorTorneos}</div>
                        ) : torneosCreados.length === 0 ? (
                            <div className="empty-message">
                                <p>📝 Aún no has creado ningún torneo</p>
                            </div>
                        ) : (
                            <div className="torneos-grid">
                                {torneosCreados.map(torneo => (
                                    <div key={torneo.id} className="torneo-card">
                                        <div className="torneo-header">
                                            <h3>{torneo.nombre_torneo}</h3>
                                             <h3>{torneo.sistema}</h3>
                                            <span className={`estado-badge ${getEstadoClase(torneo.estado)}`}>
                                                {torneo.estado?.toUpperCase() || 'PENDIENTE'}
                                            </span>
                                        </div>
                                        <div className="torneo-info">
                                            <p><strong>📅 Fecha:</strong> {formatearFecha(torneo.fecha_inicio)}</p>
                                            <p><strong>🎭 Época:</strong> {torneo.epocas_disponibles}</p>
                                            <p><strong>👥 Participantes:</strong> {torneo.total_participantes} / {torneo.participantes_max || 0}</p>
                                            <p><strong>🎲 Rondas:</strong> {torneo.rondas_max}</p>
                                            {torneo.ubicacion && (
                                                <p><strong>📍 Ubicación:</strong> {torneo.ubicacion}</p>
                                            )}
                                        </div>
                                        <Link 
                                            to={`/administrarTorneo/${torneo.id}`} 
                                            className="btn-primary"
                                        >
                                            ⚙️ Administrar Torneo
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Sección de Torneos en los que Participa */}
                <section className="torneos-section">
                    <div className="section-header">
                        <h2>🎮 Torneos en los que Participo ({torneosParticipando.length})</h2>
                    </div>

                    {loadingTorneos ? (
                        <div className="loading-message">⏳ Cargando torneos...</div>
                    ) : errorTorneos ? (
                        <div className="error-message">{errorTorneos}</div>
                    ) : torneosParticipando.length === 0 ? (
                        <div className="empty-message">
                            <p>🎯 Aún no estás inscrito en ningún torneo</p>
                            <Link to="/" className="btn-secondary">
                                Ver torneos disponibles
                            </Link>
                        </div>
                    ) : (
                        <div className="torneos-grid">
                            {torneosParticipando.map(torneo => (
                                <div key={torneo.id} className="torneo-card participando">
                                    <div className="torneo-header">
                                        <h3>{torneo.nombre_torneo}</h3>
                                        <span className={`estado-badge ${getEstadoClase(torneo.estado)}`}>
                                            {torneo.estado?.toUpperCase() || 'PENDIENTE'}
                                        </span>
                                    </div>
                                    <div className="torneo-info">
                                        <p><strong>📅 Fecha:</strong> {formatearFecha(torneo.fecha_inicio)}</p>
                                        <p><strong>🎭 Época:</strong> {torneo.epocas_disponibles}</p>
                                        <p><strong>⚔️ Mi Facción:</strong> {torneo.faccion || 'No especificada'}</p>
                                        <p><strong>👥 Participantes:</strong> {torneo.total_participantes} / {torneo.participantes_max || 0}</p>
                                        <p><strong>🎲 Rondas:</strong> {torneo.rondas_max}</p>
                                        {torneo.ubicacion && (
                                            <p><strong>📍 Ubicación:</strong> {torneo.ubicacion}</p>
                                        )}
                                    </div>
                                    <Link 
                                        to={`/torneosSaga/${torneo.id}/detalles`} 
                                        className="btn-primary"
                                    >
                                        👁️ Ver Torneo
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Seccion de conversion a organizador */}
                {user.rol === 'jugador' && (
                    <section className="organizador-section">
                        <h2>⚔️ ¿Quieres organizar torneos?</h2>
                        <p>
                            Conviértete en organizador para poder crear y gestionar tus propios torneos.
                        </p>
                        
                        {errorOrganizador && (
                            <div className="error-message">{errorOrganizador}</div>
                        )}
                        
                        <button 
                            className="btn-upgrade"
                            onClick={handleConvertirOrganizador}
                            disabled={loadingOrganizador}
                        >
                            {loadingOrganizador 
                                ? "⏳ Procesando..." 
                                : "🚀 Convertirse en Organizador"
                            }
                        </button>
                    </section>
                )}

                {/* Boton de cerrar sesion */}
                <section className="logout-section">
                    <button 
                        className="btn-danger"
                        onClick={handleLogout}
                    >
                        🚪 Cerrar Sesión
                    </button>
                </section>
            </div>
        </div>
    );
}

export default Perfil;