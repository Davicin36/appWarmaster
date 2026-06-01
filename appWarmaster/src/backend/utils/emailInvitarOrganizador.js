import { transporter } from './emailHelpers.js';

const TEXTOS = {
    es: {
        reg: {
            asunto:       (torneo) => `📋 Has sido añadido como organizador - ${torneo}`,
            header:       '¡Has sido añadido como organizador! ⚔️',
            saludo:       (nombre) => `Hola <strong>${nombre}</strong>,`,
            intro:        (creador) => `<span style="color:#4caf50;font-weight:bold;">${creador}</span> te ha añadido como <strong>organizador</strong> del siguiente torneo:`,
            fecha_label:  '📅 Fecha:',
            ubic_label:   '📍 Ubicación:',
            tipo_label:   '🎮 Tipo:',
            rondas_label: '🎲 Rondas:',
            por_confirmar:'Por confirmar',
            permisos_titulo: '🎯 Como organizador, ahora puedes:',
            p1: '✅ Gestionar participantes y equipos',
            p2: '✅ Configurar emparejamientos',
            p3: '✅ Registrar y actualizar resultados',
            p4: '✅ Modificar información del torneo',
            p5: '✅ Gestionar inscripciones',
            btn:          '🎮 Ir a Mi Panel de Organizador',
            url_hint:     'Si el botón no funciona, copia y pega este enlace en tu navegador:',
            cuerpo:       'Accede a tu cuenta para comenzar a gestionar el torneo. Encontrarás todas las herramientas necesarias en tu panel de organizador.',
            contacto:     (creador) => `Si tienes alguna duda sobre cómo gestionar el torneo, no dudes en contactar con ${creador}.`,
            despedida:    '¡Mucha suerte con el torneo!',
            txt_header:   '¡Has sido añadido como organizador!',
            txt_intro:    (creador, torneo) => `${creador} te ha añadido como organizador del torneo:\n\n${torneo}`,
        },
        no_reg: {
            asunto:       (torneo) => `📋 Invitación como organizador - ${torneo}`,
            header:       'Invitación como organizador de torneo ⚔️',
            saludo:       'Hola,',
            intro:        (creador) => `<span style="color:#2196f3;font-weight:bold;">${creador}</span> te ha invitado a ser <strong>organizador</strong> del siguiente torneo:`,
            aviso_titulo: '⚠️ Para aceptar esta invitación, necesitas completar tu registro',
            aviso_texto:  (email) => `Regístrate en nuestra aplicación usando este email (<strong>${email}</strong>) para convertirte en organizador del torneo.`,
            btn:          '✅ Completar Registro',
            url_hint:     'Si el botón no funciona, copia y pega este enlace en tu navegador:',
            permisos_titulo: '🎯 Como organizador, podrás:',
            p1: '✅ Gestionar participantes y equipos',
            p2: '✅ Configurar emparejamientos',
            p3: '✅ Registrar resultados',
            p4: '✅ Actualizar información del torneo',
            p5: '✅ Gestionar inscripciones',
            txt_header:   'Invitación como organizador de torneo',
            txt_importante:'⚠️ IMPORTANTE: Para aceptar esta invitación, necesitas completar tu registro',
        },
        pie: {
            equipo:   'Equipo de Gestiona tus Torneos',
        }
    },
    en: {
        reg: {
            asunto:       (torneo) => `📋 You have been added as organiser - ${torneo}`,
            header:       'You have been added as organiser! ⚔️',
            saludo:       (nombre) => `Hello <strong>${nombre}</strong>,`,
            intro:        (creador) => `<span style="color:#4caf50;font-weight:bold;">${creador}</span> has added you as an <strong>organiser</strong> for the following tournament:`,
            fecha_label:  '📅 Date:',
            ubic_label:   '📍 Location:',
            tipo_label:   '🎮 Type:',
            rondas_label: '🎲 Rounds:',
            por_confirmar:'To be confirmed',
            permisos_titulo: '🎯 As organiser, you can now:',
            p1: '✅ Manage participants and teams',
            p2: '✅ Configure pairings',
            p3: '✅ Record and update results',
            p4: '✅ Edit tournament information',
            p5: '✅ Manage registrations',
            btn:          '🎮 Go to My Organiser Panel',
            url_hint:     'If the button does not work, copy and paste this link into your browser:',
            cuerpo:       'Log in to start managing the tournament. You will find all the tools you need in your organiser panel.',
            contacto:     (creador) => `If you have any questions about managing the tournament, please contact ${creador}.`,
            despedida:    'Good luck with the tournament!',
            txt_header:   'You have been added as organiser!',
            txt_intro:    (creador, torneo) => `${creador} has added you as organiser for the tournament:\n\n${torneo}`,
        },
        no_reg: {
            asunto:       (torneo) => `📋 Invitation as organiser - ${torneo}`,
            header:       'Tournament organiser invitation ⚔️',
            saludo:       'Hello,',
            intro:        (creador) => `<span style="color:#2196f3;font-weight:bold;">${creador}</span> has invited you to be an <strong>organiser</strong> for the following tournament:`,
            aviso_titulo: '⚠️ To accept this invitation, you need to complete your registration',
            aviso_texto:  (email) => `Register on our platform using this email (<strong>${email}</strong>) to become a tournament organiser.`,
            btn:          '✅ Complete Registration',
            url_hint:     'If the button does not work, copy and paste this link into your browser:',
            permisos_titulo: '🎯 As organiser, you will be able to:',
            p1: '✅ Manage participants and teams',
            p2: '✅ Configure pairings',
            p3: '✅ Record results',
            p4: '✅ Update tournament information',
            p5: '✅ Manage registrations',
            txt_header:   'Tournament organiser invitation',
            txt_importante:'⚠️ IMPORTANT: To accept this invitation, you need to complete your registration',
        },
        pie: {
            equipo:   'The Gestiona tus Torneos team',
        }
    }
};

