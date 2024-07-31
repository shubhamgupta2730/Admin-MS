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
} from '../controllers/index';

router.post('/add-discount', authenticateAdmin, authorizeAdmin, addDiscount);
router.put(
  '/update-discount',
  authenticateAdmin,
  authorizeAdmin,
  updateDiscount
);
router.delete(
  '/remove-discount',
  authenticateAdmin,
  authorizeAdmin,
  removeDiscount
);

export default router;
