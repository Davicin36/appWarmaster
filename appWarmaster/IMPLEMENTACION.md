# 📘 Documentación de Implementación - Sistema de Autenticación

## 🎯 Resumen de Mejoras

Se ha refactorizado completamente el sistema de autenticación para:
- ✅ Usar una clase API centralizada (`AutentificacionApi`)
- ✅ Código más limpio, mantenible y reutilizable
- ✅ Mejor manejo de errores
- ✅ Separación de responsabilidades
- ✅ Métodos de utilidad integrados
- ✅ Documentación completa con JSDoc

---

## 📁 Estructura de Archivos

```
src/
├── servicios/
│   ├── AutentificacionApi.js    # Clase API centralizada
│   └── AuthContext.jsx           # Context de autenticación
├── componentes/
│   ├── Login.jsx                 # Componente de login
│   ├── Registrarse.jsx          # Componente de registro
│   └── Perfil.jsx               # Componente de perfil (NUEVO)
└── estilos/
    ├── auth-styles.css          # Estilos para login y registro
    └── perfil.css               # Estilos para perfil
```

---

## 🔧 Instalación y Configuración

### 1. Reemplazar archivos

```bash
# Reemplazar AutentificacionApi
src/servicios/AutentificacionApi.js

# Reemplazar AuthContext
src/servicios/AuthContext.jsx

# Actualizar componentes
src/componentes/Login.jsx
src/componentes/Registrarse.jsx

# Añadir nuevo componente
src/componentes/Perfil.jsx

# Actualizar estilos
src/estilos/auth-styles.css
src/estilos/perfil.css
```

### 2. Configurar variables de entorno

```env
# .env o .env.local
VITE_API_URL=http://localhost:5000/api
```

### 3. Importar en tu aplicación

```jsx
// App.jsx o main.jsx
import { AuthProvider } from './servicios/AuthContext';
import Login from './componentes/Login';
import Registrarse from './componentes/Registrarse';
import Perfil from './componentes/Perfil';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registrarse" element={<Registrarse />} />
          <Route path="/perfil" element={<Perfil />} />
          {/* otras rutas */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

---

## 🔌 API - AutentificacionApi

### Métodos Disponibles

#### 1. **login(credentials)**
```javascript
const response = await autentificacionApi.login({ 
  email: 'usuario@email.com', 
  password: '123456' 
});

// Respuesta
{
  success: true,
  data: {
    token: "jwt-token...",
    usuario: { id, nombre, email, rol, ... }
  }
}
```

#### 2. **registro(userData)**
```javascript
const response = await autentificacionApi.registro({
  nombre: "Juan",
  apellidos: "Pérez",
  nombre_alias: "juanito",
  club: "Club Gaming",
  email: "juan@email.com",
  password: "123456"
});

// Respuesta
{
  success: true,
  data: {
    userId: 123,
    email: "juan@email.com",
    nombre: "Juan"
  }
}
```

#### 3. **verificarToken(token)**
```javascript
const response = await autentificacionApi.verificarToken(token);

// Respuesta
{
  success: true,
  data: {
    usuario: { id, nombre, email, rol, ... }
  }
}
```

#### 4. **cambiarPassword(data)**
```javascript
const response = await autentificacionApi.cambiarPassword({
  passwordActual: "123456",
  passwordNueva: "654321"
});

// Respuesta
{
  success: true,
  message: "Contraseña cambiada exitosamente"
}
```

#### 5. **convertirOrganizador()**
```javascript
const response = await autentificacionApi.convertirOrganizador();

// Respuesta
{
  success: true,
  data: {
    usuario: { id, nombre, email, rol: "organizador", ... }
  }
}
```

#### 6. **Métodos de Utilidad**
```javascript
// Guardar token
autentificacionApi.guardarToken(token);

// Obtener token
const token = autentificacionApi.obtenerToken();

// Eliminar token
autentificacionApi.eliminarToken();
```

---

## 🎣 Hook useAuth

### Uso en Componentes

```jsx
import { useAuth } from '../servicios/AuthContext';

