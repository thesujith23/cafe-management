import mongoose from 'mongoose';
import DiningTable from '../models/DiningTable.js';
import QRToken from '../models/QRToken.js';
import QRCode from 'qrcode';
import config from '../config/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isDemoToken, demoTableFor } from '../middleware/validateQR.js';
import { recordAudit } from '../utils/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const qrDir = path.join(__dirname, '../../qrcodes');

// Ensure qrcodes directory exists
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

const fallbackTables = [
  { _id: 'tbl_1', tableId: 'TBL-001', displayName: 'Table 1', capacity: 4, status: 'available', currentQrToken: { token: 'demo-token-TBL-001' }, reservation: null },
  { _id: 'tbl_2', tableId: 'TBL-002', displayName: 'Table 2', capacity: 4, status: 'available', currentQrToken: { token: 'demo-token-TBL-002' }, reservation: null },
  { _id: 'tbl_3', tableId: 'TBL-003', displayName: 'Table 3', capacity: 6, status: 'available', currentQrToken: { token: 'demo-token-TBL-003' }, reservation: null },
  { _id: 'tbl_4', tableId: 'TBL-004', displayName: 'Table 4', capacity: 2, status: 'available', currentQrToken: { token: 'demo-token-TBL-004' }, reservation: null },
  { _id: 'tbl_5', tableId: 'TBL-005', displayName: 'Table 5', capacity: 8, status: 'available', currentQrToken: { token: 'demo-token-TBL-005' }, reservation: null },
  { _id: 'tbl_6', tableId: 'TBL-006', displayName: 'Table 6', capacity: 4, status: 'available', currentQrToken: { token: 'demo-token-TBL-006' }, reservation: null },
];

// What a guest may know about a table: enough to pick a seat, never a QR token or a
// guest's phone number.
const publicTable = (table) => {
  const plain = typeof table.toObject === 'function' ? table.toObject() : { ...table };
  return {
    _id: plain._id,
    tableId: plain.tableId,
    displayName: plain.displayName,
    capacity: plain.capacity,
    status: plain.status,
    isActive: plain.isActive !== false,
    activeOrders: (plain.activeOrders || []).map((order) => (order?._id || order)),
    reservation: plain.reservation?.startsAt
      ? { guests: plain.reservation.guests, startsAt: plain.reservation.startsAt }
      : null,
  };
};

// @desc    Get all tables
// @route   GET /api/tables
export const getTables = async (req, res, next) => {
  const expiredBefore = new Date(Date.now() - 30 * 60 * 1000);
  // If database is not currently connected, immediately serve fallback tables without 10s buffering stall
  if (mongoose.connection.readyState !== 1) {
    fallbackTables.forEach((table) => {
      if (table.status === 'reserved' && table.reservation?.startsAt && new Date(table.reservation.startsAt) < expiredBefore) {
        table.status = 'available';
        table.reservation = null;
      }
    });
    const publicFallback = fallbackTables.map(publicTable);
    return res.json({ success: true, data: publicFallback, tables: publicFallback, isFallback: true });
  }

  try {
    const expiredReservations = await DiningTable.find({
      status: 'reserved',
      'reservation.startsAt': { $lt: expiredBefore },
    }).select('_id');
    if (expiredReservations.length) {
      await DiningTable.updateMany(
        { _id: { $in: expiredReservations.map(({ _id }) => _id) } },
        { $set: { status: 'available', reservation: null } },
      );
    }
    const tables = await DiningTable.find()
      .populate('currentQrToken')
      .populate('activeOrders')
      .sort({ tableId: 1 });
    if (expiredReservations.length) {
      const io = req.app.get('io');
      if (io) tables.filter((table) => expiredReservations.some(({ _id }) => _id.equals(table._id)))
        .forEach((table) => io.emit('table:statusUpdate', table));
    }
    const publicTables = tables.map(publicTable);
    res.json({ success: true, data: publicTables, tables: publicTables });
  } catch (error) {
    console.warn('Notice: Database query in getTables failed, using fallback:', error.message);
    const publicFallback = fallbackTables.map(publicTable);
    res.json({ success: true, data: publicFallback, tables: publicFallback, isFallback: true });
  }
};

