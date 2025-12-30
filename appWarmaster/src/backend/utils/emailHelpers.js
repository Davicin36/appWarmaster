import nodemailer from 'nodemailer';

// 🔍 DEBUG PARA RENDER
console.log('🔥 EMAIL FILE LOADED - NODE_ENV =', process.env.NODE_ENV);

console.log('═══════════════════════════════════════');
console.log('🔍 EMAIL CONFIGURATION DEBUG');
console.log('═══════════════════════════════════════');
console.log('BREVO_USER existe:', !!process.env.BREVO_USER);
console.log('BREVO_SMTP_KEY existe:', !!process.env.BREVO_SMTP_KEY);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('NODE_ENV:', process.env.NODE_ENV);

const isBrevo = process.env.BREVO_USER && process.env.BREVO_SMTP_KEY;

console.log('isBrevo:', !!isBrevo);
console.log('Puerto usado:', isBrevo ? '465 (SSL)' : process.env.EMAIL_PORT);
console.log('Host usado:', isBrevo ? 'smtp-relay.brevo.com' : process.env.EMAIL_HOST);
console.log('═══════════════════════════════════════\n');

const transporter = nodemailer.createTransport({
  host: isBrevo ? 'smtp-relay.brevo.com' : process.env.EMAIL_HOST,
  port: isBrevo ? 465 : parseInt(process.env.EMAIL_PORT || '587'),
  secure: isBrevo ? true : false,
  auth: {
    user: isBrevo ? process.env.BREVO_USER : process.env.EMAIL_USER,
    pass: isBrevo ? process.env.BREVO_SMTP_KEY : process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
  debug: true, 
  logger: true 
});

// 🧪 Verificar conexión al iniciar
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Error de configuración SMTP:', error);
  } else {
    console.log('✅ Servidor SMTP listo para enviar emails');
  }
});

export { transporter };