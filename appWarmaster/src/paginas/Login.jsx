import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext";

import '../estilos/login.css';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        console.log('🔄 Intentando login...');
        
        try {
            const user = await login(email, password);
            
            console.log('📊 Resultado del login:', user);

            const token =localStorage.getItem(`token`)
            
            if (user && token) {
                console.log('✅ Login exitoso, redirigiendo a home...');
                
                // Pequeño delay para asegurar que el estado se actualice
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 100);
            } else {
                console.log('❌ Faltan datos de autenticación (usuario o token).');
                setError('Error al iniciar sesión. Faltan datos del usuario o token.');
            }
        } catch (err) {
            console.error("❌ Error en handleSubmit:", err);
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePassword = () => {
        setShowPassword(prev => !prev);
    };

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div>
            <h1>Gestión de Torneos de WARGAMES</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>LOGIN:</h2>
                
                {error && (
                    <div className="error-message" style={{
                        color: 'red',
                        backgroundColor: '#ffe6e6',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        border: '1px solid red'
                    }}>
                        {error}
                    </div>
                )}
                
                <label htmlFor="email">Email:</label>
                <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    disabled={loading}
                    autoComplete="email"
                />
                
                <label htmlFor="password">Contraseña:</label>
                <input 
                    type={showPassword ? "text" : "password"}
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña" 
                    required
                    disabled={loading}
                    autoComplete="current-password"
                />

                <div className="checkBoxPassword">
                    <label htmlFor="seePassword">Ver Contraseña</label>
                    <input 
                        type="checkbox" 
                        id="seePassword"
                        checked={showPassword}
                        onChange={handleTogglePassword}
                        disabled={loading}
                    />
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? "Iniciando..." : "Iniciar Sesión"}
                </button>
                <button type="button" onClick={volverInicio} disabled={loading}>
                    Atrás
                </button>
                <p>No tienes Sesión, <Link to="/registrarse">Regístrate aquí</Link></p>
            </form>
        </div>
    );
}

export default Login;