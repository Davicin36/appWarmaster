import { transporter } from "./emailHelpers.js";

const emailRecuperar = {
    // Enviar email de recuperación de contraseña
    enviarRecuperacionPassword: async ({ email, nombre, resetUrl }) => {
        try {
            const mailOptions = {
                from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
                replyTo: process.env.BREVO_USER || process.env.EMAIL_USER,
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
                            }
                            .container {
                                background-color: #f9f9f9;
                                border-radius: 10px;
                                padding: 30px;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                            }
                            .header h1 {
                                color: #667eea;
                                margin: 0;
                            }
                            .content {
                                background-color: white;
                                padding: 25px;
                                border-radius: 8px;
                                margin-bottom: 20px;
                            }
                            .button {
                                display: inline-block;
                                padding: 14px 30px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                text-decoration: none;
                                border-radius: 8px;
                                font-weight: bold;
                                text-align: center;
                                margin: 20px 0;
                            }
                            .button:hover {
                                opacity: 0.9;
                            }
                            .warning {
                                background-color: #fff3cd;
                                border-left: 4px solid #ffc107;
                                padding: 12px;
                                margin: 20px 0;
                                border-radius: 4px;
                            }
                            .footer {
                                text-align: center;
                                font-size: 12px;
                                color: #666;
                                margin-top: 20px;
                            }
                            .link {
                                word-break: break-all;
                                color: #667eea;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔐 Equipo de Gestiona tus Torneos</h1>
                            </div>
                            
                            <div class="content">
                                <h2>Hola ${nombre},</h2>
                                
                                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
                                
                                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                                
                                <div style="text-align: center;">
                                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                                </div>
                                
                                <p>O copia y pega este enlace en tu navegador:</p>
                                <p class="link">${resetUrl}</p>
                                
                                <div class="warning">
                                    <strong>⚠️ Importante:</strong>
                                    <ul style="margin: 10px 0;">
                                        <li>Este enlace expirará en <strong>1 hora</strong></li>
                                        <li>Solo puedes usar este enlace una vez</li>
                                        <li>Si no solicitaste este cambio, ignora este email</li>
                                    </ul>
                                </div>
                                
                                <p>Si tienes problemas con el botón, copia y pega el enlace directamente en tu navegador.</p>
                            </div>
                            
                            <div class="footer">
                                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                                <p>© ${new Date().getFullYear()} Equipo de Gestiona tus Torneos. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('❌ Error al enviar email:', error);
            throw error;
        }
    },

    // Enviar email de confirmación (después de cambiar la contraseña)
    enviarConfirmacionCambioPassword: async ({ email, nombre }) => {
        try {
            const mailOptions = {
                from: `"Gestiona Tus Torneos" <${process.env.EMAIL_FROM}>`,
                replyTo: process.env.BREVO_USER || process.env.EMAIL_USER,
                to: email,
                subject: 'Contraseña actualizada - Gestiona tus Torneos',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                max-width: 600px;
                                margin: 0 auto;
                                padding: 20px;
                            }
                            .container {
                                background-color: #f9f9f9;
                                border-radius: 10px;
                                padding: 30px;
                            }
                            .success {
                                background-color: #d4edda;
                                border-left: 4px solid #28a745;
                                padding: 15px;
                                margin: 20px 0;
                                border-radius: 4px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Hola ${nombre},</h2>
                            
                            <div class="success">
                                <strong>✓ Contraseña actualizada exitosamente</strong>
                            </div>
                            
                            <p>Tu contraseña ha sido cambiada correctamente.</p>
                            
                            <p>Si no realizaste este cambio, por favor contacta con nosotros inmediatamente.</p>
                            
                            <p>Saludos,<br>El equipo de Gestiona tus Torneos</p>
                        </div>
                    </body>
                    </html>
                `
            };

            await transporter.sendMail(mailOptions);

        } catch (error) {
            console.error('❌ Error al enviar confirmación:', error);
            // No lanzamos error aquí porque el cambio de contraseña ya se hizo
        }
    }
};

export default emailRecuperar;