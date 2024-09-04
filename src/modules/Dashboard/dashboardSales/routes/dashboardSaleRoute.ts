import { getAggregatedSalesData } from '../controllers/getDashboardSale';
import { Router } from 'express';
const router = Router();
import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../../middlewares/authMiddleware';


router.get('/get-total-sales', authenticateAdmin, authorizeAdmin, getAggregatedSalesData);
export default router;
