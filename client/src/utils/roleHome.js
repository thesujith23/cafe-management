/**
 * Where each staff role actually works. The account decides it — nobody picks a role.
 * Every destination here must be open to that role, or a guard will bounce the account
 * straight back and the two redirects chase each other forever.
 */
export const homeForRole = (role) => {
  if (role === 'kitchen') return '/kitchen';
  // Display screens watch the café scene; /admin refuses them, so sending them there loops.
  if (role === 'display') return '/cafe';
  return '/admin';
};

export default homeForRole;
