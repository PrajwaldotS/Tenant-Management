import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createPaymentSchema } from '../validations/payment.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', paymentController.getHistory);
router.post('/', authorizeRole(['ADMIN', 'COLLECTOR']), validate(createPaymentSchema), paymentController.record);

export default router;
