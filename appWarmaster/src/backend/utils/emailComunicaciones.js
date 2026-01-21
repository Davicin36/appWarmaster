import { transporter } from "./emailHelpers.js";

const emailTorneo = {

    enviarCorreoParticipantes: async ({ 
        email, 
        nombre, 
        nombreTorneo, 
        tipoJuego,
        asunto, 
        mensaje, 
        nombreEquipo = null,
        organizador = null  
    }) => {
        
        try {
            const urlBase = process.env.FRONTEND_URL || 'https://www.gestionatustorneos.es';
            
            // Obtener el color del gradiente según el juego
            const getGradienteJuego = (juego) => {
                switch(juego?.toLowerCase()) {
                    case 'saga':
                        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    case 'warmaster':
                        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                    case 'flames of war':
                    case 'flames':
                        return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
                    default:
                        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
            };

            const gradienteJuego = getGradienteJuego(tipoJuego);
            
            // NUEVO: Sección de organizador para el HTML
            const seccionOrganizador = organizador ? `
                <div class="organizador-info">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #667eea;">
                        📋 Datos del organizador:
                    </p>
                    <p style="margin: 5px 0;">
                        <strong>Nombre:</strong> ${organizador.nombre_completo || organizador.nombre}
                    </p>
                    ${organizador.email ? `
                        <p style="margin: 5px 0;">
                            <strong>Email:</strong> 
                            <a href="mailto:${organizador.email}" style="color: #667eea;">
                                ${organizador.email}
                            </a>
                        </p>
                    ` : ''}
                </div>
            ` : '';
            
            const mailOptions = {
                from: `"Gestiona Tus Torneos - ${tipoJuego}" <${process.env.EMAIL_FROM}>`,
                replyTo: organizador?.email || process.env.EMAIL_USER,  // NUEVO: reply al organizador
                to: email,
                subject: asunto,
                html: `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { 
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                line-height: 1.6; 
                                color: #333; 
                                margin: 0;
                                padding: 0;
                                background-color: #f4f4f4;
                            }
                            .container { 
                                max-width: 600px; 
                                margin: 20px auto; 
                                background-color: white;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                            }
                            .header { 
                                background: ${gradienteJuego};
                                color: white; 
                                padding: 30px 20px; 
                                text-align: center; 
                            }
                            .header h1 {
                                margin: 0;
                                font-size: 28px;
                            }
                            .logo {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 5px;
                            }
                            .juego-badge {
                                display: inline-block;
                                background-color: rgba(255,255,255,0.2);
                                padding: 5px 15px;
                                border-radius: 20px;
                                margin-top: 10px;
                                font-size: 14px;
                            }
                            .content { 
                                padding: 30px; 
                            }
                            .greeting {
                                font-size: 18px;
                                color: #2c3e50;
                                margin-bottom: 20px;
                            }
                            .torneo-info { 
                                background-color: #e8f4fd; 
                                padding: 20px; 
                                border-left: 4px solid #667eea; 
                                margin: 25px 0;
                                border-radius: 4px;
                            }
                            .torneo-info p {
                                margin: 8px 0;
                            }
                            .torneo-info strong {
                                color: #667eea;
                            }
                            .mensaje {
                                background-color: #f8f9fa;
                                padding: 20px;
                                border-radius: 4px;
                                margin: 20px 0;
                                white-space: pre-wrap;
                                line-height: 1.8;
                            }
                            .organizador-info {
                                background-color: #fff3cd;
                                border-left: 4px solid #ffc107;
                                padding: 15px;
                                margin: 20px 0;
                                border-radius: 4px;
                            }
                            .footer { 
                                margin-top: 30px; 
                                padding: 20px; 
                                text-align: center; 
                                font-size: 13px; 
                                color: #6c757d;
                                background-color: #f8f9fa;
                                border-top: 1px solid #dee2e6;
                            }
                            .footer p {
                                margin: 5px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🏆 Gestiona Tus Torneos</div>
                                <div class="juego-badge">${tipoJuego}</div>
                            </div>
                            <div class="content">
                                <p class="greeting">Hola <strong>${nombre}</strong>,</p>
                                
                                <div class="torneo-info">
                                    <p><strong>📜 Torneo:</strong> ${nombreTorneo}</p>
                                    ${nombreEquipo ? `<p><strong>🛡️ Equipo:</strong> ${nombreEquipo}</p>` : ''}
                                    <p><strong>🎮 Juego:</strong> ${tipoJuego}</p>
                                </div>
                                
                                <div class="mensaje">${mensaje.replace(/\n/g, '<br>')}</div>
                                
                                ${seccionOrganizador}
                            </div>
                            <div class="footer">
                                <p><strong>Gestiona Tus Torneos - ${tipoJuego}</strong></p>
                                <p>Este correo ha sido enviado desde la plataforma de gestión de torneos</p>
                                <p>Si tienes alguna duda, contacta con el organizador del torneo</p>
                                <p style="margin-top: 15px; color: #999;">
                                    <a href="${urlBase}" style="color: #667eea; text-decoration: none;">
                                        gestionatustorneos.es
                                    </a>
                                </p>
                                <p style="margin-top: 5px;">© ${new Date().getFullYear()} Gestiona tus Torneos. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `
Hola ${nombre},

═══════════════════════════════════════
TORNEO: ${nombreTorneo}
${nombreEquipo ? `EQUIPO: ${nombreEquipo}` : ''}
JUEGO: ${tipoJuego}
═══════════════════════════════════════

${mensaje}

${organizador ? `
───────────────────────────────
📋 Datos del organizador:
Nombre: ${organizador.nombre_completo || organizador.nombre}
${organizador.email ? `Email: ${organizador.email}` : ''}
${organizador.telefono ? `Teléfono: ${organizador.telefono}` : ''}
` : ''}

═══════════════════════════════════════

Gestiona Tus Torneos - ${tipoJuego}
Este correo ha sido enviado desde la plataforma de gestión de torneos

Web: ${urlBase}

---
© ${new Date().getFullYear()} Gestiona tus Torneos. Todos los derechos reservados.
                `.trim()
            };

            const info = await transporter.sendMail(mailOptions);
            
            return { 
                success: true, 
                messageId: info.messageId || info.response?.messageId,
                email: email
            };

        } catch (error) {
            console.error('❌ [emailTorneo] Error al enviar email a:', email);
            console.error('❌ [emailTorneo] Juego:', tipoJuego);
            console.error('❌ [emailTorneo] Mensaje:', error.message);
            console.error('❌ [emailTorneo] Stack:', error.stack);
            
            return {
                success: false,
                error: error.message,
                email: email
            };
        }
    }
};

export { emailTorneo };