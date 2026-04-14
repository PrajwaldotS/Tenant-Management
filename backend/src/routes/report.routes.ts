import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authMiddleware, authorizeRole } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);
router.use(authorizeRole(['ADMIN', 'MANAGER']));

router.get('/stats', reportController.getStats);

export default router;
