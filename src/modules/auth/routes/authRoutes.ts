import { signUp } from '../controllers/signupController';
import { singIn } from '../controllers/signinController';
import { Router } from 'express';

const router = Router();

router.post('/signup', signUp);
router.post('/sign-in', singIn);

export default router;
