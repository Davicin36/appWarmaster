import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import '@/estilos/resetPassword.css';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenValido, setTokenValido] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("Token de recuperación no válido");
            setTokenValido(false);
            return;
        }

        // Verificar si el token es válido
        verificarToken();
    }, [token]);

    const verificarToken = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/verificar-token/${token}`);
            const data = await response.json();

            if (response.ok) {
                setTokenValido(true);
            } else {
                setTokenValido(false);
                setError(data.mensaje || "El enlace de recuperación ha expirado o no es válido");
            }
        } catch (err) {
            console.error("Error:", err);
            setTokenValido(false);
            setError("Error al verificar el enlace de recuperación");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError("");
    };

    const validarPassword = (password) => {
        if (password.length < 8) {
            return "La contraseña debe tener al menos 8 caracteres";
        }
        if (!/[A-Z]/.test(password)) {
            return "La contraseña debe contener al menos una letra mayúscula";
        }
        if (!/[a-z]/.test(password)) {
            return "La contraseña debe contener al menos una letra minúscula";
        }
        if (!/[0-9]/.test(password)) {
            return "La contraseña debe contener al menos un número";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.password.trim() || !formData.confirmPassword.trim()) {
            setError("Por favor, completa todos los campos");
            return;
        }

        const errorValidacion = validarPassword(formData.password);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setError(data.mensaje || "Error al restablecer la contraseña");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    if (tokenValido === null) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <p>Verificando enlace...</p>
                </div>
            </div>
        );
    }

    if (tokenValido === false) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="error-icon">✕</div>
                    <h2>Enlace no válido</h2>
                    <p className="error-text">{error}</p>
                    <button 
                        className="btn-primary"
                        onClick={() => navigate('/')}
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                {!success ? (
                    <>
                        <h2>Restablecer Contraseña</h2>
                        <p className="reset-description">
                            Introduce tu nueva contraseña
                        </p>
                        
                        <form className="reset-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label htmlFor="password">Nueva Contraseña:</label>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repite la contraseña"
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="password-requirements">
                                <p>La contraseña debe contener:</p>
                                <ul>
                                    <li className={formData.password.length >= 8 ? 'valid' : ''}>
                                        Al menos 8 caracteres
                                    </li>
                                    <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                                        Una letra mayúscula
                                    </li>
                                    <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                                        Una letra minúscula
                                    </li>
                                    <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                                        Un número
                                    </li>
                                </ul>
                            </div>

                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="showPasswords"
                                    checked={showPassword && showConfirmPassword}
                                    onChange={() => {
                                        setShowPassword(!showPassword);
                                        setShowConfirmPassword(!showConfirmPassword);
                                    }}
                                    disabled={loading}
                                />
                                <label htmlFor="showPasswords">Mostrar contraseñas</label>
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Guardando..." : "Restablecer Contraseña"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>¡Contraseña restablecida!</h2>
                        <p>
                            Tu contraseña ha sido actualizada exitosamente.
                        </p>
                        <p className="success-subtitle">
                            Redirigiendo al inicio de sesión...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;