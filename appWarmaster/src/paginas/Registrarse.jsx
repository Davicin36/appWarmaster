import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { useAuth } from "../servicios/AuthContext";
import { validarCodigoPostal } from "../servicios/validaciones";
import Footer from '@/paginas/Footer.jsx'

import '../estilos/registrarse.css'

function Registrarse({ onOpenLogin }) { 
    const navigate = useNavigate();
    const location = useLocation();
    const { registro } = useAuth();
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        nombre_alias: "",
        club: "",
        email: "",
        codigo_postal: "",
        localidad: "",
        pais: "",
        password: "",
        confirmPassword: ""
    });

    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingCP, setLoadingCP] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);

    const paises = [
        { value: "",               label: t('registro.pais_selecciona'),  codigo: "" },
        { value: "España",         label: "España 🇪🇸",                    codigo: "ES" },
        { value: "Francia",        label: "Francia 🇫🇷",                   codigo: "FR" },
        { value: "Portugal",       label: "Portugal 🇵🇹",                  codigo: "PT" },
        { value: "Reino Unido",    label: "Reino Unido 🇬🇧",               codigo: "GB" },
        { value: "Alemania",       label: "Alemania 🇩🇪",                  codigo: "DE" },
        { value: "Italia",         label: "Italia 🇮🇹",                    codigo: "IT" },
        { value: "Países Bajos",   label: "Países Bajos 🇳🇱",              codigo: "NL" },
        { value: "Bélgica",        label: "Bélgica 🇧🇪",                   codigo: "BE" },
        { value: "Suiza",          label: "Suiza 🇨🇭",                     codigo: "CH" },
        { value: "Austria",        label: "Austria 🇦🇹",                   codigo: "AT" },
        { value: "Estados Unidos", label: "Estados Unidos 🇺🇸",            codigo: "US" },
        { value: "Canadá",         label: "Canadá 🇨🇦",                    codigo: "CA" },
        { value: "México",         label: "México 🇲🇽",                    codigo: "MX" },
        { value: "Argentina",      label: "Argentina 🇦🇷",                  codigo: "AR" },
        { value: "Brasil",         label: "Brasil 🇧🇷",                    codigo: "BR" }
    ];

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailFromUrl = params.get('email');
        if (emailFromUrl) {
            setFormData(prev => ({ ...prev, email: emailFromUrl }));
        }
    }, [location]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'pais') {
            setFormData(prev => ({ ...prev, codigo_postal: "", localidad: "" }));
        }

        if (errors[name]) {
            setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
        }

        if (error) setError("");
        if (success) setSuccess("");
    };

    const buscarLocalidadCP = async (codigoPostal, paisNombre) => {
        if (!codigoPostal || !paisNombre) return;
        const paisObjetivo = paises.find(p => p.value === paisNombre);
        if (!paisObjetivo?.codigo) return;

        try {
            setLoadingCP(true);
            const response = await fetch(`https://api.zippopotam.us/${paisObjetivo.codigo}/${codigoPostal}`);
            if (!response.ok) throw new Error('Código postal no encontrado');
            const data = await response.json();
            if (data.places?.length > 0) {
                const lugar = data.places[0];
                setFormData(prev => ({ ...prev, localidad: lugar['place name'] || lugar.state || '' }));
                setErrors(prev => { const n = {...prev}; delete n.localidad; return n; });
            }
        } catch (error) {
            console.error('No se pudo obtener la localidad', error.message);
        } finally {
            setLoadingCP(false);
        }
    };

    const handleCodigoPostalChange = (e) => {
        const codigoPostal = e.target.value;
        setFormData(prev => ({ ...prev, codigo_postal: codigoPostal }));
        if (errors.codigo_postal) {
            setErrors(prev => { const n = {...prev}; delete n.codigo_postal; return n; });
        }
    };

    const handleCPBlur = async () => {
        if (formData.codigo_postal && formData.pais) {
            const validacion = validarCodigoPostal(formData.codigo_postal, formData.pais);
            if (!validacion.valido) {
                setErrors(prev => ({ ...prev, codigo_postal: validacion.mensaje }));
                return;
            }
            await buscarLocalidadCP(formData.codigo_postal, formData.pais);
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password) {
            setError(t('registro.errores.campos_requeridos'));
            return false;
        }

        if (!formData.email.trim()) {
            nuevosErrores.email = t('registro.errores.email_requerido');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                nuevosErrores.email = t('registro.errores.email_invalido');
            }
        }

        if (!formData.pais) {
            nuevosErrores.pais = t('registro.errores.pais_requerido');
        }

        if (!formData.localidad.trim()) {
            nuevosErrores.localidad = t('registro.errores.localidad_requerida');
        }

        if (!formData.codigo_postal.trim()) {
            nuevosErrores.codigo_postal = t('registro.errores.cp_requerido');
        } else if (formData.pais) {
            const validacion = validarCodigoPostal(formData.codigo_postal, formData.pais);
            if (!validacion.valido) {
                nuevosErrores.codigo_postal = validacion.mensaje;
            }
        }

        if (!formData.password) {
            nuevosErrores.password = t('registro.errores.password_requerida');
        } else {
            if (formData.password.length < 6) {
                nuevosErrores.password = t('registro.errores.password_corta');
            }
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
            if (!passwordRegex.test(formData.password)) {
                nuevosErrores.password = t('registro.errores.password_formato');
            }
        }

        if (formData.password !== formData.confirmPassword) {
            nuevosErrores.confirmPassword = t('registro.errores.passwords_no_coinciden');
        }

        if (!aceptaTerminos) {
            nuevosErrores.terminos = t('registro.errores.terminos_requeridos');
        }

        setErrors(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) {
            setError(Object.values(nuevosErrores)[0]);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const datosRegistro = {
                nombre: formData.nombre,
                apellidos: formData.apellidos,
                nombre_alias: formData.nombre_alias,
                club: formData.club,
                email: formData.email,
                codigo_postal: formData.codigo_postal,
                localidad: formData.localidad,
                pais: formData.pais,
                password: formData.password,
                aceptaTerminos: true
            };

            const resultado = await registro(datosRegistro);

            if (resultado.success) {
                setSuccess(t('registro.exito'));
                setTimeout(() => {
                    navigate("/");
                    if (onOpenLogin) onOpenLogin();
                }, 2000);
            } else {
                setError(resultado.error || t('registro.errores.generico'));
            }
        } catch (err) {
            console.error("Error en registro:", err);
            setError(t('registro.errores.conexion'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <h1>{t('registro.titulo_app')}</h1>

            <form className="register-form" onSubmit={handleSubmit}>
                <h2>{t('registro.crear_cuenta')}</h2>

                {error   && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* NOMBRE Y APELLIDOS */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre">{t('registro.nombre')}</label>
                        <input
                            type="text" id="nombre" name="nombre"
                            value={formData.nombre} onChange={handleChange}
                            placeholder={t('registro.nombre_placeholder')}
                            required disabled={loading}
                            className={errors.nombre ? 'input-error' : ''}
                        />
                        {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="apellidos">{t('registro.apellidos')}</label>
                        <input
                            type="text" id="apellidos" name="apellidos"
                            value={formData.apellidos} onChange={handleChange}
                            placeholder={t('registro.apellidos_placeholder')}
                            required disabled={loading}
                            className={errors.apellidos ? 'input-error' : ''}
                        />
                        {errors.apellidos && <span className="field-error">{errors.apellidos}</span>}
                    </div>
                </div>

                {/* ALIAS Y CLUB */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre_alias">{t('registro.alias')}</label>
                        <input
                            type="text" id="nombre_alias" name="nombre_alias"
                            value={formData.nombre_alias} onChange={handleChange}
                            placeholder={t('registro.alias_placeholder')}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="club">{t('registro.club')}</label>
                        <input
                            type="text" id="club" name="club"
                            value={formData.club} onChange={handleChange}
                            placeholder={t('registro.club_placeholder')}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* PAÍS */}
                <div className="form-row-full">
                    <div className="form-group">
                        <label htmlFor="pais">{t('registro.pais')} <span className="required">*</span></label>
                        <select
                            id="pais" name="pais"
                            value={formData.pais} onChange={handleChange}
                            required disabled={loading}
                            className={errors.pais ? 'input-error' : ''}
                        >
                            {paises.map((pais, index) => (
                                <option key={index} value={pais.value}>{pais.label}</option>
                            ))}
                        </select>
                        {errors.pais && <span className="field-error">{errors.pais}</span>}
                    </div>
                </div>

                {/* CP Y LOCALIDAD */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="codigo_postal">{t('registro.cp')} <span className="required">*</span></label>
                        <div className="input-with-loader">
                            <input
                                type="text" id="codigo_postal" name="codigo_postal"
                                value={formData.codigo_postal}
                                onChange={handleCodigoPostalChange}
                                onBlur={handleCPBlur}
                                placeholder={formData.pais ? t('registro.cp_placeholder') : t('registro.cp_placeholder_sin_pais')}
                                required disabled={loading || !formData.pais}
                                className={errors.codigo_postal ? 'input-error' : ''}
                            />
                            {loadingCP && <span className="input-loader">🔍</span>}
                        </div>
                        {errors.codigo_postal && <span className="field-error">{errors.codigo_postal}</span>}
                        <small className="field-hint">
                            {formData.pais ? t('registro.cp_hint') : t('registro.cp_hint_sin_pais')}
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="localidad">{t('registro.localidad')} <span className="required">*</span></label>
                        <input
                            type="text" id="localidad" name="localidad"
                            value={formData.localidad} onChange={handleChange}
                            placeholder={t('registro.localidad_placeholder')}
                            required disabled={loading}
                            className={errors.localidad ? 'input-error' : ''}
                        />
                        {errors.localidad && <span className="field-error">{errors.localidad}</span>}
                        <small className="field-hint">{t('registro.localidad_hint')}</small>
                    </div>
                </div>

                {/* EMAIL */}
                <div className="form-row-full">
                    <div className="form-group">
                        <label htmlFor="email">{t('registro.email')} <span className="required">*</span></label>
                        <input
                            type="email" id="email" name="email"
                            value={formData.email} onChange={handleChange}
                            placeholder={t('registro.email_placeholder')}
                            required disabled={loading}
                            autoComplete="email"
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>
                </div>

                {/* CONTRASEÑAS */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="password">{t('registro.password')} <span className="required">*</span></label>
                        <input
                            type={showPasswords ? "text" : "password"}
                            id="password" name="password"
                            value={formData.password} onChange={handleChange}
                            placeholder={t('registro.password_placeholder')}
                            required disabled={loading}
                            autoComplete="new-password"
                            className={errors.password ? 'input-error' : ''}
                        />
                        {errors.password && <span className="field-error">{errors.password}</span>}
                        <small className="field-hint">{t('registro.password_hint')}</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t('registro.confirmar_password')} <span className="required">*</span></label>
                        <input
                            type={showPasswords ? "text" : "password"}
                            id="confirmPassword" name="confirmPassword"
                            value={formData.confirmPassword} onChange={handleChange}
                            placeholder={t('registro.confirmar_password_placeholder')}
                            required disabled={loading}
                            autoComplete="new-password"
                            className={errors.confirmPassword ? 'input-error' : ''}
                        />
                        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                    </div>
                </div>

                {/* MOSTRAR CONTRASEÑAS */}
                <div className="checkbox-container">
                    <div className="checkbox-group">
                        <input
                            type="checkbox" id="showPasswords"
                            checked={showPasswords}
                            onChange={() => setShowPasswords(prev => !prev)}
                            disabled={loading}
                        />
                        <label htmlFor="showPasswords">{t('registro.mostrar_passwords')}</label>
                    </div>
                </div>

                {/* TÉRMINOS */}
                <div className="terms-checkbox-container">
                    <label className={`terms-checkbox-label ${errors.terminos ? 'error' : ''}`}>
                        <input
                            type="checkbox" id="aceptaTerminos"
                            checked={aceptaTerminos}
                            onChange={(e) => {
                                setAceptaTerminos(e.target.checked);
                                if (e.target.checked && errors.terminos) {
                                    setErrors(prev => { const n = {...prev}; delete n.terminos; return n; });
                                }
                            }}
                            required disabled={loading}
                            className="terms-checkbox-input"
                        />
                        <span className="checkbox-text">
                            {t('registro.acepto')}{' '}
                            <Link to="/terminos-condiciones" target="_blank" rel="noopener noreferrer">
                                {t('registro.terminos_link')}
                            </Link>
                            {' '}{t('registro.y_la')}{' '}
                            <Link to="/politica-privacidad" target="_blank" rel="noopener noreferrer">
                                {t('registro.privacidad_link')}
                            </Link>
                        </span>
                    </label>
                    {errors.terminos && <span className="terms-error-message">{errors.terminos}</span>}
                </div>

                {/* BOTONES */}
                <div className="button-group">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? t('registro.registrando') : t('registro.crear_cuenta_btn')}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => navigate('/')} disabled={loading}>
                        {t('registro.volver')}
                    </button>
                </div>

                <p className="login-link">
                    {t('registro.ya_tienes_cuenta')}{' '}
                    <button type="button" onClick={onOpenLogin} className="link-button" disabled={loading}>
                        {t('registro.iniciar_sesion_link')}
                    </button>
                </p>
            </form>
            <Footer />
        </div>
    );
}

export default Registrarse;