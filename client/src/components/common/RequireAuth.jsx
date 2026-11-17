import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../utils/roleHome';

/**
 * Keeps a screen behind a session. Signed-out visitors land on the staff login; a role
 * that does not belong here is sent to its own workspace instead of an error page.
 */
const RequireAuth = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="lw-route-loading" role="status" aria-live="polite"><span aria-hidden="true" />Checking your session…</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    const home = homeForRole(user.role);
    // Belt and braces: never send a role somewhere this same guard would reject.
    return <Navigate to={home === location.pathname ? '/cafe' : home} replace />;
  }
  return children;
};

export default RequireAuth;
