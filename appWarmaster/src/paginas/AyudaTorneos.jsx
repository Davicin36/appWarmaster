function AyudaTorneos() {
    return (
        <div className="ayuda-torneos">

            <header>
                <h1>Cómo crear un torneo</h1>
            </header>

            {/* Sección torneo individual */}
            <section>
                <h2>Crear Torneo Individual</h2>

                <article>
                    <p>
                        Para crear un torneo individual, deberás seleccionar la opción <strong>"Individual"</strong>.
                        A continuación, debes elegir la época o épocas disponibles para el torneo. 
                        Es posible combinar épocas si el sistema lo permite.
                    </p>
                </article>
            </section>

            {/* Sección torneo por equipos */}
            <section>
                <h2>Crear Torneo por Equipos</h2>

                <article>
                    <p>
                        Para crear un torneo por equipos, selecciona la opción <strong>"Por Equipos"</strong>.
                        Después deberás indicar de cuántos jugadores estará formado cada equipo. 
                        Luego selecciona la época del torneo; puede ser una única época general 
                        para todos los jugadores o una época individual por jugador.
                    </p>

                    <p>
                        En este punto, debes asegurarte de que los jugadores no puedan seleccionar
                        dos épocas diferentes al mismo tiempo. Cada jugador debe tener asignada solo una época.
                    </p>

                    <p>
                        Tras esto, selecciona el número de rondas del torneo y el máximo de jugadores permitidos.
                        Finalmente, podrás añadir las bases del torneo y configurar las partidas o escenarios
                        que formarán parte del evento.
                    </p>
                </article>
            </section>

            {/* Otras secciones del panel de ayuda */}
            <section>
                <h2>Administración del Torneo</h2>
                <p>
                    En esta sección encontrarás las herramientas necesarias para gestionar jugadores,
                    equipos, emparejamientos y resultados.
                </p>
            </section>

            <section>
                <h2>Inicio del Torneo y Sistema de Emparejamientos</h2>
                <p>
                    Cuando el torneo comience, el sistema generará los emparejamientos automáticamente
                    según el formato seleccionado (suizo, liga, eliminatoria, etc.).
                </p>
            </section>

            <section>
                <h2>Sistema de Puntuación</h2>
                <p>
                    Aquí se determinarán los valores otorgados por victoria, empate, derrota
                    y puntuaciones secundarias como puntos de ejército destruidos o puntos de misión.
                </p>
            </section>

        </div>
    );
}

export default AyudaTorneos;
