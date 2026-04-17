import { Router } from 'express';
import * as propertyController from '../controllers/property.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { uploadPropertyFiles } from '../middlewares/upload';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRole(['ADMIN', 'MANAGER']), propertyController.getAll);
router.get('/:id', authorizeRole(['ADMIN', 'MANAGER']), propertyController.getById);

// POST/PATCH use multer for file uploads (layoutImage: single, images: multiple)
router.post('/', authorizeRole(['ADMIN']), uploadPropertyFiles(), propertyController.create);
router.patch('/:id', authorizeRole(['ADMIN', 'MANAGER']), uploadPropertyFiles(), propertyController.update);

export default router;
