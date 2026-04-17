import { Router } from 'express';
import { authMiddleware, authorizeRole } from '../middlewares/auth';
import { resetDatabase } from '../controllers/system.controller';

const router = Router();

// All system routes require authentication + ADMIN role
router.use(authMiddleware);
router.use(authorizeRole(['ADMIN']));

// POST /api/system/reset — Destructive database reset
router.post('/reset', resetDatabase);

export default router;
