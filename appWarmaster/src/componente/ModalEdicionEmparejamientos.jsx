import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@/estilos/modalEdicionEmparejamientos.css';

function ModalEdicionEmparejamientos({
    emparejamiento,
    jugadores,
    equipos,
    esTorneoEquipos,
    onClose,
    onGuardar
}) {
    const { t } = useTranslation();

    const [datos, setDatos] = useState({
        jugador1_id: emparejamiento.jugador1_id || null,
        jugador2_id: emparejamiento.jugador2_id || null,
        equipo1_id:  emparejamiento.equipo1_id  || null,
        equipo2_id:  emparejamiento.equipo2_id  || null,
        es_bye: emparejamiento.es_bye      || 0
    });

    const getJugadorId     = (j) =>  j.id;
    const getJugadorNombre = (j) => j.jugador_nombre || j.nombre;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (esTorneoEquipos) {
            if (!datos.equipo1_id) {
                alert(t('modal_emp.val_equipo1'));
                return;
            }
        } else {
            if (!datos.jugador1_id) {
                alert(t('modal_emp.val_jugador1'));
                return;
            }
            if (datos.jugador1_id === datos.jugador2_id && datos.jugador2_id !== null) {
                alert(t('modal_emp.val_mismo_jugador'));
                return;
            }
        }

        onGuardar(datos);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-edicion-emp" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>✏️ {t('modal_emp.titulo')}</h3>
                    <span className="mesa-info">{t('modal_emp.mesa', { num: emparejamiento.mesa || emparejamiento.index + 1 })}</span>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {esTorneoEquipos ? (
                            // ==========================================
                            // EDICIÓN PARA EQUIPOS (SAGA)
                            // ==========================================
                            <>
                                <div className="form-group">
                                    <label>{t('modal_emp.equipo1')} *</label>
                                    <select
                                        value={datos.equipo1_id || ''}
                                        onChange={(e) => setDatos({ ...datos, equipo1_id: e.target.value ? parseInt(e.target.value) : null })}
                                        required
                                    >
                                        <option value="">-- {t('modal_emp.seleccionar_equipo')} --</option>
                                        {equipos.map(eq => (
                                            <option key={eq.id || eq.equipo_id} value={eq.id || eq.equipo_id}>
                                                {eq.nombre_equipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vs-divider">⚔️ VS</div>

                                <div className="form-group">
                                    <label>{t('modal_emp.equipo2')}</label>
                                    <select
                                        value={datos.equipo2_id || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setDatos({ ...datos, equipo2_id: value ? parseInt(value) : null, es_bye: value ? 0 : 1 });
                                        }}
                                    >
                                        <option value="">⭐ {t('modal_emp.bye_opcion')}</option>
                                        {equipos.map(eq => (
                                            <option key={eq.id || eq.equipo_id} value={eq.id || eq.equipo_id}>
                                                {eq.nombre_equipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {datos.es_bye === 1 && (
                                    <div className="aviso-bye">⭐ {t('modal_emp.aviso_bye_equipo')}</div>
                                )}
                            </>
                        ) : (
                            // ==========================================
                            // EDICIÓN PARA INDIVIDUALES (TODOS LOS SISTEMAS)
                            // ==========================================
                            <>
                                <div className="form-group">
                                    <label>{t('modal_emp.jugador1')} *</label>
                                    <select
                                        value={datos.jugador1_id || ''}
                                        onChange={(e) => setDatos({ ...datos, jugador1_id: e.target.value ? parseInt(e.target.value) : null })}
                                        required
                                    >
                                        <option value="">-- {t('modal_emp.seleccionar_jugador')} --</option>
                                        {jugadores.map(j => (
                                            <option key={getJugadorId(j)} value={getJugadorId(j)}
                                                disabled={getJugadorId(j) === datos.jugador2_id}>
                                                {getJugadorNombre(j)}
                                                {j.bando ? ` (${j.bando})` : ''}
                                                {j.club  ? ` - ${j.club}`  : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vs-divider">⚔️ VS</div>

                                <div className="form-group">
                                    <label>{t('modal_emp.jugador2')}</label>
                                    <select
                                        value={datos.jugador2_id || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setDatos({ ...datos, jugador2_id: value ? parseInt(value) : null, es_bye: value ? 0 : 1 });
                                        }}
                                    >
                                        <option value="">⭐ {t('modal_emp.bye_opcion')}</option>
                                        {jugadores.map(j => (
                                            <option key={getJugadorId(j)} value={getJugadorId(j)}
                                                disabled={getJugadorId(j) === datos.jugador1_id}>
                                                {getJugadorNombre(j)}
                                                {j.bando ? ` (${j.bando})` : ''}
                                                {j.club  ? ` - ${j.club}`  : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {datos.es_bye === 1 && (
                                    <div className="aviso-bye">⭐ {t('modal_emp.aviso_bye_jugador')}</div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            ❌ {t('botones.cancelar')}
                        </button>
                        <button type="submit" className="btn-primary">
                            ✅ {t('botones.guardar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalEdicionEmparejamientos;