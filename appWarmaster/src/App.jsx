import './App.css'

import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './servicios/AuthContext.jsx';

import Login from './paginas/Login.jsx';
import Principal from './paginas/Principal.jsx';
import Registrarse from './paginas/Registrarse.jsx';
import CrearTorneo from './paginas/CrearTorneo.jsx';
import Perfil from './paginas/Perfil.jsx';

import Navbar from './componente/Navbar.jsx';
import NavbarLogin from './componente/NavbarLogin.jsx';
import AdministarTorneo from './componente/AdministarTorneo.jsx';

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
            path='/administarTorneo' 
            element={<AdministarTorneo />} 
        />
        <Route 
            path='/perfil' 
            element={<Perfil />} 
        />
      </Routes>
    </AuthProvider>
  )
}

export default App