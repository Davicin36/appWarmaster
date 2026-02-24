import { useState } from 'react';
import '@/estilos/legalPages.css';

const Contacto = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nombre, email, asunto, mensaje } = formData;
    const mailtoLink = `mailto:warmastermadrid23@gmail.com?subject=${encodeURIComponent('[Contacto Web] ' + asunto)}&body=${encodeURIComponent('Nombre: ' + nombre + '\nEmail: ' + email + '\n\n' + mensaje)}`;
    window.location.href = mailtoLink;
    setEnviado(true);
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
              <p>✅ Se ha abierto tu cliente de correo con el mensaje preparado. ¡Gracias por contactarnos!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contacto-form">
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
                />
              </div>

              <button type="submit" className="contacto-btn-enviar">
                📧 Enviar Mensaje
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