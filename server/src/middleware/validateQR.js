import config from '../config/index.js';
import QRToken from '../models/QRToken.js';

// Demo tokens let the marketing pages open a menu without a printed QR. They are a
// development affordance only: in production they would let anyone order at any table
// without ever scanning a standee.
export const isDemoToken = (token) => Boolean(token) && token.startsWith('demo-token-TBL-') && !config.isProduction;

export const demoTableFor = (token) => {
  const numStr = token.replace('demo-token-TBL-00', '').replace('demo-token-TBL-0', '');
  const num = parseInt(numStr, 10) || 1;
  return {
    table: {
      _id: `tbl_${num}`,
      tableId: `TBL-00${num}`,
      displayName: `Table ${num}`,
      capacity: num === 3 ? 6 : num === 5 ? 8 : num === 4 ? 2 : 4,
      status: 'available',
    },
    tableId: `TBL-00${num}`,
    displayName: `Table ${num}`,
  };
};

// Validate QR token from request and attach table info
const validateQRToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    if (isDemoToken(token)) {
      const demo = demoTableFor(token);
      req.qrToken = { token };
      req.table = demo.table;
      return next();
    }

    const qrToken = await QRToken.validateToken(token);

    if (!qrToken) {
      return res.status(401).json({ success: false, message: 'Invalid or expired QR code' });
    }

    // Attach validated table info to request — never trust client-supplied table IDs
    req.qrToken = qrToken;
    req.table = qrToken.table;
    next();
  } catch (error) {
    next(error);
  }
};

export default validateQRToken;
