import { useEffect, useRef } from 'react';

/**
 * AmbientBackground: Interactive ambient particle & steam simulation.
 * Inspired by design-ref/react-bits/Backgrounds/Particles & design-ref/vanta.
 * Provides floating particles, subtle coffee steam wisps, and cursor parallax.
 */
export default function AmbientBackground({
  density = 45,
  interactive = true,
  className = '',
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(150, 122, 161, 0.45)', // dusty_mauve
      'rgba(170, 161, 200, 0.35)', // lilac_ash
      'rgba(213, 198, 224, 0.40)', // thistle
      'rgba(191, 94, 107, 0.25)',  // rose accent
      'rgba(25, 42, 81, 0.18)',    // space_indigo
    ];

    // Initialize particles
    const particles = Array.from({ length: density }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4.5 + 1.2,
      speedY: -(Math.random() * 0.45 + 0.15), // gently rising like coffee aroma
      speedX: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      angle: Math.random() * Math.PI * 2,
    }));

    const handleMouseMove = (e) => {
      if (!interactive) return;
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Render loop
    const render = () => {
      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.angle) * 0.2;
        p.angle += p.pulseSpeed;

        // Wrap around top/bottom/sides
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Cursor repulsion / attraction
        if (interactive) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 1.5;
            p.x -= (dx / dist) * force;
            p.y -= (dy / dist) * force;
          }
        }

        // Draw soft glowing orb
        ctx.save();
        ctx.beginPath();
        const glowRadius = p.size * 2.8;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, interactive]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      {/* Dynamic radial gradient aura backdrops */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-dusty_mauve/15 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-lilac_ash/15 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-thistle/20 blur-3xl" />
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
