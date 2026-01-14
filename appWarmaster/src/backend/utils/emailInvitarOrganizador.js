// emailTorneos.js
import { transporter } from './emailHelpers.js';

/**
 * Envía email de invitación a organizador registrado y activo
 */
export async function enviarInvitacionOrganizadorRegistrado({
  destinatario,
  nombreDestinatario,
  creadorNombre,
  nombreTorneo,
  fechaInicio,
  fechaFin,
  ubicacion,
  tipoTorneo,
  rondasMax
}) {
  try {

    const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';

    const asunto = `📋 Has sido añadido como organizador - ${nombreTorneo}`;
    
    const contenidoHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #4caf50, #388e3c);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #ddd;
          }
          .torneo-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4caf50;
          }
          .torneo-info h3 {
            margin-top: 0;
            color: #4caf50;
          }
          .torneo-info ul {
            list-style: none;
            padding: 0;
          }
          .torneo-info li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .torneo-info li:last-child {
            border-bottom: none;
          }
          .torneo-info strong {
            color: #555;
          }
          .permisos-box {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .permisos-box h4 {
            margin-top: 0;
            color: #2e7d32;
          }
          .permisos-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .permisos-box li {
            padding: 5px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4caf50, #388e3c);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
          }
          .highlight {
            color: #4caf50;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>¡Has sido añadido como organizador! ⚔️</h2>
        </div>
        <div class="content">
          <p>Hola <strong>${nombreDestinatario}</strong>,</p>
          
          <p><span class="highlight">${creadorNombre}</span> te ha añadido como <strong>organizador</strong> del siguiente torneo:</p>
          
          <div class="torneo-info">
            <h3>📋 ${nombreTorneo}</h3>
            <ul>
              <li><strong>📅 Fecha:</strong> ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}</li>
              <li><strong>📍 Ubicación:</strong> ${ubicacion || 'Por confirmar'}</li>
              <li><strong>🎮 Tipo:</strong> ${tipoTorneo}</li>
              <li><strong>🎲 Rondas:</strong> ${rondasMax}</li>
            </ul>
          </div>
          
          <div class="permisos-box">
            <h4>🎯 Como organizador, ahora puedes:</h4>
            <ul>
              <li>✅ Gestionar participantes y equipos</li>
              <li>✅ Configurar emparejamientos</li>
              <li>✅ Registrar y actualizar resultados</li>
              <li>✅ Modificar información del torneo</li>
              <li>✅ Gestionar inscripciones</li>
            </ul>
          </div>
          
          <center>
            <a href="${urlBase}/perfil" class="cta-button">
              🎮 Ir a Mi Panel de Organizador
            </a>
          </center>
          
          <p style="margin-top: 20px;">
            Accede a tu cuenta para comenzar a gestionar el torneo. Encontrarás todas las herramientas necesarias en tu panel de organizador.
          </p>
          
          <p>Si tienes alguna duda sobre cómo gestionar el torneo, no dudes en contactar con ${creadorNombre}.</p>
          
          <p><strong>¡Mucha suerte con el torneo!</strong></p>
          
          <div class="footer">
            <p>Saludos,<br><strong>Equipo de Gestiona tus Torneos</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const contenidoTexto = `
¡Has sido añadido como organizador!

Hola ${nombreDestinatario},

${creadorNombre} te ha añadido como organizador del torneo:

📋 ${nombreTorneo}

📅 Fecha: ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}
📍 Ubicación: ${ubicacion || 'Por confirmar'}
🎮 Tipo: ${tipoTorneo}
🎲 Rondas: ${rondasMax}

Como organizador, ahora puedes:
✅ Gestionar participantes y equipos
✅ Configurar emparejamientos
✅ Registrar y actualizar resultados
✅ Modificar información del torneo
✅ Gestionar inscripciones


Accede a tu panel de organizador en:
${urlBase}/perfil

¡Mucha suerte con el torneo!

Saludos,
Equipo de Gestiona tus Torneos
    `;

    const mailOptions = {
      from:  'Gestiona Tus Torneos',
      to: destinatario,
      subject: asunto,
      html: contenidoHtml,
      text: contenidoTexto
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado a organizador registrado: ${destinatario}`);
    
    return {
      success: true,
      messageId: result.messageId || result.response?.messageId,
      destinatario
    };

  } catch (error) {
    console.error(`❌ Error enviando email a ${destinatario}:`, error.message);
    throw error;
  }
}

/**
 * Envía email de invitación a usuario no registrado (pendiente)
 */
export async function enviarInvitacionOrganizadorNoRegistrado({
  destinatario,
  nombreTorneo,
  creadorNombre,
  fechaInicio,
  fechaFin,
  ubicacion,
  tipoTorneo,
  rondasMax
}) {
  try {

    const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
    const urlRegistro = `${urlBase}/registrarse?email=${encodeURIComponent(destinatario)}`;
    
    const asunto = `📋 Invitación como organizador - ${nombreTorneo}`;
    
    const contenidoHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2196f3, #1976d2);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #ddd;
          }
          .torneo-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
          }
          .torneo-info h3 {
            margin-top: 0;
            color: #2196f3;
          }
          .torneo-info ul {
            list-style: none;
            padding: 0;
          }
          .torneo-info li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .torneo-info li:last-child {
            border-bottom: none;
          }
          .torneo-info strong {
            color: #555;
          }
          .warning-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .warning-box strong {
            color: #856404;
          }
          .permisos-box {
            background: #e3f2fd;
            border: 2px solid #2196f3;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .permisos-box h4 {
            margin-top: 0;
            color: #1565c0;
          }
          .permisos-box ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .permisos-box li {
            padding: 5px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4caf50, #388e3c);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.9em;
          }
          .highlight {
            color: #2196f3;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Invitación como organizador de torneo ⚔️</h2>
        </div>
        <div class="content">
          <p>Hola,</p>
          
          <p><span class="highlight">${creadorNombre}</span> te ha invitado a ser <strong>organizador</strong> del siguiente torneo:</p>
          
          <div class="torneo-info">
            <h3>📋 ${nombreTorneo}</h3>
            <ul>
              <li><strong>📅 Fecha:</strong> ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}</li>
              <li><strong>📍 Ubicación:</strong> ${ubicacion || 'Por confirmar'}</li>
              <li><strong>🎮 Tipo:</strong> ${tipoTorneo}</li>
              <li><strong>🎲 Rondas:</strong> ${rondasMax}</li>
            </ul>
          </div>
          
          <div class="warning-box">
            <strong>⚠️ Para aceptar esta invitación, necesitas completar tu registro</strong>
            <p style="margin: 10px 0 0 0;">Regístrate en nuestra aplicación usando este email (<strong>${destinatario}</strong>) para convertirte en organizador del torneo.</p>
          </div>
          
          <center>
            <a href="${urlRegistro}" class="cta-button">
              ✅ Completar Registro
            </a>
          </center>
          
          <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${urlRegistro}">${urlRegistro}</a>
          </p>
          
          <div class="permisos-box">
            <h4>🎯 Como organizador, podrás:</h4>
            <ul>
              <li>✅ Gestionar participantes y equipos</li>
              <li>✅ Configurar emparejamientos</li>
              <li>✅ Registrar resultados</li>
              <li>✅ Actualizar información del torneo</li>
              <li>✅ Gestionar inscripciones</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Saludos,<br><strong>Equipo de Gestiona tus Torneos</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const contenidoTexto = `
Invitación como organizador de torneo

Hola,

${creadorNombre} te ha invitado a ser organizador del torneo:

📋 ${nombreTorneo}

📅 Fecha: ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}
📍 Ubicación: ${ubicacion || 'Por confirmar'}
🎮 Tipo: ${tipoTorneo}
🎲 Rondas: ${rondasMax}

⚠️ IMPORTANTE: Para aceptar esta invitación, necesitas completar tu registro

Accede a este enlace para registrarte:
${urlRegistro}

Usa el email: ${destinatario}

Como organizador, podrás:
✅ Gestionar participantes y equipos
✅ Configurar emparejamientos
✅ Registrar resultados
✅ Actualizar información del torneo
✅ Gestionar inscripciones

Saludos,
Equipo de Gestiona tus Torneos
    `;

    const mailOptions = {
      from: "Gestiona Tus Torneos",
      to: destinatario,
      subject: asunto,
      html: contenidoHtml,
      text: contenidoTexto
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email de invitación enviado a: ${destinatario}`);
    
    return {
      success: true,
      messageId: result.messageId || result.response?.messageId,
      destinatario
    };

  } catch (error) {
    console.error(`❌ Error enviando email a ${destinatario}:`, error.message);
    throw error;
  }
}