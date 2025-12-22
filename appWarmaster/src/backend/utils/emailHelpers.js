import nodemailer from 'nodemailer';

// 🔍 DEBUG PARA RENDER
console.log('═══════════════════════════════════════');
console.log('🔍 EMAIL CONFIGURATION DEBUG');
console.log('═══════════════════════════════════════');
console.log('BREVO_USER existe:', !!process.env.BREVO_USER);
console.log('BREVO_SMTP_KEY existe:', !!process.env.BREVO_SMTP_KEY);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('NODE_ENV:', process.env.NODE_ENV);

const isBrevo = process.env.BREVO_USER && process.env.BREVO_SMTP_KEY;

console.log('isBrevo:', isBrevo);
console.log('Host usado:', isBrevo ? 'smtp-relay.brevo.com' : process.env.EMAIL_HOST);
console.log('═══════════════════════════════════════\n');

const transporter = nodemailer.createTransport({
  host: isBrevo ? 'smtp-relay.brevo.com' : process.env.EMAIL_HOST,
  port: isBrevo ? 587 : parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  auth: {
    user: isBrevo ? process.env.BREVO_USER : process.env.EMAIL_USER,
    pass: isBrevo ? process.env.BREVO_SMTP_KEY : process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error.message);
    console.error('Error completo:', error);
  } else {
    const service = isBrevo ? '🟢 Brevo (Producción)' : '🔵 Gmail (Local)';
    console.log(`✅ Servidor de email listo - ${service}`);
  }
});

export { transporter };