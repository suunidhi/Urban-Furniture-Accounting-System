import express from 'express';
import { getJournalEntries, getJournalEntryById } from '../controllers/journalEntryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getJournalEntries);

router.route('/:id')
  .get(protect, getJournalEntryById);

export default router;
