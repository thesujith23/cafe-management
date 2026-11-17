import mongoose from 'mongoose';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import CafeSettings from '../models/CafeSettings.js';
import OrderStatusHistory from '../models/OrderStatusHistory.js';
import DiningTable from '../models/DiningTable.js';
import { withProgress, withProgressList, loadOrderTimeline } from '../services/progressService.js';
import { fallbackMenuItems } from './menuController.js';

// @desc    Create a new order (called after cart submission, before payment)
// @route   POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const { items, customerNotes } = req.body;
    const table = req.table; // Set by validateQR middleware

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    const settings = await CafeSettings.getSettings();

    // Resolve table
    let tableDocId = null;
    const tableIdentifier = table?.tableId || 'TBL-001';

    if (table?._id && mongoose.Types.ObjectId.isValid(table._id)) {
      tableDocId = table._id;
    } else if (tableIdentifier && mongoose.connection.readyState === 1) {
      const realTable = await DiningTable.findOne({ tableId: tableIdentifier });
      if (realTable) {
        tableDocId = realTable._id;
      }
    }

    // Build order items from trusted DB prices (never trust client prices)
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of items) {
      let menuItem = null;

      // 1. Try finding by MongoDB ObjectId if valid
      if (cartItem.menuItemId && mongoose.Types.ObjectId.isValid(cartItem.menuItemId)) {
        menuItem = await MenuItem.findById(cartItem.menuItemId);
      }

      // 2. If not found or ID is string like 'item_1', search by name in DB
      if (!menuItem && cartItem.name && mongoose.connection.readyState === 1) {
        menuItem = await MenuItem.findOne({
          name: new RegExp(`^${cartItem.name.trim()}$`, 'i'),
          isArchived: false,
        });
      }

      // 3. Fallback item matching (handles demo items or items loaded during temporary offline state)
      if (!menuItem) {
        const fallback = fallbackMenuItems.find(
          (f) => f._id === cartItem.menuItemId || f.name.toLowerCase() === cartItem.name?.trim().toLowerCase()
        );
        if (fallback) {
          // If DB is connected, find the seeded DB item with matching name
          if (mongoose.connection.readyState === 1) {
            menuItem = await MenuItem.findOne({
              name: new RegExp(`^${fallback.name.trim()}$`, 'i'),
              isArchived: false,
            });
          }
          // If still no DB record, create mock MenuItem object from fallback
          if (!menuItem) {
            menuItem = {
              _id: null,
              name: fallback.name,
              price: fallback.price,
              discountPercent: fallback.discountPercent || 0,
              isVeg: fallback.isVeg,
              prepTime: fallback.prepTime || 15,
              sizes: fallback.sizes || [],
              addons: fallback.addons || [],
              isAvailable: true,
            };
          }
        }
      }

      if (!menuItem || !menuItem.isAvailable || menuItem.isArchived) {
        return res.status(400).json({
          success: false,
          message: `Item "${cartItem.name || cartItem.menuItemId}" is not available`,
        });
      }

      let unitPrice = menuItem.price;
      let sizeInfo = { name: '', price: 0 };
      let addonTotal = 0;
      const selectedAddons = [];

      // Handle size selection
      if (cartItem.selectedSizeId && menuItem.sizes?.length) {
        let size = null;
        if (typeof menuItem.sizes.id === 'function') {
          size = menuItem.sizes.id(cartItem.selectedSizeId);
        } else {
          size = menuItem.sizes.find(s => s._id === cartItem.selectedSizeId || s.name === cartItem.selectedSizeName);
        }
        if (size) {
          unitPrice = size.price;
          sizeInfo = { name: size.name, price: size.price };
        }
      }

      // Handle add-ons
      if (cartItem.selectedAddonIds?.length && menuItem.addons?.length) {
        for (const addonId of cartItem.selectedAddonIds) {
          let addon = null;
          if (typeof menuItem.addons.id === 'function') {
            addon = menuItem.addons.id(addonId);
          } else {
            addon = menuItem.addons.find(a => a._id === addonId || a.name === addonId);
          }
          if (addon && addon.isAvailable !== false) {
            addonTotal += addon.price;
            selectedAddons.push({ name: addon.name, price: addon.price });
          }
        }
      }

      const quantity = Math.max(1, Math.floor(cartItem.quantity || 1));
      const itemTotal = (unitPrice + addonTotal) * quantity;

      // Apply item-level discount
      const discountMultiplier = (100 - (menuItem.discountPercent || 0)) / 100;
      const discountedItemTotal = Math.round(itemTotal * discountMultiplier * 100) / 100;

      orderItems.push({
        menuItem: menuItem._id && mongoose.Types.ObjectId.isValid(menuItem._id) ? menuItem._id : undefined,
        name: menuItem.name,
        unitPrice,
        quantity,
        selectedSize: sizeInfo,
        selectedAddons,
        customizations: cartItem.customizations || [],
        specialInstructions: cartItem.specialInstructions || '',
        itemTotal: discountedItemTotal,
        isVeg: menuItem.isVeg,
        prepTime: menuItem.prepTime || 15,
      });

      subtotal += discountedItemTotal;
    }

    // Calculate taxes from server-side settings
    let taxAmount = 0;
    const taxDetails = { cgst: 0, sgst: 0, serviceCharge: 0 };

    if (settings.taxConfig?.isGstEnabled) {
      taxDetails.cgst = Math.round(subtotal * (settings.taxConfig.cgstPercent / 100) * 100) / 100;
      taxDetails.sgst = Math.round(subtotal * (settings.taxConfig.sgstPercent / 100) * 100) / 100;
      taxDetails.serviceCharge = Math.round(
        subtotal * (settings.taxConfig.serviceChargePercent / 100) * 100
      ) / 100;
      taxAmount = taxDetails.cgst + taxDetails.sgst + taxDetails.serviceCharge;
    }

    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const orderNumber = await CafeSettings.getNextOrderNumber();

    // Estimate prep time: max prep time of items * 1.2 factor
    const maxPrepTime = Math.max(...orderItems.map(i => i.prepTime || 15), 15);

    const orderData = {
      orderNumber,
      tableId: tableIdentifier,
      items: orderItems,
      subtotal,
      taxDetails,
      taxAmount,
      totalAmount,
      customerNotes: customerNotes || '',
      customerName: req.body.customerName || '',
      customerPhone: req.body.customerPhone || '',
      paymentStatus: 'pending',
      preparationStatus: 'waiting_payment',
      estimatedPrepTime: Math.ceil(maxPrepTime * 1.2),
    };

    if (tableDocId) {
      orderData.table = tableDocId;
    }

    const order = await Order.create(orderData);

    // Add order to table's active orders and ensure table is marked occupied
    if (tableDocId) {
      const tableUpdate = {
        $push: { activeOrders: order._id },
        status: 'occupied',
      };
      if (req.body.customerName) {
        tableUpdate['currentCustomer.name'] = req.body.customerName;
      }
      if (req.body.customerPhone) {
        tableUpdate['currentCustomer.phone'] = req.body.customerPhone;
      }
      await DiningTable.findByIdAndUpdate(tableDocId, tableUpdate);
    }

    await OrderStatusHistory.create({
      order: order._id,
      fromStatus: 'none',
      toStatus: 'waiting_payment',
      note: 'Order created, awaiting payment',
    });

    let populatedOrder = order;
    if (mongoose.connection.readyState === 1 && tableDocId) {
      try {
        populatedOrder = await Order.findById(order._id).populate('table', 'tableId displayName');
      } catch (popErr) {
        console.warn('Notice: populate order failed:', popErr.message);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedOrder || order,
      order: populatedOrder || order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID (customer or staff)
// @route   GET /api/orders/:id
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'tableId displayName')
      .populate('payment');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the recorded status timeline for an order (customer card / staff drawer)
// @route   GET /api/orders/:id/timeline
export const getOrderTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: { timeline: [] }, isFallback: true });
    }
    if (!(await Order.exists({ _id: id }))) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { timeline: await loadOrderTimeline(id) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders by table token (customer tracking)
// @route   GET /api/orders/table/:token
export const getOrdersByToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    let tableId = null;

    if (token && token.startsWith('demo-token-TBL-')) {
      const numStr = token.replace('demo-token-TBL-00', '').replace('demo-token-TBL-0', '');
      const num = parseInt(numStr, 10) || 1;
      const realTable = await DiningTable.findOne({ tableId: `TBL-00${num}` });
      tableId = realTable?._id;
    } else {
      const QRToken = (await import('../models/QRToken.js')).default;
      const qrToken = await QRToken.validateToken(token);
      if (!qrToken) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      tableId = qrToken.table?._id;
    }

    const filter = tableId
      ? { table: tableId, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      : { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };

    const orders = await Order.find(filter)
      .populate('table', 'tableId displayName')
      .sort({ createdAt: -1 });

    const payload = withProgressList(orders);
    res.json({ success: true, data: payload, orders: payload });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin/staff)
// @route   GET /api/orders
export const getOrders = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      isFallback: true,
    });
  }

  try {
    const { status, paymentStatus, table, date, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) filter.preparationStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (table) filter.tableId = table;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('table', 'tableId displayName')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: withProgressList(orders),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.warn('Notice: getOrders database query failed, using empty fallback:', error.message);
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      isFallback: true,
    });
  }
};

