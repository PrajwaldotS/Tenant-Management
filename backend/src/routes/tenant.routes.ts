import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createTenantSchema, updateTenantSchema } from '../validations/tenant.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', tenantController.getAll);
router.get('/:id', tenantController.getById);
router.post('/', authorizeRole(['ADMIN', 'MANAGER']), validate(createTenantSchema), tenantController.create);
router.patch('/:id', authorizeRole(['ADMIN', 'MANAGER']), validate(updateTenantSchema), tenantController.update);

export default router;
