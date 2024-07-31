import {
  createBundle,
  updateBundle,
  removeBundle,
  getBundle,
  getAllBundles,
} from '../controllers/index';
import { Router } from 'express';
const router = Router();
import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';

router.post('/createBundle', authenticateAdmin, authorizeAdmin, createBundle);
router.get('/get-bundle', authenticateAdmin, authorizeAdmin, getBundle);
router.get(
  '/get-all-bundles',
  authenticateAdmin,
  authorizeAdmin,
  getAllBundles
);
router.put('/update-bundle', authenticateAdmin, authorizeAdmin, updateBundle);
router.delete(
  '/remove-bundle',
  authenticateAdmin,
  authorizeAdmin,
  removeBundle
);

export default router;
