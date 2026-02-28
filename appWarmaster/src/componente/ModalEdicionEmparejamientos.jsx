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

    // Obtener el ID correcto del jugador (compatible con SAGA y FOW)
    const getJugadorId = (j) => j.jugador_id || j.id;

    // Obtener el nombre correcto del jugador (compatible con SAGA y FOW)
    const getJugadorNombre = (j) => j.jugador_nombre || j.nombre;

    const handleSubmit = (e) => {
        e.preventDefault();
        
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
            if (datos.jugador1_id === datos.jugador2_id && datos.jugador2_id !== null) {
                alert('⚠️ El jugador 1 y el jugador 2 no pueden ser el mismo');
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
                    <span className="mesa-info">Mesa {emparejamiento.mesa || emparejamiento.index + 1}</span>
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
                                    <label>Equipo 1: *</label>
                                    <select
                                        value={datos.equipo1_id || ''}
                                        onChange={(e) => setDatos({
                                            ...datos,
                                            equipo1_id: e.target.value ? parseInt(e.target.value) : null
                                        })}
                                        required
                                    >
                                        <option value="">-- Seleccionar equipo --</option>
                                        {equipos.map(eq => (
                                            <option
                                                key={eq.id || eq.equipo_id}
                                                value={eq.id || eq.equipo_id}
                                            >
                                                {eq.nombre_equipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vs-divider">⚔️ VS</div>

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
                                        <option value="">⭐ BYE (Victoria automática)</option>
                                        {equipos.map(eq => (
                                            <option
                                                key={eq.id || eq.equipo_id}
                                                value={eq.id || eq.equipo_id}
                                            >
                                                {eq.nombre_equipo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {datos.es_bye === 1 && (
                                    <div className="aviso-bye">
                                        ⭐ Este equipo recibirá un BYE (victoria automática)
                                    </div>
                                )}
                            </>
                        ) : (
                            // ==========================================
                            // EDICIÓN PARA INDIVIDUALES (SAGA y FOW)
                            // ==========================================
                            <>
                                <div className="form-group">
                                    <label>Jugador 1: *</label>
                                    <select
                                        value={datos.jugador1_id || ''}
                                        onChange={(e) => setDatos({
                                            ...datos,
                                            jugador1_id: e.target.value ? parseInt(e.target.value) : null
                                        })}
                                        required
                                    >
                                        <option value="">-- Seleccionar jugador --</option>
                                        {jugadores.map(j => (
                                            <option
                                                key={getJugadorId(j)}
                                                value={getJugadorId(j)}
                                                // Evitar seleccionar el mismo jugador que el 2
                                                disabled={getJugadorId(j) === datos.jugador2_id}
                                            >
                                                {getJugadorNombre(j)}
                                                {j.bando ? ` (${j.bando})` : ''}
                                                {j.club ? ` - ${j.club}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="vs-divider">⚔️ VS</div>

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
                                        <option value="">⭐ BYE (Victoria automática)</option>
                                        {jugadores.map(j => (
                                            <option
                                                key={getJugadorId(j)}
                                                value={getJugadorId(j)}
                                                // Evitar seleccionar el mismo jugador que el 1
                                                disabled={getJugadorId(j) === datos.jugador1_id}
                                            >
                                                {getJugadorNombre(j)}
                                                {j.bando ? ` (${j.bando})` : ''}
                                                {j.club ? ` - ${j.club}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {datos.es_bye === 1 && (
                                    <div className="aviso-bye">
                                        ⭐ Este jugador recibirá un BYE (victoria automática)
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            ❌ Cancelar
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