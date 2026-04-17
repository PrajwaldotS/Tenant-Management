import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import propertyRoutes from './property.routes';
import tenantRoutes from './tenant.routes';
import rentRoutes from './rent.routes';
import paymentRoutes from './payment.routes';
import reportRoutes from './report.routes';
import systemRoutes from './system.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/tenants', tenantRoutes);
router.use('/rents', rentRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/system', systemRoutes);

export default router;
