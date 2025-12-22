import React from 'react';

function VistaInformacionWarmaster({ inscritos, tipoTorneo, estadoTorneo }) {

    const mostrarPDF = estadoTorneo ==='en_curso'

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
                                    </div>

                                    {mostrarPDF && inscrito.lista_ejercito && (
                                        <div className="lista-documento">
                                            <a 
                                                href={inscrito.lista_ejercito} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn-ver-lista"
                                            >
                                                📄 Ver Lista de Ejército
                                            </a>
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