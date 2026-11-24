/**
 * Finnegan's face, as flat SVG.
 *
 * Used for the launcher button, the panel header and the no-WebGL fallback, so the mascot
 * still looks like himself on a device that cannot render the 3D scene.
 */
const FoxFaceIcon = ({ className = '', title }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    role={title ? 'img' : 'presentation'}
    aria-hidden={title ? undefined : 'true'}
    focusable="false"
  >
    {title ? <title>{title}</title> : null}
    {/* ears */}
    <path d="M14 26 9 7l17 9Z" fill="#ef8f3c" stroke="#d4702a" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M50 26 55 7 38 16Z" fill="#ef8f3c" stroke="#d4702a" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M15.5 23.5 12.6 12l9.6 5.4Z" fill="#f9e8ce" />
    <path d="M48.5 23.5 51.4 12l-9.6 5.4Z" fill="#f9e8ce" />
    {/* head */}
    <path
      d="M32 15c11.6 0 20 7.6 20 18.8C52 45.6 43.4 55 32 55S12 45.6 12 33.8C12 22.6 20.4 15 32 15Z"
      fill="#ef8f3c"
      stroke="#d4702a"
      strokeWidth="1.6"
    />
    {/* cheeks */}
    <path d="M12.6 36c3.6-3.4 9.2-3 12.4.6-2.4 5.8-7.4 8.4-11.6 6.8-2.4-1-2.8-5.2-.8-7.4Z" fill="#f9e8ce" />
    <path d="M51.4 36c-3.6-3.4-9.2-3-12.4.6 2.4 5.8 7.4 8.4 11.6 6.8 2.4-1 2.8-5.2.8-7.4Z" fill="#f9e8ce" />
    {/* muzzle */}
    <path d="M32 30c5.6 0 9.6 3.4 9.6 8.2 0 5.6-4.2 10-9.6 10s-9.6-4.4-9.6-10c0-4.8 4-8.2 9.6-8.2Z" fill="#f9e8ce" />
    <path d="M32 39.4c2 0 3.4 1.2 3.4 2.7S33.7 45 32 45s-3.4-1.4-3.4-2.9 1.4-2.7 3.4-2.7Z" fill="#2a1a12" />
    {/* eyes */}
    <ellipse cx="24" cy="30.6" rx="3.1" ry="3.7" fill="#43240f" />
    <ellipse cx="40" cy="30.6" rx="3.1" ry="3.7" fill="#43240f" />
    <circle cx="25.1" cy="29.3" r="1.15" fill="#fffaf0" />
    <circle cx="41.1" cy="29.3" r="1.15" fill="#fffaf0" />
    {/* brows */}
    <path d="M20.4 24.6c1.8-1.2 4.4-1.2 6 0" stroke="#d4702a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M37.6 24.6c1.6-1.2 4.2-1.2 6 0" stroke="#d4702a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

export default FoxFaceIcon;
