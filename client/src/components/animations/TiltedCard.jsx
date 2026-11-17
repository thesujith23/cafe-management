import { useRef, useState } from 'react';

/**
 * TiltedCard: 3D interactive perspective tilt with real-time cursor spotlight.
 * Inspired by design-ref/react-bits/Components/TiltedCard & SpotlightCard.
 * Uses hardware-accelerated CSS 3D transforms without heavy external runtime dependencies.
 */
export default function TiltedCard({
  children,
  className = '',
  maxRotation = 10,
  scale = 1.025,
  spotlightColor = 'rgba(213, 198, 224, 0.28)',
  glare = true,
  onClick
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxRotation;
    const rotateY = ((x - centerX) / centerX) * maxRotation;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
    );

    const pctX = (x / rect.width) * 100;
    const pctY = (y / rect.height) * 100;
    setSpotlightPos({ x: pctX, y: pctY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{
        transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transformStyle: 'preserve-3d'
      }}
    >
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-20 transition-opacity duration-300"
          style={{
            opacity: spotlightPos.opacity,
            background: `radial-gradient(circle 280px at ${spotlightPos.x}% ${spotlightPos.y}%, ${spotlightColor}, transparent 80%)`
          }}
        />
      )}
      <div style={{ transform: 'translateZ(18px)', transformStyle: 'preserve-3d' }} className="w-full h-full">
        {children}
      </div>
    </div>
  );
}
