import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import usuarioApi from "@/servicios/apiUsuarios";

import '@/estilos/recuperarPassword.css';

function RecuperarPassword({ isOpen, onClose }) {
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError(t('recuperar.error_email_vacio')); return; }

        setLoading(true);
        setError("");

        try {
            const data = await usuarioApi.recuperarPassword(email);
            if (data.success) {
                setSuccess(true);
                setEmail("");
                setTimeout(() => { setSuccess(false); onClose(); }, 3000);
            } else {
                setError(data.mensaje || t('recuperar.error_envio'));
            }
        } catch (err) {
            console.error("Error:", err);
            setError(t('recuperar.error_conexion'));
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    const handleClose = () => {
        setEmail(""); setError(""); setSuccess(false); onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="recuperar-modal-overlay" onClick={handleOverlayClick}>
            <div className="recuperar-modal-content">
                <button
                    className="modal-close-btn"
                    onClick={handleClose}
                    aria-label={t('login.cerrar')}
                    type="button"
                >
                    ✕
                </button>

                <h2 className="modal-title">{t('recuperar.titulo')}</h2>

                {!success ? (
                    <>
                        <p className="recuperar-description">{t('recuperar.descripcion')}</p>

                        <form className="recuperar-form" onSubmit={handleSubmit}>
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="recuperar-email">{t('registro.email')}</label>
                                <input
                                    type="email"
                                    id="recuperar-email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                                    placeholder={t('registro.email_placeholder')}
                                    required
                                    disabled={loading}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? t('recuperar.enviando') : t('recuperar.btn_enviar')}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <p>{t('recuperar.exito_titulo')}</p>
                        <p className="success-subtitle">{t('recuperar.exito_texto')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecuperarPassword;