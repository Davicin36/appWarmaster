import * as brevo from '@getbrevo/brevo'
import nodemailer from 'nodemailer'

// 🔍 DEBUG PARA RENDER
console.log('═══════════════════════════════════════');
console.log(' EMAIL CONFIGURATION DEBUG');
console.log('═══════════════════════════════════════');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS existe:', !!process.env.EMAIL_PASS);
console.log('BREVO_API_KEY existe:', !!process.env.BREVO_API_KEY);
console.log('BREVO_API_KEY (primeros 10):', process.env.BREVO_API_KEY?.substring(0, 10));
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('═══════════════════════════════════════');

const isProduction = process.env.NODE_ENV === 'production';

let transporter;

if (isProduction) {
  // ============ CONFIGURACIÓN BREVO (PRODUCCIÓN) ============
  console.log('📧 Configurando BREVO para emails (producción)');

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ ERROR CRÍTICO: BREVO_API_KEY no está definida en producción');
    throw new Error('BREVO_API_KEY no configurada');
  }

  const apiInstance = new brevo.TransactionalEmailsApi()
  
  try {
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    )
    console.log('✅ Brevo API Key configurada correctamente');
  } catch (error) {
    console.error('❌ Error al configurar Brevo API Key:', error);
    throw error;
  }

  async function sendEmail(opcionesEmail) { 
    try {
      console.log('📤 Preparando email con Brevo:', {
        to: opcionesEmail.to,
        subject: opcionesEmail.subject,
        from: opcionesEmail.from
      });

      const sendSmtpEmail = new brevo.SendSmtpEmail()

      let senderEmail = process.env.EMAIL_FROM || 'noreply@gestionatustorneos.es';
      let senderName = 'Gestiona Tus Torneos'; 

      // Si viene from en las opciones
      if (opcionesEmail.from) {
        const emailMatch = opcionesEmail.from.match(/<(.+)>/);
        const nameMatch = opcionesEmail.from.match(/"?([^"<]+)"?\s*<?/);
        
        if (emailMatch) {
          senderEmail = emailMatch[1];
        }
        if (nameMatch && nameMatch[1].trim() !== senderEmail) {
          senderName = nameMatch[1].trim();
        }
        
        if (!emailMatch && opcionesEmail.from.indexOf('@') === -1) {
          senderName = opcionesEmail.from;
          senderEmail = process.env.EMAIL_FROM || 'noreply@gestionatustorneos.es';
        }
      }

      console.log('📧 Sender configurado:', { email: senderEmail, name: senderName });

      sendSmtpEmail.sender = {
        email: senderEmail,
        name: senderName
      }

      sendSmtpEmail.to = [{email: opcionesEmail.to}]
      sendSmtpEmail.subject = opcionesEmail.subject
      sendSmtpEmail.htmlContent = opcionesEmail.html

      if (opcionesEmail.text) {
        sendSmtpEmail.textContent = opcionesEmail.text;
      }
      
      if (opcionesEmail.replyTo) {
        sendSmtpEmail.replyTo = {
          email: opcionesEmail.replyTo
        };
      }

      console.log('🚀 Enviando email con Brevo...');
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log('✅ Email enviado exitosamente con Brevo:', result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        response: result
      }
    } catch (error) {
      console.error('❌ Error detallado al enviar email con Brevo:', {
        to: opcionesEmail.to,
        subject: opcionesEmail.subject,
        errorMessage: error.message,
        errorBody: error.body,
        errorResponse: error.response?.body,
        errorStatus: error.status,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  }

  transporter = { sendMail: sendEmail }
  console.log('✅ Transporter Brevo configurado');
  
} else {
  // ============ CONFIGURACIÓN GMAIL (DESARROLLO) ============
  console.log('📧 Configurando Gmail para emails (desarrollo)');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: EMAIL_USER o EMAIL_PASS no configurados');
    throw new Error('Credenciales de Gmail no configuradas');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verificar conexión Gmail
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Error de conexión Gmail:', error);
    } else {
      console.log('✅ Gmail configurado correctamente');
    }
  });
}

export { transporter };