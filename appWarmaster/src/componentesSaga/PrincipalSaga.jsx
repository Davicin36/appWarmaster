import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../servicios/AuthContext';
import torneosSagaApi from '../servicios/apiSaga';
import logoSaga from '../assets/logoSaga.webp';
import { useSagaI18n } from './funcionesSaga/constantesFuncionesSaga';

import '../estilos/principal.css';

function PrincipalSaga({ onOpenLogin }) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const { t, i18n } = useTranslation();
    const { formatEpocas } = useSagaI18n();

    const [torneosSaga, setTorneosSaga] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const obtenerTorneosSaga = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await torneosSagaApi.obtenerTorneos();
            if (data.data && data.data.torneosSaga) {
                setTorneosSaga(data.data.torneosSaga);
            } else {
                setTorneosSaga([]);
            }
        } catch (err) {
            console.error('❌ Error al obtener torneos:', err);
            setError(err.message || t('errores.generico'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { obtenerTorneosSaga(); }, []);

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        const locale = i18n.language === 'es' ? 'es-ES' : 'en-GB';
        return new Date(fecha).toLocaleDateString(locale, {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    const apuntarseATorneo = (torneoId) => {
        if (!isAuthenticated) {
            alert(t('principal_saga.alerta_login'));
            onOpenLogin();
            return;
        }
        navigate(`/inscripcion/${torneoId}`);
    };

    const obtenerTextoEstado = (estado) => {
        const mapa = {
            'pendiente':  t('estado.pendiente'),
            'en_curso':   t('estado.en_curso'),
            'finalizado': t('estado.finalizado'),
        };
        return mapa[estado] || estado;
    };

    return (
        <div>
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                    <button onClick={obtenerTorneosSaga} className="btn-secondary">
                        🔄 {t('botones.reintentar')}
                    </button>
                </div>
            )}

            <section>
                <img src={logoSaga} alt="logo de SAGA" />
                <p>{t('principal_saga.subtitulo')}</p>

                {loading ? (
                    <p className="loading-message">⏳ {t('principal_saga.cargando')}</p>
                ) : torneosSaga.length === 0 ? (
                    <p className="no-data-message">{t('principal_saga.sin_torneos')}</p>
                ) : (
                    <div className="tabla-container">
                        <table className="tabla-torneos">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{t('tabla.nombre_torneo')}</th>
                                    <th>{t('tabla.tipo')}</th>
                                    <th>{t('tabla.epocas')}</th>
                                    <th>{t('tabla.fecha_inicio')}</th>
                                    <th>{t('tabla.ubicacion')}</th>
                                    <th>{t('tabla.organizador')}</th>
                                    <th>{t('tabla.participantes')}</th>
                                    <th>{t('perfil.estado')}</th>
                                    <th>{t('perfil.acciones')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {torneosSaga.map((torneo, index) => (
                                    <tr key={torneo.id}>
                                        <td data-label="#">{index + 1}</td>
                                        <td data-label={t('tabla.nombre_torneo')}>
                                            <strong>{torneo.nombre_torneo}</strong>
                                        </td>
                                        <td data-label={t('tabla.tipo')}>
                                            <strong>{torneo.tipo_torneo === 'Por equipos' ? t('tabla.por_equipos') : t('tabla.individual')}</strong>
                                            {torneo.tipo_torneo === 'Por equipos' && (
                                                <small className="torneo-info-extra">
                                                    ({torneo.equipos_max} {t('tabla.equipos')} / {torneo.num_jugadores_equipo} {t('tabla.jugadores')})
                                                </small>
                                            )}
                                            {torneo.tipo_torneo === 'Individual' && (
                                                <small className="torneo-info-extra">
                                                    ({torneo.participantes_max} {t('tabla.participantes_label')})
                                                </small>
                                            )}
                                        </td>
                                        <td data-label={t('tabla.epocas')}>
                                            <span className="epocas-cell">
                                                {formatEpocas(torneo.epocas_disponibles)}
                                            </span>
                                        </td>
                                        <td data-label={t('tabla.fecha_inicio')}>{formatearFecha(torneo.fecha_inicio)}</td>
                                        <td data-label={t('tabla.ubicacion')}>{torneo.ubicacion || t('tabla.por_determinar')}</td>
                                        <td data-label={t('tabla.organizador')}>
                                            {torneo.creador_nombre && torneo.creador_apellidos
                                                ? `${torneo.creador_nombre} ${torneo.creador_apellidos}`
                                                : 'N/A'}
                                            {torneo.creador_club && (
                                                <small className="club-info">📍 {torneo.creador_club}</small>
                                            )}
                                        </td>
                                        <td data-label={t('tabla.participantes')}>
                                            <span className="participantes-badge">
                                                {torneo.tipo_torneo === 'Por equipos'
                                                    ? `${torneo.total_equipos_inscritos || 0} / ${torneo.equipos_max}`
                                                    : `${torneo.total_participantes || 0} / ${torneo.participantes_max}`}
                                            </span>
                                        </td>
                                        <td data-label={t('perfil.estado')}>
                                            <span className="estado-torneos">
                                                {obtenerTextoEstado(torneo.estado)}
                                            </span>
                                        </td>
                                        <td className="acciones-cell">
                                            {torneo.es_organizador === 1 && (
                                                <button className="btn-administrar"
                                                    onClick={() => navigate(`/administrarTorneo/${torneo.id}`)}>
                                                    🔧 {t('botones.administrar')}
                                                </button>
                                            )}
                                            {torneo.estado === 'pendiente' && (
                                                <button
                                                    className={torneo.usuario_inscrito ? 'btn-inscrito' : 'btn-apuntarse'}
                                                    onClick={() => {
                                                        if (torneo.usuario_inscrito) {
                                                            navigate(`/torneosSaga/${torneo.id}/editar-inscripcion`);
                                                        } else {
                                                            apuntarseATorneo(torneo.id);
                                                        }
                                                    }}>
                                                    {torneo.usuario_inscrito
                                                        ? `✏️ ${t('botones.adm_inscripcion')}`
                                                        : `✅ ${t('botones.inscribirse')}`}
                                                </button>
                                            )}
                                            <button className="btn-ver-detalles"
                                                onClick={() => navigate(`/torneosSaga/${torneo.id}/detalles`)}>
                                                👁️ {t('botones.ver_detalles')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default PrincipalSaga;