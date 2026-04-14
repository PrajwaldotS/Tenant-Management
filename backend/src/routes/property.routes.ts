import { Router } from 'express';
import * as propertyController from '../controllers/property.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createPropertySchema, updatePropertySchema } from '../validations/property.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRole(['ADMIN', 'MANAGER']), propertyController.getAll);
router.get('/:id', authorizeRole(['ADMIN', 'MANAGER']), propertyController.getById);
router.post('/', authorizeRole(['ADMIN']), validate(createPropertySchema), propertyController.create);
router.patch('/:id', authorizeRole(['ADMIN', 'MANAGER']), validate(updatePropertySchema), propertyController.update);

export default router;
