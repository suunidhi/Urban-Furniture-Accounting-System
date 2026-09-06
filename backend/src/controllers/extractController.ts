import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response';
const pdfParse = require('pdf-parse');

export class ExtractController {
  static async extractFromPdf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Parse the PDF buffer
      const data = await pdfParse(req.file.buffer);
      const text = data.text;

      // Simple regex extraction logic
      let partnerName = '';
      let totalAmount = 0;
      let date = '';
      let description = '';

      // Try to find a Total Amount (e.g. "Total: $1200" or "Amount: 1,150.50" or "₹8,900.00")
      const totalMatch = text.match(/(?:total|amount|due).*?[\$\£\€\₹]?\s*([\d,]+\.\d{2})/i);
      if (totalMatch) {
        totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
      }

      // Try to find a Date (e.g. "Date: 2026-01-01" or "06-09-2026" or "Jan 1, 2026")
      const dateMatch = text.match(/(?:date).*?(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\w{3} \d{1,2},? \d{4})/i);
      if (dateMatch) {
        // Simple swap for DD-MM-YYYY to YYYY-MM-DD if needed, but Date.parse can sometimes handle it or UI does
        let parsedDate = dateMatch[1];
        if (/\d{2}-\d{2}-\d{4}/.test(parsedDate)) {
          const parts = parsedDate.split('-');
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        date = parsedDate;
      }

      // Try to find a Vendor/Customer Name (e.g. "From: Azure Furniture" or "To: John Doe")
      const nameMatch = text.match(/(?:from|to|vendor|customer|bill to).*?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
      if (nameMatch) {
        partnerName = nameMatch[1];
      }

      // First line as description, if any
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        description = lines[0].substring(0, 50);
      }

      return successResponse(res, {
        extractedText: text,
        extractedData: {
          partnerName,
          totalAmount,
          date,
          description,
        }
      }, 'PDF extracted successfully');

    } catch (error) {
      console.error('Extraction error:', error);
      return res.status(500).json({ success: false, message: 'Failed to extract data from PDF' });
    }
  }
}
// trigger restart
