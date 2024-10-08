import {
  authenticateAdmin,
  authorizeAdmin,
} from '../../../middlewares/authMiddleware';
import { createSale } from '../controllers/createSale';
import { getSale } from '../controllers/getSaleById';
import { getAllSales } from '../controllers/getAllSales';
import { deleteSale } from '../controllers/removeSale';
import { updateSale } from '../controllers/updateSale';
import { Router } from 'express';
import { addProductsToSale } from '../controllers/addProductToSale';
import { removeProductFromSale } from '../controllers/removeProductFromSale';
const router = Router();

router.post('/create-sale', authenticateAdmin, authorizeAdmin, createSale);
router.get('/get-sale', authenticateAdmin, authorizeAdmin, getSale);
router.get('/get-all-sales', authenticateAdmin, authorizeAdmin, getAllSales);
router.delete('/delete-sale', authenticateAdmin, authorizeAdmin, deleteSale);
router.patch('/update-sale', authenticateAdmin, authorizeAdmin, updateSale);

router.post(
  '/add-products',
  authenticateAdmin,
  authorizeAdmin,
  addProductsToSale
);
router.post(
  '/remove-product',
  authenticateAdmin,
  authorizeAdmin,
  removeProductFromSale
);

export default router;