// @desc    Update order preparation status (kitchen)
// @route   PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Normalize incoming status: 'served' is treated as 'completed'
    const targetStatus = status === 'served' ? 'completed' : status;

    // Validate status transitions
    const validTransitions = {
      waiting_payment: ['new', 'cancelled'],
      new: ['accepted', 'preparing', 'cancelled'],
      accepted: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      // 'preparing' here is the kitchen recalling a ticket it bumped by mistake.
      ready: ['completed', 'served', 'preparing'],
      completed: [],
      cancelled: [],
    };

    const allowed = validTransitions[order.preparationStatus];
    if (!allowed || (!allowed.includes(status) && !allowed.includes(targetStatus))) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${order.preparationStatus}' to '${status}'`,
      });
    }

    const fromStatus = order.preparationStatus;
    order.preparationStatus = targetStatus;

    // Set timestamps
    if (targetStatus === 'accepted') order.acceptedAt = new Date();
    if (targetStatus === 'preparing') {
      // Also covers a recall from ready: the dish is back in the pan, so the clock restarts
      // and the order gets a fresh estimate instead of resuming an overdue one.
      order.preparingAt = new Date();
      order.readyAt = undefined;
    }
    if (targetStatus === 'ready') order.readyAt = new Date();
    if (targetStatus === 'completed') {
      order.completedAt = new Date();
      if (order.table && mongoose.Types.ObjectId.isValid(order.table)) {
        await DiningTable.findByIdAndUpdate(order.table, {
          $pull: { activeOrders: order._id },
        });
      }
    }
    if (targetStatus === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelReason = req.body.reason || req.body.cancellationReason || '';
      if (order.table && mongoose.Types.ObjectId.isValid(order.table)) {
        await DiningTable.findByIdAndUpdate(order.table, {
          $pull: { activeOrders: order._id },
        });
      }
    }

    await order.save();

    await OrderStatusHistory.create({
      order: order._id,
      fromStatus,
      toStatus: targetStatus,
      changedBy: req.user?._id,
      note: req.body.reason || req.body.cancellationReason || '',
    });

    const savedOrder = await Order.findById(order._id)
      .populate('table', 'tableId displayName');
    const updatedOrder = withProgress(savedOrder);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const payload = {
        _id: updatedOrder._id,
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        preparationStatus: updatedOrder.preparationStatus,
        tableId: updatedOrder.tableId,
        order: updatedOrder,
      };

      io.to('kitchen').emit('order:statusUpdate', updatedOrder);
      io.to('kitchen').emit('order:status:changed', payload);

      io.to('admin').emit('order:statusUpdate', updatedOrder);
      io.to('admin').emit('order:status:changed', payload);

      io.to('display').emit('order:statusUpdate', updatedOrder);
      io.to('display').emit('order:status:changed', payload);

      io.to(`order:${order._id}`).emit('order:statusUpdate', updatedOrder);
      io.to(`order:${order._id}`).emit('order:status:changed', payload);
    }

    res.json({ success: true, data: updatedOrder, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Tick a dish on the ticket, or put it back in the pan
// @route   PATCH /api/orders/:id/items/:itemId
export const updateOrderItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(404).json({ success: false, message: 'Order or dish not found' });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['new', 'accepted', 'preparing', 'ready'].includes(order.preparationStatus)) {
      return res.status(400).json({ success: false, message: 'This order is closed — its dishes cannot change.' });
    }

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'That dish is not on this order' });

    // No value means "flip it", which is what a tap on the ticket does.
    const isDone = req.body?.isDone === undefined ? !item.isDone : Boolean(req.body.isDone);
    item.isDone = isDone;
    item.doneAt = isDone ? new Date() : undefined;
    await order.save();

    const savedOrder = await Order.findById(order._id).populate('table', 'tableId displayName');
    const updatedOrder = withProgress(savedOrder);

    const io = req.app.get('io');
    if (io) {
      for (const room of ['kitchen', 'admin', `order:${order._id}`]) {
        io.to(room).emit('order:items:update', updatedOrder);
      }
    }

    res.json({ success: true, data: updatedOrder, order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get kitchen orders (paid, active)
// @route   GET /api/orders/kitchen
export const getKitchenOrders = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: [], isFallback: true });
  }

  try {
    const orders = await Order.find({
      paymentStatus: 'paid',
      preparationStatus: { $in: ['new', 'accepted', 'preparing', 'ready'] },
    })
      .populate('table', 'tableId displayName')
      .sort({ createdAt: 1 });

    const payload = withProgressList(orders);
    res.json({ success: true, data: payload, orders: payload });
  } catch (error) {
    console.warn('Notice: getKitchenOrders DB query failed, using empty fallback:', error.message);
    res.json({ success: true, data: [], orders: [], isFallback: true });
  }
};

