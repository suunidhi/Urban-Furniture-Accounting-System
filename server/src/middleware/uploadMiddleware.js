import multer from 'multer';
import path from 'path';
import fs from 'fs';

const makeUploadDir = (folder) => {
  const dir = path.resolve(`uploads/${folder}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export const imageUpload = (folder = 'images') => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, makeUploadDir(folder)),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
    }
  });
};
