import axios from 'axios';
import toast from 'react-hot-toast';

// Every service in apiServices.js passes a path that starts at the API root
// (e.g. '/tables/token/...'), and the Express app mounts all routes under /api.
// The Vite dev server proxies /api -> http://localhost:5000.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const isAuthProbe = (url = '') => url.startsWith('/auth/');

// Callers read the API payload directly (`res.success`, `res.data`, `res.message`),
// so hand back response.data instead of the full axios response object.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // A session that expired mid-shift should take the user back to sign-in rather
    // than leaving an empty console on screen.
    if (status === 401 && !isAuthProbe(url) && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lw:session-expired'));
    }

    // Say what happened once, instead of letting every caller invent its own copy.
    if (status === 429) {
      const message = error.response?.data?.message || 'That was a lot at once — give it a moment.';
      toast.error(message, { id: 'rate-limited' });
    }

    return Promise.reject(error);
  },
);

export default api;
