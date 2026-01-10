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
import ResetPassword from './paginas/loginRecuperacion/ResetPassword.jsx'

import AdminPanel from './paginas/administrador/AdminPanel.jsx'
import PrivateRoute from './servicios/RutasPrivadas.jsx';

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
        {/** RUTAS PUBLICAS */ }
        <Route
            path='/' 
            element={<Principal  onOpenLogin={() => setIsLoginOpen(true)}/>} 
        />
        <Route 
            path='/registrarse' 
            element={<Registrarse onOpenLogin={() => setIsLoginOpen(true)} />} 
        />
        <Route 
            path="/reset-password" 
            element={<ResetPassword />} 
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
        {/**RUTAS PRIVADAS, SOLO LOGUEADOS*/}
        <Route 
            path='/navbarlogin' 
            element={
                <PrivateRoute>
                    <NavbarLogin />
                </PrivateRoute>
            } 
        />
        <Route 
            path='/seleccionarJuegos' 
            element={
                <PrivateRoute>
                    <SeleccionJuego />
                </PrivateRoute>
            }  
        />
        <Route 
            path='/crearTorneo/:juego' 
            element={
                <PrivateRoute>
                    <CrearTorneo />
                </PrivateRoute>
            }  
        />
        <Route 
            path='/administrarTorneo/:torneoId' 
            element={
                <PrivateRoute>
                    <AdministrarTorneo />
                </PrivateRoute>
            } 
        />
        <Route 
            path='/perfil' 
            element={
                <PrivateRoute>
                    <Perfil />
                </PrivateRoute>
            }  
        />
        <Route 
            path='/Inscripcion/:torneoId' 
            element={
                <PrivateRoute>
                    <Inscripcion />
                </PrivateRoute>
            } 
        />
        <Route
            path='/torneosSaga/:torneoId/editar-inscripcion'
            element={
                <PrivateRoute>
                    <Inscripcion />
                </PrivateRoute>
            } 
        />
        <Route
            path='/torneosWarmaster/:torneoId/editar-inscripcion'
           element={
                <PrivateRoute>
                    <Inscripcion />
                </PrivateRoute>
            } 
        />
        <Route
            path='/administrador/*'
           element={
                <PrivateRoute requiredRole="superadmin">
                    <AdminPanel />
                </PrivateRoute>
            } 
        />

        {/** ========== RUTA 404 ========== */}
        <Route 
          path='*' 
          element={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              textAlign: 'center'
            }}>
              <h1>404 - Página no encontrada</h1>
              <p>La página que buscas no existe</p>
              <a href="/" style={{ marginTop: '20px', color: '#667eea' }}>
                Volver al inicio
              </a>
            </div>
          } 
        />
      </Routes>
    </AuthProvider>
  )
}

export default App;