import { useState } from 'react';

import usuarioApi from '@/servicios/apiUsuarios';
import '@/estilos/legalPages.css';

const Contacto = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await usuarioApi.enviarContacto(formData);
      setEnviado(true);
    } catch (err) {
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos directamente a warmastermadrid23@gmail.com', err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="documento-legal-container">
      <div className="documento-legal-content">
        <h1 className="documento-legal-titulo">Contacto</h1>
        <p className="documento-legal-fecha">¿Tienes alguna pregunta o sugerencia? Escríbenos.</p>

        <section className="documento-legal-seccion">
          <h2>Información de Contacto</h2>
          <p>Puedes contactar conmigo directamente a través del siguiente correo electrónico:</p>
          <p>
            📧 <strong>
              <a href="mailto:warmastermadrid23@gmail.com">
                warmastermadrid23@gmail.com
              </a>
            </strong>
          </p>
          <p>Intento responder en un plazo máximo de <strong>48 horas laborables</strong>.</p>
        </section>

        <section className="documento-legal-seccion">
          <h2>Envía un Mensaje</h2>

          {enviado ? (
            <div className="contacto-exito">
              <p>✅ Mensaje enviado correctamente. Te responderemos en un plazo de 48 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contacto-form">

              {error && (
                <div className="contacto-error">
                  <p>❌ {error}</p>
                </div>
              )}

              <div className="contacto-form-row">
                <div className="contacto-form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    disabled={enviando}
                  />
                </div>
                <div className="contacto-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    disabled={enviando}
                  />
                </div>
              </div>

              <div className="contacto-form-group">
                <label>Asunto *</label>
                <input
                  type="text"
                  name="asunto"
                  required
                  value={formData.asunto}
                  onChange={handleChange}
                  placeholder="¿En qué puedo ayudarte?"
                  disabled={enviando}
                />
              </div>

              <div className="contacto-form-group">
                <label>Mensaje *</label>
                <textarea
                  name="mensaje"
                  required
                  value={formData.mensaje}
                  onChange={handleChange}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                  disabled={enviando}
                />
              </div>

              <button type="submit" className="contacto-btn-enviar" disabled={enviando}>
                {enviando ? '⏳ Enviando...' : '📧 Enviar Mensaje'}
              </button>
            </form>
          )}
        </section>

        <section className="documento-legal-seccion">
          <h2>Motivos de Contacto Frecuentes</h2>
          <ul>
            <li>Problemas con el registro o inicio de sesión</li>
            <li>Dudas sobre la gestión de torneos</li>
            <li>Solicitar soporte para un torneo específico</li>
            <li>Sugerencias de mejora de la plataforma</li>
            <li>Reporte de errores o comportamientos inesperados</li>
            <li>Consultas sobre datos personales y privacidad</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Contacto;