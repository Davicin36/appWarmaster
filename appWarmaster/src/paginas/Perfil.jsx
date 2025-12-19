import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";
import { validarCodigoPostal } from '../servicios/validaciones';

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
        pais: user?.pais || "",
        localidad: user?.localidad || "",
        codigo_postal: user?.codigo_postal || ""
    });
    const [loadingEdicion, setLoadingEdicion] = useState(false);
    const [loadingCP, setLoadingCP] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState("");
    const [errors, setErrors] = useState({});
    const [successEdicion, setSuccessEdicion] = useState("");
    
    // Estados para cambio de contraseña
    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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

    // Lista de países
    const paises = [
        { value: "", label: "Selecciona un país", codigo: "" },
        { value: "España", label: "España 🇪🇸", codigo: "ES" },
        { value: "Francia", label: "Francia 🇫🇷", codigo: "FR" },
        { value: "Portugal", label: "Portugal 🇵🇹", codigo: "PT" },
        { value: "Reino Unido", label: "Reino Unido 🇬🇧", codigo: "GB" },
        { value: "Alemania", label: "Alemania 🇩🇪", codigo: "DE" },
        { value: "Italia", label: "Italia 🇮🇹", codigo: "IT" },
        { value: "Países Bajos", label: "Países Bajos 🇳🇱", codigo: "NL" },
        { value: "Bélgica", label: "Bélgica 🇧🇪", codigo: "BE" },
        { value: "Suiza", label: "Suiza 🇨🇭", codigo: "CH" },
        { value: "Austria", label: "Austria 🇦🇹", codigo: "AT" },
        { value: "Estados Unidos", label: "Estados Unidos 🇺🇸", codigo: "US" },
        { value: "Canadá", label: "Canadá 🇨🇦", codigo: "CA" },
        { value: "México", label: "México 🇲🇽", codigo: "MX" },
        { value: "Argentina", label: "Argentina 🇦🇷", codigo: "AR" },
        { value: "Brasil", label: "Brasil 🇧🇷", codigo: "BR" }
    ];

    // Sincronizar datos cuando cambia el usuario
    useEffect(() => {
        if (user) {
            setDatosEdicion({
                nombre: user.nombre || "",
                apellidos: user.apellidos || "",
                nombre_alias: user.nombre_alias || "",
                club: user.club || "",
                email: user.email || "",
                pais: user.pais || "",
                localidad: user.localidad || "",
                codigo_postal: user.codigo_postal || ""
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

                const response = await usuarioApi.obtenerTorneosUsuario(user.id);

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

    // Buscar localidad por código postal
    const buscarLocalidadCP = async (codigoPostal, paisNombre) => {
        if (!codigoPostal || !paisNombre) return;

        const paisObj = paises.find(p => p.value === paisNombre);
        if (!paisObj || !paisObj.codigo) return;

        const codigoISO = paisObj.codigo;

        try {
            setLoadingCP(true);

            const response = await fetch(
                `http://api.zippopotam.us/${codigoISO}/${codigoPostal}`
            );

            if (!response.ok) {
                throw new Error('Código postal no encontrado');
            }

            const data = await response.json();
          
            if (data.places && data.places.length > 0) {
                const lugar = data.places[0];
                
                setDatosEdicion(prev => ({
                    ...prev,
                    localidad: lugar['place name'] || lugar.state || ''
                }));

                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.localidad;
                    return newErrors;
                });
            }

        } catch (err) {
            console.error('⚠️ No se pudo obtener la localidad:', err.message);
        } finally {
            setLoadingCP(false);
        }
    };

    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar errores
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (errorEdicion) setErrorEdicion("");
        if (successEdicion) setSuccessEdicion("");

        // Si cambia el país, resetear código postal y localidad
        if (name === 'pais') {
            setDatosEdicion(prev => ({
                ...prev,
                codigo_postal: "",
                localidad: ""
            }));
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.codigo_postal;
                delete newErrors.localidad;
                return newErrors;
            });
        }
    };

    const handleCodigoPostalChange = (e) => {
        const codigoPostal = e.target.value;
        
        setDatosEdicion(prev => ({
            ...prev,
            codigo_postal: codigoPostal
        }));

        if (errors.codigo_postal) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.codigo_postal;
                return newErrors;
            });
        }
    };

    const handleCodigoPostalBlur = async () => {
        if (datosEdicion.codigo_postal && datosEdicion.pais) {
            // Validar formato
            const validacion = validarCodigoPostal(datosEdicion.codigo_postal, datosEdicion.pais);
            
            if (!validacion.valido) {
                setErrors(prev => ({
                    ...prev,
                    codigo_postal: validacion.mensaje
                }));
                return;
            }

            // Buscar localidad
            await buscarLocalidadCP(datosEdicion.codigo_postal, datosEdicion.pais);
        }
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
        const nuevosErrores = {};

        if (!datosEdicion.nombre.trim()) {
            nuevosErrores.nombre = "El nombre es obligatorio";
        }

        if (!datosEdicion.apellidos.trim()) {
            nuevosErrores.apellidos = "Los apellidos son obligatorios";
        }

        if (!datosEdicion.email.trim()) {
            nuevosErrores.email = "El email es obligatorio";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(datosEdicion.email)) {
                nuevosErrores.email = "Email inválido";
            }
        }

        if (!datosEdicion.pais) {
            nuevosErrores.pais = "El país es obligatorio";
        }

        if (!datosEdicion.localidad.trim()) {
            nuevosErrores.localidad = "La localidad es obligatoria";
        }

        if (!datosEdicion.codigo_postal.trim()) {
            nuevosErrores.codigo_postal = "El código postal es obligatorio";
        } else if (datosEdicion.pais) {
            const validacion = validarCodigoPostal(datosEdicion.codigo_postal, datosEdicion.pais);
            if (!validacion.valido) {
                nuevosErrores.codigo_postal = validacion.mensaje;
            }
        }

        setErrors(nuevosErrores);

        if (Object.keys(nuevosErrores).length > 0) {
            setErrorEdicion(Object.values(nuevosErrores)[0]);
            return false;
        }

        return true;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
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
            pais: user?.pais || "",
            localidad: user?.localidad || "",
            codigo_postal: user?.codigo_postal || ""
        });
        setErrorEdicion("");
        setErrors({});
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

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
        if (!passwordRegex.test(passwordData.passwordNueva)) {
            setErrorPassword("La contraseña debe contener al menos una letra y un número");
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
                setSuccessPassword("✅ Contraseña cambiada exitosamente");
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
            setErrorPassword("Error de conexión");
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleConvertirOrganizador = async () => {
        const confirmacion = window.confirm(
            "¿Estás seguro de que quieres convertirte en organizador? " +
            "Podrás crear y gestionar torneos."
        );

        if (!confirmacion) return;

        setLoadingOrganizador(true);
        setErrorOrganizador("");

        try {
            const resultado = await convertirOrganizador();

            if (resultado.success) {
                alert("¡Ahora eres organizador! Ya puedes crear torneos.");
            } else {
                setErrorOrganizador(resultado.error || "Error al cambiar rol");
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorOrganizador("Error de conexión");
        } finally {
            setLoadingOrganizador(false);
        }
    };

    const handleLogout = () => {
        const confirmacion = window.confirm("¿Seguro que quieres cerrar sesión?");
        if (confirmacion) {
            logout();
            navigate('/');
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "Sin fecha";
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

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
                {/* SECCIÓN COMBINADA: Info Personal y Seguridad */}
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
                                    <label htmlFor="nombre">
                                        Nombre <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={datosEdicion.nombre}
                                        onChange={handleEdicionChange}
                                        placeholder="Tu nombre"
                                        disabled={loadingEdicion}
                                        className={errors.nombre ? 'input-error' : ''}
                                        required
                                    />
                                    {errors.nombre && (
                                        <span className="field-error">{errors.nombre}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="apellidos">
                                        Apellidos <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="apellidos"
                                        name="apellidos"
                                        value={datosEdicion.apellidos}
                                        onChange={handleEdicionChange}
                                        placeholder="Tus apellidos"
                                        disabled={loadingEdicion}
                                        className={errors.apellidos ? 'input-error' : ''}
                                        required
                                    />
                                    {errors.apellidos && (
                                        <span className="field-error">{errors.apellidos}</span>
                                    )}
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
                                <label htmlFor="email">
                                    Email <span className="required">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={datosEdicion.email}
                                    onChange={handleEdicionChange}
                                    placeholder="tu-email@ejemplo.com"
                                    disabled={loadingEdicion}
                                    className={errors.email ? 'input-error' : ''}
                                    required
                                />
                                {errors.email && (
                                    <span className="field-error">{errors.email}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="pais">
                                    País <span className="required">*</span>
                                </label>
                                <select
                                    id="pais"
                                    name="pais"
                                    value={datosEdicion.pais}
                                    onChange={handleEdicionChange}
                                    disabled={loadingEdicion}
                                    className={errors.pais ? 'input-error' : ''}
                                    required
                                >
                                    {paises.map((pais, index) => (
                                        <option key={index} value={pais.value}>
                                            {pais.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.pais && (
                                    <span className="field-error">{errors.pais}</span>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="codigo_postal">
                                        Código Postal <span className="required">*</span>
                                    </label>
                                    <div className="input-with-loader">
                                        <input
                                            type="text"
                                            id="codigo_postal"
                                            name="codigo_postal"
                                            value={datosEdicion.codigo_postal}
                                            onChange={handleCodigoPostalChange}
                                            onBlur={handleCodigoPostalBlur}
                                            placeholder={datosEdicion.pais ? "Ej: 28001" : "Selecciona país primero"}
                                            disabled={loadingEdicion || !datosEdicion.pais}
                                            className={errors.codigo_postal ? 'input-error' : ''}
                                            required
                                        />
                                        {loadingCP && <span className="input-loader">🔍</span>}
                                    </div>
                                    {errors.codigo_postal && (
                                        <span className="field-error">{errors.codigo_postal}</span>
                                    )}
                                    <small className="field-hint">
                                        {datosEdicion.pais ? "La localidad se completará automáticamente" : "Selecciona un país primero"}
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="localidad">
                                        Localidad <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="localidad"
                                        name="localidad"
                                        value={datosEdicion.localidad}
                                        onChange={handleEdicionChange}
                                        placeholder="Se autocompletará..."
                                        disabled={loadingEdicion}
                                        className={errors.localidad ? 'input-error' : ''}
                                        required
                                    />
                                    {errors.localidad && (
                                        <span className="field-error">{errors.localidad}</span>
                                    )}
                                    <small className="field-hint">
                                        Puedes editarla si es necesario
                                    </small>
                                </div>
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
                                <label>País:</label>
                                <p>{user.pais || "No especificado"}</p>
                            </div>

                            <div className="info-item">
                                <label>Código Postal:</label>
                                <p>{user.codigo_postal || "No especificado"}</p>
                            </div>
                            
                            <div className="info-item">
                                <label>Localidad:</label>
                                <p>{user.localidad || "No especificado"}</p>
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
                                    type={showPassword ? "text" : "password"}
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
                                    type={showPassword ? "text" : "password"}
                                    name="passwordNueva"
                                    value={passwordData.passwordNueva}
                                    onChange={handlePasswordChange}
                                    placeholder="Mínimo 6 caracteres"
                                    disabled={loadingPassword}
                                    required
                                />
                                <small className="field-hint">
                                    Debe contener al menos una letra y un número
                                </small>
                            </div>

                            <div className="form-group">
                                <label>Confirmar Contraseña:</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmarPassword"
                                    value={passwordData.confirmarPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Repite la contraseña"
                                    disabled={loadingPassword}
                                    required
                                />
                            </div>

                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="showPassword"
                                    checked={showPassword}
                                    onChange={togglePasswordVisibility}
                                    disabled={loadingPassword}
                                />
                                <label htmlFor="showPassword">Mostrar contraseñas</label>
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

                {/* Resto de secciones (torneos, organizador, logout) - sin cambios */}
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
                                        <h3>{torneo.sistema}</h3>
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