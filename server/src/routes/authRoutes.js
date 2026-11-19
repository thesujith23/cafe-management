import { Router } from 'express';
import { login, logout, register, getMe, getUsers, updateUser } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema, updateUserSchema } from '../validators/schemas.js';
import { loginLimiter } from '../middleware/limiters.js';

const router = Router();

router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Owner-only routes
router.post('/register', protect, authorize('owner'), validateBody(registerSchema), register);
router.get('/users', protect, authorize('owner'), getUsers);
router.put('/users/:id', protect, authorize('owner'), validateBody(updateUserSchema), updateUser);

export default router;
