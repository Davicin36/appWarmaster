import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../servicios/AuthContext";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

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
        setLoading(true);
        setError("");
        
        try {
            const usuario = await login(formData.email, formData.password);
            
            if (usuario) {
                console.log('Login exitoso:', usuario.email);
                navigate('/', { replace: true });
            } else {
                setError('Error al iniciar sesion. Intenta nuevamente.');
            }
        } catch (err) {
            console.error("Error en login:", err);
            const mensajeError = err.message || "Error de conexion. Intenta nuevamente.";
            setError(mensajeError);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div className="login-container">
            <h1>Gestion de Torneos de WARGAMES</h1>
            
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>INICIAR SESION</h2>
                
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
                
                <div className="button-group">
                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
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
                
                <p className="register-link">
                    ¿No tienes cuenta? <Link to="/registrarse">Registrate aqui</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;