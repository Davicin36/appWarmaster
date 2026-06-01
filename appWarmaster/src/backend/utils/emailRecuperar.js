import { transporter } from "./emailHelpers.js";

// ==========================================
// TEXTOS POR IDIOMA
// ==========================================
const TEXTOS = {
    es: {
        recuperar: {
            subject:        'Recuperación de contraseña - Gestiona tus Torneos',
            titulo:         '🔐 Gestiona tus Torneos',
            saludo:         (nombre) => `Hola ${nombre},`,
            intro:          'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Gestiona tus Torneos</strong>.',
            btn:            '🔑 Restablecer Contraseña',
            url_hint:       'Si el botón no funciona, copia y pega este enlace en tu navegador:',
            aviso_titulo:   '⚠️ Importante:',
            aviso_1:        'Este enlace <strong>expirará en 1 hora</strong>',
            aviso_2:        'Solo puedes usar este enlace <strong>una vez</strong>',
            aviso_3:        'Si no solicitaste este cambio, <strong>ignora este email</strong>',
            consejo:        '<strong>💡 Consejo:</strong> Si tienes problemas, copia el enlace completo que aparece en el recuadro azul y pégalo directamente en la barra de direcciones de tu navegador.',
            contacto:       'Si tienes algún problema, no dudes en contactarnos.',
            despedida:      'Saludos cordiales,',
            equipo:         'El equipo de Gestiona tus Torneos',
            pie:            'Este es un correo automático, por favor no respondas a este mensaje.',
            copyright:      (year) => `© ${year} Gestiona tus Torneos. Todos los derechos reservados.`,
            ignorar:        'Si no solicitaste este cambio, tu cuenta sigue siendo segura y puedes ignorar este email.',
        },
        confirmacion: {
            subject:        'Contraseña actualizada - Gestiona tus Torneos',
            titulo:         '✅ Contraseña Actualizada',
            saludo:         (nombre) => `Hola ${nombre},`,
            exito:          '✓ Tu contraseña ha sido actualizada exitosamente',
            texto1:         'Tu contraseña en <strong>Gestiona tus Torneos</strong> ha sido cambiada correctamente.',
            texto2:         'Ya puedes iniciar sesión con tu nueva contraseña.',
            btn:            '🔐 Iniciar Sesión',
            no_fuiste:      '⚠️ ¿No fuiste tú?',
            no_fuiste_texto:'Si no realizaste este cambio, por favor contacta con nosotros inmediatamente para proteger tu cuenta.',
            despedida:      'Saludos cordiales,',
            equipo:         'El equipo de Gestiona tus Torneos',
            pie:            'Este es un correo automático, por favor no respondas a este mensaje.',
            copyright:      (year) => `© ${year} Gestiona tus Torneos. Todos los derechos reservados.`,
        }
    },
    en: {
        recuperar: {
            subject:        'Password recovery - Gestiona tus Torneos',
            titulo:         '🔐 Gestiona tus Torneos',
            saludo:         (nombre) => `Hello ${nombre},`,
            intro:          'We received a request to reset the password for your account on <strong>Gestiona tus Torneos</strong>.',
            btn:            '🔑 Reset Password',
            url_hint:       'If the button does not work, copy and paste this link into your browser:',
            aviso_titulo:   '⚠️ Important:',
            aviso_1:        'This link will <strong>expire in 1 hour</strong>',
            aviso_2:        'You can only use this link <strong>once</strong>',
            aviso_3:        'If you did not request this change, <strong>ignore this email</strong>',
            consejo:        '<strong>💡 Tip:</strong> If you have trouble, copy the full link from the blue box and paste it directly into your browser\'s address bar.',
            contacto:       'If you have any problems, please do not hesitate to contact us.',
            despedida:      'Kind regards,',
            equipo:         'The Gestiona tus Torneos team',
            pie:            'This is an automated email, please do not reply to this message.',
            copyright:      (year) => `© ${year} Gestiona tus Torneos. All rights reserved.`,
            ignorar:        'If you did not request this change, your account is still secure and you can ignore this email.',
        },
        confirmacion: {
            subject:        'Password updated - Gestiona tus Torneos',
            titulo:         '✅ Password Updated',
            saludo:         (nombre) => `Hello ${nombre},`,
            exito:          '✓ Your password has been updated successfully',
            texto1:         'Your password on <strong>Gestiona tus Torneos</strong> has been changed successfully.',
            texto2:         'You can now log in with your new password.',
            btn:            '🔐 Log In',
            no_fuiste:      '⚠️ Was this not you?',
            no_fuiste_texto:'If you did not make this change, please contact us immediately to protect your account.',
            despedida:      'Kind regards,',
            equipo:         'The Gestiona tus Torneos team',
            pie:            'This is an automated email, please do not reply to this message.',
            copyright:      (year) => `© ${year} Gestiona tus Torneos. All rights reserved.`,
        }
    }
};

