import { Router } from 'express';
import {
  getTables, getTablesManage, getTable, validateTableToken,
  generateQR, downloadQR, updateTableStatus,
  checkinTable, clearTable, createTableReservation,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { tableStatusSchema, reservationSchema, checkinSchema } from '../validators/schemas.js';

const router = Router();

const FLOOR = ['owner', 'counter'];

// Public guest routes: a printed QR carries the token, and the menu only needs its table.
router.get('/validate/:token', validateTableToken);
router.get('/token/:token', validateTableToken);
router.post('/checkin/:token', validateBody(checkinSchema), checkinTable);
router.post('/:id/reservations', validateBody(reservationSchema), createTableReservation);

// Public floor map: identity, capacity, status and free/busy only — never QR tokens or
// guest phone numbers.
router.get('/', getTables);

// Staff floor management. `/manage` returns the full documents the console needs.
router.get('/manage', protect, authorize(...FLOOR), getTablesManage);
router.get('/:id', protect, authorize(...FLOOR), getTable);
router.post('/:id/qr', protect, authorize(...FLOOR), generateQR);
router.get('/:id/qr/download', protect, authorize(...FLOOR), downloadQR);
router.patch('/:id/status', protect, authorize(...FLOOR), validateBody(tableStatusSchema), updateTableStatus);
router.post('/:id/clear', protect, authorize(...FLOOR), clearTable);

export default router;
