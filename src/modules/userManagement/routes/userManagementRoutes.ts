import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';
import { toggleBlockUser } from '../controllers/blockUnblockUser';
import { getAllUsers } from '../controllers/getAllUsers';
import { getUserInfo } from '../controllers/getUserInfo';
import { Router } from 'express';
const router = Router();

router.put(
  '/toggle-block-user',
  authenticateAdmin,
  authorizeAdmin,
  toggleBlockUser
);

router.get('/get-all-users', authenticateAdmin, authorizeAdmin, getAllUsers);
router.get('/get-user-info', authenticateAdmin, authorizeAdmin, getUserInfo);

export default router;