function MiComponente() {
  const { 
    user,                    // Usuario actual
    isAuthenticated,         // Boolean: ¿está autenticado?
    loading,                 // Boolean: ¿está cargando?
    login,                   // Función de login
    logout,                  // Función de logout
    registro,                // Función de registro
    cambiarPassword,         // Función cambiar contraseña
    convertirOrganizador,    // Función convertir a organizador
    actualizarUsuario        // Función actualizar datos usuario
  } = useAuth();

  // Usar en el componente...
}
```

### Ejemplos de Uso

#### Login
```jsx
const handleLogin = async (email, password) => {
  try {
    const usuario = await login(email, password);
    console.log('Usuario logueado:', usuario);
    navigate('/home');
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

#### Registro
```jsx
const handleRegistro = async (datos) => {
  const resultado = await registro(datos);
  
  if (resultado.success) {
    console.log('Registro exitoso');
    navigate('/login');
  } else {
    console.error('Error:', resultado.error);
  }
};
```

#### Cambiar Contraseña
```jsx
const handleCambiarPassword = async () => {
  const resultado = await cambiarPassword(
    passwordActual, 
    passwordNueva
  );
  
  if (resultado.success) {
    alert('Contraseña actualizada');
  } else {
    alert(resultado.error);
  }
};
```

#### Convertir a Organizador
```jsx
const handleConvertir = async () => {
  const resultado = await convertirOrganizador();
  
  if (resultado.success) {
    console.log('Ahora eres organizador:', resultado.usuario);
  } else {
    console.error(resultado.error);
  }
};
```

---

## 🔒 Protección de Rutas

### Crear componente ProtectedRoute

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../servicios/AuthContext';

function ProtectedRoute({ children, requireOrganizador = false }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireOrganizador && user.rol !== 'organizador') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

### Usar en rutas

```jsx
<Routes>
  {/* Rutas públicas */}
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/registrarse" element={<Registrarse />} />
  
  {/* Rutas protegidas */}
  <Route 
    path="/perfil" 
    element={
      <ProtectedRoute>
        <Perfil />
      </ProtectedRoute>
    } 
  />
  
  {/* Rutas solo para organizadores */}
  <Route 
    path="/crear-torneo" 
    element={
      <ProtectedRoute requireOrganizador={true}>
        <CrearTorneo />
      </ProtectedRoute>
    } 
  />
</Routes>
```

---

## 🎨 Personalización de Estilos

Los estilos están en archivos CSS separados y pueden ser personalizados:

### Variables CSS recomendadas
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #363;
  --error-color: #c33;
  --border-radius: 8px;
  --transition: all 0.3s ease;
}
```

---

## ⚠️ Manejo de Errores

Todos los métodos devuelven respuestas consistentes:

```javascript
// Éxito
{
  success: true,
  data: { ... },
  message: "Mensaje opcional"
}

// Error
{
  success: false,
  error: "Mensaje de error descriptivo"
}
```

### Ejemplo de manejo robusto
```jsx
try {
  const resultado = await login(email, password);
  
  if (resultado.success) {
    // Procesar éxito
  } else {
    // Mostrar error al usuario
    setError(resultado.error);
  }
} catch (error) {
  // Error de red u otro error inesperado
  setError("Error de conexión. Intenta nuevamente.");
  console.error(error);
}
```

---

## 🚀 Ventajas de la Nueva Implementación

1. **Código más limpio**: Separación clara entre lógica de API y lógica de UI
2. **Reutilizable**: La clase API puede usarse en cualquier componente
3. **Mantenible**: Cambios en la API se hacen en un solo lugar
4. **Tipado**: JSDoc proporciona autocompletado en IDEs
5. **Testeable**: Facilita la creación de tests unitarios
6. **Consistente**: Todas las respuestas siguen el mismo formato
7. **Escalable**: Fácil añadir nuevos métodos de API

---

## 📝 Notas Importantes

1. **Token Storage**: Los tokens se guardan en localStorage automáticamente
2. **Persistencia de Sesión**: El usuario se restaura al recargar la página
3. **Logout automático**: Si el token expira, el usuario se desloguea automáticamente
4. **Validaciones**: Las validaciones se hacen tanto en cliente como en servidor
5. **Seguridad**: Las contraseñas nunca se almacenan en localStorage

---

## 🐛 Troubleshooting

### El usuario no se mantiene al recargar
- Verificar que el token se guarda correctamente en localStorage
- Comprobar que el endpoint `/verificar` funciona

### Los estilos no se aplican
- Verificar que los archivos CSS se importan correctamente
- Comprobar rutas de importación

### Error de CORS
- Configurar CORS en el backend para aceptar el origen del frontend

---

## 📞 Soporte

Para más información sobre el backend, revisar:
- `routes/authRutas.js`
- Documentación de la API en el servidor

---

**Versión**: 2.0  
**Última actualización**: Octubre 2025  
**Autor**: Sistema de Autenticación Refactorizado