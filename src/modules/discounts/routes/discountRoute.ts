import { Router } from 'express';
const router = Router();
import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';
import {
  addDiscount,
  updateDiscount,
  removeDiscount,
  applyDiscount,
  getDiscountById,
  getAllDiscounts,
  removeDiscountFromProductsBundles,
} from '../controllers/index';

router.post('/add-discount', authenticateAdmin, authorizeAdmin, addDiscount);

router.put(
  '/update-discount',
  authenticateAdmin,
  authorizeAdmin,
  updateDiscount
);

router.get('/get-discount', authenticateAdmin, authorizeAdmin, getDiscountById);

router.get(
  '/get-all-discounts',
  authenticateAdmin,
  authorizeAdmin,
  getAllDiscounts
);

router.post(
  '/apply-discount',
  authenticateAdmin,
  authorizeAdmin,
  applyDiscount
);
router.delete(
  '/remove-discount',
  authenticateAdmin,
  authorizeAdmin,
  removeDiscount
);

router.post(
  '/remove-discounts-from-products-bundles',
  authenticateAdmin,
  authorizeAdmin,
  removeDiscountFromProductsBundles
);

export default router;
