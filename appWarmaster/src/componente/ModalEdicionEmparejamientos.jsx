import React, { useState } from 'react';

import '@/estilos/modalEdicionEmparejamientos.css';

function ModalEdicionEmparejamientos({ 
    emparejamiento, 
    jugadores, 
    equipos,
    esTorneoEquipos,
    onClose, 
    onGuardar 
}) {
    const [datos, setDatos] = useState({
        jugador1_id: emparejamiento.jugador1_id || null,
        jugador2_id: emparejamiento.jugador2_id || null,
        equipo1_id: emparejamiento.equipo1_id || null,
        equipo2_id: emparejamiento.equipo2_id || null,
        es_bye: emparejamiento.es_bye || 0
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validaciones
        if (esTorneoEquipos) {
            if (!datos.equipo1_id) {
                alert('⚠️ Debes seleccionar al menos el equipo 1');
                return;
            }
        } else {
            if (!datos.jugador1_id) {
                alert('⚠️ Debes seleccionar al menos el jugador 1');
                return;
            }
        }
        
        onGuardar(datos);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-edicion-emp" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>✏️ Editar Emparejamiento</h3>
                    <button className="btn-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {esTorneoEquipos ? (
                            // EDICIÓN PARA EQUIPOS
                            <>
                                <div className="form-group">
                                    <label>Equipo 1:*</label>
                                    <select
                                        value={datos.equipo1_id || ''}
                                        onChange={(e) => setDatos({...datos, equipo1_id: parseInt(e.target.value)})}
                                        required
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {equipos.map(eq => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.nombre_equipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vs-divider">VS</div>

                                <div className="form-group">
                                    <label>Equipo 2:</label>
                                    <select
                                        value={datos.equipo2_id || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setDatos({
                                                ...datos, 
                                                equipo2_id: value ? parseInt(value) : null,
                                                es_bye: value ? 0 : 1
                                            });
                                        }}
                                    >
                                        <option value="">⭐ BYE</option>
                                        {equipos.map(eq => (
                                            <option key={eq.id} value={eq.id}>
                                                {eq.nombre_equipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            // EDICIÓN PARA INDIVIDUALES
                            <>
                                <div className="form-group">
                                    <label>Jugador 1:*</label>
                                    <select
                                        value={datos.jugador1_id || ''}
                                        onChange={(e) => setDatos({...datos, jugador1_id: parseInt(e.target.value)})}
                                        required
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {jugadores.map(j => (
                                            <option key={j.id} value={j.id}>
                                                {j.nombre || j.jugador_nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vs-divider">VS</div>

                                <div className="form-group">
                                    <label>Jugador 2:</label>
                                    <select
                                        value={datos.jugador2_id || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setDatos({
                                                ...datos, 
                                                jugador2_id: value ? parseInt(value) : null,
                                                es_bye: value ? 0 : 1
                                            });
                                        }}
                                    >
                                        <option value="">⭐ BYE</option>
                                        {jugadores.map(j => (
                                            <option key={j.id} value={j.id}>
                                                {j.nombre || j.jugador_nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary">
                            ✅ Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalEdicionEmparejamientos;