import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext";
import { validarCodigoPostal } from "../servicios/validaciones";

import '../estilos/registrarse.css'

function Registrarse({ onOpenLogin }) { 
    const navigate = useNavigate();
    const location = useLocation()
    const { registro } = useAuth();
    
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        nombre_alias: "",
        club: "",
        email: "",
        codigo_postal: "",
        localidad: "",
        pais: "",
        password: "",
        confirmPassword: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [loadingCP, setLoadingCP] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);

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

    // ✅ Pre-cargar email si viene de invitación
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailFromUrl = params.get('email');
        
        if (emailFromUrl) {
            setFormData(prev => ({
                ...prev,
                email: emailFromUrl
            }));
        }
    }, [location]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'pais') {
            setFormData(prev => ({
                ...prev,
                codigo_postal: "",
                localidad: ""
            }));
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }

        if (error) setError("");
        if (success) setSuccess("");
    };

    const buscarLocalidadCP = async (codigoPostal, paisNombre) => {
        if(!codigoPostal || !paisNombre) return;

        const paisObjetivo = paises.find(pais => pais.value === paisNombre);
        if(!paisObjetivo || !paisObjetivo.codigo) return;
        
        const codigoISO = paisObjetivo.codigo;

        try {
            setLoadingCP(true);

            const response = await fetch(
                `https://api.zippopotam.us/${codigoISO}/${codigoPostal}`
            );

            if (!response.ok){
                throw new Error('Código postal no encontrado');
            }

            const data = await response.json();
            if (data.places && data.places.length > 0) {
                const lugar = data.places[0];

                setFormData(prev => ({
                    ...prev,
                    localidad: lugar['place name'] || lugar.state || ''
                }));

                setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.localidad;
                    return newErrors;
                });
            }
        } catch (error){
            console.error('No se pudo obtener la localidad', error.message);
        } finally {
            setLoadingCP(false);
        }
    };

    const handleCodigoPostalChange = (e) => {
        const codigoPostal = e.target.value;
        setFormData(prev => ({
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

    const handleCPBlur = async () => {
        if(formData.codigo_postal && formData.pais){
            const validacion = validarCodigoPostal(formData.codigo_postal, formData.pais);

            if (!validacion.valido) {
                setErrors(prev => ({
                    ...prev,
                    codigo_postal: validacion.mensaje
                }));
                return;
            }
            await buscarLocalidadCP(formData.codigo_postal, formData.pais);
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password) {
            setError("Por favor, completa todos los campos requeridos");
            return false;
        }

        if (!formData.email.trim()) {
            nuevosErrores.email = "El email es requerido";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                nuevosErrores.email = "El formato del email no es válido";
            }
        }

        if (!formData.pais) {
            nuevosErrores.pais = "Debes seleccionar un país";
        }

        if (!formData.localidad.trim()) {
            nuevosErrores.localidad = "La localidad es requerida";
        }

        if (!formData.codigo_postal.trim()) {
            nuevosErrores.codigo_postal = "El código postal es requerido";
        } else if (formData.pais) {
            const validacion = validarCodigoPostal(formData.codigo_postal, formData.pais);
            if (!validacion.valido) {
                nuevosErrores.codigo_postal = validacion.mensaje;
            }
        }
        

        if (!formData.password) {
            nuevosErrores.password = "La contraseña es requerida";
        } else {
            if (formData.password.length < 6) {
                nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
            }
            
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
            if (!passwordRegex.test(formData.password)) {
                nuevosErrores.password = "La contraseña debe contener al menos una letra y un número";
            }
        }

        if (formData.password !== formData.confirmPassword) {
            nuevosErrores.confirmPassword = "Las contraseñas no coinciden";
        }

        setErrors(nuevosErrores);
        
        if (Object.keys(nuevosErrores).length > 0) {
            setError(Object.values(nuevosErrores)[0]);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");
        
        try {
           const datosRegistro = {
                nombre: formData.nombre,
                apellidos: formData.apellidos,
                nombre_alias: formData.nombre_alias,
                club: formData.club,
                email: formData.email,
                codigo_postal: formData.codigo_postal,
                localidad: formData.localidad,
                pais: formData.pais,
                password: formData.password
            };
            
            const resultado = await registro(datosRegistro);
            
            if (resultado.success) {
                setSuccess("✅ Usuario registrado exitosamente! Redirigiendo...");
                
                setTimeout(() => {
                    navigate("/");
                    if (onOpenLogin) {
                        onOpenLogin();
                    }
                }, 2000);
            } else {
                setError(resultado.error || "Error al registrar usuario");
            }
        } catch (err) {
            console.error("Error en registro:", err);
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordsVisibility = () => {
        setShowPasswords(prev => !prev);
    };

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div className="register-container">
            <h1>Gestión de Torneos de WARGAMES</h1>
            
            <form className="register-form" onSubmit={handleSubmit}>
                <h2>CREAR CUENTA</h2>
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}
                
                {/* FILA 1: Nombre y Apellidos */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre">Nombre</label>
                        <input 
                            type="text" 
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                            required
                            disabled={loading}
                            className={errors.nombre ? 'input-error' : ''}
                        />
                        {errors.nombre && (
                            <span className="field-error">{errors.nombre}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="apellidos">Apellidos</label>
                        <input 
                            type="text" 
                            id="apellidos"
                            name="apellidos"
                            value={formData.apellidos}
                            onChange={handleChange}
                            placeholder="Tus apellidos"
                            required
                            disabled={loading}
                            className={errors.apellidos ? 'input-error' : ''}
                        />
                        {errors.apellidos && (
                            <span className="field-error">{errors.apellidos}</span>
                        )}
                    </div>
                </div>

                {/* FILA 2: Alias y Club */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre_alias">Alias (Opcional)</label>
                        <input 
                            type="text" 
                            id="nombre_alias"
                            name="nombre_alias"
                            value={formData.nombre_alias}
                            onChange={handleChange}
                            placeholder="Nickname"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="club">Club (Opcional)</label>
                        <input 
                            type="text" 
                            id="club"
                            name="club"
                            value={formData.club}
                            onChange={handleChange}
                            placeholder="Tu club (opcional)"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-row-full">
                    <div className="form-group">
                        <label htmlFor="pais">
                            País <span className="required">*</span>
                        </label>
                        <select
                                id="pais"
                                name="pais"
                                value={formData.pais}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className={errors.pais ? 'input-error' : ''}
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
                                    value={formData.codigo_postal}
                                    onChange={handleCodigoPostalChange}
                                    onBlur={handleCPBlur}
                                    placeholder={formData.pais ? "Ej: 28001" : "Selecciona país primero"}
                                    required
                                    disabled={loading || !formData.pais}
                                    className={errors.codigo_postal ? 'input-error' : ''}
                                />
                                {loadingCP && <span className="input-loader">🔍</span>}
                            </div>
                            {errors.codigo_postal && (
                                <span className="field-error">{errors.codigo_postal}</span>
                            )}
                            <small className="field-hint">
                                {formData.pais ? "La localidad se completará automáticamente" : "Selecciona un país primero"}
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
                                value={formData.localidad}
                                onChange={handleChange}
                                placeholder="Se autocompletará..."
                                required
                                disabled={loading}
                                className={errors.localidad ? 'input-error' : ''}
                            />
                            {errors.localidad && (
                                <span className="field-error">{errors.localidad}</span>
                            )}
                            <small className="field-hint">
                                Puedes editarla si es necesario
                            </small>
                        </div>
                    </div>

                {/* FILA Email */}
                <div className="form-row-full">
                    <div className="form-group">
                        <label htmlFor="email">
                            Email <span className="required">*</span>
                        </label>
                        <input 
                            type="email" 
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu-email@ejemplo.com"
                            required
                            disabled={loading} // ✅ Bloquear si es invitación
                            autoComplete="email"
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && (
                            <span className="field-error">{errors.email}</span>
                        )}
                    </div>
                </div>

                {/* FILA Contraseñas */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="password">
                            Contraseña <span className="required">*</span>
                        </label>
                        <input 
                            type={showPasswords ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Mínimo 6 caracteres" 
                            required
                            disabled={loading}
                            autoComplete="new-password"
                            className={errors.password ? 'input-error' : ''}
                        />
                        {errors.password && (
                            <span className="field-error">{errors.password}</span>
                        )}
                        <small className="field-hint">
                            Debe contener al menos una letra y un número
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirmar Contraseña <span className="required">*</span>
                        </label>
                        <input 
                            type={showPasswords ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repite contraseña" 
                            required
                            disabled={loading}
                            autoComplete="new-password"
                            className={errors.confirmPassword ? 'input-error' : ''}
                        />
                        {errors.confirmPassword && (
                            <span className="field-error">{errors.confirmPassword}</span>
                        )}
                    </div>
                </div>

                <div className="checkbox-container">
                    <div className="checkbox-group">
                        <input 
                            type="checkbox" 
                            id="showPasswords"
                            checked={showPasswords}
                            onChange={togglePasswordsVisibility}
                            disabled={loading}
                        />
                        <label htmlFor="showPasswords">Mostrar contraseñas</label>
                    </div>
                </div>

                <div className="button-group">
                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? "⏳ Registrando..." : "CREAR CUENTA"}
                    </button>
                    
                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={volverInicio} 
                        disabled={loading}
                    >
                        Volver
                    </button>
                </div>

                <p className="login-link">
                    ¿Ya tienes cuenta?{' '}
                    <button 
                        type="button"
                        onClick={onOpenLogin}
                        className="link-button"
                        disabled={loading}
                    >
                        Inicia sesión aquí
                    </button>
                </p>
            </form>
        </div>
    );
}

export default Registrarse;