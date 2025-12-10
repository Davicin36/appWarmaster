import './App.css'

import { useState } from 'react';
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './servicios/AuthContext.jsx';

import Login from './paginas/Login.jsx';
import Principal from './paginas/Principal.jsx';
import Registrarse from './paginas/Registrarse.jsx';
import CrearTorneo from './paginas/CrearTorneo.jsx';
import Perfil from './paginas/Perfil.jsx';
import AdministrarTorneo from './paginas/AdministrarTorneo.jsx';
import VerTorneos from './paginas/VerTorneos.jsx';
import Inscripcion from './paginas/Inscripcion.jsx';
import AyudaTorneos from './paginas/AyudaTorneos.jsx';
import SeleccionJuego from './paginas/SeleccionJuego.jsx';

import Navbar from './componente/Navbar.jsx';
import NavbarLogin from './componente/NavbarLogin.jsx';

function App() {

    const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <AuthProvider>
      <Navbar onOpenLogin={() => setIsLoginOpen(true)} />
        
        {/* Modal de Login */}
        <Login 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
        />
        
      <Routes>
        <Route
            path='/' 
            element={<Principal  onOpenLogin={() => setIsLoginOpen(true)}/>} 
        />
        <Route 
            path='/registrarse' 
            element={<Registrarse onOpenLogin={() => setIsLoginOpen(true)} />} 
        />
        <Route
            path='/torneosSaga/:torneoId/detalles'
            element={<VerTorneos />}
        />
        <Route
            path='/torneosWarmaster/:torneoId/detalles'
            element={<VerTorneos />}
        />
         <Route
            path='/ayudaTorneos'
            element={<AyudaTorneos />}
        />
        {/*tendria que tener aqui un protected Routes porque estas rutas ya son privadas*/}
        <Route 
            path='/navbarlogin' 
            element={<NavbarLogin />} 
        />
        <Route 
            path='/seleccionarJuegos' 
            element={<SeleccionJuego />} 
        />
        <Route 
            path='/crearTorneo/:juego' 
            element={<CrearTorneo />} 
        />
        <Route 
            path='/administrarTorneo/:torneoId' 
            element={<AdministrarTorneo />} 
        />
        <Route 
            path='/perfil' 
            element={<Perfil />} 
        />
        <Route 
            path='/Inscripcion/:torneoId' 
            element={<Inscripcion />} 
        />
        <Route
            path='/torneosSaga/:torneoId/editar-inscripcion'
            element={<Inscripcion />}
        />
        <Route
            path='/torneosWarmaster/:torneoId/editar-inscripcion'
            element={<Inscripcion />}
        />
      </Routes>
    </AuthProvider>
  )
}

export default App;