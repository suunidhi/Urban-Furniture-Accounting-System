require('dotenv').config({ path: 'd:\\Hackathons\\Odoo_2026\\Shlok_urban furntiure\\server\\.env' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('User:', process.env.EMAIL_USER);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Mail",
      text: "Hello from Node.js"
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

testEmail();
