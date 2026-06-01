import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../servicios/AuthContext";
import { validarCodigoPostal } from '../servicios/validaciones';

import Footer from '@/paginas/Footer.jsx';
import EstadisticasDetalladas from "../componente/rankings/EstadisticasDetalladas.jsx";
import { obtenerCategoria, formatearSistemaJuego } from "../funciones/rankingHelper.js";

import usuarioApi from "../servicios/apiUsuarios.js";
import apiRanking from "../servicios/apiRanking.js";

import '../estilos/perfil.css';

function Perfil() {
    const { user, logout, cambiarPassword, convertirOrganizador, actualizarUsuario } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [rankingData, setRankingData] = useState([]);
    const [loadingRanking, setLoadingRanking] = useState(true);
    const [errorRanking, setErrorRanking] = useState("");
    const [sistemaRankingActivo, setSistemaRankingActivo] = useState(null);

    const [modoEdicion, setModoEdicion] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({
        nombre: user?.nombre || "", apellidos: user?.apellidos || "",
        nombre_alias: user?.nombre_alias || "", club: user?.club || "",
        email: user?.email || "", pais: user?.pais || "",
        localidad: user?.localidad || "", codigo_postal: user?.codigo_postal || ""
    });
    const [loadingEdicion, setLoadingEdicion] = useState(false);
    const [loadingCP, setLoadingCP] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState("");
    const [errors, setErrors] = useState({});
    const [successEdicion, setSuccessEdicion] = useState("");

    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [errorPassword, setErrorPassword] = useState("");
    const [successPassword, setSuccessPassword] = useState("");

    const [loadingOrganizador, setLoadingOrganizador] = useState(false);
    const [errorOrganizador, setErrorOrganizador] = useState("");
    const [torneosCoorganizando, setTorneosCoorganizando] = useState([]);

    const [torneosCreados, setTorneosCreados] = useState([]);
    const [torneosParticipando, setTorneosParticipando] = useState([]);
    const [loadingTorneos, setLoadingTorneos] = useState(true);
    const [errorTorneos, setErrorTorneos] = useState("");

    const paises = [
        { value: "",               label: t('registro.pais_selecciona'), codigo: "" },
        { value: "España",         label: "España 🇪🇸",                  codigo: "ES" },
        { value: "Francia",        label: "Francia 🇫🇷",                 codigo: "FR" },
        { value: "Portugal",       label: "Portugal 🇵🇹",                codigo: "PT" },
        { value: "Reino Unido",    label: "Reino Unido 🇬🇧",             codigo: "GB" },
        { value: "Alemania",       label: "Alemania 🇩🇪",                codigo: "DE" },
        { value: "Italia",         label: "Italia 🇮🇹",                  codigo: "IT" },
        { value: "Países Bajos",   label: "Países Bajos 🇳🇱",            codigo: "NL" },
        { value: "Bélgica",        label: "Bélgica 🇧🇪",                 codigo: "BE" },
        { value: "Suiza",          label: "Suiza 🇨🇭",                   codigo: "CH" },
        { value: "Austria",        label: "Austria 🇦🇹",                 codigo: "AT" },
        { value: "Estados Unidos", label: "Estados Unidos 🇺🇸",          codigo: "US" },
        { value: "Canadá",         label: "Canadá 🇨🇦",                  codigo: "CA" },
        { value: "México",         label: "México 🇲🇽",                  codigo: "MX" },
        { value: "Argentina",      label: "Argentina 🇦🇷",               codigo: "AR" },
        { value: "Brasil",         label: "Brasil 🇧🇷",                  codigo: "BR" }
    ];

    const traducirCategoria = (nombre) => {
        const mapa = {
            'Gran Maestro': t('ranking.cat.gran_maestro'),
            'Maestro':      t('ranking.cat.maestro'),
            'Experto':      t('ranking.cat.experto'),
            'Avanzado':     t('ranking.cat.avanzado'),
            'Intermedio':   t('ranking.cat.intermedio'),
            'Principiante': t('ranking.cat.principiante'),
            'Novato':       t('ranking.cat.novato'),
        };
        return mapa[nombre] || nombre;
    };

    const getRutaTorneo = (sistema) => {
        const s = (sistema || '').toLowerCase();
        if (s.includes('warmaster')) return 'torneosWarmaster';
        if (s.includes('fow') || s.includes('flames')) return 'torneosFow';
        if (s.includes('epic')) return 'torneosEpic';
        if (s.includes('dracula')) return 'torneosDracula';
        return 'torneosSaga';
    };

    const traducirEstado = (estado) => {
        const mapa = {
            'pendiente':  t('estado.pendiente'),
            'en_curso':   t('estado.en_curso'),
            'finalizado': t('estado.finalizado')
        };
        return mapa[estado] || estado?.toUpperCase() || 'pendiente';
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return t('perfil.sin_fecha');
        const locale = i18n.language === 'es' ? 'es-ES' : 'en-GB';
        return new Date(fecha).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getEstadoClase = (estado) => ({
        'pendiente': 'estado-pendiente',
        'en_curso':  'estado-encurso',
        'finalizado':'estado-finalizado'
    }[estado] || 'estado-pendiente');

    useEffect(() => {
        if (user) {
            setDatosEdicion({
                nombre: user.nombre || "", apellidos: user.apellidos || "",
                nombre_alias: user.nombre_alias || "", club: user.club || "",
                email: user.email || "", pais: user.pais || "",
                localidad: user.localidad || "", codigo_postal: user.codigo_postal || ""
            });
        }
    }, [user]);

    useEffect(() => {
        const cargarTorneosUsuario = async () => {
            if (!user?.id) return;
            try {
                setLoadingTorneos(true);
                const response = await usuarioApi.obtenerTorneosUsuario(user.id);
                if (response.success || response.data) {
                    const data = response.data || response;
                    setTorneosCreados(data.torneosCreados || []);
                    setTorneosParticipando(data.torneosParticipando || []);
                    setTorneosCoorganizando(data.torneosCoorganizando || []);
                } else {
                    setErrorTorneos(response.error || t('perfil.error_torneos'));
                }
            } catch (error) {
                setErrorTorneos(error.message || t('perfil.error_conexion'));
            } finally {
                setLoadingTorneos(false);
            }
        };
        cargarTorneosUsuario();
    }, [user]);

    useEffect(() => {
        const cargarRankingJugador = async () => {
            if (!user?.id) return;
            try {
                setLoadingRanking(true);
                const data = await apiRanking.obtenerPerfilJugador(user.id);
                if (data?.length > 0) {
                    setRankingData(data);
                    setSistemaRankingActivo(data[0].sistema_juego);
                } else {
                    setRankingData([]);
                }
            } catch  {
                setErrorRanking(t('perfil.error_ranking'));
            } finally {
                setLoadingRanking(false);
            }
        };
        cargarRankingJugador();
    }, [user]);

    const buscarLocalidadCP = async (codigoPostal, paisNombre) => {
        if (!codigoPostal || !paisNombre) return;
        const paisObj = paises.find(p => p.value === paisNombre);
        if (!paisObj?.codigo) return;
        try {
            setLoadingCP(true);
            const response = await fetch(`http://api.zippopotam.us/${paisObj.codigo}/${codigoPostal}`);
            if (!response.ok) throw new Error('CP no encontrado');
            const data = await response.json();
            if (data.places?.length > 0) {
                setDatosEdicion(prev => ({ ...prev, localidad: data.places[0]['place name'] || data.places[0].state || '' }));
                setErrors(prev => { const e = { ...prev }; delete e.localidad; return e; });
            }
        } catch (err) {
            console.error('No se pudo obtener la localidad:', err.message);
        } finally {
            setLoadingCP(false);
        }
    };

    const handleEdicionChange = (e) => {
        const { name, value } = e.target;
        setDatosEdicion(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e; });
        if (errorEdicion) setErrorEdicion("");
        if (successEdicion) setSuccessEdicion("");
        if (name === 'pais') {
            setDatosEdicion(prev => ({ ...prev, codigo_postal: "", localidad: "" }));
            setErrors(prev => { const e = { ...prev }; delete e.codigo_postal; delete e.localidad; return e; });
        }
    };

    const handleCodigoPostalChange = (e) => {
        setDatosEdicion(prev => ({ ...prev, codigo_postal: e.target.value }));
        if (errors.codigo_postal) setErrors(prev => { const e = { ...prev }; delete e.codigo_postal; return e; });
    };

    const handleCodigoPostalBlur = async () => {
        if (datosEdicion.codigo_postal && datosEdicion.pais) {
            const validacion = validarCodigoPostal(datosEdicion.codigo_postal, datosEdicion.pais);
            if (!validacion.valido) { setErrors(prev => ({ ...prev, codigo_postal: validacion.mensaje })); return; }
            await buscarLocalidadCP(datosEdicion.codigo_postal, datosEdicion.pais);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (errorPassword) setErrorPassword("");
        if (successPassword) setSuccessPassword("");
    };

    const validarEdicion = () => {
        const nuevosErrores = {};
        if (!datosEdicion.nombre.trim())    nuevosErrores.nombre    = t('perfil.val_nombre');
        if (!datosEdicion.apellidos.trim()) nuevosErrores.apellidos = t('perfil.val_apellidos');
        if (!datosEdicion.email.trim()) {
            nuevosErrores.email = t('registro.errores.email_requerido');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosEdicion.email)) {
            nuevosErrores.email = t('registro.errores.email_invalido');
        }
        if (!datosEdicion.pais)               nuevosErrores.pais          = t('registro.errores.pais_requerido');
        if (!datosEdicion.localidad.trim())    nuevosErrores.localidad     = t('registro.errores.localidad_requerida');
        if (!datosEdicion.codigo_postal.trim()) {
            nuevosErrores.codigo_postal = t('registro.errores.cp_requerido');
        } else if (datosEdicion.pais) {
            const v = validarCodigoPostal(datosEdicion.codigo_postal, datosEdicion.pais);
            if (!v.valido) nuevosErrores.codigo_postal = v.mensaje;
        }
        setErrors(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) { setErrorEdicion(Object.values(nuevosErrores)[0]); return false; }
        return true;
    };

    const handleGuardarCambios = async () => {
        if (!validarEdicion()) return;
        setLoadingEdicion(true); setErrorEdicion(""); setSuccessEdicion("");
        try {
            const data = await usuarioApi.actualizarPerfil(datosEdicion);
            if (data.success) {
                actualizarUsuario(data.data.usuario);
                setSuccessEdicion(t('perfil.exito_perfil'));
                setModoEdicion(false);
                setTimeout(() => setSuccessEdicion(""), 3000);
            } else {
                setErrorEdicion(data.error || t('perfil.error_perfil'));
            }
        } catch (error) {
            setErrorEdicion(error.message || t('perfil.error_conexion'));
        } finally {
            setLoadingEdicion(false);
        }
    };

    const handleCancelarEdicion = () => {
        setModoEdicion(false);
        setDatosEdicion({ nombre: user?.nombre || "", apellidos: user?.apellidos || "", nombre_alias: user?.nombre_alias || "", club: user?.club || "", email: user?.email || "", pais: user?.pais || "", localidad: user?.localidad || "", codigo_postal: user?.codigo_postal || "" });
        setErrorEdicion(""); setErrors({}); setSuccessEdicion("");
    };

    const validarPasswordForm = () => {
        if (!passwordData.passwordActual || !passwordData.passwordNueva || !passwordData.confirmarPassword) {
            setErrorPassword(t('perfil.val_pwd_campos')); return false;
        }
        if (passwordData.passwordNueva !== passwordData.confirmarPassword) {
            setErrorPassword(t('registro.errores.passwords_no_coinciden')); return false;
        }
        if (passwordData.passwordNueva.length < 6) {
            setErrorPassword(t('registro.errores.password_corta')); return false;
        }
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(passwordData.passwordNueva)) {
            setErrorPassword(t('registro.errores.password_formato')); return false;
        }
        return true;
    };

    const handleCambiarPassword = async (e) => {
        e.preventDefault();
        if (!validarPasswordForm()) return;
        setLoadingPassword(true); setErrorPassword(""); setSuccessPassword("");
        try {
            const resultado = await cambiarPassword(passwordData.passwordActual, passwordData.passwordNueva);
            if (resultado.success) {
                setSuccessPassword(t('perfil.exito_password'));
                setPasswordData({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
                setTimeout(() => { setMostrarCambioPassword(false); setSuccessPassword(""); }, 2000);
            } else {
                setErrorPassword(resultado.error || t('perfil.error_password'));
            }
        } catch (error) {
            setErrorPassword(t('perfil.error_conexion') + ': ' + (error.message || ""));
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleConvertirOrganizador = async () => {
        if (!window.confirm(t('perfil.confirmar_organizador'))) return;
        setLoadingOrganizador(true); setErrorOrganizador("");
        try {
            const resultado = await convertirOrganizador();
            if (resultado.success) {
                alert(t('perfil.exito_organizador'));
            } else {
                setErrorOrganizador(resultado.error || t('perfil.error_rol'));
            }
        } catch  {
            setErrorOrganizador(t('perfil.error_conexion'));
        } finally {
            setLoadingOrganizador(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm(t('perfil.confirmar_logout'))) { logout(); navigate('/'); }
    };

    if (!user) return null;

    const SISTEMAS = [
        { key: 'SAGA',     icono: '⚔️', label: 'SAGA' },
        { key: 'WARMASTER',icono: '⚔️', label: 'WARMASTER' },
        { key: 'FOW',      icono: '⚔️', label: 'FLAMES OF WAR' },
        { key: 'EPIC',     icono: '⚔️', label: 'EPIC' },
        { key: 'DRACULA',  icono: '⚔️', label: 'DRACULA' }
    ];

    return (
        <div className="perfil-container">
            <h1>👤 {t('perfil.titulo')}</h1>

            <div className="perfil-card">

                {/* INFO PERSONAL + SEGURIDAD */}
                <section className="info-security-combined">
                    <div className="headers-combined-row">
                        <div className="section-header">
                            <h2>📋 {t('perfil.info_personal')}</h2>
                            {!modoEdicion && (
                                <button className="btn-secondary" onClick={() => setModoEdicion(true)}>
                                    ✏️ {t('perfil.editar_perfil')}
                                </button>
                            )}
                        </div>
                        <div className="section-header">
                            <h2>🔒 {t('perfil.seguridad')}</h2>
                            {!mostrarCambioPassword && (
                                <button className="btn-secondary" onClick={() => setMostrarCambioPassword(true)}>
                                    🔑 {t('perfil.cambiar_password')}
                                </button>
                            )}
                        </div>
                    </div>

                    {errorEdicion   && <div className="error-message">{errorEdicion}</div>}
                    {successEdicion && <div className="success-message">{successEdicion}</div>}

                    {modoEdicion ? (
                        <form className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="nombre">{t('registro.nombre')} <span className="required">*</span></label>
                                    <input type="text" id="nombre" name="nombre" value={datosEdicion.nombre} onChange={handleEdicionChange}
                                        placeholder={t('registro.nombre_placeholder')} disabled={loadingEdicion}
                                        className={errors.nombre ? 'input-error' : ''} required />
                                    {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="apellidos">{t('registro.apellidos')} <span className="required">*</span></label>
                                    <input type="text" id="apellidos" name="apellidos" value={datosEdicion.apellidos} onChange={handleEdicionChange}
                                        placeholder={t('registro.apellidos_placeholder')} disabled={loadingEdicion}
                                        className={errors.apellidos ? 'input-error' : ''} required />
                                    {errors.apellidos && <span className="field-error">{errors.apellidos}</span>}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="nombre_alias">{t('registro.alias')}</label>
                                    <input type="text" id="nombre_alias" name="nombre_alias" value={datosEdicion.nombre_alias}
                                        onChange={handleEdicionChange} placeholder={t('registro.alias_placeholder')} disabled={loadingEdicion} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="club">{t('registro.club')}</label>
                                    <input type="text" id="club" name="club" value={datosEdicion.club}
                                        onChange={handleEdicionChange} placeholder={t('registro.club_placeholder')} disabled={loadingEdicion} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">{t('registro.email')} <span className="required">*</span></label>
                                <input type="email" id="email" name="email" value={datosEdicion.email} onChange={handleEdicionChange}
                                    placeholder={t('registro.email_placeholder')} disabled={loadingEdicion}
                                    className={errors.email ? 'input-error' : ''} required />
                                {errors.email && <span className="field-error">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="pais">{t('registro.pais')} <span className="required">*</span></label>
                                <select id="pais" name="pais" value={datosEdicion.pais} onChange={handleEdicionChange}
                                    disabled={loadingEdicion} className={errors.pais ? 'input-error' : ''} required>
                                    {paises.map((p, i) => <option key={i} value={p.value}>{p.label}</option>)}
                                </select>
                                {errors.pais && <span className="field-error">{errors.pais}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="codigo_postal">{t('registro.cp')} <span className="required">*</span></label>
                                    <div className="input-with-loader">
                                        <input type="text" id="codigo_postal" name="codigo_postal" value={datosEdicion.codigo_postal}
                                            onChange={handleCodigoPostalChange} onBlur={handleCodigoPostalBlur}
                                            placeholder={datosEdicion.pais ? t('registro.cp_placeholder') : t('registro.cp_placeholder_sin_pais')}
                                            disabled={loadingEdicion || !datosEdicion.pais}
                                            className={errors.codigo_postal ? 'input-error' : ''} required />
                                        {loadingCP && <span className="input-loader">🔍</span>}
                                    </div>
                                    {errors.codigo_postal && <span className="field-error">{errors.codigo_postal}</span>}
                                    <small className="field-hint">{datosEdicion.pais ? t('registro.cp_hint') : t('registro.cp_hint_sin_pais')}</small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="localidad">{t('registro.localidad')} <span className="required">*</span></label>
                                    <input type="text" id="localidad" name="localidad" value={datosEdicion.localidad}
                                        onChange={handleEdicionChange} placeholder={t('registro.localidad_placeholder')}
                                        disabled={loadingEdicion} className={errors.localidad ? 'input-error' : ''} required />
                                    {errors.localidad && <span className="field-error">{errors.localidad}</span>}
                                    <small className="field-hint">{t('registro.localidad_hint')}</small>
                                </div>
                            </div>

                            <div className="button-group">
                                <button type="button" className="btn-primary" onClick={handleGuardarCambios} disabled={loadingEdicion}>
                                    {loadingEdicion ? `⏳ ${t('perfil.guardando')}` : `✅ ${t('perfil.guardar_cambios')}`}
                                </button>
                                <button type="button" className="btn-secondary" onClick={handleCancelarEdicion} disabled={loadingEdicion}>
                                    ❌ {t('botones.cancelar')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="info-grid">
                            <div className="info-item"><label>{t('perfil.nombre_label')}</label><p>{user.nombre} {user.apellidos}</p></div>
                            <div className="info-item"><label>{t('perfil.alias_label')}</label><p>{user.nombre_alias || t('perfil.no_especificado')}</p></div>
                            <div className="info-item"><label>{t('navbar.club')}</label><p>{user.club || t('perfil.no_especificado')}</p></div>
                            <div className="info-item"><label>{t('registro.email')}</label><p>{user.email}</p></div>
                            <div className="info-item">
                                <label>{t('navbar.rol')}</label>
                                <p className={`rol-badge ${user.rol}`}>
                                    {user.rol === 'organizador' ? `⚔️ ${t('perfil.rol_organizador')}` : `🎮 ${t('perfil.rol_jugador')}`}
                                </p>
                            </div>
                            <div className="info-item"><label>{t('registro.pais')}</label><p>{user.pais || t('perfil.no_especificado')}</p></div>
                            <div className="info-item"><label>{t('registro.cp')}</label><p>{user.codigo_postal || t('perfil.no_especificado')}</p></div>
                            <div className="info-item"><label>{t('registro.localidad')}</label><p>{user.localidad || t('perfil.no_especificado')}</p></div>
                        </div>
                    )}

                    {mostrarCambioPassword && (
                        <form onSubmit={handleCambiarPassword} className="password-form">
                            {errorPassword   && <div className="error-message">{errorPassword}</div>}
                            {successPassword && <div className="success-message">{successPassword}</div>}

                            <div className="form-group">
                                <label>{t('perfil.pwd_actual')}</label>
                                <input type={showPassword ? "text" : "password"} name="passwordActual"
                                    value={passwordData.passwordActual} onChange={handlePasswordChange}
                                    placeholder={t('perfil.pwd_actual_placeholder')} disabled={loadingPassword} required />
                            </div>
                            <div className="form-group">
                                <label>{t('perfil.pwd_nueva')}</label>
                                <input type={showPassword ? "text" : "password"} name="passwordNueva"
                                    value={passwordData.passwordNueva} onChange={handlePasswordChange}
                                    placeholder={t('registro.password_placeholder')} disabled={loadingPassword} required />
                                <small className="field-hint">{t('registro.password_hint')}</small>
                            </div>
                            <div className="form-group">
                                <label>{t('perfil.pwd_confirmar')}</label>
                                <input type={showPassword ? "text" : "password"} name="confirmarPassword"
                                    value={passwordData.confirmarPassword} onChange={handlePasswordChange}
                                    placeholder={t('registro.confirmar_password_placeholder')} disabled={loadingPassword} required />
                            </div>

                            <div className="checkbox-group">
                                <input type="checkbox" id="showPassword" checked={showPassword}
                                    onChange={() => setShowPassword(p => !p)} disabled={loadingPassword} />
                                <label htmlFor="showPassword">{t('registro.mostrar_passwords')}</label>
                            </div>

                            <div className="button-group">
                                <button type="submit" className="btn-primary" disabled={loadingPassword}>
                                    {loadingPassword ? `⏳ ${t('perfil.actualizando')}` : `✅ ${t('perfil.actualizar_password')}`}
                                </button>
                                <button type="button" className="btn-secondary" disabled={loadingPassword}
                                    onClick={() => { setMostrarCambioPassword(false); setPasswordData({ passwordActual: "", passwordNueva: "", confirmarPassword: "" }); setErrorPassword(""); setSuccessPassword(""); }}>
                                    ❌ {t('botones.cancelar')}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* RANKING */}
                <section className="ranking-section">
                    <div className="section-header">
                        <h2>🏆 {t('perfil.mis_estadisticas')}</h2>
                        <Link to="/ranking" className="btn-secondary">{t('perfil.ver_ranking_completo')}</Link>
                    </div>

                    {loadingRanking ? (
                        <div className="loading-message">⏳ {t('perfil.cargando_estadisticas')}</div>
                    ) : errorRanking || rankingData.length === 0 ? (
                        <div className="info-message">
                            <p>📊 {t('perfil.sin_estadisticas')}</p>
                            <small>{t('perfil.sin_estadisticas_hint')}</small>
                        </div>
                    ) : (
                        <>
                            {rankingData.length > 1 && (
                                <div className="ranking-tabs">
                                    {rankingData.map(sistema => {
                                        const categoria = obtenerCategoria(sistema.elo_actual);
                                        return (
                                            <button key={sistema.sistema_juego}
                                                className={`ranking-tab ${sistemaRankingActivo === sistema.sistema_juego ? 'active' : ''}`}
                                                onClick={() => setSistemaRankingActivo(sistema.sistema_juego)}>
                                                <span className="tab-sistema">{formatearSistemaJuego(sistema.sistema_juego)}</span>
                                                <span className="tab-elo">{sistema.elo_actual} ELO</span>
                                                <span className="tab-categoria">{categoria.icono} {traducirCategoria(categoria.nombre)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {rankingData.map(sistema => {
                                if (sistema.sistema_juego !== sistemaRankingActivo) return null;
                                const categoria = obtenerCategoria(sistema.elo_actual);
                                const porcentajeVictorias = sistema.partidas_jugadas > 0
                                    ? ((sistema.victorias / sistema.partidas_jugadas) * 100).toFixed(1) : 0;

                                return (
                                    <div key={sistema.sistema_juego} className="ranking-content">
                                        <div className="ranking-resumen">
                                            <div className="ranking-principal">
                                                <div className="elo-display">
                                                    <span className="elo-numero">{sistema.elo_actual}</span>
                                                    <span className="elo-label">ELO Rating</span>
                                                </div>
                                                <div className="ranking-info">
                                                    <div className="categoria-display">
                                                        <span className={`categoria-icono ${categoria.clase}`}>{categoria.icono}</span>
                                                        <div>
                                                            <span className="categoria-nombre">{traducirCategoria(categoria.nombre)}</span>
                                                            <span className="sistema-nombre">{formatearSistemaJuego(sistema.sistema_juego)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="posicion-ranking">
                                                        <span className="posicion-numero">#{sistema.posicion_ranking || '?'}</span>
                                                        <span className="posicion-label">{t('perfil.en_el_ranking')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="stats-grid">
                                                <div className="stat-box"><span className="stat-icono">🎮</span><span className="stat-valor">{sistema.partidas_jugadas}</span><span className="stat-label">{t('perfil.stat_pj')}</span></div>
                                                <div className="stat-box victoria"><span className="stat-icono">✅</span><span className="stat-valor">{sistema.victorias}</span><span className="stat-label">{t('perfil.stat_victorias')}</span></div>
                                                <div className="stat-box derrota"><span className="stat-icono">❌</span><span className="stat-valor">{sistema.derrotas}</span><span className="stat-label">{t('perfil.stat_derrotas')}</span></div>
                                                <div className="stat-box empate"><span className="stat-icono">🤝</span><span className="stat-valor">{sistema.empates}</span><span className="stat-label">{t('perfil.stat_empates')}</span></div>
                                                <div className="stat-box destacado"><span className="stat-icono">📈</span><span className="stat-valor">{porcentajeVictorias}%</span><span className="stat-label">{t('perfil.stat_pct')}</span></div>
                                                <div className="stat-box"><span className="stat-icono">🏆</span><span className="stat-valor">{sistema.elo_maximo}</span><span className="stat-label">{t('perfil.stat_elo_max')}</span></div>
                                            </div>
                                            <EstadisticasDetalladas jugadorId={user.id} sistemaJuego={sistema.sistema_juego} />
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </section>

                {/* TORNEOS CREADOS */}
                {user.rol === 'organizador' && (
                    <section className="torneos-section">
                        <div className="section-header">
                            <h2>🏆 {t('perfil.mis_torneos_creados', { count: torneosCreados.length + torneosCoorganizando.length })}</h2>
                            <Link to="/seleccionarJuegos" className="btn-primary">➕ {t('perfil.crear_torneo')}</Link>
                        </div>

                        {loadingTorneos ? (
                            <div className="loading-message">⏳ {t('perfil.cargando_torneos')}</div>
                        ) : errorTorneos ? (
                            <div className="error-message">{errorTorneos}</div>
                        ) : torneosCreados.length === 0 && torneosCoorganizando.length === 0 ? (
                            <div className="empty-message"><p>📝 {t('perfil.sin_torneos_creados')}</p></div>
                        ) : (
                            <div className="torneos-tabla-wrapper">
                                <table className="torneos-tabla">
                                    <thead>
                                        <tr>
                                            <th>{t('perfil.nombre')}</th>
                                            <th>{t('perfil.th_sistema')}</th>
                                            <th>{t('perfil.estado')}</th>
                                            <th>{t('navbar.rol')}</th>
                                            <th>{t('perfil.acciones')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {torneosCreados.map(torneo => (
                                            <tr key={torneo.id}>
                                                <td className="torneo-nombre-cel">{torneo.nombre_torneo}</td>
                                                <td>{torneo.sistema}</td>
                                                <td><span className={`estado-badge ${getEstadoClase(torneo.estado)}`}>{traducirEstado(torneo.estado)}</span></td>
                                                <td><span className="rol-badge-tabla">🤝 {t('perfil.rol_org_principal')}</span></td>
                                                <td className="acciones-cel">
                                                    <Link to={`/administrarTorneo/${torneo.id}`} className="btn-tabla btn-administrar">⚙️ {t('botones.administrar')}</Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {torneosCoorganizando.map(torneo => (
                                            <tr key={`coorg-${torneo.id}`}>
                                                <td className="torneo-nombre-cel">{torneo.nombre_torneo}</td>
                                                <td>{torneo.sistema}</td>
                                                <td><span className={`estado-badge ${getEstadoClase(torneo.estado)}`}>{traducirEstado(torneo.estado)}</span></td>
                                                <td><span className="rol-badge-tabla">🤝 {t('perfil.rol_coorganizador')}</span></td>
                                                <td className="acciones-cel">
                                                    <Link to={`/administrarTorneo/${torneo.id}`} className="btn-tabla btn-administrar">⚙️ {t('botones.administrar')}</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* TORNEOS PARTICIPANDO */}
                <section className="torneos-section">
                    <div className="section-header">
                        <h2>🎮 {t('perfil.torneos_participando', { count: torneosParticipando.length })}</h2>
                    </div>

                    {loadingTorneos ? (
                        <div className="loading-message">⏳ {t('perfil.cargando_torneos')}</div>
                    ) : errorTorneos ? (
                        <div className="error-message">{errorTorneos}</div>
                    ) : torneosParticipando.length === 0 ? (
                        <div className="empty-message">
                            <p>🎯 {t('perfil.sin_torneos_participando')}</p>
                            <Link to="/" className="btn-secondary">{t('perfil.ver_disponibles')}</Link>
                        </div>
                    ) : (
                        <>
                            {SISTEMAS.map(({ key, icono, label }) => {
                                const torneosSistema = torneosParticipando.filter(t => (t.sistema || '').toUpperCase() === key);
                                if (torneosSistema.length === 0) return null;
                                return (
                                    <div key={key} className="torneos-sistema-bloque">
                                        <h3 className="torneos-sistema-titulo">{icono} {label}</h3>
                                        <div className="torneos-tabla-wrapper">
                                            <table className="torneos-tabla">
                                                <thead>
                                                    <tr>
                                                        <th>{t('perfil.nombre')}</th>
                                                        <th>{t('perfil.th_sistema')}</th>
                                                        <th>{t('perfil.estado')}</th>
                                                        <th>{t('perfil.fecha')}</th>
                                                        {key !== 'WARMASTER' && key !== 'EPIC' && <th>{t('perfil.epocas')}</th>}
                                                        <th>{t('perfil.faccion')}</th>
                                                        <th>{t('perfil.acciones')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {torneosSistema.map(torneo => (
                                                        <tr key={torneo.id}>
                                                            <td className="torneo-nombre-cel">{torneo.nombre_torneo}</td>
                                                            <td>{torneo.sistema}</td>
                                                            <td><span className={`estado-badge ${getEstadoClase(torneo.estado)}`}>{traducirEstado(torneo.estado)}</span></td>
                                                            <td>{formatearFecha(torneo.fecha_inicio)}</td>
                                                            {key !== 'WARMASTER' && key !== 'EPIC' && <td>{torneo.epocas_disponibles || '—'}</td>}
                                                            <td>{torneo.faccion || '—'}</td>
                                                            <td className="acciones-cel">
                                                                <Link to={`/${getRutaTorneo(torneo.sistema)}/${torneo.id}/detalles`} className="btn-tabla btn-ver">
                                                                    👁️ {t('botones.ver_detalles')}
                                                                </Link>
                                                                {torneo.estado === 'pendiente' && (
                                                                    <Link to={`/${getRutaTorneo(torneo.sistema)}/${torneo.id}/editar-inscripcion`} className="btn-tabla btn-inscribir">
                                                                        📝 {t('perfil.titulo_editar')}
                                                                    </Link>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </section>

                {/* CONVERTIRSE EN ORGANIZADOR */}
                {user.rol === 'jugador' && (
                    <section className="organizador-section">
                        <h2>⚔️ {t('perfil.quieres_organizar')}</h2>
                        <p>{t('perfil.quieres_organizar_texto')}</p>
                        {errorOrganizador && <div className="error-message">{errorOrganizador}</div>}
                        <button className="btn-upgrade" onClick={handleConvertirOrganizador} disabled={loadingOrganizador}>
                            {loadingOrganizador ? `⏳ ${t('perfil.procesando')}` : `🚀 ${t('perfil.convertirse_organizador')}`}
                        </button>
                    </section>
                )}

                {/* CERRAR SESIÓN */}
                <section className="logout-section">
                    <button className="btn-danger" onClick={handleLogout}>
                        🚪 {t('navbar.cerrar_sesion')}
                    </button>
                </section>
            </div>
            <Footer />
        </div>
    );
}

export default Perfil;