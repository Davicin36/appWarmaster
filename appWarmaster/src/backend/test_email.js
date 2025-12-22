import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'warmastermadrid23@gmail.com',
    pass: 'dkiigiopdfmhruzc'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Email configurado correctamente');
  }
});