const nodemailer = require('nodemailer');

const EMAIL_USER = 'sahatushankar234@gmail.com';
const EMAIL_PASS = 'ayfnafrdoglvkvar';

async function verifyEmailConfig() {
  console.log('--- Custom Email Verification ---');
  console.log(`Checking credentials for user: ${EMAIL_USER}`);
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    // 1. Verify connection configuration
    console.log('Step 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully.');

    // 2. Send a test email
    console.log('Step 2: Sending test email...');
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to: 'tushankarsaha0@gmail.com', // Send to specified recipient
      subject: "Custom Credential Test Email",
      text: "If you are reading this, the provided credentials are working correctly!",
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log('--- Verification Complete ---');
    
  } catch (error) {
    console.error('❌ Verification Failed:');
    console.error(error.message);
    if (error.response) {
      console.error('Server response:', error.response);
    }
  }
}

verifyEmailConfig();
