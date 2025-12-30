import * as brevo from '@getbrevo/brevo'

// 🔍 DEBUG PARA RENDER
console.log(' EMAIL API LOADED - NODE_ENV =', process.env.NODE_ENV);

console.log('═══════════════════════════════════════');
console.log(' EMAIL CONFIGURATION DEBUG');
console.log('═══════════════════════════════════════');
console.log('BREVO_API_KEY existe:', !!process.env.BREVO_API_KEY);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('NODE_ENV:', process.env.NODE_ENV);

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey (
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ''
)

async function  sendEmail (opcionesEmail) {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail()

    sendSmtpEmail.sender = {
      email: opcionesEmail.from?.match(/<(.+)>/)?.[1] || opcionesEmail.from || process.env.EMAIL_FROM,
      name: opcionesEmail.from?.match(/"(.+)"/)?.[1] || 'Gestiona Tus Torneos'
    };

    sendSmtpEmail.to = [
      {
        email: opcionesEmail.to
      }
    ]

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

if (process.env.BREVO_API_KEY) { 
  console.log('BRevo API configurada correctamente.')
} else {
  console.log('BREVO_API_KEY no encontrada')
}

const transporter = {
  sendMail: sendEmail
}

export { sendEmail, transporter};