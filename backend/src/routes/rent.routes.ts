import { Router } from 'express';
import * as rentController from '../controllers/rent.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { z } from 'zod';

// Inline validation for rent generation (doesn't warrant its own schema file)
const generateRentSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format. Use ISO 8601.',
    }),
  }),
});

const router = Router();

router.use(authMiddleware);

router.get('/', rentController.getAll);
router.get('/:id', rentController.getById);
router.post('/generate', authorizeRole(['ADMIN']), validate(generateRentSchema), rentController.generate);
router.post('/mark-overdue', authorizeRole(['ADMIN']), rentController.markOverdue);

export default router;
