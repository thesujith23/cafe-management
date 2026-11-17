import { Router } from 'express';
import {
  getTables, getTable, validateTableToken,
  generateQR, downloadQR, updateTableStatus,
  checkinTable, clearTable, createTableReservation,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes for customer table validation, check-in, and table listing
router.get('/validate/:token', validateTableToken);
router.get('/token/:token', validateTableToken);
router.post('/checkin/:token', checkinTable);
router.get('/', getTables);
router.post('/:id/reservations', createTableReservation);

// Staff / Admin / Counter routes
router.get('/:id', getTable);
router.post('/:id/qr', generateQR);
router.get('/:id/qr/download', downloadQR);
router.patch('/:id/status', updateTableStatus);
router.post('/:id/clear', clearTable);

export default router;
