import { useState, useEffect, useRef } from 'react';

/**
 * CountUp: Smoothly animates numbers from start to target.
 * Inspired by design-ref/react-bits/TextAnimations/CountUp.
 * Uses requestAnimationFrame with cubic ease-out curve and IntersectionObserver.
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1.8,
  delay = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
}) {
  const [value, setValue] = useState(from);
  const ref = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;

          const delayTimer = setTimeout(() => {
            const startTime = performance.now();
            const startVal = Number(from) || 0;
            const endVal = Number(to) || 0;
            const totalDuration = duration * 1000;

            const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(1, elapsed / totalDuration);

              // Ease Out Cubic
              const easedProgress = 1 - Math.pow(1 - progress, 3);
              const currentVal = startVal + (endVal - startVal) * easedProgress;

              setValue(currentVal);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setValue(endVal);
              }
            };

            requestAnimationFrame(animate);
          }, delay * 1000);

          return () => clearTimeout(delayTimer);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [to, from, duration, delay]);

  const formattedValue = Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
