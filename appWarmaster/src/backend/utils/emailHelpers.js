import * as brevo from '@getbrevo/brevo'
import nodemailer from 'nodemailer'

// 🔍 DEBUG PARA RENDER
console.log('═══════════════════════════════════════');
console.log(' EMAIL CONFIGURATION DEBUG');
console.log('═══════════════════════════════════════');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_USER:', process.env.EMAIL_USER); // ← Ver valor completo
console.log('EMAIL_PASS existe:', !!process.env.EMAIL_PASS); // ← Ver si existe
console.log('EMAIL_PASS (primeros 4):', process.env.EMAIL_PASS?.substring(0, 4)); // ← Ver primeros caracteres
console.log('BREVO_API_KEY existe:', !!process.env.BREVO_API_KEY);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

const isProduction = process.env.NODE_ENV === 'production';

let transporter;

if (isProduction) {
  // ============ CONFIGURACIÓN BREVO (PRODUCCIÓN) ============
  console.log('📧 Usando BREVO para emails (producción)');

  const apiInstance = new brevo.TransactionalEmailsApi()
  apiInstance.setApiKey (
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY || ''
  )

  async function  sendEmail (opcionesEmail) { 
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail()

       let senderEmail = process.env.EMAIL_FROM; // Default
      let senderName = 'Gestiona Tus Torneos'; 

      // Si viene from en las opciones
    if (opcionesEmail.from) {
      // Intenta extraer email y nombre del formato "Nombre <email@ejemplo.com>"
      const emailMatch = opcionesEmail.from.match(/<(.+)>/);
      const nameMatch = opcionesEmail.from.match(/"?([^"<]+)"?\s*<?/);
      
      if (emailMatch) {
        senderEmail = emailMatch[1];
      }
      if (nameMatch && nameMatch[1].trim() !== senderEmail) {
        senderName = nameMatch[1].trim();
      }
      
      // Si solo viene el nombre (sin email), usar EMAIL_FROM
      if (!emailMatch && opcionesEmail.from.indexOf('@') === -1) {
        senderName = opcionesEmail.from;
        senderEmail = process.env.EMAIL_FROM;
      }
    }

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

      console.log('📤 Enviando email con Brevo:', {
      from: sendSmtpEmail.sender,
      to: sendSmtpEmail.to,
      subject: sendSmtpEmail.subject
    });

      const result = await apiInstance.sendTransacEmail(sendSmtpEmail)

      console.log('Email enviado correctamente:', {
        messageId: result.messageId,
        to: opcionesEmail.to
      })

      return {
        success: true,
        messageId: result.messageId,
        response: result
      }
    } catch (error) {
      console.error('Error al enviar el email:', {
        to: opcionesEmail.to,
        error: error.message,
        body: error.body
      })
      throw error
    }
  }

   transporter = { sendMail: sendEmail }
  
} else {
  // ============ CONFIGURACIÓN GMAIL (DESARROLLO) ============
  console.log('📧 Usando Gmail para emails (desarrollo)');

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