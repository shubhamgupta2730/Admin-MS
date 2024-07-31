import { Router } from 'express';

import authRoutes from '../modules/auth/routes/authRoutes';
import categoryRoutes from '../modules/product Category/routes/categoryRoutes';
import bundleRoutes from '../modules/adminBundles/routes/adminBundleRoute';
import discountRoutes from '../modules/discounts/routes/discountRoute';
const router = Router();

router.use('/authRoute', authRoutes);
router.use('/categoryRoute', categoryRoutes);
router.use('/bundleRoute', bundleRoutes);
router.use('/discountRoute', discountRoutes);

export default router;
