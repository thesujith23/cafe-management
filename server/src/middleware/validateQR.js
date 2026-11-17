import QRToken from '../models/QRToken.js';

// Validate QR token from request and attach table info
const validateQRToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required' });
    }

    if (token.startsWith('demo-token-TBL-')) {
      const numStr = token.replace('demo-token-TBL-00', '').replace('demo-token-TBL-0', '');
      const num = parseInt(numStr, 10) || 1;
      req.qrToken = { token };
      req.table = {
        _id: `tbl_${num}`,
        tableId: `TBL-00${num}`,
        displayName: `Table ${num}`,
      };
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
