import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import usuarioApi from '@/servicios/apiUsuarios';
import Footer from '@/paginas/Footer.jsx';
import '@/estilos/legalPages.css';

const Contacto = () => {
  const { t } = useTranslation();
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
    } catch {
      setError(t('contacto.error_envio'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="documento-legal-container">
      <div className="documento-legal-content">
        <h1 className="documento-legal-titulo">{t('contacto.titulo')}</h1>
        <p className="documento-legal-fecha">{t('contacto.subtitulo')}</p>

        <section className="documento-legal-seccion">
          <h2>{t('contacto.info_titulo')}</h2>
          <p>{t('contacto.info_texto')}</p>
          <p>
            📧 <strong>
              <a href="mailto:warmastermadrid23@gmail.com">warmastermadrid23@gmail.com</a>
            </strong>
          </p>
          <p>{t('contacto.plazo_respuesta')}</p>
        </section>

        <section className="documento-legal-seccion">
          <h2>{t('contacto.form_titulo')}</h2>

          {enviado ? (
            <div className="contacto-exito">
              <p>✅ {t('contacto.exito')}</p>
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
                  <label>{t('contacto.campo_nombre')}</label>
                  <input
                    type="text" name="nombre" required
                    value={formData.nombre} onChange={handleChange}
                    placeholder={t('contacto.placeholder_nombre')}
                    disabled={enviando}
                  />
                </div>
                <div className="contacto-form-group">
                  <label>{t('contacto.campo_email')}</label>
                  <input
                    type="email" name="email" required
                    value={formData.email} onChange={handleChange}
                    placeholder={t('registro.email_placeholder')}
                    disabled={enviando}
                  />
                </div>
              </div>

              <div className="contacto-form-group">
                <label>{t('contacto.campo_asunto')}</label>
                <input
                  type="text" name="asunto" required
                  value={formData.asunto} onChange={handleChange}
                  placeholder={t('contacto.placeholder_asunto')}
                  disabled={enviando}
                />
              </div>

              <div className="contacto-form-group">
                <label>{t('contacto.campo_mensaje')}</label>
                <textarea
                  name="mensaje" required rows={6}
                  value={formData.mensaje} onChange={handleChange}
                  placeholder={t('contacto.placeholder_mensaje')}
                  disabled={enviando}
                />
              </div>

              <button type="submit" className="contacto-btn-enviar" disabled={enviando}>
                {enviando ? `⏳ ${t('contacto.enviando')}` : `📧 ${t('contacto.btn_enviar')}`}
              </button>
            </form>
          )}
        </section>

        <section className="documento-legal-seccion">
          <h2>{t('contacto.motivos_titulo')}</h2>
          <ul>
            <li>{t('contacto.motivo_1')}</li>
            <li>{t('contacto.motivo_2')}</li>
            <li>{t('contacto.motivo_3')}</li>
            <li>{t('contacto.motivo_4')}</li>
            <li>{t('contacto.motivo_5')}</li>
            <li>{t('contacto.motivo_6')}</li>
          </ul>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Contacto;