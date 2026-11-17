import { Router } from 'express';
import { login, logout, register, getMe, getUsers, updateUser } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Owner-only routes
router.post('/register', protect, authorize('owner'), register);
router.get('/users', protect, authorize('owner'), getUsers);
router.put('/users/:id', protect, authorize('owner'), updateUser);

export default router;
