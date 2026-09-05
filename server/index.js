import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import authRoutes from './src/routes/authRoutes.js';
import contactRoutes from './src/routes/contactRoutes.js';
import productCategoryRoutes from './src/routes/productCategoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import accountRoutes from './src/routes/accountRoutes.js';
import journalRoutes from './src/routes/journalRoutes.js';
import analyticAccountRoutes from './src/routes/analyticAccountRoutes.js';
import journalEntryRoutes from './src/routes/journalEntryRoutes.js';
import purchaseRoutes from './src/routes/purchaseRoutes.js';
import billRoutes from './src/routes/billRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import salesRoutes from './src/routes/salesRoutes.js';
import invoiceRoutes from './src/routes/invoiceRoutes.js';
import customerPaymentRoutes from './src/routes/customerPaymentRoutes.js';
import budgetRoutes from './src/routes/budgetRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import ocrRoutes from './src/routes/ocrRoutes.js';
import pdfRoutes from './src/routes/pdfRoutes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/analytic-accounts', analyticAccountRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/receipts', customerPaymentRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/pdf', pdfRoutes);

app.get('/', (req, res) => {
  res.send('Urban Furniture API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