// @desc    Create a short-lived, table-scoped token for the public 3D café
// @route   POST /api/tables/:tableId/virtual-token
export const createVirtualTableToken = async (req, res, next) => {
  const tableId = String(req.params.tableId || '').trim().toUpperCase();
  if (!/^TBL-\d{3}$/.test(tableId)) {
    return res.status(400).json({ success: false, message: 'Choose a valid café table.' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Table ordering is temporarily unavailable.' });
  }

  try {
    const table = await DiningTable.findOne({ tableId, isActive: true });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });
    if (table.status !== 'available') {
      return res.status(409).json({ success: false, message: 'This table is not available. Choose another table.' });
    }

    const token = QRToken.generateToken();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await QRToken.create({ table: table._id, token, expiresAt });

    return res.status(201).json({
      success: true,
      data: { token, expiresAt, table: publicTable(table) },
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Full table documents for the staff console (includes QR tokens and contacts)
// @route   GET /api/tables/manage
export const getTablesManage = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: fallbackTables, tables: fallbackTables, isFallback: true });
    }
    const tables = await DiningTable.find()
      .populate('currentQrToken')
      .populate('activeOrders')
      .sort({ tableId: 1 });
    res.json({ success: true, data: tables, tables });
  } catch (error) {
    next(error);
  }
};

