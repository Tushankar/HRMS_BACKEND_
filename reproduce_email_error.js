require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email with user:', process.env.EMAIL_USER);
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('Transporter verification successful');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: "Test Email",
      text: "This is a test email to verify credentials."
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Email failed:', error);
  }
}

testEmail();
