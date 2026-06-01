import { transporter } from "./emailHelpers.js";

const TEXTOS = {
    es: {
        asunto:         (esNuevo, sistema, torneo) =>
            `🎯 ${esNuevo ? 'Invitación' : 'Inscripción'} - ${sistema} - "${torneo}"`,
        header_sub:     (esNuevo) => esNuevo ? 'Has sido invitado a participar' : 'Estás inscrito en el torneo',
        saludo:         (nombre) => `Hola <strong>${nombre}</strong>,`,
        intro_nuevo:    (sistema) => `¡Buenas noticias! Has sido invitado/a a participar en un emocionante torneo de <strong>${sistema}</strong> en modalidad individual.`,
        intro_existente:(sistema) => `¡Buenas noticias! Has sido inscrito/a en un torneo de <strong>${sistema}</strong> en modalidad individual.`,
        torneo_titulo:  '📋 Detalles del Torneo',
        nombre_label:   'Nombre:',
        sistema_label:  'Sistema:',
        tipo_label:     'Tipo:',
        tipo_individual:'Individual',
        ubicacion_label:'📍 Ubicación:',
        fecha_ini:      '📅 Fecha inicio:',
        fecha_fin:      '📅 Fecha fin:',
        puntos_label:   '⚔️ Puntos de banda:',
        bases_txt:      'Las <strong>BASES</strong> las podrás encontrar en la web',
        insc_titulo:    '👤 Tus Datos de Inscripción',
        email_label:    'Tu email:',
        epoca_label:    'Época asignada:',
        epoca_pend:     '⚠️ <strong>Época:</strong> Pendiente de seleccionar',
        banda_label:    'Banda:',
        banda_pend:     '⚠️ <strong>Banda:</strong> Pendiente de seleccionar',
        precargado:     '✨ Tu nombre y email ya estarán precargados en el formulario de registro',
        btn_nuevo:      '🆕 Crear tu perfil y acceder al torneo',
        btn_existente:  '🌐 Acceder a tu perfil',
        url_hint:       'Si el botón no funciona, copia y pega este enlace en tu navegador:',
        contacto_titulo:'📞 Contacto',
        org_label:      'Organizador:',
        pie_1:          'Este es un correo automático, por favor no respondas a este mensaje.',
        txt_invitacion: 'INVITACIÓN A TORNEO',
        txt_inscripcion:'INSCRIPCIÓN EN TORNEO',
        txt_invitado:   '¡Has sido invitado/a a participar en un torneo!',
        txt_inscrito:   '¡Estás inscrito/a en el torneo!',
        txt_acceso:     'Para acceder:',
        txt_paso1_nuevo:(url) => `1. Accede al enlace de registro:\n   ${url}`,
        txt_paso2_nuevo:       '2. Completa tu registro (tu nombre y email ya estarán precargados)',
        txt_paso3_nuevo:(torneo) => `3. Ve a "Perfil" → "Mis Torneos" → "${torneo}"`,
        txt_paso4_nuevo:       '4. Completa los datos de tu inscripción',
        txt_paso1_exist:(url)  => `1. Accede a tu perfil:\n   ${url}`,
        txt_paso2_exist:(torneo) => `2. Ve a "Perfil" → "Mis Torneos" → "${torneo}"`,
        txt_paso3_exist:       '3. Completa los datos de tu inscripción',
        txt_contacto:   'Contacta con el organizador del torneo si tienes dudas.',
        txt_banda_pend: 'Pendiente de seleccionar ⚠️',
        txt_epoca_pend: 'Pendiente de seleccionar ⚠️',
        por_definir:    'Por definir',
    },
    en: {
        asunto:         (esNuevo, sistema, torneo) =>
            `🎯 ${esNuevo ? 'Invitation' : 'Registration'} - ${sistema} - "${torneo}"`,
        header_sub:     (esNuevo) => esNuevo ? 'You have been invited to participate' : 'You are registered in the tournament',
        saludo:         (nombre) => `Hello <strong>${nombre}</strong>,`,
        intro_nuevo:    (sistema) => `Great news! You have been invited to participate in an exciting <strong>${sistema}</strong> individual tournament.`,
        intro_existente:(sistema) => `Great news! You have been registered in a <strong>${sistema}</strong> individual tournament.`,
        torneo_titulo:  '📋 Tournament Details',
        nombre_label:   'Name:',
        sistema_label:  'System:',
        tipo_label:     'Type:',
        tipo_individual:'Individual',
        ubicacion_label:'📍 Location:',
        fecha_ini:      '📅 Start date:',
        fecha_fin:      '📅 End date:',
        puntos_label:   '⚔️ Warband points:',
        bases_txt:      'The <strong>RULES</strong> can be found on the website',
        insc_titulo:    '👤 Your Registration Details',
        email_label:    'Your email:',
        epoca_label:    'Assigned era:',
        epoca_pend:     '⚠️ <strong>Era:</strong> Pending selection',
        banda_label:    'Warband:',
        banda_pend:     '⚠️ <strong>Warband:</strong> Pending selection',
        precargado:     '✨ Your name and email will be pre-filled in the registration form',
        btn_nuevo:      '🆕 Create your profile and join the tournament',
        btn_existente:  '🌐 Access your profile',
        url_hint:       'If the button does not work, copy and paste this link into your browser:',
        contacto_titulo:'📞 Contact',
        org_label:      'Organiser:',
        pie_1:          'This is an automated email, please do not reply to this message.',
        txt_invitacion: 'TOURNAMENT INVITATION',
        txt_inscripcion:'TOURNAMENT REGISTRATION',
        txt_invitado:   'You have been invited to participate in a tournament!',
        txt_inscrito:   'You are registered in the tournament!',
        txt_acceso:     'To access:',
        txt_paso1_nuevo:(url) => `1. Go to the registration page:\n   ${url}`,
        txt_paso2_nuevo:       '2. Complete your registration (your name and email will be pre-filled)',
        txt_paso3_nuevo:(torneo) => `3. Go to "Profile" → "My Tournaments" → "${torneo}"`,
        txt_paso4_nuevo:       '4. Complete your registration details',
        txt_paso1_exist:(url)  => `1. Access your profile:\n   ${url}`,
        txt_paso2_exist:(torneo) => `2. Go to "Profile" → "My Tournaments" → "${torneo}"`,
        txt_paso3_exist:       '3. Complete your registration details',
        txt_contacto:   'Contact the tournament organiser if you have any questions.',
        txt_banda_pend: 'Pending selection ⚠️',
        txt_epoca_pend: 'Pending selection ⚠️',
        por_definir:    'To be confirmed',
    }
};