// @desc    Reserve an available table for a future visit
// @route   POST /api/tables/:id/reservations
export const createTableReservation = async (req, res, next) => {
  try {
    const { customerName, customerPhone, guests, startsAt, notes = '' } = req.body;
    const name = String(customerName || '').trim();
    const phone = String(customerPhone || '').trim();
    const guestCount = Number(guests);
    const reservationDate = new Date(startsAt);
    const now = new Date();
    const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ success: false, message: 'Enter a name between 2 and 80 characters.' });
    }
    if (!/^[+\d\s().-]{7,20}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Enter a phone number we can use to confirm your table.' });
    }
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 8) {
      return res.status(400).json({ success: false, message: 'Choose between 1 and 8 guests.' });
    }
    if (Number.isNaN(reservationDate.getTime()) || reservationDate <= now || reservationDate > maxDate) {
      return res.status(400).json({ success: false, message: 'Choose a time in the next 90 days.' });
    }

    const query = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { tableId: req.params.id };
    let table = mongoose.connection.readyState === 1 ? await DiningTable.findOne(query) : null;
    const isFallback = !table;
    if (isFallback) table = fallbackTables.find((item) => item._id === req.params.id || item.tableId === req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found.' });

    const capacity = Number(table.capacity) || 4;
    if (guestCount > capacity) {
      return res.status(400).json({ success: false, message: `This table seats up to ${capacity} guests.` });
    }
    const reservedUntil = new Date(table.reservation?.startsAt || 0);
    if (['occupied', 'maintenance'].includes(table.status) || (table.status === 'reserved' && reservedUntil > now)) {
      return res.status(409).json({ success: false, message: 'This table has just been taken. Choose another table.' });
    }

    const reservation = {
      customerName: name,
      customerPhone: phone,
      guests: guestCount,
      startsAt: reservationDate,
      notes: String(notes).trim().slice(0, 300),
      bookedAt: now,
    };
    if (isFallback) {
      table.status = 'reserved';
      table.reservation = reservation;
      const io = req.app.get('io');
      if (io) io.emit('table:statusUpdate', table);
      return res.status(201).json({ success: true, data: table, message: 'Your table is reserved.' });
    }

    const reservedTable = await DiningTable.findOneAndUpdate(
      {
        _id: table._id,
        capacity: { $gte: guestCount },
        $or: [
          { status: 'available' },
          { status: 'reserved', 'reservation.startsAt': { $lte: now } },
        ],
      },
      { $set: { status: 'reserved', reservation } },
      { new: true, runValidators: true },
    );
    if (!reservedTable) {
      return res.status(409).json({ success: false, message: 'This table has just been taken. Choose another table.' });
    }
    const populatedTable = await DiningTable.findById(reservedTable._id)
      .populate('currentQrToken')
      .populate('activeOrders');
    const io = req.app.get('io');
    if (io) io.emit('table:statusUpdate', populatedTable || table);
    return res.status(201).json({ success: true, data: populatedTable || table, message: 'Your table is reserved.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
export const getTable = async (req, res, next) => {
  try {
    const table = await DiningTable.findById(req.params.id)
      .populate('currentQrToken')
      .populate('activeOrders');
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate a QR token (public route for customers)
// @route   GET /api/tables/validate/:token
export const validateTableToken = async (req, res, next) => {
  const { token } = req.params;

  // Handle demo token directly (development only)
  if (isDemoToken(token)) {
    const demo = demoTableFor(token);
    return res.json({
      success: true,
      data: {
        table: demo.table,
        tableId: demo.tableId,
        displayName: demo.displayName,
        token,
      },
    });
  }

  try {
    const qrToken = await QRToken.validateToken(token);
    if (!qrToken) {
      return res.status(401).json({ success: false, message: 'Invalid or expired QR code' });
    }
    const table = publicTable(qrToken.table);
    res.json({
      success: true,
      data: {
        table,
        tableId: table.tableId,
        displayName: table.displayName,
        token: qrToken.token,
      },
    });
  } catch (error) {
    console.warn('Notice: validateTableToken error:', error.message);
    res.status(500).json({ success: false, message: 'Could not validate QR code. Please check database connection.' });
  }
};

// @desc    Generate/regenerate QR code for a table
// @route   POST /api/tables/:id/qr
export const generateQR = async (req, res, next) => {
  try {
    const table = await DiningTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    // Revoke old token if exists
    if (table.currentQrToken) {
      const oldToken = await QRToken.findById(table.currentQrToken);
      if (oldToken) await oldToken.revoke();
    }

    // Create new token
    const tokenValue = QRToken.generateToken();
    const qrToken = await QRToken.create({
      table: table._id,
      token: tokenValue,
    });

    // Update table reference
    table.currentQrToken = qrToken._id;
    await table.save();

    // Generate QR code URL — points to customer ordering page. publicClientUrl is the
    // address a phone can actually reach; clientUrl may be localhost.
    const qrUrl = `${config.publicClientUrl}/order/${tokenValue}`;
    const qrFilePath = path.join(qrDir, `${table.tableId}.png`);

    await QRCode.toFile(qrFilePath, qrUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    // Also generate data URL for API response
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    recordAudit(req, 'table_qr_regenerated', {
      targetModel: 'DiningTable',
      targetId: table._id,
      details: { tableId: table.tableId },
    });

    res.json({
      success: true,
      data: {
        table: table.tableId,
        token: tokenValue,
        qrUrl,
        qrImage: qrDataUrl,
        filePath: `/qrcodes/${table.tableId}.png`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download QR code image
// @route   GET /api/tables/:id/qr/download
export const downloadQR = async (req, res, next) => {
  try {
    const table = await DiningTable.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    const qrFilePath = path.join(qrDir, `${table.tableId}.png`);
    if (!fs.existsSync(qrFilePath)) {
      return res.status(404).json({ success: false, message: 'QR code not generated yet' });
    }

    res.download(qrFilePath, `QR-${table.tableId}.png`);
  } catch (error) {
    next(error);
  }
};

// @desc    Customer check-in when scanning QR code (marks table occupied with customer details)
// @route   POST /api/tables/checkin/:token
export const checkinTable = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { customerName, customerPhone, guests } = req.body;

    let table = null;

    if (isDemoToken(token)) {
      const tableId = demoTableFor(token).tableId;

      if (mongoose.connection.readyState === 1) {
        table = await DiningTable.findOne({ tableId });
      }

      if (!table) {
        const fb = fallbackTables.find((t) => t.tableId === tableId);
        if (fb) {
          fb.status = 'occupied';
          fb.reservation = null;
          fb.currentCustomer = {
            name: customerName || 'Guest',
            phone: customerPhone || '',
            guests: Number(guests) || 1,
            checkedInAt: new Date(),
          };
          const io = req.app.get('io');
          if (io) io.emit('table:statusUpdate', publicTable(fb));
          return res.json({ success: true, data: publicTable(fb), message: 'Checked in successfully' });
        }
      }
    } else {
      const qrToken = await QRToken.validateToken(token);
      if (qrToken?.table) {
        table = await DiningTable.findById(qrToken.table._id || qrToken.table);
      }
    }

    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found for this QR token' });
    }

    table.status = 'occupied';
    table.reservation = null;
    table.currentCustomer = {
      name: customerName || 'Guest',
      phone: customerPhone || '',
      guests: Number(guests) || 1,
      checkedInAt: new Date(),
    };
    await table.save();

    const populatedTable = await DiningTable.findById(table._id)
      .populate('currentQrToken')
      .populate('activeOrders');

    const io = req.app.get('io');
    if (io) {
      io.emit('table:statusUpdate', publicTable(populatedTable || table));
    }

    res.json({
      success: true,
      data: publicTable(populatedTable || table),
      message: `Table ${table.displayName} checked in as Occupied`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update table status (Admin / Counter control: Occupied, Available, Reserved)
// @route   PATCH /api/tables/:id/status
export const updateTableStatus = async (req, res, next) => {
  try {
    const { status, customerName, customerPhone, guests } = req.body;
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { tableId: id };

    let table = null;
    if (mongoose.connection.readyState === 1) {
      table = await DiningTable.findOne(query);
    }

    if (!table) {
      const fb = fallbackTables.find((t) => t._id === id || t.tableId === id);
      if (fb) {
        fb.status = status;
        if (status === 'available') {
          fb.currentCustomer = { name: '', phone: '', guests: 1 };
          fb.activeOrders = [];
          fb.reservation = null;
        } else if (status === 'occupied' && customerName) {
          fb.reservation = null;
          fb.currentCustomer = {
            name: customerName,
            phone: customerPhone || '',
            guests: Number(guests) || 1,
            checkedInAt: new Date(),
          };
        }
        const io = req.app.get('io');
        if (io) io.emit('table:statusUpdate', fb);
        return res.json({ success: true, data: fb });
      }
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.status = status;
    if (status === 'available') {
      table.currentCustomer = { name: '', phone: '', guests: 1 };
      table.reservation = null;
      // Clear completed/cancelled orders from active orders list
      table.activeOrders = [];
    } else if (status === 'occupied' && customerName) {
      table.reservation = null;
      table.currentCustomer = {
        name: customerName,
        phone: customerPhone || '',
        guests: Number(guests) || 1,
        checkedInAt: new Date(),
      };
    }

    await table.save();

    const populatedTable = await DiningTable.findById(table._id)
      .populate('currentQrToken')
      .populate('activeOrders');

    // Broadcast table status update in real time to all connected clients. The public
    // event carries the public shape only.
    const io = req.app.get('io');
    if (io) {
      io.emit('table:statusUpdate', publicTable(populatedTable || table));
    }

    recordAudit(req, 'table_status_changed', {
      targetModel: 'DiningTable',
      targetId: table._id,
      details: { tableId: table.tableId, status: table.status },
    });

    res.json({ success: true, data: populatedTable || table });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear / Free table (Counter/Admin quick action)
// @route   POST /api/tables/:id/clear
export const clearTable = async (req, res, next) => {
  req.body = req.body || {};
  req.body.status = 'available';
  return updateTableStatus(req, res, next);
};

