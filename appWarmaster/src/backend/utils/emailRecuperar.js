import { transporter } from "./emailHelpers.js";

const emailRecuperar = {
    // Enviar email de recuperación de contraseña
    enviarRecuperacionPassword: async ({ email, nombre, resetUrl }) => {
        console.log('📧 [emailRecuperar] Iniciando envío...');
        console.log('📧 [emailRecuperar] Email:', email);
        console.log('📧 [emailRecuperar] Nombre:', nombre);
        console.log('📧 [emailRecuperar] resetUrl:', resetUrl);
        
        try {
            const mailOptions = {
                from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
                replyTo: process.env.EMAIL_USER,
                to: email,
                subject: 'Recuperación de contraseña - Gestiona tus torneos',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #f4f4f4;
                            }
                            .container {
                                background-color: #ffffff;
                                border-radius: 10px;
                                padding: 30px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            }
                                console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                padding-bottom: 20px;
                                border-bottom: 3px solid #667eea;
                            }
                            .header h1 {
                                color: #667eea;
                                margin: 0;
                                font-size: 28px;
                            }
                            .content {
                                padding: 20px 0;
                            }
                            .content h2 {
                                color: #333;
                                font-size: 22px;
                                margin-bottom: 15px;
                            }
                            .content p {
                                margin: 15px 0;
                                font-size: 16px;
                            }
                            .link-box {
                                word-break: break-all;
                                background: #f8f9fa;
                                padding: 20px;
                                border-radius: 8px;
                                border: 2px solid #667eea;
                                margin: 25px 0;
                                text-align: center;
                            }
                            .link-text {
                                color: #667eea;
                                font-size: 14px;
                                font-weight: 600;
                                line-height: 1.8;
                            }
                            .button-container {
                                text-align: center;
                                margin: 30px 0;
                            }
                            .button {
                                display: inline-block;
                                padding: 16px 40px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: #ffffff !important;
                                text-decoration: none;
                                border-radius: 8px;
                                font-weight: bold;
                                font-size: 16px;
                                transition: opacity 0.3s;
                            }
                            .button:hover {
                                opacity: 0.9;
                            }
                            .warning {
                                background-color: #fff3cd;
                                border-left: 5px solid #ffc107;
                                padding: 15px 20px;
                                margin: 25px 0;
                                border-radius: 5px;
                            }
                            .warning strong {
                                color: #856404;
                                font-size: 16px;
                            }
                            .warning ul {
                                margin: 12px 0;
                                padding-left: 20px;
                            }
                            .warning li {
                                margin: 8px 0;
                                color: #856404;
                            }
                            .note {
                                background-color: #e7f3ff;
                                padding: 15px;
                                border-radius: 5px;
                                margin: 20px 0;
                                font-size: 14px;
                                color: #004085;
                            }
                            .footer {
                                text-align: center;
                                font-size: 12px;
                                color: #999;
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #e0e0e0;
                            }
                            .footer p {
                                margin: 8px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔐 Gestiona tus Torneos</h1>
                            </div>
                            
                            <div class="content">
                                <h2>Hola ${nombre},</h2>
                                
                                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Gestiona tus Torneos</strong>.</p>
                                
                                <p style="margin-top: 25px;"><strong>📋 Copia y pega este enlace en tu navegador:</strong></p>
                                
                                <div class="link-box">
                                    <div class="link-text">${resetUrl}</div>
                                </div>
                                
                                <div class="button-container">
                                    <a href="${resetUrl}" 
                                       class="button"
                                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; display: inline-block;"
                                       target="_blank"
                                       rel="noopener noreferrer">
                                        Restablecer Contraseña
                                    </a>
                                </div>
                                
                                <div class="warning">
                                    <strong>⚠️ Importante:</strong>
                                    <ul>
                                        <li>Este enlace <strong>expirará en 1 hora</strong></li>
                                        <li>Solo puedes usar este enlace <strong>una vez</strong></li>
                                        <li>Si no solicitaste este cambio, <strong>ignora este email</strong></li>
                                    </ul>
                                </div>
                                
                                <div class="note">
                                    <strong>💡 Consejo:</strong> Si el botón no funciona correctamente, copia el enlace que aparece en el recuadro azul y pégalo directamente en la barra de direcciones de tu navegador.
                                </div>
                                
                                <p style="margin-top: 25px;">Si tienes algún problema, no dudes en contactarnos.</p>
                                
                                <p style="margin-top: 20px;">
                                    Saludos cordiales,<br>
                                    <strong>El equipo de Gestiona tus Torneos</strong>
                                </p>
                            </div>
                            
                            <div class="footer">
                                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                                <p style="margin-top: 5px;">© ${new Date().getFullYear()} Gestiona tus Torneos. Todos los derechos reservados.</p>
                                <p style="margin-top: 10px; font-size: 11px; color: #bbb;">
                                    Si no solicitaste este cambio, tu cuenta sigue siendo segura y puedes ignorar este email.
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
Hola ${nombre},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Gestiona tus Torneos.

COPIA Y PEGA ESTE ENLACE EN TU NAVEGADOR:
${resetUrl}

⚠️ IMPORTANTE:
- Este enlace expirará en 1 hora
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email

Si tienes algún problema, contacta con nosotros.

Saludos,
El equipo de Gestiona tus Torneos

---
Este es un correo automático, por favor no respondas a este mensaje.
© ${new Date().getFullYear()} Gestiona tus Torneos. Todos los derechos reservados.
                `.trim()
            };

            console.log('📧 [emailRecuperar] Opciones de email preparadas');
            console.log('📧 [emailRecuperar] From:', mailOptions.from);
            console.log('📧 [emailRecuperar] To:', mailOptions.to);
            console.log('📧 [emailRecuperar] Subject:', mailOptions.subject);
            console.log('📧 [emailRecuperar] Enviando...');
            
            const info = await transporter.sendMail(mailOptions);
            
            console.log('✅ [emailRecuperar] Email enviado exitosamente');
            console.log('✅ [emailRecuperar] MessageId:', info.messageId || info.response?.messageId);
            
            return { success: true, messageId: info.messageId || info.response?.messageId };

        } catch (error) {
            console.error('❌ [emailRecuperar] Error al enviar email:');
            console.error('❌ [emailRecuperar] Mensaje:', error.message);
            console.error('❌ [emailRecuperar] Stack:', error.stack);
            console.error('❌ [emailRecuperar] Body:', error.body);
            throw error;
        }
    },

    // Enviar email de confirmación (después de cambiar la contraseña)
    enviarConfirmacionCambioPassword: async ({ email, nombre }) => {
        console.log('📧 [emailRecuperar] Enviando confirmación de cambio de contraseña');
        console.log('📧 [emailRecuperar] Email:', email);
        console.log('📧 [emailRecuperar] Nombre:', nombre);
        
        try {
            const mailOptions = {
                from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
                replyTo: process.env.EMAIL_USER,
                to: email,
                subject: 'Contraseña actualizada - Gestiona tus Torneos',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                                background-color: #f4f4f4;
                            }
                            .container {
                                background-color: #ffffff;
                                border-radius: 10px;
                                padding: 30px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 25px;
                            }
                            .header h1 {
                                color: #28a745;
                                margin: 0;
                                font-size: 26px;
                            }
                            .success {
                                background-color: #d4edda;
                                border-left: 5px solid #28a745;
                                padding: 20px;
                                margin: 25px 0;
                                border-radius: 5px;
                            }
                            .success strong {
                                color: #155724;
                                font-size: 18px;
                            }
                            .content p {
                                margin: 15px 0;
                                font-size: 16px;
                            }
                            .warning-box {
                                background-color: #fff3cd;
                                border: 1px solid #ffc107;
                                padding: 15px;
                                margin: 20px 0;
                                border-radius: 5px;
                            }
                            .warning-box strong {
                                color: #856404;
                            }
                            .footer {
                                text-align: center;
                                font-size: 12px;
                                color: #999;
                                margin-top: 30px;
                                padding-top: 20px;
                                border-top: 1px solid #e0e0e0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>✓ Contraseña Actualizada</h1>
                            </div>
                            
                            <div class="content">
                                <h2>Hola ${nombre},</h2>
                                
                                <div class="success">
                                    <strong>✓ Tu contraseña ha sido actualizada exitosamente</strong>
                                </div>
                                
                                <p>Tu contraseña en <strong>Gestiona tus Torneos</strong> ha sido cambiada correctamente.</p>
                                
                                <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                                
                                <div class="warning-box">
                                    <strong>⚠️ ¿No fuiste tú?</strong>
                                    <p style="margin: 10px 0 0 0;">Si no realizaste este cambio, por favor contacta con nosotros inmediatamente para proteger tu cuenta.</p>
                                </div>
                                
                                <p style="margin-top: 25px;">
                                    Saludos cordiales,<br>
                                    <strong>El equipo de Gestiona tus Torneos</strong>
                                </p>
                            </div>
                            
                            <div class="footer">
                                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                                <p>© ${new Date().getFullYear()} Gestiona tus Torneos. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
Hola ${nombre},

✓ Tu contraseña ha sido actualizada exitosamente

Tu contraseña en Gestiona tus Torneos ha sido cambiada correctamente.
Ya puedes iniciar sesión con tu nueva contraseña.

⚠️ ¿No fuiste tú?
Si no realizaste este cambio, por favor contacta con nosotros inmediatamente para proteger tu cuenta.

Saludos,
El equipo de Gestiona tus Torneos

---
Este es un correo automático, por favor no respondas a este mensaje.
© ${new Date().getFullYear()} Gestiona tus Torneos. Todos los derechos reservados.
                `.trim()
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('✅ [emailRecuperar] Email de confirmación enviado');
            
            return { success: true, messageId: info.messageId || info.response?.messageId };

        } catch (error) {
            console.error('❌ [emailRecuperar] Error al enviar confirmación:', error);
            // No lanzamos error aquí porque el cambio de contraseña ya se hizo
        }
    }
};

export default emailRecuperar;