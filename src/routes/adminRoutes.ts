import { Router } from 'express';

import authRoutes from '../modules/auth/routes/authRoutes';
import categoryRoutes from '../modules/product Category/routes/categoryRoutes';
const router = Router();

router.use('/authRoute', authRoutes);
router.use('/categoryRoute', categoryRoutes);

export default router;
