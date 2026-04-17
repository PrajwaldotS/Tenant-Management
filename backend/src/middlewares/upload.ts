import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
});

/**
 * Middleware to handle a single file upload for the given field name.
 */
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

/**
 * Middleware to handle multiple file fields at once.
 * - layoutImage: single file (floor plan)
 * - images: up to 10 property photos
 */
export const uploadPropertyFiles = () =>
  upload.fields([
    { name: 'layoutImage', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]);
