// What a public board (or a guest holding a table token) is allowed to see. Names and
// phone numbers are dropped, and the internal payment document never leaves the API.
export const publicOrderView = (order) => {
  if (!order) return order;
  const plain = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  delete plain.customerPhone;
  delete plain.payment;
  return plain;
};

export const publicOrderList = (orders = []) => orders.map(publicOrderView);

export default publicOrderView;
