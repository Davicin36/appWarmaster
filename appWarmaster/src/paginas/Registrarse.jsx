import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { useAuth } from "../servicios/AuthContext";
import { validarCodigoPostal } from "../servicios/validaciones";
import { PAISES_FORMULARIO, listaPaises, nombrePais } from '@/funciones/paises';
import Footer from '@/paginas/Footer.jsx'

import '../estilos/registrarse.css'

function Registrarse({ onOpenLogin }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { registro } = useAuth();
    const { t, i18n } = useTranslation();
    const idioma = i18n.language?.slice(0, 2) || 'es';

    const [formData, setFormData] = useState({
        nombre: "",
        apellidos: "",
        nombre_alias: "",
        club: "",
        email: "",
        codigo_postal: "",
        localidad: "",
        pais: "",            // código ISO: 'ES', 'PT', 'FR'...
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

    // Lista de países: se guarda el código, se muestra el nombre en el idioma de la web
    const paises = listaPaises(idioma, PAISES_FORMULARIO);

    // Tu validador espera el nombre en español ("España", "Francia"...)
    const validarCP = (cp, codigoPais) => validarCodigoPostal(cp, nombrePais(codigoPais, 'es'));

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailFromUrl = params.get('email');
        if (emailFromUrl) {
            setFormData(prev => ({ ...prev, email: emailFromUrl }));
        }
    }, [location]);

    const limpiarError = (campo) => {
        setErrors(prev => { const n = { ...prev }; delete n[campo]; return n; });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'pais') {
            // Al cambiar de país, el código postal y la localidad anteriores ya no valen
            setFormData(prev => ({ ...prev, pais: value, codigo_postal: "", localidad: "" }));
            limpiarError('codigo_postal');
            limpiarError('localidad');
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) limpiarError(name);
        if (error) setError("");
        if (success) setSuccess("");
    };

    const buscarLocalidadCP = async (codigoPostal, codigoPais) => {
        if (!codigoPostal || !codigoPais) return;

        try {
            setLoadingCP(true);
            const response = await fetch(
                `https://api.zippopotam.us/${codigoPais}/${encodeURIComponent(codigoPostal)}`
            );
            if (!response.ok) throw new Error('Código postal no encontrado');
            const data = await response.json();
            if (data.places?.length > 0) {
                const lugar = data.places[0];
                setFormData(prev => ({ ...prev, localidad: lugar['place name'] || lugar.state || '' }));
                limpiarError('localidad');
            }
        } catch (err) {
            // No es un error grave: el usuario puede escribir la localidad a mano
            console.error('No se pudo obtener la localidad', err.message);
        } finally {
            setLoadingCP(false);
        }
    };

    const handleCodigoPostalChange = (e) => {
        setFormData(prev => ({ ...prev, codigo_postal: e.target.value }));
        if (errors.codigo_postal) limpiarError('codigo_postal');
    };

    const handleCPBlur = async () => {
        const cp = formData.codigo_postal.trim();
        if (!cp || !formData.pais) return;

        const validacion = validarCP(cp, formData.pais);
        if (!validacion.valido) {
            setErrors(prev => ({ ...prev, codigo_postal: validacion.mensaje }));
            return;
        }
        await buscarLocalidadCP(cp, formData.pais);
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.nombre.trim())    nuevosErrores.nombre    = t('registro.errores.campos_requeridos');
        if (!formData.apellidos.trim()) nuevosErrores.apellidos = t('registro.errores.campos_requeridos');

        if (!formData.email.trim()) {
            nuevosErrores.email = t('registro.errores.email_requerido');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            nuevosErrores.email = t('registro.errores.email_invalido');
        }

        if (!formData.pais) {
            nuevosErrores.pais = t('registro.errores.pais_requerido');
        }

        if (!formData.codigo_postal.trim()) {
            nuevosErrores.codigo_postal = t('registro.errores.cp_requerido');
        } else if (formData.pais) {
            const validacion = validarCP(formData.codigo_postal.trim(), formData.pais);
            if (!validacion.valido) nuevosErrores.codigo_postal = validacion.mensaje;
        }

        if (!formData.localidad.trim()) {
            nuevosErrores.localidad = t('registro.errores.localidad_requerida');
        }

        if (!formData.password) {
            nuevosErrores.password = t('registro.errores.password_requerida');
        } else if (formData.password.length < 6) {
            nuevosErrores.password = t('registro.errores.password_corta');
        } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(formData.password)) {
            nuevosErrores.password = t('registro.errores.password_formato');
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
                nombre: formData.nombre.trim(),
                apellidos: formData.apellidos.trim(),
                nombre_alias: formData.nombre_alias.trim(),
                club: formData.club.trim(),
                email: formData.email.trim().toLowerCase(),
                codigo_postal: formData.codigo_postal.trim().toUpperCase(),
                localidad: formData.localidad.trim(),
                pais: formData.pais,               // 'ES', 'PT'...
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

            <form className="register-form" onSubmit={handleSubmit} noValidate>
                <h2>{t('registro.crear_cuenta')}</h2>

                {error   && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {/* NOMBRE Y APELLIDOS */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nombre">{t('registro.nombre')} <span className="required">*</span></label>
                        <input
                            type="text" id="nombre" name="nombre"
                            value={formData.nombre} onChange={handleChange}
                            placeholder={t('registro.nombre_placeholder')}
                            required disabled={loading}
                            autoComplete="given-name"
                            className={errors.nombre ? 'input-error' : ''}
                        />
                        {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="apellidos">{t('registro.apellidos')} <span className="required">*</span></label>
                        <input
                            type="text" id="apellidos" name="apellidos"
                            value={formData.apellidos} onChange={handleChange}
                            placeholder={t('registro.apellidos_placeholder')}
                            required disabled={loading}
                            autoComplete="family-name"
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
                            <option value="">{t('registro.pais_selecciona')}</option>
                            {paises.map(p => (
                                <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>
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
                                autoComplete="postal-code"
                                inputMode={formData.pais === 'ES' ? 'numeric' : 'text'}
                                maxLength={15}
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
                            autoComplete="address-level2"
                            maxLength={100}
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
                                if (e.target.checked && errors.terminos) limpiarError('terminos');
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