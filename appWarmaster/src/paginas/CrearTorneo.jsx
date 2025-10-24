import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

import { useAuth } from "../servicios/AuthContext";

function CrearTorneo() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    // Estados para los campos del formulario
    const [nombreTorneo, setNombreTorneo] = useState("");
    const [epoca, setEpoca] = useState("");
    const [clubOrganizador, setClubOrganizador] = useState("");
    const [categoria, setCategoria] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        console.log("Creando el torneo...");
        
        try {
            // Aquí deberías llamar a una función específica para crear torneos
            // En lugar de usar 'login', necesitas una función como 'crearTorneo'
            const torneoData = {
                nombreTorneo,
                rondas,
                epoca,
                clubOrganizador,
                categoria,
                fechaInicio
            };
            
            // Ejemplo: const result = await crearTorneo(torneoData);
            const result = await login(torneoData); // Cambiar por la función correcta
            
            if (result.success) {
                console.log("Torneo creado con éxito");
                navigate("/"); // Redirigir a página principal
            } else {
                setError(result.error || "Error al crear el Torneo");
            }
        } catch (err) {
            setError("Error de conexión. Intenta nuevamente.");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const volverInicio = () => {
        navigate('/');
    };

    return (
        <div>
            <h1>Crear Torneo</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            <form className="login-form" onSubmit={handleSubmit}>
                <label htmlFor="nombreTorneo">Nombre del Torneo:</label>
                <input 
                    name="nombreTorneo" 
                    id="nombreTorneo" 
                    type="text"
                    value={nombreTorneo}
                    onChange={(e) => setNombreTorneo(e.target.value)}
                    placeholder="Nombre del torneo"
                    required
                    disabled={loading}
                />
                
                <label htmlFor="epoca">Época del torneo:</label>
                <input 
                    name="epoca" 
                    id="epoca" 
                    type="text"
                    value={epoca}
                    onChange={(e) => setEpoca(e.target.value)}
                    placeholder="Ej: 2024/2025"
                    required
                    disabled={loading}
                />
                
                <label htmlFor="clubOrganizador">Club Organizador:</label>
                <input 
                    name="clubOrganizador" 
                    id="clubOrganizador" 
                    type="text"
                    value={clubOrganizador}
                    onChange={(e) => setClubOrganizador(e.target.value)}
                    placeholder="Nombre del club"
                    required
                    disabled={loading}
                />
                
                <label htmlFor="categoria">Categoría:</label>
                <input 
                    name="categoria" 
                    id="categoria" 
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Ej: Sub-17, Senior, etc."
                    required
                    disabled={loading}
                />
                
                <label htmlFor="fechaInicio">Fecha:</label>
                <input 
                    name="fechaInicio" 
                    id="fechaInicio" 
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                    disabled={loading}
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Creando..." : "Crear Torneo"}
                </button>
                
                <button type="button" onClick={volverInicio} disabled={loading}>
                    Atrás
                </button>
            </form>
        </div>
    );
}

export default CrearTorneo;