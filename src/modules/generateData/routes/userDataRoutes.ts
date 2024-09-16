import { Router } from 'express';
import { generateUserData } from '../controllers/userData';
import { generateProductData } from '../controllers/productData';
const router = Router();

router.post('/generate-users', generateUserData);
router.post('/generate-product-data', generateProductData);

export default router;
