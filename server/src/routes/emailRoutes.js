const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/send-receipt', authenticateToken, async (req, res) => {
  const { email, type, data } = req.body;
  
  if (!email || !type || !data) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Using environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const isInvoice = type === 'invoice';
    const number = isInvoice ? data.invoice_number : data.bill_number;
    const partner = isInvoice ? (data.customer?.name || '') : (data.vendor?.name || '');
    
    let htmlLines = '';
    if (data.lines && data.lines.length > 0) {
      data.lines.forEach(line => {
        htmlLines += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${line.product?.name || 'Item'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${line.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${Number(line.unit_price).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(Number(line.total) || Number(line.subtotal) || (Number(line.quantity) * Number(line.unit_price)) || 0).toFixed(2)}</td>
          </tr>
        `;
      });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #6366f1; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Urban Furniture</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">${isInvoice ? 'Customer Invoice' : 'Vendor Bill'} Receipt</p>
        </div>
        
        <div style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #333;">${number}</h2>
              <p style="margin: 5px 0; color: #666;">Date: ${new Date(data.invoice_date).toLocaleDateString()}</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0; color: #333;">${partner}</h3>
              <p style="margin: 5px 0; color: #666;">Status: <strong>${data.status.toUpperCase()}</strong></p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; text-align: left;">
                <th style="padding: 10px 8px; border-bottom: 2px solid #6366f1;">Product</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #6366f1; text-align: center;">Qty</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #6366f1; text-align: right;">Unit Price</th>
                <th style="padding: 10px 8px; border-bottom: 2px solid #6366f1; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${htmlLines}
            </tbody>
          </table>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; text-align: right;">
            <p style="margin: 0 0 10px; color: #666;">Subtotal: $${Number(data.total || 0).toFixed(2)}</p>
            <h2 style="margin: 0; color: #6366f1;">Total Due: $${Number(data.outstanding_amount || 0).toFixed(2)}</h2>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">Thank you for your business!</p>
          <p style="margin: 5px 0 0;">Urban Furniture &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@urbanfurniture.com',
      to: email,
      subject: `Receipt for ${isInvoice ? 'Invoice' : 'Bill'} ${number} from Urban Furniture`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    res.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email. Please check your EMAIL_USER and EMAIL_PASS environment variables.', error: error.message });
  }
});

module.exports = router;
