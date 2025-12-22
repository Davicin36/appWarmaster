import nodemailer from 'nodemailer';

console.log('🔍 EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('🔍 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔍 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Existe' : '❌ No existe');
console.log('🔍 BREVO_USER:', process.env.BREVO_USER ? '✅ Existe' : '❌ No existe');
console.log('🔍 isBrevo:', process.env.BREVO_USER && process.env.BREVO_SMTP_KEY);

const isBrevo = process.env.BREVO_USER && process.env.BREVO_SMTP_KEY;

const transporter = nodemailer.createTransport({
  host: isBrevo ? 'smtp-relay.brevo.com' : process.env.EMAIL_HOST,
  port: isBrevo ? 587 : parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: isBrevo ? process.env.BREVO_USER : process.env.EMAIL_USER,
    pass: isBrevo ? process.env.BREVO_SMTP_KEY : process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error.message);
  } else {
    const service = isBrevo ? '🟢 Brevo (Producción)' : '🔵 Gmail (Local)';
    console.log(`✅ Servidor de email listo - ${service}`);
  }
});

export { transporter };