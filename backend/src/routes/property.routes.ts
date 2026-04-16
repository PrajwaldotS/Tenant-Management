import { Router } from 'express';
import * as propertyController from '../controllers/property.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updatePropertySchema } from '../validations/property.schema';
import { uploadSingle } from '../middlewares/upload';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRole(['ADMIN', 'MANAGER']), propertyController.getAll);
router.get('/:id', authorizeRole(['ADMIN', 'MANAGER']), propertyController.getById);

// POST uses multer for file upload — validation is handled inside the controller
router.post('/', authorizeRole(['ADMIN']), uploadSingle('layoutImage'), propertyController.create);

// PATCH uses multer for optional image re-upload + Zod for body fields
router.patch('/:id', authorizeRole(['ADMIN', 'MANAGER']), uploadSingle('layoutImage'), propertyController.update);

export default router;
