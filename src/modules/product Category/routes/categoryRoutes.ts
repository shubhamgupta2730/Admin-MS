import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/index';
import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';

import { Router } from 'express';
const router = Router();

router.post(
  '/create-category',
  authenticateAdmin,
  authorizeAdmin,
  createCategory
);
router.get(
  '/get-all-categories',
  authenticateAdmin,
  authorizeAdmin,
  getAllCategories
);
router.get('/get-category', authenticateAdmin, authorizeAdmin, getCategory);
router.put(
  '/update-category',
  authenticateAdmin,
  authorizeAdmin,
  updateCategory
);
router.delete(
  '/remove-category',
  authenticateAdmin,
  authorizeAdmin,
  deleteCategory
);

export default router;
