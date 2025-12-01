import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

import '../estilos/login.css';

function Login({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    // Cerrar modal con tecla Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim() || !formData.password.trim()) {
            setError(" Por favor, completa todos los campos")
            return
        }

        setLoading(true);
        setError("");
        
        try {
            const usuario = await login(formData.email, formData.password);
            
            if (usuario) {
                onClose(); // ✅ Cerrar modal después de login exitoso
                navigate('/', { replace: true });
                // Limpiar formulario
                setFormData({ email: "", password: "" });
                setShowPassword(false);
            } else {
                setError('Error al iniciar sesión, Email o contraseña incorrectos, Intenta de nuevo.')
                setFormData (prev => ({ ...prev, password: ' '}))
            }
        } catch (err) {
            console.error("Error en login:", err);

            let mensajeError =  "";
            if(err) {
                 console.error("Error en login:", err);
                 mensajeError = "Error de conexión. Intenta nuevamente."
            }

            setError(mensajeError);
            setFormData (prev => ({ ...prev, password: ' '}))
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleOverlayClick = (e) => {
        // Cerrar solo si se hace click en el overlay, no en el contenido
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null; // ✅ No renderizar si no está abierto

    return (
        <div className="login-modal-overlay" onClick={handleOverlayClick}>
            <div className="login-modal-content">
                {/* Botón cerrar */}
                <button 
                    className="modal-close-btn"
                    onClick={onClose}
                    aria-label="Cerrar"
                    type="button"
                >
                    ✕
                </button>

                <h2 className="modal-title">Iniciar Sesión</h2>
                
                <form className="login-form-modal" onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input 
                            type="email" 
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Introduce tu email"
                            required
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <input 
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Introduce tu contraseña" 
                            required
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="checkbox-group">
                        <input 
                            type="checkbox" 
                            id="showPassword"
                            checked={showPassword}
                            onChange={togglePasswordVisibility}
                            disabled={loading}
                        />
                        <label htmlFor="showPassword">Mostrar contraseña</label>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </button>
                    
                    <p className="register-link">
                        ¿No tienes cuenta? <Link to="/registrarse" onClick={onClose}>Regístrate aquí</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Login;