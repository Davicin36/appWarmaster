import React from 'react';
import '@/estilos/ayudaTorneos.css';

//IMPORT CREAR TORNEO
import imgBasesRonda from '@/assets/imagenesAyuda/basesRonda.png';
import imgFechaUbicacion from '@/assets/imagenesAyuda/fechaUbicacion.png';
import imgBotonCrearTorneo from '@/assets/imagenesAyuda/botonCrearTorneo.png';
import imgCrearTorneoInd from '@/assets/imagenesAyuda/crearTorneoInd.png';
import imgCrearTorneoEq from '@/assets/imagenesAyuda/crearTorneoEq.png';

//IMPORTS INSCRIBIR IND
import imgInscripcionInd from '@/assets/imagenesAyuda/inscripcionInd.png';
import imgIntroInd from '@/assets/imagenesAyuda/introInd.png';
import imgPonerMercs from '@/assets/imagenesAyuda/ponerMercs.png';

//IMPORT INSCRIBIR EQ
import imgAñadirBandasEpocas from '@/assets/imagenesAyuda/añadirbandasyEpocas.png';
import imgInscribirEq from '@/assets/imagenesAyuda/inscribirEq.png';
import imgIntroMiembrosEq from '@/assets/imagenesAyuda/introMiembrosEq.png';
import imgTorneoInscrito from '@/assets/imagenesAyuda/torneoInscrito.png';

//IMPORTS SELECCIONAR TIPO JUEGO
import imgSeleccionTorneo from '@/assets/imagenesAyuda/seleccionTorneo.png';