const enviarInvitarJugador = async (destinatario, torneoInfo, lang = 'es') => {
    const tx = TEXTOS[lang] || TEXTOS.es;
    const esNuevoUsuario = destinatario.esNuevo === true;
    const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
    const urlAcceso = esNuevoUsuario
        ? `${urlBase}/registrarse?email=${encodeURIComponent(destinatario.email)}&nombre=${encodeURIComponent(destinatario.nombre)}`
        : `${urlBase}/perfil`;

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
        .divider{height:1px;background:#eee;margin:25px 0;}
        .url-box{background:#f8f9fa;border:2px solid #667eea;padding:15px;border-radius:8px;margin:20px 0;word-break:break-all;text-align:center;}
        .url-box a{color:#667eea;font-weight:600;text-decoration:none;}
        .footer{text-align:center;padding:25px 30px;background:#f8f9fa;color:#999;font-size:13px;border-top:1px solid #eee;}
        .footer p{margin-bottom:8px;}
        .highlight-box{background:#e3f2fd;border:2px solid #2196f3;padding:15px;border-radius:8px;margin:20px 0;text-align:center;}
        .highlight-box p{color:#1976d2;font-weight:600;margin:0;}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 ${torneoInfo.nombre_torneo}</h1>
          <h2>${torneoInfo.sistema}</h2>
          <p style="margin:0;opacity:0.9;">${tx.header_sub(esNuevoUsuario)}</p>
        </div>
        <div class="content">
          <p>${tx.saludo(destinatario.nombre)}</p>
          <p>${esNuevoUsuario ? tx.intro_nuevo(torneoInfo.sistema) : tx.intro_existente(torneoInfo.sistema)}</p>

          <div class="info-box">
            <h3>${tx.torneo_titulo}</h3>
            <p><strong>${tx.nombre_label}</strong> ${torneoInfo.nombre_torneo}</p>
            <p><strong>${tx.sistema_label}</strong> ${torneoInfo.sistema}</p>
            <p><strong>${tx.tipo_label}</strong> ${tx.tipo_individual}</p>
            ${torneoInfo.ubicacion   ? `<p><strong>${tx.ubicacion_label}</strong> ${torneoInfo.ubicacion}</p>` : ''}
            ${torneoInfo.fecha_inicio ? `<p><strong>${tx.fecha_ini}</strong> ${formatearFecha(torneoInfo.fecha_inicio)}</p>` : ''}
            ${torneoInfo.fecha_fin    ? `<p><strong>${tx.fecha_fin}</strong> ${formatearFecha(torneoInfo.fecha_fin)}</p>` : ''}
            ${torneoInfo.puntos_banda ? `<p><strong>${tx.puntos_label}</strong> ${torneoInfo.puntos_banda}</p>` : ''}
            <p>${tx.bases_txt}</p>
          </div>

          <div class="info-box">
            <h3>${tx.insc_titulo}</h3>
            <p><strong>${tx.email_label}</strong> ${destinatario.email}</p>
            ${destinatario.epoca ? `<p><strong>${tx.epoca_label}</strong> ${destinatario.epoca}</p>` : `<p class="warning">${tx.epoca_pend}</p>`}
            ${destinatario.banda ? `<p><strong>${tx.banda_label}</strong> ${destinatario.banda}</p>` : `<p class="warning">${tx.banda_pend}</p>`}
          </div>

          ${esNuevoUsuario ? `<div class="highlight-box"><p>${tx.precargado}</p></div>` : ''}

          <div class="button-container">
            <a href="${urlAcceso}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff!important;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
              ${esNuevoUsuario ? tx.btn_nuevo : tx.btn_existente}
            </a>
          </div>

          <div class="url-box">
            <p style="margin-bottom:10px;color:#666;font-size:14px;">${tx.url_hint}</p>
            <a href="${urlAcceso}" target="_blank" rel="noopener noreferrer">${urlAcceso}</a>
          </div>

          <div class="divider"></div>

          ${torneoInfo.organizador ? `
          <div class="info-box">
            <h3>${tx.contacto_titulo}</h3>
            <p><strong>${tx.org_label}</strong> ${torneoInfo.organizador.nombre}</p>
            <p><a href="mailto:${torneoInfo.organizador.email}" target="_blank" rel="noopener noreferrer" style="color:#667eea;text-decoration:none;font-weight:500;">${torneoInfo.organizador.email}</a></p>
          </div>` : ''}
        </div>

        <div class="footer">
          <p><strong>Equipo de Gestiona Tus Torneos</strong></p>
          <p>${tx.pie_1}</p>
          <p style="margin-top:10px;"><a href="${urlBase}" target="_blank" rel="noopener noreferrer" style="color:#667eea;text-decoration:none;">www.gestionatustorneos.es</a></p>
        </div>
      </div>
    </body>
    </html>`;

    const textEmail = `
${esNuevoUsuario ? tx.txt_invitacion : tx.txt_inscripcion} - ${torneoInfo.sistema}

${destinatario.nombre},

${esNuevoUsuario ? tx.txt_invitado : tx.txt_inscrito}

${'═'.repeat(39)}
${torneoInfo.nombre_torneo}
${'═'.repeat(39)}
${tx.nombre_label} ${torneoInfo.nombre_torneo}
${tx.sistema_label} ${torneoInfo.sistema}
${tx.tipo_label} ${tx.tipo_individual}
${torneoInfo.ubicacion    ? `${tx.ubicacion_label} ${torneoInfo.ubicacion}` : ''}
${torneoInfo.fecha_inicio ? `${tx.fecha_ini} ${formatearFecha(torneoInfo.fecha_inicio)}` : ''}
${torneoInfo.fecha_fin    ? `${tx.fecha_fin} ${formatearFecha(torneoInfo.fecha_fin)}` : ''}

${tx.email_label} ${destinatario.email}
${tx.epoca_label} ${destinatario.epoca || tx.txt_epoca_pend}
${tx.banda_label} ${destinatario.banda || tx.txt_banda_pend}

${tx.txt_acceso}
${esNuevoUsuario
    ? `${tx.txt_paso1_nuevo(urlAcceso)}\n${tx.txt_paso2_nuevo}\n${tx.txt_paso3_nuevo(torneoInfo.nombre_torneo)}\n${tx.txt_paso4_nuevo}`
    : `${tx.txt_paso1_exist(urlAcceso)}\n${tx.txt_paso2_exist(torneoInfo.nombre_torneo)}\n${tx.txt_paso3_exist}`
}

${torneoInfo.organizador ? `${tx.org_label} ${torneoInfo.organizador.nombre} — ${torneoInfo.organizador.email}` : tx.txt_contacto}

Web: ${urlBase}
    `.trim();

    const mailOptions = {
        from:    `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
        replyTo: process.env.EMAIL_USER,
        to:      destinatario.email,
        subject: tx.asunto(esNuevoUsuario, torneoInfo.sistema, torneoInfo.nombre_torneo),
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

export { enviarInvitarJugador };