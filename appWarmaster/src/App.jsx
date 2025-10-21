import './App.css'

import { Route, Routes, Link } from 'react-router-dom'
import { AuthProvider } from './servicios/AuthContext.jsx';

import Login from './paginas/Login.jsx';
import Principal from './paginas/Principal.jsx';
import Registrarse from './paginas/Registrarse.jsx';

function App() {

  return (
    <AuthProvider>
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
      </Routes>
    </AuthProvider>
  )
}

export default App