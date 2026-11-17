import api from '../api/axios';

/**
 * The address a phone should use to open a table menu. A QR generated while the console
 * runs on localhost would encode "localhost", which on a phone means the phone itself —
 * so the server tells us the LAN (or public) address instead. Fetched once per session.
 */
let pending = null;

export const getPublicBaseUrl = () => {
  if (!pending) {
    pending = api.get('/config/public')
      .then((res) => res?.data?.publicUrl || null)
      .catch(() => null);
  }
  return pending;
};

export default getPublicBaseUrl;
