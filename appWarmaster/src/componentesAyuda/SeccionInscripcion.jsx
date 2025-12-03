import React from 'react';

// Imports de imágenes
import imgTorneoInscrito from '@/assets/imagenesAyuda/torneoInscrito.png';
import imgInscripcionInd from '@/assets/imagenesAyuda/inscripcionInd.png';
import imgIntroInd from '@/assets/imagenesAyuda/introInd.png';
import imgPonerMercs from '@/assets/imagenesAyuda/ponerMercs.png';
import imgInscribirEq from '@/assets/imagenesAyuda/inscribirEq.png';
import imgIntroMiembrosEq from '@/assets/imagenesAyuda/introMiembrosEq.png';
import imgAñadirBandasEpocas from '@/assets/imagenesAyuda/añadirbandasyEpocas.png';

function SeccionInscripcion() {
    return (
        <div className="seccion-contenido">
            
            {/* INTRODUCCIÓN GENERAL */}

            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h1>📝 Cómo inscribirse en un torneo</h1>
                </header>

                <div className="ayuda-contenido">
                    <div className="imagen-container">
                        <img src={imgTorneoInscrito} alt="Botón inscribirse en torneo" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Botón para inscribirse en un torneo</p>
                    </div>

                    <p className="texto-intro">
                        Tanto si es para inscribirse en un torneo <strong>"Individual"</strong> como por <strong>"Equipos"</strong>, 
                        se deberá primero clicar en el botón <strong>"Inscribirse"</strong>.
                    </p>

                    <p>
                        A continuación, dependiendo del tipo de torneo, deberás seguir los pasos específicos que se explican a continuación.
                    </p>
                </div>
            </section>

            {/* INSCRIPCIÓN INDIVIDUAL */}

            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h2>👤 Torneos Individuales</h2>
                </header>

                <div className="ayuda-contenido">
                    <div className="imagen-container">
                        <img src={imgInscripcionInd} alt="Formulario inscripción individual" className="imagen-ayuda" />
                        <p className="imagen-descripcion">Formulario de inscripción individual</p>
                    </div>

                    <p>
                        Este es el más sencillo. Simplemente elegiremos la banda y después nos aparecerá un desplegable para poder introducir 
                        los puntos de composición de la banda. Cuando seleccionamos puntos de mercenarios, luego hay que especificar qué tipo 
                        de mercenario has elegido.
                    </p>

                    <div className="lista-pasos">
                        <div className="paso">
                            <span className="numero-paso">1</span>
                            <div className="contenido-paso">
                                <h4>Selecciona tu banda</h4>
                                <p>
                                    Elige la facción con la que vas a jugar en el torneo. Asegúrate de que sea de la época permitida en el torneo.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">2</span>
                            <div className="contenido-paso">
                                <h4>Introduce los puntos de composición</h4>
                                <p>
                                    Especifica cómo has distribuido los puntos de tu banda según las reglas del torneo.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">3</span>
                            <div className="contenido-paso">
                                <h4>Especifica mercenarios (si los usas)</h4>
                                <p>
                                    Si tu banda incluye mercenarios, deberás indicar qué tipo de mercenarios has elegido y sus puntos.
                                </p>
                            </div>
                        </div>
                    </div>

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

                    <div className="nota-info">
                        <strong>ℹ️ Consejo:</strong> Revisa bien tu lista de banda antes de confirmar la inscripción. 
                        Algunos torneos no permiten cambios una vez inscrito.
                    </div>
                </div>
            </section>

            {/* INSCRIPCIÓN POR EQUIPOS */}

            <section className="ayuda-seccion">
                <header className="ayuda-header">
                    <h2>👥 Torneos por Equipos</h2>
                </header>

                <div className="ayuda-contenido">
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

                    <div className="lista-pasos">
                        <div className="paso">
                            <span className="numero-paso">1</span>
                            <div className="contenido-paso">
                                <h4>Nombre del equipo</h4>
                                <p>
                                    Primero tenemos que poner el nombre del equipo. Elige un nombre identificativo y único para tu equipo.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">2</span>
                            <div className="contenido-paso">
                                <h4>Añadir miembros del equipo</h4>
                                <p>
                                    Para cada miembro del equipo, debes introducir su nombre de usuario (debe estar registrado previamente en la plataforma).
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">3</span>
                            <div className="contenido-paso">
                                <h4>Seleccionar época y banda por jugador</h4>
                                <p>
                                    En el formulario de cada jugador habrá un desplegable para seleccionar la época en la que jugará cada miembro del equipo. 
                                    Acto seguido aparecerá otro para poder elegir la facción e introducir la composición de la banda, incluidos mercenarios 
                                    que hay que especificarlos.
                                </p>
                            </div>
                        </div>

                        <div className="paso">
                            <span className="numero-paso">4</span>
                            <div className="contenido-paso">
                                <h4>Confirmar inscripción</h4>
                                <p>
                                    Cuando tengamos ya todos los miembros junto con sus bandas y puntos introducidos, apretamos el botón de inscripción 
                                    y ya tendremos nuestro equipo inscrito para el torneo.
                                </p>
                            </div>
                        </div>
                    </div>

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

                    <div className="nota-info">
                        <strong>ℹ️ Importante:</strong> Cada jugador del equipo debe jugar con una época diferente. 
                        No se pueden repetir épocas dentro del mismo equipo.
                    </div>
                </div>
            </section>

        </div>
    );
}

export default SeccionInscripcion;