// ==========================================
// EMAIL: RECUPERAR CONTRASEÑA
// ==========================================
const emailRecuperar = {

    enviarRecuperacionPassword: async ({ email, nombre, resetUrl, lang = 'es' }) => {
        try {
            const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
            const tx = TEXTOS[lang]?.recuperar || TEXTOS.es.recuperar;
            const year = new Date().getFullYear();

            const mailOptions = {
                from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
                replyTo: process.env.EMAIL_USER,
                to: email,
                subject: tx.subject,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
                            .container { background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #667eea; }
                            .header h1 { color: #667eea; margin: 0; font-size: 28px; }
                            .content { padding: 20px 0; }
                            .content h2 { color: #333; font-size: 22px; margin-bottom: 15px; }
                            .content p { margin: 15px 0; font-size: 16px; }
                            .button-container { text-align: center; margin: 30px 0; }
                            .url-box { background: #f8f9fa; border: 2px solid #667eea; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; text-align: center; }
                            .url-box a { color: #667eea; font-weight: 600; text-decoration: none; font-size: 14px; }
                            .warning { background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 5px; }
                            .warning strong { color: #856404; font-size: 16px; }
                            .warning ul { margin: 12px 0; padding-left: 20px; }
                            .warning li { margin: 8px 0; color: #856404; }
                            .note { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; color: #004085; }
                            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
                            .footer p { margin: 8px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>${tx.titulo}</h1>
                            </div>
                            <div class="content">
                                <h2>${tx.saludo(nombre)}</h2>
                                <p>${tx.intro}</p>
                                <div class="button-container">
                                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer"
                                       style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff!important;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                                        ${tx.btn}
                                    </a>
                                </div>
                                <div class="url-box">
                                    <p style="margin-bottom:10px;color:#666;font-size:14px;">${tx.url_hint}</p>
                                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
                                </div>
                                <div class="warning">
                                    <strong>${tx.aviso_titulo}</strong>
                                    <ul>
                                        <li>${tx.aviso_1}</li>
                                        <li>${tx.aviso_2}</li>
                                        <li>${tx.aviso_3}</li>
                                    </ul>
                                </div>
                                <div class="note">${tx.consejo}</div>
                                <p style="margin-top:25px;">${tx.contacto}</p>
                                <p style="margin-top:20px;">${tx.despedida}<br><strong>${tx.equipo}</strong></p>
                            </div>
                            <div class="footer">
                                <p>${tx.pie}</p>
                                <p style="margin-top:10px;">
                                    <a href="${urlBase}" target="_blank" rel="noopener noreferrer" style="color:#667eea;text-decoration:none;">www.gestionatustorneos.es</a>
                                </p>
                                <p style="margin-top:5px;">${tx.copyright(year)}</p>
                                <p style="margin-top:10px;font-size:11px;color:#bbb;">${tx.ignorar}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
${tx.saludo(nombre)}

${tx.intro.replace(/<[^>]+>/g, '')}

${tx.btn}: ${resetUrl}

${tx.aviso_titulo}
- ${tx.aviso_1.replace(/<[^>]+>/g, '')}
- ${tx.aviso_2.replace(/<[^>]+>/g, '')}
- ${tx.aviso_3.replace(/<[^>]+>/g, '')}

${tx.contacto}

${tx.despedida}
${tx.equipo}

Web: ${urlBase}

---
${tx.pie}
${tx.copyright(year)}
                `.trim()
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId || info.response?.messageId };

        } catch (error) {
            console.error('❌ [emailRecuperar] Error:', error.message);
            throw error;
        }
    },

    // ==========================================
    // EMAIL: CONFIRMACIÓN CAMBIO CONTRASEÑA
    // ==========================================
    enviarConfirmacionCambioPassword: async ({ email, nombre, lang = 'es' }) => {
        try {
            const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
            const tx = TEXTOS[lang]?.confirmacion || TEXTOS.es.confirmacion;
            const year = new Date().getFullYear();

            const mailOptions = {
                from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
                replyTo: process.env.EMAIL_USER,
                to: email,
                subject: tx.subject,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
                            .container { background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                            .header { text-align: center; margin-bottom: 25px; }
                            .header h1 { color: #28a745; margin: 0; font-size: 26px; }
                            .success { background-color: #d4edda; border-left: 5px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 5px; }
                            .success strong { color: #155724; font-size: 18px; }
                            .content p { margin: 15px 0; font-size: 16px; }
                            .button-container { text-align: center; margin: 25px 0; }
                            .warning-box { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
                            .warning-box strong { color: #856404; }
                            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
                            .footer p { margin: 8px 0; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>${tx.titulo}</h1>
                            </div>
                            <div class="content">
                                <h2>${tx.saludo(nombre)}</h2>
                                <div class="success"><strong>${tx.exito}</strong></div>
                                <p>${tx.texto1}</p>
                                <p>${tx.texto2}</p>
                                <div class="button-container">
                                    <a href="${urlBase}/login" target="_blank" rel="noopener noreferrer"
                                       style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#28a745 0%,#20903a 100%);color:#ffffff!important;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(40,167,69,0.4);">
                                        ${tx.btn}
                                    </a>
                                </div>
                                <div class="warning-box">
                                    <strong>${tx.no_fuiste}</strong>
                                    <p style="margin:10px 0 0 0;">${tx.no_fuiste_texto}</p>
                                </div>
                                <p style="margin-top:25px;">${tx.despedida}<br><strong>${tx.equipo}</strong></p>
                            </div>
                            <div class="footer">
                                <p>${tx.pie}</p>
                                <p style="margin-top:10px;">
                                    <a href="${urlBase}" target="_blank" rel="noopener noreferrer" style="color:#667eea;text-decoration:none;">www.gestionatustorneos.es</a>
                                </p>
                                <p style="margin-top:5px;">${tx.copyright(year)}</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
${tx.saludo(nombre)}

${tx.exito}

${tx.texto1.replace(/<[^>]+>/g, '')}
${tx.texto2}

${tx.btn}: ${urlBase}/login

${tx.no_fuiste}
${tx.no_fuiste_texto}

${tx.despedida}
${tx.equipo}

Web: ${urlBase}

---
${tx.pie}
${tx.copyright(year)}
                `.trim()
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ [emailRecuperar] Email de confirmación enviado');
            return { success: true, messageId: info.messageId || info.response?.messageId };

        } catch (error) {
            console.error('❌ [emailRecuperar] Error al enviar confirmación:', error);
        }
    }
};

export default emailRecuperar;