// @desc    Get public display orders (sanitized)
// @route   GET /api/orders/display
export const getDisplayOrders = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      data: { queued: [], preparing: [], ready: [], active: [], recentlyCompleted: [] },
      queued: [],
      preparing: [],
      ready: [],
      isFallback: true,
    });
  }

  try {
    const activeOrders = await Order.find({
      paymentStatus: 'paid',
      preparationStatus: { $in: ['new', 'accepted', 'preparing', 'ready'] },
      createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    })
      .populate('table', 'tableId displayName')
      .select('orderNumber preparationStatus paymentStatus table tableId items customerNotes estimatedPrepTime readyAt preparingAt createdAt')
      .sort({ createdAt: 1 });

    const queued = activeOrders.filter((o) => o.preparationStatus === 'new' || o.preparationStatus === 'accepted');
    const preparing = activeOrders.filter((o) => o.preparationStatus === 'preparing');
    const ready = activeOrders.filter((o) => o.preparationStatus === 'ready');

    // Also get recently completed (last 30 minutes)
    const completed = await Order.find({
      preparationStatus: 'completed',
      completedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    })
      .populate('table', 'tableId displayName')
      .select('orderNumber preparationStatus table tableId items completedAt')
      .sort({ completedAt: -1 })
      .limit(10);

    const now = Date.now();
    const progressLists = {
      queued: withProgressList(queued, now),
      preparing: withProgressList(preparing, now),
      ready: withProgressList(ready, now),
      active: withProgressList(activeOrders, now),
      recentlyCompleted: withProgressList(completed, now),
    };

    res.json({
      success: true,
      data: progressLists,
      ...progressLists,
    });
  } catch (error) {
    console.warn('Notice: getDisplayOrders DB query failed, using empty fallback:', error.message);
    res.json({
      success: true,
      data: { queued: [], preparing: [], ready: [], active: [], recentlyCompleted: [] },
      queued: [],
      preparing: [],
      ready: [],
      isFallback: true,
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/orders/stats
export const getOrderStats = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      data: {
        totalOrders: 0,
        paidOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        todayRevenue: 0,
        bestSelling: [],
        tableSummary: [],
      },
      isFallback: true,
    });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = { createdAt: { $gte: today, $lt: tomorrow } };

    const [
      totalToday,
      paidToday,
      preparingCount,
      readyCount,
      completedToday,
      cancelledToday,
      revenueResult,
    ] = await Promise.all([
      Order.countDocuments(todayFilter),
      Order.countDocuments({ ...todayFilter, paymentStatus: 'paid' }),
      Order.countDocuments({ ...todayFilter, preparationStatus: 'preparing' }),
      Order.countDocuments({ ...todayFilter, preparationStatus: 'ready' }),
      Order.countDocuments({ ...todayFilter, preparationStatus: 'completed' }),
      Order.countDocuments({ ...todayFilter, preparationStatus: 'cancelled' }),
      Order.aggregate([
        { $match: { ...todayFilter, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Best selling items today
    const bestSelling = await Order.aggregate([
      { $match: { ...todayFilter, paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.itemTotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // Table-wise summary
    const tableSummary = await Order.aggregate([
      { $match: { ...todayFilter, paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$tableId',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalOrders: totalToday,
        paidOrders: paidToday,
        preparingOrders: preparingCount,
        readyOrders: readyCount,
        completedOrders: completedToday,
        cancelledOrders: cancelledToday,
        todayRevenue: revenueResult[0]?.total || 0,
        bestSelling,
        tableSummary,
      },
    });
  } catch (error) {
    console.warn('Notice: getOrderStats DB query failed, using empty fallback:', error.message);
    res.json({
      success: true,
      data: {
        totalOrders: 0,
        paidOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        todayRevenue: 0,
        bestSelling: [],
        tableSummary: [],
      },
      isFallback: true,
    });
  }
};

// @desc    Get sales report
// @route   GET /api/orders/reports
export const getSalesReport = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      if (period === 'daily') start.setDate(start.getDate() - 1);
      else if (period === 'weekly') start.setDate(start.getDate() - 7);
      else if (period === 'monthly') start.setMonth(start.getMonth() - 1);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filter = {
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    };

    const [summary, dailyBreakdown] = await Promise.all([
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            totalTax: { $sum: '$taxAmount' },
            totalDiscount: { $sum: '$discountAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate: start,
        endDate: end,
        summary: summary[0] || { totalOrders: 0, totalRevenue: 0, totalTax: 0, totalDiscount: 0, avgOrderValue: 0 },
        dailyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (Customer 1-minute window OR Admin/Counter override)
// @route   PATCH /api/orders/:id/cancel
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason, isStaffOverride } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // If order is already completed or cancelled
    if (['completed', 'cancelled'].includes(order.preparationStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.preparationStatus}`,
      });
    }

    const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    // If not staff override, enforce 1-minute (65s for network transit tolerance)
    if (!isStaffOverride) {
      if (order.preparationStatus === 'preparing' || order.preparationStatus === 'ready') {
        return res.status(400).json({
          success: false,
          canCancelOnline: false,
          message: 'The kitchen has already started cooking your order. Please visit the counter to cancel.',
        });
      }

      if (elapsedSeconds > 65) {
        return res.status(400).json({
          success: false,
          canCancelOnline: false,
          elapsedSeconds,
          message: 'Online cancellation window (1 minute) has expired. Please visit the counter to cancel your order.',
        });
      }
    }

    const fromStatus = order.preparationStatus;
    order.preparationStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason || (isStaffOverride ? 'Cancelled by Counter Staff' : 'Customer cancelled within 1-minute window');

    // Update payment status if paid
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    await order.save();

    // Pull order from table's activeOrders
    if (order.table && mongoose.Types.ObjectId.isValid(order.table)) {
      await DiningTable.findByIdAndUpdate(order.table, {
        $pull: { activeOrders: order._id },
      });
    }

    await OrderStatusHistory.create({
      order: order._id,
      fromStatus,
      toStatus: 'cancelled',
      changedBy: req.user?._id,
      note: order.cancelReason,
    });

    const savedOrder = await Order.findById(order._id)
      .populate('table', 'tableId displayName');
    const updatedOrder = withProgress(savedOrder);

    const io = req.app.get('io');
    if (io) {
      const payload = {
        _id: updatedOrder._id,
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        preparationStatus: 'cancelled',
        tableId: updatedOrder.tableId,
        order: updatedOrder,
      };

      io.to('kitchen').emit('order:statusUpdate', updatedOrder);
      io.to('kitchen').emit('order:status:changed', payload);
      io.to('kitchen').emit('order:cancelled', payload);

      io.to('admin').emit('order:statusUpdate', updatedOrder);
      io.to('admin').emit('order:status:changed', payload);

      io.to('display').emit('order:statusUpdate', updatedOrder);
      io.to('display').emit('order:status:changed', payload);

      io.to(`order:${order._id}`).emit('order:statusUpdate', updatedOrder);
      io.to(`order:${order._id}`).emit('order:status:changed', payload);
      io.to(`token:${order.tableId}`).emit('order:status:changed', payload);
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss / Clear completed or served order from live boards and table
// @route   DELETE /api/orders/:id
export const clearOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // If order was ready, mark completed
    if (order.preparationStatus === 'ready') {
      order.preparationStatus = 'completed';
      order.completedAt = new Date();
      await order.save();
    }

    // Pull from table active orders
    if (order.table && mongoose.Types.ObjectId.isValid(order.table)) {
      await DiningTable.findByIdAndUpdate(order.table, {
        $pull: { activeOrders: order._id },
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to('display').emit('order:served', { orderId: order._id });
      io.to('display').emit('order:statusUpdate', { _id: order._id, preparationStatus: 'completed' });
      io.to('kitchen').emit('order:status:changed', { orderId: order._id, preparationStatus: 'completed' });
      io.to('admin').emit('order:status:changed', { orderId: order._id, preparationStatus: 'completed' });
    }

    res.json({ success: true, message: 'Order cleared from live board and tables' });
  } catch (error) {
    next(error);
  }
};

