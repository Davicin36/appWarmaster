import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext";

import '../estilos/registrarse.css'

function Registrarse({ onOpenLogin }) {
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        nombre_alias: "",
        club: "",
        email: "",
        localidad: "",
        pais: "",
        password: "",
        confirmPassword: ""
     
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    
    const { registro } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError("");
        if (success) setSuccess("");
    };

    const validarFormulario = () => {
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return false;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return false;
        }

        if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password) {
            setError("Por favor, completa todos los campos requeridos");
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
            const { ...datosRegistro } = formData;
            
            const resultado = await registro(datosRegistro);
            
            if (resultado.success) {
                setSuccess("Usuario registrado exitosamente! Redirigiendo...");
                
                setTimeout(() => {
                    navigate("/");
                    onOpenLogin();//para abrir el modal de login
                }, 2000);
            } else {
                setError(resultado.error || "Error al registrar usuario");
            }
        } catch (err) {
            console.error("Error en registro:", err);
            setError("Error de conexion. Intenta nuevamente.");
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
                
                {/* ✅ FILA 1: Nombre y Apellidos */}
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
                        />
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
                        />
                    </div>
                </div>

                {/* ✅ FILA 2: Alias y Club */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre_alias">Alias</label>
                        <input 
                            type="text" 
                            id="nombre_alias"
                            name="nombre_alias"
                            value={formData.nombre_alias}
                            onChange={handleChange}
                            placeholder="Nickname (opcional)"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="club">Club</label>
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

                {/* ✅ FILA 4: Localidad y País */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="localidad">Localidad</label>
                        <input 
                            type="text" 
                            id="localidad"
                            name="localidad"
                            value={formData.localidad}
                            onChange={handleChange}
                            placeholder="Madrid, Barcelona..."
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="pais">País</label>
                        <input 
                            type="text" 
                            id="pais"
                            name="pais"
                            value={formData.pais}
                            onChange={handleChange}
                            placeholder="España, Portugal..."
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                   {/* ✅ FILA 3: Email (completa) */}
                <div className="form-row-full">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu-email@ejemplo.com"
                            required
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>
                </div>
                
                {/* ✅ FILA 5: Contraseñas */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar</label>
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
                        />
                    </div>

                     {/* ✅ FILA: Checkbox + Botones */}
                <div className="actions-row">
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
                            {loading ? "Registrando..." : "Crear Cuenta"}
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