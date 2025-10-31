function GestionPartida () {
    return (
        <div>
            <h1>Gestion de la Partida</h1>
            <p>Introduce los datos que se solicitan</p>
            <label>Puntos de Partida</label>
            <input 
                type="number" 
                name="puntos-partida" 
                id="puntos-partida" 
                placeholder="0"
            />
            <label>Puntos de Masacre</label>
            <input 
                type="number" 
                name="puntos-masacre" 
                id="puntos-masacre"
                placeholder="0" 
            />
            <label>Has matado al Señor de la Guerra Enemigo?</label>
            <input
                type="checkbox"
                name="warlord"
                id="warlord"
            />
        </div>
    )
}

export default GestionPartida;