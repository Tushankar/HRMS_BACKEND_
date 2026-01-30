require('dotenv').config();
const nodemailer = require('nodemailer');

async function verifyEmailConfig() {
  console.log('--- Email Configuration Verification ---');
  console.log(`Checking credentials for user: ${process.env.EMAIL_USER}`);
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS.replace(/\s+/g, ''), // Strip spaces just in case
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
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: "CareComp Test Email",
      text: "If you are reading this, your email configuration is working correctly! Date: " + new Date().toISOString(),
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #27ae60;">Verification Successful</h2>
          <p>Your email credentials for CareComp are working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
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

// Check if run directly
if (require.main === module) {
  verifyEmailConfig();
}
