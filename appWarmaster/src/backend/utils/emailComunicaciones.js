import { transporter } from "./emailHelpers.js";

const TEXTOS = {
    es: {
        saludo:         (nombre) => `Hola <strong>${nombre}</strong>,`,
        torneo_label:   '📜 Torneo:',
        equipo_label:   '🛡️ Equipo:',
        juego_label:    '🎮 Juego:',
        organizador_titulo: '📋 Datos del organizador:',
        org_nombre:     'Nombre:',
        org_email:      'Email:',
        pie_1:          'Este correo ha sido enviado desde la plataforma de gestión de torneos',
        pie_2:          'Si tienes alguna duda, contacta con el organizador del torneo',
        copyright:      (year) => `© ${year} Gestiona tus Torneos. Todos los derechos reservados.`,
        txt_saludo:     (nombre) => `Hola ${nombre},`,
        txt_organizador:'📋 Datos del organizador:',
        txt_nombre:     'Nombre:',
        txt_email:      'Email:',
        txt_telefono:   'Teléfono:',
    },
    en: {
        saludo:         (nombre) => `Hello <strong>${nombre}</strong>,`,
        torneo_label:   '📜 Tournament:',
        equipo_label:   '🛡️ Team:',
        juego_label:    '🎮 Game:',
        organizador_titulo: '📋 Organiser details:',
        org_nombre:     'Name:',
        org_email:      'Email:',
        pie_1:          'This email was sent from the tournament management platform',
        pie_2:          'If you have any questions, please contact the tournament organiser',
        copyright:      (year) => `© ${year} Gestiona tus Torneos. All rights reserved.`,
        txt_saludo:     (nombre) => `Hello ${nombre},`,
        txt_organizador:'📋 Organiser details:',
        txt_nombre:     'Name:',
        txt_email:      'Email:',
        txt_telefono:   'Phone:',
    }
};

const emailTorneo = {

    enviarCorreoParticipantes: async ({
        email,
        nombre,
        nombreTorneo,
        tipoJuego,
        asunto,
        mensaje,
        nombreEquipo = null,
        organizador  = null,
        lang         = 'es'
    }) => {

        try {
            const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
            const tx = TEXTOS[lang] || TEXTOS.es;
            const year = new Date().getFullYear();

            const getGradienteJuego = (juego) => {
                switch (juego?.toLowerCase()) {
                    case 'saga':        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    case 'warmaster':   return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                    case 'flames of war':
                    case 'flames':      return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
                    default:            return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
            };

            const gradienteJuego = getGradienteJuego(tipoJuego);

            const seccionOrganizador = organizador ? `
                <div class="organizador-info">
                    <p style="margin:0 0 10px 0;font-weight:bold;color:#667eea;">${tx.organizador_titulo}</p>
                    <p style="margin:5px 0;"><strong>${tx.org_nombre}</strong> ${organizador.nombre_completo || organizador.nombre}</p>
                    ${organizador.email ? `
                        <p style="margin:5px 0;"><strong>${tx.org_email}</strong>
                            <a href="mailto:${organizador.email}" style="color:#667eea;">${organizador.email}</a>
                        </p>` : ''}
                </div>` : '';

            const mailOptions = {
                from:    `"Gestiona Tus Torneos - ${tipoJuego}" <${process.env.EMAIL_FROM}>`,
                replyTo: organizador?.email || process.env.EMAIL_USER,
                to:      email,
                subject: asunto,
                html: `
                    <!DOCTYPE html>
                    <html lang="${lang}">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background-color:#f4f4f4;}
                            .container{max-width:600px;margin:20px auto;background-color:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
                            .header{background:${gradienteJuego};color:white;padding:30px 20px;text-align:center;}
                            .header h1{margin:0;font-size:28px;}
                            .logo{font-size:24px;font-weight:bold;margin-bottom:5px;}
                            .juego-badge{display:inline-block;background-color:rgba(255,255,255,0.2);padding:5px 15px;border-radius:20px;margin-top:10px;font-size:14px;}
                            .content{padding:30px;}
                            .greeting{font-size:18px;color:#2c3e50;margin-bottom:20px;}
                            .torneo-info{background-color:#e8f4fd;padding:20px;border-left:4px solid #667eea;margin:25px 0;border-radius:4px;}
                            .torneo-info p{margin:8px 0;}
                            .torneo-info strong{color:#667eea;}
                            .mensaje{background-color:#f8f9fa;padding:20px;border-radius:4px;margin:20px 0;white-space:pre-wrap;line-height:1.8;}
                            .organizador-info{background-color:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px;}
                            .footer{margin-top:30px;padding:20px;text-align:center;font-size:13px;color:#6c757d;background-color:#f8f9fa;border-top:1px solid #dee2e6;}
                            .footer p{margin:5px 0;}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🏆 Gestiona Tus Torneos</div>
                                <div class="juego-badge">${tipoJuego}</div>
                            </div>
                            <div class="content">
                                <p class="greeting">${tx.saludo(nombre)}</p>
                                <div class="torneo-info">
                                    <p><strong>${tx.torneo_label}</strong> ${nombreTorneo}</p>
                                    ${nombreEquipo ? `<p><strong>${tx.equipo_label}</strong> ${nombreEquipo}</p>` : ''}
                                    <p><strong>${tx.juego_label}</strong> ${tipoJuego}</p>
                                </div>
                                <div class="mensaje">${mensaje.replace(/\n/g, '<br>')}</div>
                                ${seccionOrganizador}
                            </div>
                            <div class="footer">
                                <p><strong>Gestiona Tus Torneos - ${tipoJuego}</strong></p>
                                <p>${tx.pie_1}</p>
                                <p>${tx.pie_2}</p>
                                <p style="margin-top:15px;color:#999;">
                                    <a href="${urlBase}" style="color:#667eea;text-decoration:none;">gestionatustorneos.es</a>
                                </p>
                                <p style="margin-top:5px;">${tx.copyright(year)}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
${tx.txt_saludo(nombre)}

${'═'.repeat(39)}
${tx.torneo_label} ${nombreTorneo}
${nombreEquipo ? `${tx.equipo_label} ${nombreEquipo}` : ''}
${tx.juego_label} ${tipoJuego}
${'═'.repeat(39)}

${mensaje}

${organizador ? `
${'─'.repeat(32)}
${tx.txt_organizador}
${tx.txt_nombre} ${organizador.nombre_completo || organizador.nombre}
${organizador.email    ? `${tx.txt_email} ${organizador.email}`    : ''}
${organizador.telefono ? `${tx.txt_telefono} ${organizador.telefono}` : ''}
` : ''}

${'═'.repeat(39)}

Gestiona Tus Torneos - ${tipoJuego}
${tx.pie_1}

Web: ${urlBase}

---
${tx.copyright(new Date().getFullYear())}
                `.trim()
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId || info.response?.messageId, email };

        } catch (error) {
            console.error('❌ [emailTorneo] Error al enviar email a:', email, error.message);
            return { success: false, error: error.message, email };
        }
    }
};

export { emailTorneo };