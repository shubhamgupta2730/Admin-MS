import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';
import { removeReview } from '../controllers/deleteReview';

import { Router } from 'express';
const router = Router();

router.delete(
  '/remove-review',
  authenticateAdmin,
  authorizeAdmin,
  removeReview
);
export default router;
