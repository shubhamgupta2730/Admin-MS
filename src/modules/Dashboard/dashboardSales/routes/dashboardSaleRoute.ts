import { getSalesAnalytics } from '../controllers/getDashboardSale';
import { Router } from 'express';
const router = Router();
import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../../middlewares/authMiddleware';

router.get(
  '/get-total-sales',
  authenticateAdmin,
  authorizeAdmin,
  getSalesAnalytics
);
export default router;
