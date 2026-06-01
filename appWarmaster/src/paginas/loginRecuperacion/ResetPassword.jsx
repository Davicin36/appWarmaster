import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import usuarioApi from "@/servicios/apiUsuarios";

import '@/estilos/resetPassword.css';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenValido, setTokenValido] = useState(null);

    useEffect(() => {
        if (!token) {
            setError(t('reset.error_token_invalido'));
            setTokenValido(false);
            return;
        }
        verificarToken();
    }, [token]);

    const verificarToken = async () => {
        try {
            const data = await usuarioApi.verificarTokenRecuperar(token);
            if (data.success) {
                setTokenValido(true);
            } else {
                setTokenValido(false);
                setError(data.mensaje || t('reset.error_token_expirado'));
            }
        } catch (err) {
            console.error("Error:", err);
            setTokenValido(false);
            setError(err.message || t('reset.error_verificar'));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    const validarPassword = (password) => {
        if (password.length < 8)          return t('reset.val_longitud');
        if (!/[A-Z]/.test(password))      return t('reset.val_mayuscula');
        if (!/[a-z]/.test(password))      return t('reset.val_minuscula');
        if (!/[0-9]/.test(password))      return t('reset.val_numero');
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.password.trim() || !formData.confirmPassword.trim()) {
            setError(t('registro.errores.campos_requeridos'));
            return;
        }

        const errorValidacion = validarPassword(formData.password);
        if (errorValidacion) { setError(errorValidacion); return; }

        if (formData.password !== formData.confirmPassword) {
            setError(t('registro.errores.passwords_no_coinciden'));
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await usuarioApi.resetPassword(token, formData.password);
            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 3000);
            } else {
                setError(data.mensaje || t('reset.error_restablecer'));
            }
        } catch (err) {
            console.error("Error:", err);
            setError(err.message || t('recuperar.error_conexion'));
        } finally {
            setLoading(false);
        }
    };

    if (tokenValido === null) return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <p>{t('reset.verificando')}</p>
            </div>
        </div>
    );

    if (tokenValido === false) return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="error-icon">✕</div>
                <h2>{t('reset.enlace_invalido')}</h2>
                <p className="error-text">{error}</p>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    {t('inscripcion_general.volver_inicio')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                {!success ? (
                    <>
                        <h2>{t('reset.titulo')}</h2>
                        <p className="reset-description">{t('reset.descripcion')}</p>

                        <form className="reset-form" onSubmit={handleSubmit}>
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="password">{t('reset.nueva_password')}</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password" name="password"
                                    value={formData.password} onChange={handleChange}
                                    placeholder={t('reset.placeholder_password')}
                                    required disabled={loading}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">{t('registro.confirmar_password')}</label>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword" name="confirmPassword"
                                    value={formData.confirmPassword} onChange={handleChange}
                                    placeholder={t('registro.confirmar_password_placeholder')}
                                    required disabled={loading}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="password-requirements">
                                <p>{t('reset.requisitos_titulo')}</p>
                                <ul>
                                    <li className={formData.password.length >= 8 ? 'valid' : ''}>{t('reset.req_longitud')}</li>
                                    <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>{t('reset.req_mayuscula')}</li>
                                    <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>{t('reset.req_minuscula')}</li>
                                    <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>{t('reset.req_numero')}</li>
                                </ul>
                            </div>

                            <div className="checkbox-group">
                                <input
                                    type="checkbox" id="showPasswords"
                                    checked={showPassword && showConfirmPassword}
                                    onChange={() => { setShowPassword(p => !p); setShowConfirmPassword(p => !p); }}
                                    disabled={loading}
                                />
                                <label htmlFor="showPasswords">{t('registro.mostrar_passwords')}</label>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? t('reset.guardando') : t('reset.btn_restablecer')}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>{t('reset.exito_titulo')}</h2>
                        <p>{t('reset.exito_texto')}</p>
                        <p className="success-subtitle">{t('reset.exito_redirigiendo')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPassword;