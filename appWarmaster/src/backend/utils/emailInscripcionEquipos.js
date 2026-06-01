import { transporter } from "./emailHelpers.js";

const TEXTOS = {
    es: {
        asunto:         (esNuevo, sistema, torneo, equipo) =>
            `🎮 ${esNuevo ? 'Invitación' : 'Inscripción'}: ${sistema} - "${torneo}" - Equipo: ${equipo}`,
        header_sub:     (esNuevo) => esNuevo ? 'Has sido invitado a un equipo' : 'Has sido inscrito en un equipo',
        saludo:         (nombre) => `Hola <strong>${nombre}</strong>,`,
        intro_nuevo:    (equipo, sistema) =>
            `¡Buenas noticias! Has sido invitado/a a formar parte del equipo <strong>"${equipo}"</strong> para participar en un emocionante torneo de <strong>${sistema}</strong>.`,
        intro_existente:(equipo, sistema) =>
            `¡Buenas noticias! Has sido inscrito/a en el equipo <strong>"${equipo}"</strong> para participar en un emocionante torneo de <strong>${sistema}</strong>.`,
        inscrito_por:   (capitan) => `Te ha inscrito <strong>${capitan}</strong>, capitán de tu equipo.`,
        torneo_titulo:  '📋 Detalles del Torneo',
        nombre_label:   'Nombre:',
        sistema_label:  'Sistema:',
        tipo_label:     'Tipo:',
        ubicacion_label:'📍 Ubicación:',
        fecha_ini:      '📅 Fecha inicio:',
        fecha_fin:      '📅 Fecha fin:',
        puntos_label:   '⚔️ Puntos de banda:',
        bases_txt:      'Las <strong>BASES</strong> las podrás encontrar en la web',
        equipo_titulo:  '👥 Tu Equipo',
        equipo_label:   'Equipo:',
        capitan_label:  'Capitán:',
        insc_titulo:    '⚔️ Tus Datos de Inscripción',
        email_label:    'Tu email:',
        epoca_label:    'Época asignada:',
        banda_label:    'Banda:',
        banda_pendiente:'⚠️ <strong>Banda:</strong> Pendiente de seleccionar',
        pasos_titulo:   '<strong>Para completar tu inscripción, sigue estos pasos:</strong>',
        pasos_nuevo:    (equipo, torneo) => `
            <li><strong>Haz clic en el botón de abajo</strong> para ir a la página de registro</li>
            <li><strong>Completa tu registro</strong> (tu nombre y email ya estarán precargados)</li>
            <li>Tras registrarte, automáticamente serás añadido al equipo <strong>"${equipo}"</strong></li>
            <li>Ve a <strong>"Perfil"</strong> → <strong>"Mis Torneos"</strong> → <strong>"${torneo}"</strong></li>
            <li>En <strong>"Administrar Inscripción"</strong>, completa los datos de tu banda</li>`,
        pasos_existente:(torneo) => `
            <li><strong>Inicia sesión</strong> en <span style="color:#667eea;font-weight:600;">www.gestionatustorneos.es</span></li>
            <li>Ve a <strong>"Perfil"</strong> → <strong>"Mis Torneos"</strong> → <strong>"${torneo}"</strong></li>
            <li>En <strong>"Administrar Inscripción"</strong>, completa los datos de tu banda</li>`,
        precargado:     '✨ Tu nombre y email ya estarán precargados en el formulario de registro',
        btn_nuevo:      '🎯 Registrarse y Unirse al Equipo',
        btn_existente:  '🌐 Ir a Gestiona Tus Torneos',
        url_hint:       'Si el botón no funciona, copia y pega este enlace en tu navegador:',
        contacto_titulo:'📞 Información de Contacto',
        capitan_contacto:'Capitán del equipo:',
        organizador_label:'Organizador del torneo:',
        contacto_simple:(capitan, email) =>
            `Si tienes alguna duda, contacta con tu capitán <strong>${capitan}</strong> (<a href="mailto:${email}" style="color:#667eea;text-decoration:none;">${email}</a>).`,
        pie_1:          'Este es un correo automático, por favor no respondas a este mensaje.',
        pie_consultas:  (nombre) => `Para consultas sobre el torneo, contacta con ${nombre}`,
        pie_ayuda:      'Si necesitas ayuda, contacta con el organizador del torneo.',
        tipo_equipos:   'Por equipos',
        por_definir:    'Por definir',
        txt_invitacion: 'INVITACIÓN A TORNEO',
        txt_inscripcion:'INSCRIPCIÓN EN TORNEO',
        txt_invitado:   (equipo) => `¡Has sido invitado/a a formar parte del equipo "${equipo}"!`,
        txt_inscrito:   (equipo) => `Te informamos que has sido inscrito/a en el equipo "${equipo}".`,
        txt_banda_pend: 'Pendiente de seleccionar ⚠️',
    },
    en: {
        asunto:         (esNuevo, sistema, torneo, equipo) =>
            `🎮 ${esNuevo ? 'Invitation' : 'Registration'}: ${sistema} - "${torneo}" - Team: ${equipo}`,
        header_sub:     (esNuevo) => esNuevo ? 'You have been invited to a team' : 'You have been registered in a team',
        saludo:         (nombre) => `Hello <strong>${nombre}</strong>,`,
        intro_nuevo:    (equipo, sistema) =>
            `Great news! You have been invited to join the team <strong>"${equipo}"</strong> to participate in an exciting <strong>${sistema}</strong> tournament.`,
        intro_existente:(equipo, sistema) =>
            `Great news! You have been registered in the team <strong>"${equipo}"</strong> to participate in an exciting <strong>${sistema}</strong> tournament.`,
        inscrito_por:   (capitan) => `You were registered by <strong>${capitan}</strong>, your team captain.`,
        torneo_titulo:  '📋 Tournament Details',
        nombre_label:   'Name:',
        sistema_label:  'System:',
        tipo_label:     'Type:',
        ubicacion_label:'📍 Location:',
        fecha_ini:      '📅 Start date:',
        fecha_fin:      '📅 End date:',
        puntos_label:   '⚔️ Warband points:',
        bases_txt:      'The <strong>RULES</strong> can be found on the website',
        equipo_titulo:  '👥 Your Team',
        equipo_label:   'Team:',
        capitan_label:  'Captain:',
        insc_titulo:    '⚔️ Your Registration Details',
        email_label:    'Your email:',
        epoca_label:    'Assigned era:',
        banda_label:    'Warband:',
        banda_pendiente:'⚠️ <strong>Warband:</strong> Pending selection',
        pasos_titulo:   '<strong>To complete your registration, follow these steps:</strong>',
        pasos_nuevo:    (equipo, torneo) => `
            <li><strong>Click the button below</strong> to go to the registration page</li>
            <li><strong>Complete your registration</strong> (your name and email will be pre-filled)</li>
            <li>Once registered, you will automatically be added to team <strong>"${equipo}"</strong></li>
            <li>Go to <strong>"Profile"</strong> → <strong>"My Tournaments"</strong> → <strong>"${torneo}"</strong></li>
            <li>Under <strong>"Manage Registration"</strong>, complete your warband details</li>`,
        pasos_existente:(torneo) => `
            <li><strong>Log in</strong> at <span style="color:#667eea;font-weight:600;">www.gestionatustorneos.es</span></li>
            <li>Go to <strong>"Profile"</strong> → <strong>"My Tournaments"</strong> → <strong>"${torneo}"</strong></li>
            <li>Under <strong>"Manage Registration"</strong>, complete your warband details</li>`,
        precargado:     '✨ Your name and email will be pre-filled in the registration form',
        btn_nuevo:      '🎯 Register and Join the Team',
        btn_existente:  '🌐 Go to Gestiona Tus Torneos',
        url_hint:       'If the button does not work, copy and paste this link into your browser:',
        contacto_titulo:'📞 Contact Information',
        capitan_contacto:'Team captain:',
        organizador_label:'Tournament organiser:',
        contacto_simple:(capitan, email) =>
            `If you have any questions, contact your captain <strong>${capitan}</strong> (<a href="mailto:${email}" style="color:#667eea;text-decoration:none;">${email}</a>).`,
        pie_1:          'This is an automated email, please do not reply to this message.',
        pie_consultas:  (nombre) => `For tournament queries, contact ${nombre}`,
        pie_ayuda:      'If you need help, please contact the tournament organiser.',
        tipo_equipos:   'Team',
        por_definir:    'To be confirmed',
        txt_invitacion: 'TOURNAMENT INVITATION',
        txt_inscripcion:'TOURNAMENT REGISTRATION',
        txt_invitado:   (equipo) => `You have been invited to join the team "${equipo}"!`,
        txt_inscrito:   (equipo) => `You have been registered in the team "${equipo}".`,
        txt_banda_pend: 'Pending selection ⚠️',
    }
};

