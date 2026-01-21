function VistaInformacionSaga({ inscritos, equipos, tipoTorneo }) {
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
                                        <h3> {inscrito.nombre_alias && ` "${inscrito.nombre_alias}"`}</h3>
                                        {inscrito.club && <p className="club">🏛️ {inscrito.club}</p>}
                                        {inscrito.ciudad && <p className="ubicacion">📍 {inscrito.ciudad}</p>}
                                    </div>

                                    <div className="banda-info">
                                        <p><strong>Facción:</strong> {inscrito.faccion || "Sin definir"}</p>
                                        <p><strong>Época:</strong> {inscrito.epoca || "Sin definir"}</p>
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

    // Vista de equipos
    return (
        <div className="vista-inscritos">
            <h2>👥 Equipos Inscritos ({equipos.length})</h2>
            {equipos.length === 0 ? (
                <div className="empty-message">
                    <p>📭 Aún no hay equipos inscritos en este torneo.</p>
                </div>
            ) : (
                <div className="grid-equipos">
                    {equipos.map((equipo) => (
                        <div key={equipo.id} className="card-equipo">
                            <div className="equipo-header">
                                <h3>🏆 {equipo.nombre_equipo || 'Sin nombre'}</h3>
                                <span className="badge-capitan">
                                    👑 Capitán: {equipo.capitan_nombre || 'Sin capitán'} {equipo.capitan_apellidos || ''}
                                </span>
                            </div>

                            <div className="equipo-miembros">
                                <h4>Miembros ({(equipo.miembros || []).length}):</h4>
                                {(equipo.miembros || []).length > 0 ? (
                                    <ul className="lista-miembros">
                                        {equipo.miembros.map((miembro, idx) => {
                                            const comp = miembro.composicion || {};
                                            const totalPuntos = 
                                                (parseFloat(comp.guardias) || 0) +
                                                (parseFloat(comp.guerreros) || 0) +
                                                (parseFloat(comp.levas) || 0) +
                                                (parseFloat(comp.mercenarios) || 0);

                                            return (
                                                <li key={idx} className="miembro-item">
                                                    <div className="miembro-header">
                                                        <span className="miembro-nombre">
                                                            {miembro.es_capitan && '👑 '}
                                                            {miembro.nombre || 'Sin nombre'}
                                                            {miembro.nombre_alias && ` "${miembro.nombre_alias}"`}
                                                        </span>
                                                        <span className="miembro-epoca-banda">
                                                            {miembro.epoca || 'Sin época'} - {miembro.faccion || 'Sin banda'}
                                                        </span>
                                                    </div>
                                                    
                                                    {Object.keys(comp).length > 0 && (
                                                        <div className="miembro-composicion">
                                                            <div className="puntos-total">
                                                                <strong>Total: {totalPuntos.toFixed(1)} pts</strong>
                                                            </div>
                                                            <div className="puntos-detalle">
                                                                <span>Guardias: {parseFloat(comp.guardias) || 0}</span>
                                                                <span>Guerreros: {parseFloat(comp.guerreros) || 0}</span>
                                                                <span>Levas: {parseFloat(comp.levas) || 0}</span>
                                                                <span>Mercenarios: {parseFloat(comp.mercenarios) || 0}</span>
                                                            </div>
                                                            {comp.detalleMercenarios && (
                                                                <div className="detalle-mercenarios-mini">
                                                                    🧾 {comp.detalleMercenarios}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="sin-miembros">Sin miembros</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VistaInformacionSaga;