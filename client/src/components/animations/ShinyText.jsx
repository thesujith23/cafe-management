/**
 * ShinyText: Shimmering metallic sweep effect for typography.
 * Refined from design-ref/react-bits/TextAnimations/ShinyText.
 * Uses hardware-accelerated CSS background clipping for high performance.
 */
export default function ShinyText({
  children,
  text,
  color = '#2f4a3a',
  shineColor = '#ffd3c7',
  spread = 120,
  speed = 3.5,
  className = '',
  ...props
}) {
  const content = text || children;

  return (
    <span
      className={`inline-block relative font-bold bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 40%, ${shineColor} 50%, ${color} 60%, ${color} 100%)`,
        backgroundSize: '250% 100%',
        animation: `shinySweep ${speed}s ease-in-out infinite`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
      {...props}
    >
      {content}
    </span>
  );
}
