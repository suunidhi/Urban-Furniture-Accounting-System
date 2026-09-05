require('dotenv').config({ path: 'd:\\Hackathons\\Odoo_2026\\Shlok_urban furntiure\\server\\.env' });
const jwt = require('jsonwebtoken');

async function testApi() {
  try {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
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

    const res = await fetch('http://localhost:5000/api/email/send-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: 'skp140607@gmail.com',
        type: 'invoice',
        data: data
      })
    });

    const resData = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", resData);
  } catch (err) {
    console.error("Error:", err);
  }
}

testApi();
