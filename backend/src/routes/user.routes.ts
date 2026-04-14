import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createUserSchema, updateStatusSchema } from '../validations/user.schema';

const router = Router();

router.use(authMiddleware);
router.use(authorizeRole(['ADMIN']));

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', validate(createUserSchema), userController.create);
router.patch('/:id/status', validate(updateStatusSchema), userController.updateStatus);

export default router;
