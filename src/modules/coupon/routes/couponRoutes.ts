import { Router } from 'express';
const router = Router();
import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';
import { createCoupon } from '../controllers/createCoupon';
import { getAllCoupons } from '../controllers/getAllCoupon';
import { getCouponById } from '../controllers/getCoupons';
import { deleteCoupon } from '../controllers/deleteCoupon';
import { updateCoupon } from '../controllers/updateCoupon';

router.post('/create-coupon', authenticateAdmin, authorizeAdmin, createCoupon);
router.get(
  '/get-all-coupons',
  authenticateAdmin,
  authorizeAdmin,
  getAllCoupons
);
router.get('/get-coupon', authenticateAdmin, authorizeAdmin, getCouponById);
router.delete(
  '/delete-coupon',
  authenticateAdmin,
  authorizeAdmin,
  deleteCoupon
);
router.patch('/update-coupon', authenticateAdmin, authorizeAdmin, updateCoupon);
export default router;
