import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

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
        email: user?.email || ""
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

    // Sincronizar datos cuando cambia el usuario
    React.useEffect(() => {
        if (user) {
            setDatosEdicion({
                nombre: user.nombre || "",
                apellidos: user.apellidos || "",
                nombre_alias: user.nombre_alias || "",
                club: user.club || "",
                email: user.email || ""
            });
        }
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
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/usuariosRutas/actualizar-perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosEdicion)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                actualizarUsuario(data.data.usuario);
                setSuccessEdicion("Perfil actualizado exitosamente");
                setModoEdicion(false);
                
                setTimeout(() => {
                    setSuccessEdicion("");
                }, 3000);
            } else {
                setErrorEdicion(data.error || "Error al actualizar perfil");
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorEdicion("Error de conexion");
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
            email: user?.email || ""
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

    if (!user) {
        return null;
    }

    return (
        <div className="perfil-container">
            <h1>Mi Perfil</h1>
            
            <div className="perfil-card">
                {/* Seccion de informacion personal editable */}
                <section className="info-section">
                    <div className="section-header">
                        <h2>Informacion Personal</h2>
                        {!modoEdicion && (
                            <button 
                                className="btn-secondary"
                                onClick={() => setModoEdicion(true)}
                            >
                                Editar Perfil
                            </button>
                        )}
                    </div>

                    {errorEdicion && (
                        <div className="error-message">{errorEdicion}</div>
                    )}

                    {successEdicion && (
                        <div className="success-message">{successEdicion}</div>
                    )}

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

                            <div className="button-group">
                                <button 
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleGuardarCambios}
                                    disabled={loadingEdicion}
                                >
                                    {loadingEdicion ? "Guardando..." : "Guardar Cambios"}
                                </button>
                                
                                <button 
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancelarEdicion}
                                    disabled={loadingEdicion}
                                >
                                    Cancelar
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
                                    {user.rol === 'organizador' ? 'Organizador' : 'Jugador'}
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Seccion de cambio de contraseña */}
                <section className="password-section">
                    <div className="section-header">
                        <h2>Seguridad</h2>
                        {!mostrarCambioPassword && (
                            <button 
                                className="btn-secondary"
                                onClick={() => setMostrarCambioPassword(true)}
                            >
                                Cambiar Contraseña
                            </button>
                        )}
                    </div>

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
                                    {loadingPassword ? "Actualizando..." : "Actualizar Contraseña"}
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
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* Seccion de conversion a organizador */}
                {user.rol === 'jugador' && (
                    <section className="organizador-section">
                        <h2>Quieres organizar torneos?</h2>
                        <p>
                            Conviertete en organizador para poder crear y gestionar tus propios torneos.
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
                                ? "Procesando..." 
                                : "Convertirse en Organizador"
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
                        Cerrar Sesion
                    </button>
                </section>
            </div>
        </div>
    );
}

export default Perfil;