import { Router } from 'express';

import authRoutes from '../modules/auth/routes/authRoutes';
import categoryRoutes from '../modules/product Category/routes/categoryRoutes';
import bundleRoutes from '../modules/Bundles/routes/adminBundleRoute';
import discountRoutes from '../modules/discounts/routes/discountRoute';
import userManagementRoutes from '../modules/userManagement/routes/userManagementRoutes';
import productManagementRoutes from '../modules/productManagement/routes/productManagementRoute';
import saleRoutes from '../modules/sales/routes/saleRoutes';
import reviewRoutes from '../modules/review/routes/reviewRoutes';
import dashboardSalesRoutes from '../modules/Dashboard/dashboardSales/routes/dashboardSaleRoute';
import generateData from '../modules/generateData/routes/userDataRoutes';
import couponRoutes from '../modules/coupon/routes/couponRoutes';
const router = Router();

router.use('/authRoute', authRoutes);
router.use('/categoryRoute', categoryRoutes);
router.use('/bundleRoute', bundleRoutes);
router.use('/discountRoute', discountRoutes);
router.use('/user-management', userManagementRoutes);
router.use('/product-management', productManagementRoutes);
router.use('/saleRoute', saleRoutes);
router.use('/reviewRoute', reviewRoutes);
router.use('/dashboardRoute', dashboardSalesRoutes);
router.use('/dummyData', generateData);
router.use('/couponRoute', couponRoutes);

export default router;
