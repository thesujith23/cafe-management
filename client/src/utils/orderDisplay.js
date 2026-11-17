// Shared way to name a table and a guest, so the console, the café board and the
// tracker never show the same order two different ways.

export const orderTableLabel = (order) => (
  order?.table?.displayName
  || (order?.tableId ? `Table ${order.tableId}` : 'No table')
);

// "Table 5" and "TBL-005" both become "T5": a badge that fits a 40px square.
export const orderTableCode = (order) => {
  const source = order?.table?.displayName || order?.table?.tableId || order?.tableId || '';
  const digits = String(source).match(/\d+/);
  if (digits) return `T${Number(digits[0])}`;
  const word = String(source).trim().split(/\s+/)[0];
  return word ? word.slice(0, 3).toUpperCase() : 'T';
};

// Dishes ordered, counting quantities: two plates of one dish is two items.
export const orderItemCount = (order) => (order?.items || [])
  .reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

export const itemWord = (count) => (count === 1 ? 'item' : 'items');

// A single letter left by a half-typed check-in reads as a broken name, so it is
// treated as no name at all and the row says "Walk-in" instead.
export const guestName = (order) => {
  const name = String(order?.customerName || '').trim();
  if (name.length < 2) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};
