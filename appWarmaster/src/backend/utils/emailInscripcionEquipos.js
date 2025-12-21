const nodemailer = require('nodemailer');

// Configurar transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error.message);
    console.log('⚠️ Los correos NO se enviarán. Revisa tus credenciales en .env');
  } else {
    console.log('✅ Servidor de email listo para enviar correos');
  }
});

/**
 * Enviar correo de invitación a equipo
 */
const enviarInvitacionEquipo = async (destinatario, datosEquipo, torneoInfo, token) => {

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Por definir';
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const esNuevo = destinatario.esNuevo === true

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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 Invitación a Torneo ${torneoInfo.nombre_torneo}</h1>
          <h2>${torneoInfo.sistema}</h2>
          <p style="margin: 0; opacity: 0.9;">
             ${esNuevo ? 'Has sido invitado a un equipo' : 'Has sido inscrito en un equipo'}
          </p>
        </div>
        
        <div class="content">
          <p>Hola <strong>${destinatario.nombre}</strong>,</p>
          
          <p>¡Buenas noticias! 
            Has sido invitado/a a formar parte del equipo <strong>"${datosEquipo.nombreEquipo}"</strong> 
            para participar en un emocionante torneo de <strong>${torneoInfo.sistema}</strong>.
          </p>
          
          <p>Te ha inscrito <strong>${datosEquipo.capitan.nombre}</strong>, capitán de tu equipo.</p>
          
          <div class="info-box">
            <h3>📋 Detalles del Torneo</h3>
            <p><strong>Nombre:</strong> ${torneoInfo.nombre_torneo}</p>
            <p><strong>Sistema:</strong> ${torneoInfo.sistema }</p>
            <p><strong>Tipo:</strong> ${torneoInfo.tipo_torneo || 'Por equipos'}</p>
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
            <h3>👥 Tu Equipo</h3>
            <p><strong>Equipo:</strong> ${datosEquipo.nombreEquipo}</p>
            <p><strong>Capitán:</strong> ${datosEquipo.capitan.nombre}</p>
            <p style="color: #666; font-size: 14px;">
              <a href="mailto:${datosEquipo.capitan.email}" class="email-link">${datosEquipo.capitan.email}</a>
            </p>
          </div>
          
          <div class="info-box">
            <h3>⚔️ Tus Datos de Inscripción</h3>
            <p><strong>Tu email:</strong> ${destinatario.email}</p>
            <p><strong>Época asignada:</strong> ${destinatario.epoca}</p>
            ${destinatario.banda 
              ? `<p><strong>Banda:</strong> ${destinatario.banda}</p>` 
              : '<p class="warning">⚠️ <strong>Banda:</strong> Pendiente de seleccionar</p>'}
          </div>
          
          <div class="divider"></div>
          
          <p><strong>Para completar tu inscripción, sigue estos pasos:</strong></p>
          
          <div class="steps">
           <ol>
              ${esNuevo ? `
                <li>Accede a <span class="url-highlight">gestionatustorneos.es</span></li>
                <li><strong>Regístrate</strong> con este email: <strong>${destinatario.email}</strong></li>
                <li>Ve a <strong>"Perfil"</strong> y <strong>"Mis Torneos"</strong> → <strong>"${torneoInfo.nombre_torneo}"</strong></li>
                <li>En <strong>"Administrar Inscripción"</strong>, completa los datos de tu banda</li>
              ` : `
                <li><strong>Inicia sesión</strong> en <span class="url-highlight">gestionatustorneos.es</span></li>
                <li>Ve a <strong>"Perfil"</strong> y <strong>"Mis Torneos"</strong> → <strong>"${torneoInfo.nombre_torneo}"</strong></li>
                <li>En <strong>"Administrar Inscripción"</strong>, completa los datos de tu banda</li>
              `}
            </ol>
          </div>
          
          <div class="button-container">
            <a href="https://gestionatustorneos.es" class="button">🌐 Ir a Gestiona Tus Torneos</a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            Si el botón no funciona, accede directamente a:<br>
            <strong>https://gestionatustorneos.es</strong>
          </p>
          
          <div class="divider"></div>
          
          ${torneoInfo.organizador ? `
          <div class="contact-box">
            <h3>📞 Información de Contacto</h3>
            <p><strong>Capitán del equipo:</strong> ${datosEquipo.capitan.nombre}</p>
            <p style="font-size: 14px; margin-bottom: 15px;">
              <a href="mailto:${datosEquipo.capitan.email}" class="email-link">${datosEquipo.capitan.email}</a>
            </p>
            <p><strong>Organizador del torneo:</strong> ${torneoInfo.organizador.nombre}</p>
            <p style="font-size: 14px;">
              <a href="mailto:${torneoInfo.organizador.email}" class="email-link">${torneoInfo.organizador.email}</a>
            </p>
          </div>
          ` : `
          <p style="margin-bottom: 0;">
            Si tienes alguna duda, contacta con tu capitán 
            <strong>${datosEquipo.capitan.nombre}</strong> 
            (<a href="mailto:${datosEquipo.capitan.email}" class="email-link">${datosEquipo.capitan.email}</a>).
          </p>
          `}
        </div>
        
        <div class="footer">
          <p><strong>Equipo de Gestiona Tus Torneos</strong></p>
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          ${torneoInfo.organizador 
            ? `<p>Para consultas sobre el torneo, contacta con ${torneoInfo.organizador.nombre} (${torneoInfo.organizador.email})</p>`
            : '<p>Si necesitas ayuda, contacta con el organizador del torneo.</p>'}
        </div>
      </div>
    </body>
    </html>
  `;

  const textEmail = `
Has sido inscrito en un torneo de ${torneoInfo.sistema || 'wargaming'}

Hola ${destinatario.nombre},

Te informamos que ${datosEquipo.capitan.nombre} te ha inscrito en el siguiente torneo como miembro de su equipo.

DETALLES DEL TORNEO:
- Nombre: ${torneoInfo.nombre_torneo}
- Sistema: ${torneoInfo.sistema}
- Tipo: ${torneoInfo.tipo_torneo || 'Por equipos'}
${torneoInfo.ubicacion ? `- Ubicación: ${torneoInfo.ubicacion}` : ''}
${torneoInfo.fecha_inicio ? `- Fecha inicio: ${formatearFecha(torneoInfo.fecha_inicio)}` : ''}
${torneoInfo.puntos_banda ? `- Puntos de banda: ${torneoInfo.puntos_banda}` : ''}

TU EQUIPO:
- Equipo: ${datosEquipo.nombreEquipo}
- Capitán: ${datosEquipo.capitan.nombre} (${datosEquipo.capitan.email})

TUS DATOS:
- Email: ${destinatario.email}
- Época asignada: ${destinatario.epoca}
- Banda: ${destinatario.banda || 'Pendiente de seleccionar'}

PARA COMPLETAR TU INSCRIPCIÓN:
1. Accede a gestionatustorneos.es
2. Regístrate con este email: ${destinatario.email} (o inicia sesión si ya tienes cuenta)
3. Ve a "Mis Torneos" → "${torneoInfo.nombre_torneo}"
4. En "Gestionar Inscripción", completa los datos de tu banda

INFORMACIÓN DE CONTACTO:
- Capitán del equipo: ${datosEquipo.capitan.nombre} (${datosEquipo.capitan.email})
${torneoInfo.organizador ? `- Organizador del torneo: ${torneoInfo.organizador.nombre} (${torneoInfo.organizador.email})` : ''}

---
Equipo de Gestiona Tus Torneos
Este es un correo automático, por favor no respondas.
${torneoInfo.organizador ? `Para consultas sobre el torneo, contacta con ${torneoInfo.organizador.nombre}` : ''}
  `;

  const mailOptions = {
    from: `"Gestiona Tus Torneos" <${process.env.EMAIL_USER}>`,
    to: destinatario.email,
    subject: `🎮 Invitación: ${torneoInfo.sistema || 'Torneo'} - "${torneoInfo.nombre_torneo}" - Equipo: ${datosEquipo.nombreEquipo}`,
    html: htmlEmail,
    text: textEmail
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

module.exports = {
  enviarInvitacionEquipo
};