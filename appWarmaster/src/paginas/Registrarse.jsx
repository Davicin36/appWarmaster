import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../servicios/AuthContext";

import '../estilos/registrarse.css';

function Registrarse() {
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        nombre_alias: "",
        club: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const { registro } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        
        // Validar que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        // Validar longitud de contraseña
        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }
        
        try {
            const result = await registro(formData);
            
            if (result.success) {
                setSuccess("Usuario registrado exitosamente");
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setError(result.error || "Error al registrar usuario");
            }
        } catch (err) {
            setError("Error de conexión. Intenta nuevamente.");
            console.error("Error en registro:", err);
        } finally {
            setLoading(false);
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div>
            <h1>Gestión de Torneos de WARGAMES</h1>
            <form className="register-form" onSubmit={handleSubmit}>
                <h2>REGISTRO:</h2>
                
                {error && (
                    <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message" style={{color: 'green', marginBottom: '10px'}}>
                        {success}
                    </div>
                )}
                
                <label htmlFor="nombre">Nombre*:</label>
                <input 
                    type="text" 
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre"
                    required
                    disabled={loading}
                />

                <label htmlFor="apellidos">Apellidos*:</label>
                <input 
                    type="text" 
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    placeholder="Apellidos"
                    required
                    disabled={loading}
                />

                <label htmlFor="nombre_alias">Nombre Alias:</label>
                <input 
                    type="text" 
                    id="nombre_alias"
                    name="nombre_alias"
                    value={formData.nombre_alias}
                    onChange={handleChange}
                    placeholder="Nombre Alias (opcional)"
                    disabled={loading}
                />

                <label htmlFor="club">Club:</label>
                <input 
                    type="text" 
                    id="club"
                    name="club"
                    value={formData.club}
                    onChange={handleChange}
                    placeholder="Club (opcional)"
                    disabled={loading}
                />
                
                <label htmlFor="email">Email*:</label>
                <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                    disabled={loading}
                />
                
                <label htmlFor="password">Contraseña*:</label>
                <input 
                    type="password" 
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Contraseña (mínimo 6 caracteres)" 
                    required
                    disabled={loading}
                />

                <label htmlFor="confirmPassword">Confirmar Contraseña*:</label>
                <input 
                    type="password" 
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmar Contraseña" 
                    required
                    disabled={loading}
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? "Registrando..." : "Registrarse"}
                </button>
                <button type="button" onClick={volverInicio} disabled={loading}>
                    Atrás
                </button>
                <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
            </form>
        </div>
    );
}

export default Registrarse;