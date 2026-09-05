require('dotenv').config({ path: 'd:\\Hackathons\\Odoo_2026\\Shlok_urban furntiure\\server\\.env' });
const nodemailer = require('nodemailer');

async function testRoute() {
  const data = {
    invoice_number: 'INV001',
    invoice_date: '2026-09-05T00:00:00Z',
    status: 'draft',
    total: 400,
    outstanding_amount: 0,
    customer: { name: 'Shikha Shah' },
    lines: [
      { product: { name: 'Chair' }, quantity: 20, unit_price: 20, total: 0 }
    ]
  };
  const isInvoice = true;
  const number = data.invoice_number;
  const partner = data.customer?.name;
  
  let htmlLines = '';
  data.lines.forEach(line => {
    htmlLines += `
      <tr>
        <td>${line.product?.name || 'Item'}</td>
        <td>${line.quantity}</td>
        <td>$${Number(line.unit_price).toFixed(2)}</td>
        <td>$${(Number(line.total) || Number(line.subtotal) || (Number(line.quantity) * Number(line.unit_price)) || 0).toFixed(2)}</td>
      </tr>
    `;
  });

  console.log("Status: ", data.status.toUpperCase());
  
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
      subject: "Test API payload",
      html: htmlLines
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

testRoute();
