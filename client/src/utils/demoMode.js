// Demo affordances — the test payment button and the one-click staff logins — are
// for local development and explicit demo builds only. A production build shows the
// real flow instead.
export const DEMO_MODE = Boolean(import.meta.env.DEV) || import.meta.env.VITE_DEMO_MODE === 'true';
