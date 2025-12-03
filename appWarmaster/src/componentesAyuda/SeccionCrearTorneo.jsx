import React from 'react';

// Imports de imágenes
import imgSeleccionTorneo from '@/assets/imagenesAyuda/seleccionTorneo.png';
import imgCrearTorneoInd from '@/assets/imagenesAyuda/crearTorneoInd.png';
import imgFechaUbicacion from '@/assets/imagenesAyuda/fechaUbicacion.png';
import imgBasesRonda from '@/assets/imagenesAyuda/basesRonda.png';
import imgBotonCrearTorneo from '@/assets/imagenesAyuda/botonCrearTorneo.png';
import imgCrearTorneoEq from '@/assets/imagenesAyuda/crearTorneoEq.png';
import imgPrimerPaso from '@/assets/imagenesAyuda/primerPasoCrearTorneo.png'
import imgEpocaEquipos from '@/assets/imagenesAyuda/epocasEquipos.png'

function SeccionCrearTorneo() {
    return (
        <div className="seccion-contenido">
            
            {/* ========================================= */}
            {/* INTRODUCCIÓN */}
            {/* ========================================= */}
            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h1>⚔️ Cómo crear un torneo</h1>
                </header>

                <div className="ayuda-contenido">
                    <p className="texto-intro">
                        Primero iremos a la pestaña de 3 rayas que tenemos a nuestra derecha de la página web. Ahí clicaremos en <strong>"Crear Torneo"</strong> 
                        y nos llevará a la página para seleccionar el tipo de juego del cual queremos crear el torneo. Será seleccionar el tipo de juego y clicar el 
                        botón de <strong>"Crear"</strong>.
                        <br /><br />
                        <img src={imgPrimerPaso} alt="Selección crear torneo" className="imagen-ayuda" />
                    </p>
                    

                    <div className="imagen-container">
                        <img src={imgSeleccionTorneo} alt="Selección tipo de juego" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Pantalla de selección del tipo de juego</p>
                    </div>
                </div>
            </section>

            {/* CREAR TORNEO INDIVIDUAL */}
      
            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h2>🎯 Crear Torneo Individual</h2>
                </header>

                <div className="ayuda-contenido">
                    <div className="imagen-container">
                        <img src={imgCrearTorneoInd} alt="Formulario crear torneo individual" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Formulario de creación de torneo individual</p>
                    </div>

                    <p>
                        Para crear un torneo individual, deberás seleccionar la opción <strong>"Individual"</strong>.
                    </p>

                    <div className="lista-pasos">
                        <div className="paso">
                            <span className="numero-paso">1</span>
                            <div className="contenido-paso">
                                <h4>Nombre del torneo</h4>
                                <p>Debemos poner el nombre del torneo en primer lugar.</p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">2</span>
                            <div className="contenido-paso">
                                <h4>Configuración básica</h4>
                                <p>
                                    A continuación, debes elegir la época disponible para el torneo. 
                                    También tenemos que indicar el número máximo de jugadores que tendrá nuestro torneo, 
                                    además de seleccionar el número de rondas y los puntos de banda.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">3</span>
                            <div className="contenido-paso">
                                <h4>Fechas y ubicación</h4>
                                <p>
                                    Seleccionar la fecha de inicio y, aunque no es obligatorio, fecha de fin del torneo y lugar del mismo.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="imagen-container">
                        <img src={imgFechaUbicacion} alt="Fechas y ubicación" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Sección de fechas y ubicación del torneo</p>
                    </div>

                    <div className="lista-pasos">
                        <div className="paso">
                            <span className="numero-paso">4</span>
                            <div className="contenido-paso">
                                <h4>Bases del Torneo (Opcional)</h4>
                                <p>
                                    A continuación tenemos una parte del formulario para poder introducir <strong>Las Bases del Torneo</strong>. 
                                    Tiene que ser en formato PDF y hasta 16MB.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">5</span>
                            <div className="contenido-paso">
                                <h4>Escenarios por ronda</h4>
                                <p>
                                    Al final tenemos unos desplegables para poder introducir el tipo de partida de cada ronda.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="imagen-container">
                        <img src={imgBasesRonda} alt="Bases y escenarios" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Sección de bases PDF y escenarios por ronda</p>
                    </div>

                    <p>
                        Una vez tengamos ya todo el formulario completado, apretamos el botón de crear torneo y nos creará nuestro torneo.
                    </p>

                    <div className="imagen-container">
                        <img src={imgBotonCrearTorneo} alt="Botón crear torneo" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Botón para finalizar la creación del torneo</p>
                    </div>
                </div>
            </section>

            {/* ========================================= */}
            {/* CREAR TORNEO POR EQUIPOS */}
            {/* ========================================= */}
            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h2>🏆 Crear Torneo por Equipos</h2>
                </header>

                <div className="ayuda-contenido">
                    <div className="imagen-container">
                        <img src={imgCrearTorneoEq} alt="Formulario crear torneo por equipos" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Formulario de creación de torneo por equipos</p>
                    </div>

                    <p>
                        Primero debemos introducir el nombre del torneo y acto seguido, seleccionar la opción <strong>"Por Equipos"</strong>.
                    </p>

                    <div className="lista-pasos">
                        <div className="paso">
                            <span className="numero-paso">1</span>
                            <div className="contenido-paso">
                                <h4>Nombre del torneo</h4>
                                <p>
                                    Introduce un nombre descriptivo para el torneo por equipos.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">2</span>
                            <div className="contenido-paso">
                                <h4>Jugadores por equipo</h4>
                                <p>
                                    Acto seguido elegiremos el número de jugadores que tiene que tener cada equipo para poder participar en el torneo, 
                                    entre 3 y 5 jugadores.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">3</span>
                            <div className="contenido-paso">
                                <h4>Épocas disponibles</h4>
                                <p>
                                    Luego selecciona las épocas del torneo. Se debe elegir una época por cada jugador que compongan los equipos.
                                    Por ejemplo, si cada equipo tiene 4 jugadores, debes seleccionar 4 épocas diferentes.
                                </p>
                                <br /><br />
                                <img src={imgEpocaEquipos} alt="epocas por equipos" className="imagen-ayuda" />
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">4</span>
                            <div className="contenido-paso">
                                <h4>Número de equipos y puntos de banda</h4>
                                <p>
                                    Seleccionar el número de equipos que pueden participar en nuestro torneo, un máximo de 20 equipos. 
                                    <br />
                                    <strong> Importante:</strong> No se puede introducir participantes máximos manualmente, 
                                    ya que se calcula automáticamente al introducir el número de equipos multiplicado por el número de jugadores de cada equipo.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">5</span>
                            <div className="contenido-paso">
                                <h4>Configuración final</h4>
                                <p>
                                    Aquí en este punto también tendremos que elegir el número de rondas, así como la fecha de inicio, 
                                    lugar donde se celebrará el torneo, una sección para introducir las bases del torneo en formato PDF 
                                    y por último introducir los escenarios que se jugarán en cada ronda.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="nota-info">
                        <strong>ℹ️ Nota:</strong> Debes asegurarte de que cada jugador del equipo tenga asignada solo una época diferente. 
                        No se pueden repetir épocas dentro del mismo equipo.
                    </div>

                    <div className="alerta-importante">
                        <strong>⚠️ Recuerda:</strong> Al crear un torneo por equipos, el sistema calculará automáticamente el número total 
                        de participantes multiplicando el número de equipos por el número de jugadores por equipo.
                    </div>
                </div>
            </section>

        </div>
    );
}

export default SeccionCrearTorneo;