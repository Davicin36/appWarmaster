import React from 'react';

function MenuLateralAyuda({ secciones, seccionActiva, onCambiarSeccion, menuAbierto }) {
    return (
        <nav className={`menu-lateral ${menuAbierto ? 'abierto' : ''}`}>
            <div className="menu-header">
                <h2>📚 Ayuda</h2>
            </div>
            
            <ul className="menu-lista">
                {secciones.map((seccion) => (
                    <li 
                        key={seccion.id}
                        className={`menu-item ${seccionActiva === seccion.id ? 'activo' : ''}`}
                    >
                        <button
                            onClick={() => onCambiarSeccion(seccion.id)}
                            className="menu-boton"
                        >
                            <span className="menu-icono">{seccion.icono}</span>
                            <span className="menu-texto">{seccion.titulo.replace(/^[^\s]+\s/, '')}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default MenuLateralAyuda;