const enviarInvitacionEquipo = async (destinatario, datosEquipo, torneoInfo, lang = 'es') => {
    const tx = TEXTOS[lang] || TEXTOS.es;
    const esNuevoUsuario = destinatario.esNuevo === true;
    const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';

    const urlRegistro = esNuevoUsuario
        ? `${urlBase}/registrarse?email=${encodeURIComponent(destinatario.email)}&nombre=${encodeURIComponent(destinatario.nombre)}`
        : urlBase;

    const formatearFecha = (fecha) => {
        if (!fecha) return tx.por_definir;
        const locale = lang === 'es' ? 'es-ES' : 'en-GB';
        return new Date(fecha).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;background-color:#f4f4f4;}
        .container{max-width:600px;margin:20px auto;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
        .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px 30px;text-align:center;}
        .header h1{font-size:28px;margin-bottom:10px;font-weight:600;}
        .content{padding:40px 30px;background:white;}
        .content p{margin-bottom:15px;color:#555;}
        .info-box{background:#f8f9fa;padding:20px;border-left:4px solid #667eea;margin:25px 0;border-radius:4px;}
        .info-box h3{color:#667eea;font-size:18px;margin-bottom:15px;font-weight:600;}
        .info-box p{margin-bottom:8px;color:#555;}
        .info-box strong{color:#333;}
        .warning{color:#f39c12;font-weight:500;}
        .button-container{text-align:center;margin:35px 0;}
        .steps{background:#f8f9fa;padding:20px;border-radius:4px;margin:20px 0;}
        .steps ol{margin-left:20px;margin-top:10px;}
        .steps li{margin-bottom:10px;color:#555;}
        .divider{height:1px;background:#eee;margin:25px 0;}
        .contact-box{background:#fff3cd;border-left:4px solid #ffc107;padding:20px;margin:25px 0;border-radius:4px;}
        .contact-box h3{color:#856404;font-size:18px;margin-bottom:15px;font-weight:600;}
        .contact-box p{margin-bottom:8px;color:#856404;}
        .highlight-box{background:#e3f2fd;border:2px solid #2196f3;padding:15px;border-radius:8px;margin:20px 0;text-align:center;}
        .highlight-box p{color:#1976d2;font-weight:600;margin:0;}
        .url-box{background:#f8f9fa;border:2px solid #667eea;padding:15px;border-radius:8px;margin:20px 0;word-break:break-all;text-align:center;}
        .url-box a{color:#667eea;font-weight:600;text-decoration:none;}
        .footer{text-align:center;padding:25px 30px;background:#f8f9fa;color:#999;font-size:13px;border-top:1px solid #eee;}
        .footer p{margin-bottom:8px;}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 ${torneoInfo.nombre_torneo}</h1>
          <h2>${torneoInfo.sistema}</h2>
          <p style="margin:0;opacity:0.9;">${tx.header_sub(esNuevoUsuario)}</p>
        </div>
        <div class="content">
          <p>${tx.saludo(destinatario.nombre)}</p>
          <p>${esNuevoUsuario ? tx.intro_nuevo(datosEquipo.nombreEquipo, torneoInfo.sistema) : tx.intro_existente(datosEquipo.nombreEquipo, torneoInfo.sistema)}</p>
          <p>${tx.inscrito_por(datosEquipo.capitan.nombre)}</p>

          <div class="info-box">
            <h3>${tx.torneo_titulo}</h3>
            <p><strong>${tx.nombre_label}</strong> ${torneoInfo.nombre_torneo}</p>
            <p><strong>${tx.sistema_label}</strong> ${torneoInfo.sistema}</p>
            <p><strong>${tx.tipo_label}</strong> ${torneoInfo.tipo_torneo || tx.tipo_equipos}</p>
            ${torneoInfo.ubicacion  ? `<p><strong>${tx.ubicacion_label}</strong> ${torneoInfo.ubicacion}</p>` : ''}
            ${torneoInfo.fecha_inicio ? `<p><strong>${tx.fecha_ini}</strong> ${formatearFecha(torneoInfo.fecha_inicio)}</p>` : ''}
            ${torneoInfo.fecha_fin   ? `<p><strong>${tx.fecha_fin}</strong> ${formatearFecha(torneoInfo.fecha_fin)}</p>` : ''}
            ${torneoInfo.puntos_banda ? `<p><strong>${tx.puntos_label}</strong> ${torneoInfo.puntos_banda}</p>` : ''}
            <p>${tx.bases_txt}</p>
          </div>

          <div class="info-box">
            <h3>${tx.equipo_titulo}</h3>
            <p><strong>${tx.equipo_label}</strong> ${datosEquipo.nombreEquipo}</p>
            <p><strong>${tx.capitan_label}</strong> ${datosEquipo.capitan.nombre}</p>
            <p style="color:#666;font-size:14px;">
              <a href="mailto:${datosEquipo.capitan.email}" style="color:#667eea;text-decoration:none;font-weight:500;">${datosEquipo.capitan.email}</a>
            </p>
          </div>

          <div class="info-box">
            <h3>${tx.insc_titulo}</h3>
            <p><strong>${tx.email_label}</strong> ${destinatario.email}</p>
            <p><strong>${tx.epoca_label}</strong> ${destinatario.epoca}</p>
            ${destinatario.banda ? `<p><strong>${tx.banda_label}</strong> ${destinatario.banda}</p>` : `<p class="warning">${tx.banda_pendiente}</p>`}
          </div>

          <div class="divider"></div>
          <p>${tx.pasos_titulo}</p>
          <div class="steps">
            <ol>${esNuevoUsuario ? tx.pasos_nuevo(datosEquipo.nombreEquipo, torneoInfo.nombre_torneo) : tx.pasos_existente(torneoInfo.nombre_torneo)}</ol>
          </div>

          ${esNuevoUsuario ? `<div class="highlight-box"><p>${tx.precargado}</p></div>` : ''}

          <div class="button-container">
            <a href="${urlRegistro}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff!important;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
              ${esNuevoUsuario ? tx.btn_nuevo : tx.btn_existente}
            </a>
          </div>

          <div class="url-box">
            <p style="margin-bottom:10px;color:#666;font-size:14px;">${tx.url_hint}</p>
            <a href="${urlRegistro}" target="_blank" rel="noopener noreferrer">${urlRegistro}</a>
          </div>

          <div class="divider"></div>

          ${torneoInfo.organizador ? `
          <div class="contact-box">
            <h3>${tx.contacto_titulo}</h3>
            <p><strong>${tx.capitan_contacto}</strong> ${datosEquipo.capitan.nombre}</p>
            <p style="font-size:14px;margin-bottom:15px;">
              <a href="mailto:${datosEquipo.capitan.email}" style="color:#667eea;text-decoration:none;font-weight:500;">${datosEquipo.capitan.email}</a>
            </p>
            <p><strong>${tx.organizador_label}</strong> ${torneoInfo.organizador.nombre}</p>
            <p style="font-size:14px;">
              <a href="mailto:${torneoInfo.organizador.email}" style="color:#667eea;text-decoration:none;font-weight:500;">${torneoInfo.organizador.email}</a>
            </p>
          </div>
          ` : `<p style="margin-bottom:0;">${tx.contacto_simple(datosEquipo.capitan.nombre, datosEquipo.capitan.email)}</p>`}
        </div>

        <div class="footer">
          <p><strong>Equipo de Gestiona Tus Torneos</strong></p>
          <p>${tx.pie_1}</p>
          <p style="margin-top:10px;"><a href="${urlBase}" target="_blank" rel="noopener noreferrer" style="color:#667eea;text-decoration:none;">www.gestionatustorneos.es</a></p>
          ${torneoInfo.organizador
            ? `<p>${tx.pie_consultas(torneoInfo.organizador.nombre)} (${torneoInfo.organizador.email})</p>`
            : `<p>${tx.pie_ayuda}</p>`}
        </div>
      </div>
    </body>
    </html>`;

    const textEmail = `
${esNuevoUsuario ? tx.txt_invitacion : tx.txt_inscripcion} - ${torneoInfo.sistema}

${tx.txt_saludo ? tx.txt_saludo(destinatario.nombre) : `Hello ${destinatario.nombre},`}

${esNuevoUsuario ? tx.txt_invitado(datosEquipo.nombreEquipo) : tx.txt_inscrito(datosEquipo.nombreEquipo)}
${tx.inscrito_por(datosEquipo.capitan.nombre).replace(/<[^>]+>/g, '')}

${'═'.repeat(39)}
${torneoInfo.nombre_torneo}
${'═'.repeat(39)}

${tx.nombre_label} ${torneoInfo.nombre_torneo}
${tx.sistema_label} ${torneoInfo.sistema}
${torneoInfo.ubicacion   ? `${tx.ubicacion_label} ${torneoInfo.ubicacion}` : ''}
${torneoInfo.fecha_inicio ? `${tx.fecha_ini} ${formatearFecha(torneoInfo.fecha_inicio)}` : ''}
${torneoInfo.fecha_fin    ? `${tx.fecha_fin} ${formatearFecha(torneoInfo.fecha_fin)}` : ''}
${torneoInfo.puntos_banda ? `${tx.puntos_label} ${torneoInfo.puntos_banda}` : ''}

${tx.equipo_titulo}
${tx.equipo_label} ${datosEquipo.nombreEquipo}
${tx.capitan_label} ${datosEquipo.capitan.nombre} — ${datosEquipo.capitan.email}

${tx.insc_titulo}
${tx.email_label} ${destinatario.email}
${tx.epoca_label} ${destinatario.epoca}
${tx.banda_label} ${destinatario.banda || tx.txt_banda_pend}

${urlRegistro}

${'═'.repeat(39)}

Web: ${urlBase}
    `.trim();

    const mailOptions = {
        from:    `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
        replyTo: process.env.EMAIL_USER,
        to:      destinatario.email,
        subject: tx.asunto(esNuevoUsuario, torneoInfo.sistema, torneoInfo.nombre_torneo, datosEquipo.nombreEquipo),
        html:    htmlEmail,
        text:    textEmail
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado a ${destinatario.email}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Error enviando email a ${destinatario.email}:`, error.message);
        return { success: false, error: error.message };
    }
};

export { enviarInvitacionEquipo };