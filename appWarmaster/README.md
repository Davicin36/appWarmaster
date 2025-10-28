# 🎮 Sistema de Autenticación para WARGAMES

Sistema completo de autenticación refactorizado con arquitectura limpia, clase API centralizada y componentes React modernos.

---

## 📦 Contenido del Paquete

### Archivos Principales

1. **`AutentificacionApi.js`** - Clase API centralizada
   - Manejo de todas las peticiones HTTP
   - Métodos de utilidad para tokens
   - Documentación JSDoc completa

2. **`AuthContext_Updated.jsx`** - Context de autenticación
   - State management global
   - Integración con AutentificacionApi
   - Persistencia de sesión

3. **`Login.jsx`** - Componente de login
   - Formulario optimizado
   - Validación de campos
   - Manejo de errores

4. **`Registrarse.jsx`** - Componente de registro
   - Validación en tiempo real
   - Campos opcionales
   - UX mejorada

5. **`Perfil.jsx`** - Componente de perfil (NUEVO)
   - Cambio de contraseña
   - Conversión a organizador
   - Vista de información personal

### Estilos

6. **`auth-styles.css`** - Estilos para login y registro
7. **`perfil.css`** - Estilos para perfil

### Documentación

8. **`IMPLEMENTACION.md`** - Guía completa de implementación
9. **`EJEMPLOS_AVANZADOS.jsx`** - Casos de uso avanzados

---

## 🚀 Inicio Rápido

### 1. Copiar archivos

```bash
# API y Context
cp AutentificacionApi.js src/servicios/
cp AuthContext_Updated.jsx src/servicios/AuthContext.jsx

# Componentes
cp Login.jsx src/componentes/
cp Registrarse.jsx src/componentes/
cp Perfil.jsx src/componentes/

# Estilos
cp auth-styles.css src/estilos/
cp perfil.css src/estilos/
```

### 2. Configurar

```bash
# Crear archivo .env
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 3. Instalar dependencias

```bash
npm install react-router-dom
```

### 4. Integrar en tu App

```jsx
import { AuthProvider } from './servicios/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './componentes/Login';
import Registrarse from './componentes/Registrarse';
import Perfil from './componentes/Perfil';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registrarse" element={<Registrarse />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## 📚 Características Principales

### ✨ Arquitectura Limpia

- **Separación de responsabilidades**: API, Context y UI separados
- **Código reutilizable**: Clase API puede usarse en cualquier parte
- **Fácil mantenimiento**: Cambios centralizados

### 🔐 Seguridad

- Tokens JWT automáticos
- Validación de campos
- Protección de rutas
- Manejo seguro de contraseñas

### 🎨 Experiencia de Usuario

- Diseño moderno y responsive
- Validación en tiempo real
- Mensajes de error claros
- Loading states
- Animaciones suaves

### 📱 Funcionalidades

✅ Login / Logout  
✅ Registro de usuarios  
✅ Verificación de tokens  
✅ Cambio de contraseña  
✅ Conversión a organizador  
✅ Persistencia de sesión  
✅ Actualización de perfil

---

## 🔌 API Reference

### AutentificacionApi

```javascript
import { autentificacionApi } from './servicios/AutentificacionApi';

// Login
await autentificacionApi.login({ email, password });

// Registro
await autentificacionApi.registro(userData);

// Verificar token
await autentificacionApi.verificarToken(token);

// Cambiar contraseña
await autentificacionApi.cambiarPassword({ passwordActual, passwordNueva });

// Convertir a organizador
await autentificacionApi.convertirOrganizador();

// Utilidades
autentificacionApi.guardarToken(token);
autentificacionApi.obtenerToken();
autentificacionApi.eliminarToken();
```

### useAuth Hook

```javascript
import { useAuth } from './servicios/AuthContext';

const {
  user,              // Usuario actual
  isAuthenticated,   // Estado de autenticación
  loading,           // Estado de carga
  login,             // Función login
  logout,            // Función logout
  registro,          // Función registro
  cambiarPassword,   // Función cambiar contraseña
  convertirOrganizador, // Función convertir rol
  actualizarUsuario  // Función actualizar datos
} = useAuth();
```

---

## 🎯 Casos de Uso

### 1. Login Simple

```jsx
function MiLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/home');
    } catch (error) {
      alert(error.message);
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### 2. Protección de Rutas

```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
}
```

### 3. Mostrar info de usuario

```jsx
function UserInfo() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Bienvenido, {user.nombre}</h2>
      <p>Rol: {user.rol}</p>
    </div>
  );
}
```

---

## 🔧 Personalización

### Cambiar colores

Edita las variables CSS en `auth-styles.css`:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  /* ... */
}
```

### Añadir nuevos endpoints

Extiende la clase `AutentificacionApi`:

```javascript
class AutentificacionApi {
  // ... métodos existentes

  async miNuevoMetodo(datos) {
    return this.request('/mi-endpoint', {
      method: 'POST',
      body: datos
    });
  }
}
```

---

## 📖 Documentación Completa

- Ver **`IMPLEMENTACION.md`** para guía detallada
- Ver **`EJEMPLOS_AVANZADOS.jsx`** para casos de uso avanzados

---

## 🛠️ Tecnologías

- React 18+
- React Router DOM
- Fetch API
- JWT
- CSS3 (Gradients, Animations)

---

## 📝 Notas Importantes

1. **Backend requerido**: Este frontend necesita el backend de `authRutas.js`
2. **Variables de entorno**: Configurar `VITE_API_URL` correctamente
3. **CORS**: Asegurarse de que el backend tenga CORS configurado
4. **Tokens**: Se almacenan en localStorage automáticamente

---

## 🐛 Troubleshooting

**Problema**: Usuario no persiste al recargar  
**Solución**: Verificar que `verificarToken` funcione correctamente

**Problema**: Estilos no se aplican  
**Solución**: Verificar rutas de importación de CSS

**Problema**: Error de CORS  
**Solución**: Configurar CORS en el backend

---

## 📈 Mejoras Futuras

- [ ] Remember me (guardar email)
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Autenticación con redes sociales
- [ ] 2FA (autenticación de dos factores)
- [ ] Rate limiting
- [ ] Timeout de sesión por inactividad

---

## 👨‍💻 Comparación: Antes vs Después

### ❌ Antes

```javascript
// Código repetido en cada componente
const response = await fetch('http://localhost:5000/api/authRutas/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
// ... manejo de respuesta
```

### ✅ Después

```javascript
// Código limpio y reutilizable
const response = await autentificacionApi.login({ email, password });
```

**Ventajas**:
- 80% menos código
- Centralizado y mantenible
- Manejo de errores consistente
- Fácil de testear

---

## 📄 Licencia

Este código es parte del proyecto WARGAMES.

---

## 🤝 Contribuir

Para contribuir al proyecto:
1. Seguir la estructura de archivos
2. Documentar con JSDoc
3. Mantener consistencia en estilos
4. Testear antes de commitear

---

## 📬 Contacto

Para preguntas o sugerencias sobre la implementación, consultar la documentación o crear un issue en el repositorio.

---

**Última actualización**: Octubre 2025  
**Versión**: 2.0  
**Estado**: ✅ Producción