import express from 'express';
import { getContacts, getContactById, createContact, updateContact, archiveContact } from '../controllers/contactController.js';
import { protect } from '../middleware/authMiddleware.js';
import { imageUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();
const upload = imageUpload('contacts');

router.route('/')
  .get(protect, getContacts)
  .post(protect, upload.single('image'), createContact);

router.route('/:id')
  .get(protect, getContactById)
  .put(protect, upload.single('image'), updateContact);

router.route('/:id/archive')
  .patch(protect, archiveContact);

export default router;
