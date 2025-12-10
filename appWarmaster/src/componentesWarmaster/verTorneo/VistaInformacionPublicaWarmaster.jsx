import React from 'react';

function VistaInformacionWarmaster({ inscritos, tipoTorneo }) {

    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-inscritos">
                <h2>👤 Jugadores Inscritos ({inscritos.length})</h2>
                {inscritos.length === 0 ? (
                    <div className="empty-message">
                        <p>📭 Aún no hay jugadores inscritos en este torneo.</p>
                    </div>
                ) : (
                    <div className="grid-inscritos">
                        {inscritos.map((inscrito) => {
                            const comp = inscrito.composicion_ejercito || {};
                            const totalPuntos = 
                                (parseFloat(comp.guardias) || 0) +
                                (parseFloat(comp.guerreros) || 0) +
                                (parseFloat(comp.levas) || 0) +
                                (parseFloat(comp.mercenarios) || 0);

                            return (
                                <div key={inscrito.id} className="card-inscrito">
                                    <div className="jugador-info">
                                        <h3>
                                            👤 {inscrito.jugador_nombre || 'Sin nombre'} {inscrito.jugador_apellidos || ''}
                                        </h3>
                                        {inscrito.club && <p className="club">🏛️ {inscrito.club}</p>}
                                        {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                    </div>

                                    <div className="banda-info">
                                        <p><strong>Ejercito:</strong> {inscrito.ejercito || "Sin definir"}</p>
                                        <p><strong>Puntos:</strong> {totalPuntos.toFixed(1)} pts</p>
                                    </div>

                                    {Object.keys(comp).length > 0 && (
                                        <div className="composicion-banda">
                                            <h5>📜 Composición:</h5>
                                            <ul>
                                                <li>Guardias: {parseFloat(comp.guardias) || 0}</li>
                                                <li>Guerreros: {parseFloat(comp.guerreros) || 0}</li>
                                                <li>Levas: {parseFloat(comp.levas) || 0}</li>
                                                <li>Mercenarios: {parseFloat(comp.mercenarios) || 0}</li>
                                                {comp.detalleMercenarios && (
                                                    <li className="detalle-mercenarios">
                                                        🧾 {comp.detalleMercenarios}
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
}

export default VistaInformacionWarmaster;