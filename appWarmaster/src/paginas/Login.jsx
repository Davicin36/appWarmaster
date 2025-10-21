import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        console.log("Iniciando Sesión...");
        
        try {
            const result = await login(email, password);
            
            if (result.success) {
                console.log("Login exitoso");
                navigate("/dashboard"); // Redirigir al dashboard o página principal
            } else {
                setError(result.error || "Error al iniciar sesión");
            }
        } catch (err) {
            setError("Error de conexión. Intenta nuevamente.");
            console.error("Error en login:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePassword = () => {
        const passwordInput = document.getElementById('password');
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
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
                    <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>
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
                />
                
                <label htmlFor="password">Contraseña:</label>
                <input 
                    type="password" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña" 
                    required
                    disabled={loading}
                />

                <div className="checkBoxPassword">
                    <label htmlFor="seePassword">Ver Contraseña</label>
                    <input 
                        type="checkbox" 
                        id="seePassword"
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