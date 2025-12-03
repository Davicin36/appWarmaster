import React, { useState } from 'react';
import '@/estilos/ayudaTorneos.css';

// Componentes
import MenuLateralAyuda from '@/componentesAyuda/MenuLateralAyuda';
import SeccionInscripcion from '@/componentesAyuda/SeccionInscripcion';
import SeccionCrearTorneo from '@/componentesAyuda/SeccionCrearTorneo';
import SeccionGestion from '@/componentesAyuda/SeccionGestion';

function AyudaTorneos() {
    const [seccionActiva, setSeccionActiva] = useState('inscripcion');
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

    const secciones = [
        {
            id: 'inscripcion',
            titulo: '📝 Inscribirse en Torneos',
            icono: '📝'
        },
        {
            id: 'crear-torneo',
            titulo: '⚔️ Crear Torneo',
            icono: '⚔️'
        },
        {
            id: 'gestion',
            titulo: '🎮 Gestión del Torneo',
            icono: '🎮'
        }
    ];

    const handleCambiarSeccion = (seccionId) => {
        setSeccionActiva(seccionId);
        setMenuMovilAbierto(false);
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderSeccion = () => {
        switch (seccionActiva) {
            case 'inscripcion':
                return <SeccionInscripcion />;
            case 'crear-torneo':
                return <SeccionCrearTorneo />;
            case 'gestion':
                return <SeccionGestion />;
            default:
                return <SeccionInscripcion />;
        }
    };

    return (
        <div className="ayuda-torneos-wrapper">
            
            {/* BOTÓN MENÚ MÓVIL */}
            <button 
                className={`menu-movil-toggle ${menuMovilAbierto ? 'activo' : ''}`}
                onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
                aria-label="Toggle menu"
            >
                {menuMovilAbierto ? '✕' : '☰'} Menú de Ayuda
            </button>

            {/* MENÚ LATERAL */}
            <MenuLateralAyuda 
                secciones={secciones}
                seccionActiva={seccionActiva}
                onCambiarSeccion={handleCambiarSeccion}
                menuAbierto={menuMovilAbierto}
            />

            {/* CONTENIDO PRINCIPAL */}
            <main className="contenido-principal">
                {renderSeccion()}
            </main>
        </div>
    );
}

export default AyudaTorneos;