function AyudaTorneos() {
    return (
        <div className="ayuda-torneos-container">
            
            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h1>📝 Cómo inscribirse en un torneo</h1>
                </header>

                <div className="ayuda-contenido">
                    <h2>Inscribirse en Torneos: Individual y por Equipos</h2>
                    
                    <div className="imagen-container">
                        <img src={imgTorneoInscrito} alt="Botón inscribirse en torneo" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Botón para inscribirse en un torneo</p>
                    </div>

                    <p className="texto-intro">
                        Tanto si es para inscribirse en un torneo <strong>"Individual"</strong> como por <strong>"Equipos"</strong>, se deberá primero clicar en el botón 
                        <strong> "Inscribirse"</strong>.
                    </p>

                    {/* TORNEOS INDIVIDUALES */}
                    <article className="subseccion">
                        <h3>👤 Torneos Individuales</h3>
                        
                        <div className="imagen-container">
                            <img src={imgInscripcionInd} alt="Formulario inscripción individual" className="imagen-ayuda" />
                            <p className="imagen-descripcion">Formulario de inscripción individual</p>
                        </div>

                        <p>
                            Este es el más sencillo. Simplemente elegiremos la banda y después nos aparecerá un desplegable para poder introducir los puntos de composición 
                            de la banda. Cuando seleccionamos puntos de mercenarios, luego hay que especificar qué tipo de mercenario has elegido.
                        </p>

                        <div className="imagenes-grupo">
                            <div className="imagen-container">
                                <img src={imgIntroInd} alt="Selección de banda" className="imagen-ayuda" />
                                <p className="imagen-descripcion">Selección de banda y puntos</p>
                            </div>
                            <div className="imagen-container">
                                <img src={imgPonerMercs} alt="Puntos de mercenarios" className="imagen-ayuda" />
                                <p className="imagen-descripcion">Introducir puntos de mercenarios</p>
                            </div>
                        </div>
                    </article>

                    {/* TORNEOS POR EQUIPOS */}
                    <article className="subseccion">
                        <h3>👥 Torneos por Equipos</h3>

                        <div className="imagen-container">
                            <img src={imgInscribirEq} alt="Formulario inscripción por equipos" className="imagen-ayuda" />
                            <p className="imagen-descripcion">Formulario de inscripción por equipos</p>
                        </div>

                        <div className="alerta-importante">
                            <strong>⚠️ MUY IMPORTANTE:</strong> Todos los miembros del equipo deben estar registrados antes de inscribir al equipo.
                        </div>

                        <p>
                            Nos aparece un formulario donde tendremos que ir introduciendo cada uno de los miembros del equipo. 
                        </p>

                        <p>
                            Primero tenemos que poner el nombre del equipo. Para acto seguido ir introduciendo cada uno de los miembros del equipo. Como ya hemos dicho, todos 
                            deben estar registrados para poder inscribir el equipo. En el formulario de cada jugador habrá un desplegable para seleccionar la época en la 
                            que jugará cada miembro del equipo, y acto seguido aparecerá otro para poder elegir la facción e introducir la composición de la banda, incluidos 
                            mercenarios que hay que especificarlos.
                        </p>

                        <div className="imagenes-grupo">
                            <div className="imagen-container">
                                <img src={imgIntroMiembrosEq} alt="Introducir miembros del equipo" className="imagen-ayuda" />
                                <p className="imagen-descripcion">Formulario de cada miembro del equipo</p>
                            </div>
                            <div className="imagen-container">
                                <img src={imgAñadirBandasEpocas} alt="Seleccionar época y banda" className="imagen-ayuda" />
                                <p className="imagen-descripcion">Selección de época y banda por jugador</p>
                            </div>
                        </div>

                        <p>
                            Cuando tengamos ya todos los miembros junto con sus bandas y puntos introducidos, apretamos el botón de inscripción y ya tendremos nuestro
                            equipo inscrito para el torneo.
                        </p>
                    </article>
                </div>
            </section>

            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h1>⚔️ Cómo crear un torneo</h1>
                </header>

                <div className="ayuda-contenido">
                    <p className="texto-intro">
                        Primero iremos a la pestaña de 3 rayas que tenemos a nuestra derecha de la página web. Ahí clicaremos en <strong>"Crear Torneo"</strong> 
                        y nos llevará a la página para seleccionar el tipo de juego del cual queremos crear el torneo. Será seleccionar el tipo de juego y clicar el 
                        botón de <strong>"Crear"</strong>.
                    </p>

                    <div className="imagen-container">
                        <img src={imgSeleccionTorneo} alt="Selección tipo de juego" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Pantalla de selección del tipo de juego</p>
                    </div>

                    {/* CREAR TORNEO INDIVIDUAL */}
                    <article className="subseccion">
                        <h2>🎯 Crear Torneo Individual</h2>

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
                    </article>

                    {/* CREAR TORNEO POR EQUIPOS */}
                    <article className="subseccion">
                        <h2>🏆 Crear Torneo por Equipos</h2>

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
                                    <h4>Jugadores por equipo</h4>
                                    <p>
                                        Acto seguido elegiremos el número de jugadores que tiene que tener cada equipo para poder participar en el torneo, 
                                        entre 3 y 5 jugadores.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">2</span>
                                <div className="contenido-paso">
                                    <h4>Épocas disponibles</h4>
                                    <p>
                                        Luego selecciona las épocas del torneo. Se debe elegir una época por cada jugador que compongan los equipos.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">3</span>
                                <div className="contenido-paso">
                                    <h4>Número de equipos</h4>
                                    <p>
                                        Seleccionar el número de equipos que pueden participar en nuestro torneo, un máximo de 20 equipos. 
                                        <strong> Importante:</strong> No se puede introducir participantes máximos manualmente, 
                                        ya que se calcula automáticamente al introducir el número de equipos multiplicado por el número de jugadores de cada equipo.
                                    </p>
                                </div>
                            </div>

                            <div className="paso">
                                <span className="numero-paso">4</span>
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
                    </article>
                </div>
            </section>

            {/* ========================================= */}
            {/* OTRAS SECCIONES */}
            {/* ========================================= */}
            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h1>🎮 Gestión del Torneo</h1>
                </header>

                <div className="ayuda-contenido">
                    <article className="subseccion">
                        <h2>⚙️ Administración del Torneo</h2>
                        <p>
                            En esta sección encontrarás las herramientas necesarias para gestionar jugadores,
                            equipos, emparejamientos y resultados.
                        </p>
                    </article>

                    <article className="subseccion">
                        <h2>🔀 Inicio del Torneo y Sistema de Emparejamientos</h2>
                        <p>
                            Cuando el torneo comience, el sistema generará los emparejamientos automáticamente
                            según el formato seleccionado (suizo, liga, eliminatoria, etc.).
                        </p>
                    </article>

                    <article className="subseccion">
                        <h2>🏅 Sistema de Puntuación</h2>
                        <p>
                            Aquí se determinarán los valores otorgados por victoria, empate, derrota
                            y puntuaciones secundarias como puntos de ejército destruidos o puntos de misión.
                        </p>
                    </article>
                </div>
            </section>

        </div>
    );
}

export default AyudaTorneos;