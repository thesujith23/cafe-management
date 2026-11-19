import { Router } from 'express';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getMenuItems, getMenuItem, createMenuItem, updateMenuItem,
  archiveMenuItem, toggleAvailability,
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { menuItemSchema } from '../validators/schemas.js';

const router = Router();

// Public routes (customers can view menu)
router.get('/categories', getCategories);
router.get('/items', getMenuItems);
router.get('/items/:id', getMenuItem);

// Admin routes
router.post('/categories', protect, authorize('owner', 'counter'), createCategory);
router.put('/categories/:id', protect, authorize('owner', 'counter'), updateCategory);
router.delete('/categories/:id', protect, authorize('owner'), deleteCategory);

router.post('/items', protect, authorize('owner', 'counter'), validateBody(menuItemSchema), createMenuItem);
router.put('/items/:id', protect, authorize('owner', 'counter'), updateMenuItem);
router.delete('/items/:id', protect, authorize('owner'), archiveMenuItem);
router.patch('/items/:id/availability', protect, authorize('owner', 'counter'), toggleAvailability);
router.patch('/items/:id/toggle-availability', protect, authorize('owner', 'counter'), toggleAvailability);

export default router;
