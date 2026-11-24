

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Menu API
export const menuApi = {
  getCategories: () => api.get('/menu/categories'),
  getMenuItems: (params) => api.get('/menu/items', { params }),
  getMenuItem: (id) => api.get(`/menu/items/${id}`),
  createMenuItem: (data) => api.post('/menu/items', data),
  updateMenuItem: (id, data) => api.put(`/menu/items/${id}`, data),
  toggleAvailability: (id) => api.patch(`/menu/items/${id}/toggle-availability`),
  deleteMenuItem: (id) => api.delete(`/menu/items/${id}`),
};

// Table API
export const tableApi = {
  getTables: () => api.get('/tables'),
  getTablesManage: () => api.get('/tables/manage'),
  getTable: (id) => api.get(`/tables/${id}`),
  validateToken: (token) => api.get(`/tables/token/${token}`),
  createVirtualToken: (tableId) => api.post(`/tables/${tableId}/virtual-token`),
  generateQR: (id) => api.post(`/tables/${id}/qr`),
  updateStatus: (id, status, extraData = {}) => api.patch(`/tables/${id}/status`, { status, ...extraData }),
  checkin: (token, data) => api.post(`/tables/checkin/${token}`, data),
  createReservation: (id, data) => api.post(`/tables/${id}/reservations`, data),
  clearTable: (id) => api.post(`/tables/${id}/clear`),
};

// Order API
export const orderApi = {
  createOrder: (token, payload) => api.post(`/orders/token/${token}`, payload),
  getOrder: (id) => api.get(`/orders/${id}`),
  getOrderTimeline: (id) => api.get(`/orders/${id}/timeline`),
  getOrders: (params) => api.get('/orders', { params }),
  getOrdersByToken: (token) => api.get(`/orders/track/${token}`),
  updateOrderStatus: (id, status, cancellationReason) =>
    api.patch(`/orders/${id}/status`, { status, cancellationReason }),
  toggleOrderItem: (id, itemId, isDone) =>
    api.patch(`/orders/${id}/items/${itemId}`, { isDone }),
  cancelOrder: (id, reason, tableToken) =>
    api.patch(`/orders/${id}/cancel`, { reason, tableToken }),
  clearOrder: (id) => api.delete(`/orders/${id}`),
  notifyGuest: (id) => api.post(`/orders/${id}/notify`),
  getKitchenOrders: () => api.get('/orders/kitchen'),
  getDisplayOrders: () => api.get('/orders/display'),
  getStats: (period) => api.get('/orders/stats', { params: { period } }),
  getReports: (params) => api.get('/orders/reports', { params }),
};

// Payment API
export const paymentApi = {
  getPaymentKey: () => api.get('/payments/key'),
  createPaymentOrder: (orderId, tableToken) => api.post(`/payments/create/${orderId}`, { tableToken }),
  verifyPayment: (paymentDetails) => api.post('/payments/verify', paymentDetails),
};

// Settings API
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

// Chatbot API
import api from './axios';

export const chatBotApi = {
  sendMessage: (message) => api.post('/chat', { message }),
  // Returns the spoken reply as an audio blob (or rejects when voice is not configured).
  speak: (text) => api.post('/chat/speak', { text }, { responseType: 'blob' }),
};
