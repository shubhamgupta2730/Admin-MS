import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';
import { toggleBlockProduct } from '../controllers/blockUnblockProduct';
import { getProductInfo } from '../controllers/getProductInfo';
import { getAllProducts } from '../controllers/getAllProducts';
import { Router } from 'express';
const router = Router();

router.put(
  '/toggle-block-product',
  authenticateAdmin,
  authorizeAdmin,
  toggleBlockProduct
);

router.get(
  '/get-product-info',
  authenticateAdmin,
  authorizeAdmin,
  getProductInfo
);
router.get(
  '/get-all-products',
  authenticateAdmin,
  authorizeAdmin,
  getAllProducts
);

export default router;
