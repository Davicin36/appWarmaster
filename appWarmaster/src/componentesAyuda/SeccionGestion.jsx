import React from 'react';

import imgAdminBasicoInd from '@/assets/imagenesAyuda/administrarBasicoInd.png'; 
import imgAdminBasicoEq from '@/assets/imagenesAyuda/administrarBasicoEq.png'; 

function SeccionGestion() {
    return (
        <div className="seccion-contenido">
            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h1>🎮 Gestión del Torneo</h1>
                </header>

                <div className="ayuda-contenido">
                    <p className="texto-intro">
                        Una vez creado el torneo, como organizador tendrás acceso a diversas herramientas para gestionar todos los aspectos del evento.
                    </p>

                    <article className="subseccion">
                        <h2>⚙️ Administración del Torneo</h2>
                        <p>
                            En esta sección encontrarás las herramientas necesarias para gestionar jugadores, equipos, emparejamientos y resultados.
                        </p>

                        <div className="lista-pasos">
                            <div className="paso">
                                <span className="numero-paso">1</span>
                                <div className="contenido-paso">
                                    <h4>Gestión del torneo</h4>
                                    <p>
                                        Podrás ver toda la información relativa al torneo, como las rondas que tipo de partida tienen, poder iniciar el torneo y finalizarlo,
                                        así como editar el torneo si se necesita realizar algún cambio.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="imagenes-grupo">
                            <div className="imagen-container">
                                <img src={imgAdminBasicoInd} alt="gestion torneo individual" className="imagen-ayuda" />
                                <p className="imagen-descripcion">Zona de Administrar torneo Individual</p>
                            </div>
                            <div className="imagen-container">
                                <img src={imgAdminBasicoEq} alt="gestion torneo equipos" className="imagen-ayuda" />
                                <p className="imagen-descripcion">Zona de Administrar torneo por Equipos</p>
                            </div>
                        </div>

                        <div className="lista-pasos">
                            <div className="paso">
                                <span className="numero-paso">2</span>
                                <div className="contenido-paso">
                                    <h4>Visualización de participantes o Equipos</h4>
                                    <p>
                                        Accede a la lista completa de participantes inscritos, con toda su información: bandas, puntos, épocas, etc.
                                    </p>
                                    <p>
                                        Además también podrás controlar que jugadores/equipos han pagado la inscricpción del torneo e incluso poder
                                        eliminar a los jugadores o equipos del torneo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="subseccion">
                        <h2>🔀 Inicio del Torneo y Sistema de Emparejamientos</h2>
                        <p>
                            Cuando el torneo comience, el sistema generará los emparejamientos automáticamente según el formato seleccionado.
                        </p>

                        <div className="lista-pasos">
                            <div className="paso">
                                <span className="numero-paso">1</span>
                                <div className="contenido-paso">
                                    <h4>Iniciar el torneo</h4>
                                    <p>
                                        Una vez que se cierre el plazo de inscripciones, podrás iniciar el torneo. 
                                        Esto generará automáticamente los emparejamientos de la primera ronda.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">2</span>
                                <div className="contenido-paso">
                                    <h4>Sistema Suizo</h4>
                                    <p>
                                        El sistema utiliza el formato Suizo para los emparejamientos. En la primera ronda, los emparejamientos son aleatorios.
                                        En las siguientes rondas, se enfrentan jugadores con puntuaciones similares, evitando rematches.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">3</span>
                                <div className="contenido-paso">
                                    <h4>Gestión de BYE</h4>
                                    <p>
                                        Si hay un número impar de jugadores/equipos, el sistema asignará automáticamente un BYE (descanso) 
                                        al jugador con menos puntos que aún no haya tenido BYE.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">4</span>
                                <div className="contenido-paso">
                                    <h4>Avanzar de ronda</h4>
                                    <p>
                                        Una vez que todos los resultados de la ronda actual estén confirmados, podrás generar los emparejamientos 
                                        de la siguiente ronda.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="nota-info">
                            <strong>ℹ️ Nota:</strong> No podrás avanzar de ronda hasta que todos los partidos de la ronda actual tengan 
                            resultados confirmados por ambos jugadores.
                        </div>
                    </article>

                    <article className="subseccion">
                        <h2>📊 Introducción de Resultados</h2>
                        <p>
                            Los jugadores pueden introducir los resultados de sus partidos, pero necesitan confirmación del oponente.
                        </p>

                        <div className="lista-pasos">
                            <div className="paso">
                                <span className="numero-paso">1</span>
                                <div className="contenido-paso">
                                    <h4>Los jugadores introducen resultados</h4>
                                    <p>
                                        Cada jugador puede introducir el resultado de su partida desde su panel. Debe indicar el ganador y los puntos.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">2</span>
                                <div className="contenido-paso">
                                    <h4>Confirmación del oponente</h4>
                                    <p>
                                        El resultado no se hace oficial hasta que el oponente lo confirme. Esto evita errores y fraudes.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">3</span>
                                <div className="contenido-paso">
                                    <h4>Intervención del organizador</h4>
                                    <p>
                                        Como organizador, puedes introducir o modificar resultados manualmente si es necesario 
                                        (por ejemplo, en caso de disputa o si los jugadores no pueden hacerlo).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="subseccion">
                        <h2>🏅 Sistema de Puntuación</h2>
                        <p>
                            El sistema de puntuación sigue las reglas estándar del formato Suizo:
                        </p>

                        <div className="lista-pasos">
                            <div className="paso">
                                <span className="numero-paso">🥇</span>
                                <div className="contenido-paso">
                                    <h4>Victoria</h4>
                                    <p>
                                        <strong>3 puntos de torneo</strong> para el ganador del partido.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">🤝</span>
                                <div className="contenido-paso">
                                    <h4>Empate</h4>
                                    <p>
                                        <strong>1 punto de torneo</strong> para cada jugador en caso de empate.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">❌</span>
                                <div className="contenido-paso">
                                    <h4>Derrota</h4>
                                    <p>
                                        <strong>0 puntos de torneo</strong> para el perdedor.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">💤</span>
                                <div className="contenido-paso">
                                    <h4>BYE (Descanso)</h4>
                                    <p>
                                        <strong>3 puntos de torneo</strong> automáticos cuando un jugador tiene BYE.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="alerta-importante">
                            <strong>⚠️ Criterios de desempate:</strong>
                            <br />
                            <p style={{ marginTop: '10px' }}>
                                En caso de empate en puntos de torneo, se utilizan los siguientes criterios en orden:
                            </p>
                            <ol style={{ marginTop: '10px', paddingLeft: '25px' }}>
                                <li>Enfrentamiento directo (si se han enfrentado entre sí)</li>
                                <li>Buchholz (suma de puntos de los oponentes que ha enfrentado)</li>
                                <li>Puntos de victoria totales</li>
                            </ol>
                        </div>
                    </article>

                    <article className="subseccion">
                        <h2>🏆 Clasificación Final</h2>
                        <p>
                            Al finalizar todas las rondas, el sistema generará automáticamente la clasificación final ordenada por:
                        </p>
                        <ul style={{ paddingLeft: '25px', marginTop: '10px' }}>
                            <li>Puntos de torneo (principal)</li>
                            <li>Criterios de desempate (si es necesario)</li>
                        </ul>

                        <div className="nota-info">
                            <strong>ℹ️ Tip:</strong> Puedes exportar la clasificación final a PDF o compartirla directamente desde la plataforma.
                        </div>
                    </article>

                </div>
            </section>

        </div>
    );
}

export default SeccionGestion;