export async function enviarInvitacionOrganizadorRegistrado({
    destinatario, nombreDestinatario, creadorNombre, nombreTorneo,
    fechaInicio, fechaFin, ubicacion, tipoTorneo, rondasMax,
    lang = 'es'
}) {
    try {
        const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
        const tx = (TEXTOS[lang] || TEXTOS.es).reg;
        const pie = (TEXTOS[lang] || TEXTOS.es).pie;

        const mailOptions = {
            from:    `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
            to:      destinatario,
            subject: tx.asunto(nombreTorneo),
            html: `
            <!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8">
            <style>
              body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;}
              .container{background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
              .header{background:linear-gradient(135deg,#4caf50,#388e3c);color:white;padding:30px;text-align:center;}
              .header h2{margin:0;font-size:24px;}
              .content{padding:30px;}
              .content p{margin:15px 0;color:#555;}
              .torneo-info{background:#f8f9fa;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #4caf50;}
              .torneo-info h3{margin-top:0;color:#4caf50;font-size:20px;}
              .torneo-info ul{list-style:none;padding:0;margin:0;}
              .torneo-info li{padding:8px 0;border-bottom:1px solid #eee;color:#555;}
              .torneo-info li:last-child{border-bottom:none;}
              .torneo-info strong{color:#333;}
              .permisos-box{background:#e8f5e9;border:2px solid #4caf50;border-radius:8px;padding:20px;margin:25px 0;}
              .permisos-box h4{margin-top:0;color:#2e7d32;font-size:18px;}
              .permisos-box ul{margin:10px 0;padding-left:20px;}
              .permisos-box li{padding:5px 0;color:#2e7d32;}
              .button-container{text-align:center;margin:30px 0;}
              .url-box{background:#f8f9fa;border:2px solid #4caf50;padding:15px;border-radius:8px;margin:20px 0;word-break:break-all;text-align:center;}
              .url-box a{color:#4caf50;font-weight:600;text-decoration:none;font-size:14px;}
              .footer{text-align:center;padding:25px 30px;background:#f8f9fa;color:#999;font-size:13px;border-top:1px solid #eee;}
              .footer p{margin:8px 0;}
            </style></head><body>
            <div class="container">
              <div class="header"><h2>${tx.header}</h2></div>
              <div class="content">
                <p>${tx.saludo(nombreDestinatario)}</p>
                <p>${tx.intro(creadorNombre)}</p>
                <div class="torneo-info">
                  <h3>📋 ${nombreTorneo}</h3>
                  <ul>
                    <li><strong>${tx.fecha_label}</strong> ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}</li>
                    <li><strong>${tx.ubic_label}</strong> ${ubicacion || tx.por_confirmar}</li>
                    <li><strong>${tx.tipo_label}</strong> ${tipoTorneo}</li>
                    <li><strong>${tx.rondas_label}</strong> ${rondasMax}</li>
                  </ul>
                </div>
                <div class="permisos-box">
                  <h4>${tx.permisos_titulo}</h4>
                  <ul><li>${tx.p1}</li><li>${tx.p2}</li><li>${tx.p3}</li><li>${tx.p4}</li><li>${tx.p5}</li></ul>
                </div>
                <div class="button-container">
                  <a href="${urlBase}/perfil" target="_blank" rel="noopener noreferrer"
                     style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#4caf50,#388e3c);color:#ffffff!important;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(76,175,80,0.4);">
                    ${tx.btn}
                  </a>
                </div>
                <div class="url-box">
                  <p style="margin-bottom:10px;color:#666;font-size:14px;">${tx.url_hint}</p>
                  <a href="${urlBase}/perfil" target="_blank" rel="noopener noreferrer">${urlBase}/perfil</a>
                </div>
                <p style="margin-top:20px;">${tx.cuerpo}</p>
                <p>${tx.contacto(creadorNombre)}</p>
                <p><strong>${tx.despedida}</strong></p>
              </div>
              <div class="footer">
                <p><strong>${pie.equipo}</strong></p>
                <p style="margin-top:10px;"><a href="${urlBase}" target="_blank" rel="noopener noreferrer" style="color:#4caf50;text-decoration:none;">www.gestionatustorneos.es</a></p>
              </div>
            </div></body></html>`,
            text: `
${tx.txt_header}

${tx.txt_intro(creadorNombre, nombreTorneo)}

${tx.fecha_label} ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}
${tx.ubic_label} ${ubicacion || tx.por_confirmar}
${tx.tipo_label} ${tipoTorneo}
${tx.rondas_label} ${rondasMax}

${tx.permisos_titulo}
${tx.p1} / ${tx.p2} / ${tx.p3} / ${tx.p4} / ${tx.p5}

${urlBase}/perfil

${pie.equipo}
Web: ${urlBase}
            `.trim()
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado a organizador registrado: ${destinatario}`);
        return { success: true, messageId: result.messageId || result.response?.messageId, destinatario };

    } catch (error) {
        console.error(`❌ Error enviando email a ${destinatario}:`, error.message);
        throw error;
    }
}

export async function enviarInvitacionOrganizadorNoRegistrado({
    destinatario, nombreTorneo, creadorNombre,
    fechaInicio, fechaFin, ubicacion, tipoTorneo, rondasMax,
    lang = 'es'
}) {
    try {
        const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
        const urlRegistro = `${urlBase}/registrarse?email=${encodeURIComponent(destinatario)}`;
        const tx = (TEXTOS[lang] || TEXTOS.es).no_reg;
        const pie = (TEXTOS[lang] || TEXTOS.es).pie;
        const reg = (TEXTOS[lang] || TEXTOS.es).reg;

        const mailOptions = {
            from:    `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
            to:      destinatario,
            subject: tx.asunto(nombreTorneo),
            html: `
            <!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8">
            <style>
              body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f4f4f4;}
              .container{background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
              .header{background:linear-gradient(135deg,#2196f3,#1976d2);color:white;padding:30px;text-align:center;}
              .header h2{margin:0;font-size:24px;}
              .content{padding:30px;}
              .content p{margin:15px 0;color:#555;}
              .torneo-info{background:#f8f9fa;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #2196f3;}
              .torneo-info h3{margin-top:0;color:#2196f3;font-size:20px;}
              .torneo-info ul{list-style:none;padding:0;margin:0;}
              .torneo-info li{padding:8px 0;border-bottom:1px solid #eee;color:#555;}
              .torneo-info li:last-child{border-bottom:none;}
              .warning-box{background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:20px;margin:25px 0;}
              .warning-box strong{color:#856404;font-size:16px;}
              .warning-box p{margin:10px 0 0 0;color:#856404;}
              .permisos-box{background:#e3f2fd;border:2px solid #2196f3;border-radius:8px;padding:20px;margin:25px 0;}
              .permisos-box h4{margin-top:0;color:#1565c0;font-size:18px;}
              .permisos-box ul{margin:10px 0;padding-left:20px;}
              .permisos-box li{padding:5px 0;color:#1565c0;}
              .button-container{text-align:center;margin:30px 0;}
              .url-box{background:#f8f9fa;border:2px solid #2196f3;padding:15px;border-radius:8px;margin:20px 0;word-break:break-all;text-align:center;}
              .url-box a{color:#2196f3;font-weight:600;text-decoration:none;font-size:14px;}
              .footer{text-align:center;padding:25px 30px;background:#f8f9fa;color:#999;font-size:13px;border-top:1px solid #eee;}
              .footer p{margin:8px 0;}
            </style></head><body>
            <div class="container">
              <div class="header"><h2>${tx.header}</h2></div>
              <div class="content">
                <p>${tx.saludo}</p>
                <p>${tx.intro(creadorNombre)}</p>
                <div class="torneo-info">
                  <h3>📋 ${nombreTorneo}</h3>
                  <ul>
                    <li><strong>${reg.fecha_label}</strong> ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}</li>
                    <li><strong>${reg.ubic_label}</strong> ${ubicacion || reg.por_confirmar}</li>
                    <li><strong>${reg.tipo_label}</strong> ${tipoTorneo}</li>
                    <li><strong>${reg.rondas_label}</strong> ${rondasMax}</li>
                  </ul>
                </div>
                <div class="warning-box">
                  <strong>${tx.aviso_titulo}</strong>
                  <p>${tx.aviso_texto(destinatario)}</p>
                </div>
                <div class="button-container">
                  <a href="${urlRegistro}" target="_blank" rel="noopener noreferrer"
                     style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#4caf50,#388e3c);color:#ffffff!important;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(76,175,80,0.4);">
                    ${tx.btn}
                  </a>
                </div>
                <div class="url-box">
                  <p style="margin-bottom:10px;color:#666;font-size:14px;">${tx.url_hint}</p>
                  <a href="${urlRegistro}" target="_blank" rel="noopener noreferrer">${urlRegistro}</a>
                </div>
                <div class="permisos-box">
                  <h4>${tx.permisos_titulo}</h4>
                  <ul><li>${tx.p1}</li><li>${tx.p2}</li><li>${tx.p3}</li><li>${tx.p4}</li><li>${tx.p5}</li></ul>
                </div>
              </div>
              <div class="footer">
                <p><strong>${pie.equipo}</strong></p>
                <p style="margin-top:10px;"><a href="${urlBase}" target="_blank" rel="noopener noreferrer" style="color:#2196f3;text-decoration:none;">www.gestionatustorneos.es</a></p>
              </div>
            </div></body></html>`,
            text: `
${tx.txt_header}

${tx.intro(creadorNombre).replace(/<[^>]+>/g, '')}

${nombreTorneo}
${reg.fecha_label} ${fechaInicio}${fechaFin ? ` - ${fechaFin}` : ''}
${reg.ubic_label} ${ubicacion || reg.por_confirmar}
${reg.tipo_label} ${tipoTorneo}
${reg.rondas_label} ${rondasMax}

${tx.txt_importante}
${urlRegistro}

${pie.equipo}
Web: ${urlBase}
            `.trim()
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email de invitación enviado a: ${destinatario}`);
        return { success: true, messageId: result.messageId || result.response?.messageId, destinatario };

    } catch (error) {
        console.error(`❌ Error enviando email a ${destinatario}:`, error.message);
        throw error;
    }
}