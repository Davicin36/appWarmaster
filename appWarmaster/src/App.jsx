import './App.css'

import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './servicios/AuthContext.jsx';

import Login from './paginas/Login.jsx';
import Principal from './paginas/Principal.jsx';
import Registrarse from './paginas/Registrarse.jsx';
import CrearTorneo from './paginas/CrearTorneo.jsx';
import Perfil from './paginas/Perfil.jsx';
import AdministrarTorneo from './paginas/AdministrarTorneo.jsx';
import VerTorneos from './paginas/VerTorneos.jsx';

import Navbar from './componente/Navbar.jsx';
import NavbarLogin from './componente/NavbarLogin.jsx';
import Inscripcion from './componente/Inscripcion.jsx';

function App() {

  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route
            path='/' 
            element={<Principal />} 
        />
        <Route 
            path='/login' 
            element={<Login />} 
        />
        <Route 
            path='/registrarse' 
            element={<Registrarse />} 
        />
        <Route 
            path='/navbarlogin' 
            element={<NavbarLogin />} 
        />
        <Route 
            path='/crearTorneo' 
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
            path='/torneosSaga/:torneoId/detalles'
            element={<VerTorneos />}
        />
        <Route
            path='/torneosSaga/:torneoId/editar-inscripcion'
            element={<Inscripcion />}
        />
      </Routes>
    </AuthProvider>
  )
}

export default App;