import React, { useState, useEffect } from "react";

import '@/estilos/recuperarPassword.css';

function RecuperarPassword({ isOpen, onClose }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setError("Por favor, introduce tu email");
            return;
        }

        setLoading(true);
        setError("");
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/recuperar-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setEmail("");
                // Cerrar modal después de 3 segundos
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                }, 3000);
            } else {
                setError(data.mensaje || "Error al enviar el correo de recuperación");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleClose = () => {
        setEmail("");
        setError("");
        setSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="recuperar-modal-overlay" onClick={handleOverlayClick}>
            <div className="recuperar-modal-content">
                <button 
                    className="modal-close-btn"
                    onClick={handleClose}
                    aria-label="Cerrar"
                    type="button"
                >
                    ✕
                </button>

                <h2 className="modal-title">Recuperar Contraseña</h2>
                
                {!success ? (
                    <>
                        <p className="recuperar-description">
                            Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                        
                        <form className="recuperar-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label htmlFor="recuperar-email">Email:</label>
                                <input 
                                    type="email" 
                                    id="recuperar-email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="tu@email.com"
                                    required
                                    disabled={loading}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <p>¡Correo enviado!</p>
                        <p className="success-subtitle">
                            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecuperarPassword;