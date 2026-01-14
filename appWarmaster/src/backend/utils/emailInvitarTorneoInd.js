import { transporter } from "./emailHelpers.js";

/**
 * Enviar correo de invitación a jugador individual
 */
const enviarInvitarJugador = async (destinatario, torneoInfo) => {

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Por definir';
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const esNuevoUsuario = destinatario.esNuevo === true;
  const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
  const urlAcceso = esNuevoUsuario
    ? `${urlBase}/registrarse?email=${encodeURIComponent(destinatario.email)}&nombre=${encodeURIComponent(destinatario.nombre)}`
    : `${urlBase}/perfil`; // perfil de usuario ya registrado


  const esNuevo = destinatario.esNuevo === true;

  const htmlEmail = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { 
          font-size: 28px; 
          margin-bottom: 10px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px;
          background: white;
        }
        .content p { 
          margin-bottom: 15px; 
          color: #555;
        }
        .info-box { 
          background: #f8f9fa;
          padding: 20px;
          border-left: 4px solid #667eea;
          margin: 25px 0;
          border-radius: 4px;
        }
        .info-box h3 { 
          color: #667eea;
          font-size: 18px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .info-box p { 
          margin-bottom: 8px;
          color: #555;
        }
        .info-box strong { 
          color: #333;
        }
        .warning { 
          color: #f39c12;
          font-weight: 500;
        }
        .button-container { 
          text-align: center;
          margin: 35px 0;
        }
        .button { 
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s;
        }
        .steps {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .steps ol {
          margin-left: 20px;
          margin-top: 10px;
        }
        .steps li {
          margin-bottom: 10px;
          color: #555;
        }
        .divider {
          height: 1px;
          background: #eee;
          margin: 25px 0;
        }
        .contact-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .contact-box h3 {
          color: #856404;
          font-size: 18px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .contact-box p {
          margin-bottom: 8px;
          color: #856404;
        }
        .email-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .footer { 
          text-align: center;
          padding: 25px 30px;
          background: #f8f9fa;
          color: #999;
          font-size: 13px;
          border-top: 1px solid #eee;
        }
        .footer p { 
          margin-bottom: 8px;
        }
        .url-highlight {
          color: #667eea;
          font-weight: 600;
          font-size: 16px;
        }
        .highlight-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Invitación a Torneo ${torneoInfo.nombre_torneo}</h1>
          <h2>${torneoInfo.sistema}</h2>
          <p style="margin: 0; opacity: 0.9;">
            ${esNuevoUsuario ? 'Has sido invitado a participar' : 'Estás inscrito en el torneo'}
          </p>
        </div>
        
        <div class="content">
          <p>Hola <strong>${destinatario.nombre}</strong>,</p>
          
          <p>¡Buenas noticias! 
            Has sido invitado/a a participar en un emocionante torneo de 
            <strong>${torneoInfo.sistema}</strong> en modalidad individual.
          </p>
          
          <div class="info-box">
            <h3>📋 Detalles del Torneo</h3>
            <p><strong>Nombre:</strong> ${torneoInfo.nombre_torneo}</p>
            <p><strong>Sistema:</strong> ${torneoInfo.sistema}</p>
            <p><strong>Tipo:</strong> Individual</p>
            ${torneoInfo.ubicacion 
              ? `<p><strong>📍 Ubicación:</strong> ${torneoInfo.ubicacion}</p>` 
              : ''}
            ${torneoInfo.fecha_inicio 
              ? `<p><strong>📅 Fecha inicio:</strong> ${formatearFecha(torneoInfo.fecha_inicio)}</p>` 
              : ''}
            ${torneoInfo.fecha_fin 
              ? `<p><strong>📅 Fecha fin:</strong> ${formatearFecha(torneoInfo.fecha_fin)}</p>` 
              : ''}
            ${torneoInfo.puntos_banda 
              ? `<p><strong>⚔️ Puntos de banda:</strong> ${torneoInfo.puntos_banda}</p>` 
              : ''}
            <p>Las <strong>BASES</strong> las podrás encontrar en la web</p>
          </div>
          
          <div class="info-box">
            <h3>👤 Tus Datos de Inscripción</h3>
            <p><strong>Tu email:</strong> ${destinatario.email}</p>
            ${destinatario.epoca 
              ? `<p><strong>Época asignada:</strong> ${destinatario.epoca}</p>` 
              : '<p class="warning">⚠️ <strong>Época:</strong> Pendiente de seleccionar</p>'}
            ${destinatario.banda 
              ? `<p><strong>Banda:</strong> ${destinatario.banda}</p>` 
              : '<p class="warning">⚠️ <strong>Banda:</strong> Pendiente de seleccionar</p>'}
          </div>
          
          <div class="button-container">
            <a href="${urlAcceso}" class="button">
              ${esNuevoUsuario ? '🆕 Crear tu perfil y acceder al torneo' : '🌐 Acceder a tu perfil'}
            </a>
          </div>

          <div class="divider"></div>
          
            <p style="font-size: 14px; color: #666; text-align: center;">Si el botón no funciona, accede directamente a: <br> <strong>${urlAcceso}</strong></p>

          <div class="divider"></div>

          ${torneoInfo.organizador ? `
          <div class="info-box">
            <h3>📞 Contacto</h3>
            <p><strong>Organizador:</strong> ${torneoInfo.organizador.nombre}</p>
            <p><a href="mailto:${torneoInfo.organizador.email}" class="email-link">${torneoInfo.organizador.email}</a></p>
          </div>` : ''}
        </div>

        <div class="footer">
          <p><strong>Equipo de Gestiona Tus Torneos</strong></p>
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      </div>
    </body>
  </html>
  `;
  
  const mailOptions = {
    from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
    replyTo: process.env.EMAIL_USER,
    to: destinatario.email,
    subject: `🎯 ${esNuevoUsuario ? 'Invitación' : 'Inscripción'} - ${torneoInfo.sistema || 'Torneo'} - "${torneoInfo.nombre_torneo}"`,
    html: htmlEmail,
    text: `Hola ${destinatario.nombre},\nHas sido ${esNuevoUsuario ? 'invitado/a' : 'inscrito/a'} en el torneo ${torneoInfo.nombre_torneo} (${torneoInfo.sistema}). Accede aquí: ${urlAcceso}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${destinatario.email} - ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${destinatario.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export { enviarInvitarJugador };