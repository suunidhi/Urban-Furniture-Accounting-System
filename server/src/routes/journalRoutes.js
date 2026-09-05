import express from 'express';
import { getJournals, createJournal } from '../controllers/journalController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getJournals)
  .post(protect, restrictTo('admin', 'accountant'), createJournal);

export default router;
