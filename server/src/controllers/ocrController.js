import multer from 'multer';
import { createWorker } from 'tesseract.js';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ── Upload setup ─────────────────────────────────────────────────────────────
const uploadDir = path.resolve('uploads/ocr');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.bmp', '.tiff', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files and PDFs are supported'));
  }
});

// ── Text extraction ──────────────────────────────────────────────────────────

/**
 * Extract text from a PDF using pdf-parse (no OCR needed — reads PDF text layer directly)
 */
async function extractFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

/**
 * Extract text from an image using Tesseract OCR
 */
async function extractFromImage(filePath) {
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      logger: () => {}, // suppress verbose logs
    });
    const { data: { text } } = await worker.recognize(filePath);
    return text || '';
  } finally {
    if (worker) await worker.terminate();
  }
}

// ── Data parsing ─────────────────────────────────────────────────────────────

/**
 * Extract structured vendor bill fields from raw text.
 * Works for both OCR text and PDF text layers.
 */
function parseText(text) {
  if (!text || text.trim().length === 0) {
    return { vendor_name: '', total: '', invoice_number: '', date: '', description: '', raw_text: text };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // ── Vendor name ─────────────────────────────────────────────────────────
  let vendor_name = '';
  // Look for explicit "from" / "vendor" / "billed by" labels first
  const vendorLabelMatch = text.match(/(?:from|vendor|supplier|billed?\s*by|sold\s*by)[:\s]+(.{3,60}?)(?:\n|,|$)/i);
  if (vendorLabelMatch) {
    vendor_name = vendorLabelMatch[1].trim();
  } else {
    // Fall back: first non-empty non-numeric line that looks like a business name
    for (const line of lines.slice(0, 8)) {
      if (line.length >= 3 && line.length <= 60 && /[A-Za-z]/.test(line) && !/invoice|bill|receipt|date|no\.|#|total|amount/i.test(line)) {
        vendor_name = line;
        break;
      }
    }
  }

  // ── Total amount ────────────────────────────────────────────────────────
  let total = '';
  // Match "Total", "Amount Due", "Grand Total", "Net Amount", "Balance Due"
  const totalPatterns = [
    /(?:grand\s*total|total\s*due|amount\s*due|total\s*amount|net\s*payable|balance\s*due|total)[:\s]*[$₹£€]?\s*([\d,]+\.?\d{0,2})/i,
    /(?:total)[:\s]*[$₹£€]\s*([\d,]+\.?\d{0,2})/i,
  ];
  for (const pattern of totalPatterns) {
    const m = text.match(pattern);
    if (m) { total = m[1].replace(/,/g, ''); break; }
  }
  if (!total) {
    // Fallback: collect all dollar/rupee amounts and pick the largest
    const amounts = [...text.matchAll(/[$₹£€]\s*([\d,]+(?:\.\d{2})?)/g)]
      .map(m => parseFloat(m[1].replace(/,/g, '')))
      .filter(n => !isNaN(n) && n > 0);
    if (amounts.length) total = String(Math.max(...amounts));
  }

  // ── Invoice / Bill number ───────────────────────────────────────────────
  let invoice_number = '';
  const invPatterns = [
    /(?:invoice|bill|receipt|ref(?:erence)?|order)[:\s#]*(?:no\.?|num(?:ber)?)?[:\s#]*([A-Z0-9][-A-Z0-9]{2,19})/i,
    /#\s*([A-Z0-9][-A-Z0-9]{2,19})/i,
  ];
  for (const pattern of invPatterns) {
    const m = text.match(pattern);
    if (m) { invoice_number = m[1].trim(); break; }
  }

  // ── Date ────────────────────────────────────────────────────────────────
  let date = '';
  const datePatterns = [
    // YYYY-MM-DD
    /\b(\d{4}-\d{2}-\d{2})\b/,
    // DD/MM/YYYY or MM/DD/YYYY
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    // "15 March 2024" or "March 15, 2024"
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+\d{2,4})\b/i,
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}[\s,]+\d{2,4})\b/i,
  ];
  // Only match near "date" label for better accuracy
  const dateContextMatch = text.match(/(?:date|issued|dated?)[:\s]+(.{5,20})/i);
  if (dateContextMatch) {
    const snippet = dateContextMatch[1];
    for (const pattern of datePatterns) {
      const m = snippet.match(pattern);
      if (m) { date = m[0].trim(); break; }
    }
  }
  if (!date) {
    for (const pattern of datePatterns) {
      const m = text.match(pattern);
      if (m) { date = m[0].trim(); break; }
    }
  }

  // ── Description / line items ─────────────────────────────────────────────
  // Pick content lines that look like item descriptions
  const description = lines
    .filter(l =>
      l.length > 8 &&
      l.length < 120 &&
      /[a-z]/i.test(l) &&
      !/(?:invoice|bill|receipt|vendor|supplier|total|subtotal|tax|date|address|phone|email|gst|pan|due)/i.test(l) &&
      !/^[\d\s$.,%-]+$/.test(l)
    )
    .slice(0, 4)
    .join('; ');

  return {
    vendor_name: vendor_name.trim(),
    total,
    invoice_number,
    date,
    description,
    raw_text: text
  };
}

// ── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/ocr/extract
 * Accepts a single image or PDF and returns structured extracted data.
 */
export const extractFromDocument = async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    if (ext === '.pdf') {
      // Direct text extraction — fast and accurate
      text = await extractFromPDF(filePath);
      if (!text || text.trim().length < 20) {
        // PDF has no text layer (scanned) — fall back to OCR
        text = await extractFromImage(filePath);
      }
    } else {
      // Image — use Tesseract OCR
      text = await extractFromImage(filePath);
    }

    // Cleanup temp file
    fs.unlink(filePath, () => {});

    const extracted = parseText(text);

    res.json({ success: true, extracted });
  } catch (error) {
    if (filePath) fs.unlink(filePath, () => {});
    console.error('OCR Error:', error);
    res.status(500).json({
      message: 'Data extraction failed: ' + error.message,
      error: error.message
    });
  }
};
