import React, { useState } from 'react';

import torneosFowApi from '@/servicios/apiFow';

function VistaInformacionFow({ inscritos, tipoTorneo, estadoTorneo, torneoId }) {
    const [loadingPdf, setLoadingPdf] = useState(null);
    const [error, setError] = useState('');

    const mostrarPDF = estadoTorneo === 'en_curso' || estadoTorneo === 'finalizado';

    const handleVerLista = async (jugador) => {
        if (!jugador.lista_nombre) {
            alert('⚠️ Este jugador no ha subido su lista de ejército');
            return;
        }

        try {
            setLoadingPdf(jugador.jugador_id);
            setError('');
            await torneosFowApi.verListaPDFJugador(torneoId, jugador.jugador_id);
        } catch (err) {
            console.error('❌ Error al ver lista:', err);
            setError(err.message || 'Error al abrir la lista de ejército');
            setTimeout(() => setError(''), 4000);
        } finally {
            setLoadingPdf(null);
        }
    };

    const handleDescargarLista = async (jugador) => {
        if (!jugador.lista_nombre) {
            alert('⚠️ Este jugador no ha subido su lista de ejército');
            return;
        }

        try {
            setLoadingPdf(jugador.jugador_id);
            setError('');
            await torneosFowApi.descargarListaEjercito(torneoId, jugador.jugador_id);
        } catch (err) {
            console.error('❌ Error al descargar lista:', err);
            setError(err.message || 'Error al descargar la lista de ejército');
            setTimeout(() => setError(''), 4000);
        } finally {
            setLoadingPdf(null);
        }
    };

    if (tipoTorneo === 'Individual') {
        return (
            <div className="vista-inscritos">
                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

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
                                        <p><strong>Nombre Ejército:</strong> {inscrito.nombre_ejercito || "Sin definir"}</p>
                                        <p><strong>Facción:</strong> {inscrito.ejercito || "Sin definir"}</p>
                                    </div>

                                    {/* BOTONES PARA VER/DESCARGAR PDF */}
                                    {mostrarPDF && (
                                        <div className="lista-documento">
                                            {inscrito.lista_nombre ? (
                                                <>
                                                    <p className="pdf-disponible">
                                                        📄 <strong>{inscrito.lista_nombre}</strong>
                                                    </p>
                                                    <div className="botones-pdf">
                                                        <button
                                                            onClick={() => handleVerLista(inscrito)}
                                                            disabled={loadingPdf === inscrito.jugador_id}
                                                            className="btn-ver-pdf"
                                                            title="Ver lista en nueva pestaña"
                                                        >
                                                            {loadingPdf === inscrito.jugador_id ? '⏳' : '👁️'} Ver Lista
                                                        </button>
                                                        <button
                                                            onClick={() => handleDescargarLista(inscrito)}
                                                            disabled={loadingPdf === inscrito.jugador_id}
                                                            className="btn-descargar-pdf"
                                                            title="Descargar lista PDF"
                                                        >
                                                            {loadingPdf === inscrito.jugador_id ? '⏳' : '📥'} Descargar
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="pdf-no-disponible">
                                                    ⚠️ Sin lista de ejército
                                                </p>
                                            )}
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

export default VistaInformacionFow;