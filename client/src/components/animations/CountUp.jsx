import { useState, useEffect, useRef } from 'react';

/**
 * CountUp: Smoothly animates numbers from the current value to target.
 * Inspired by design-ref/react-bits/TextAnimations/CountUp.
 * Uses requestAnimationFrame with cubic ease-out curve and IntersectionObserver.
 *
 * The target often arrives after the first render (stats load from the API), so a change
 * in `to` re-runs the animation from whatever is currently displayed instead of staying
 * stuck on the initial value.
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
  const valueRef = useRef(from);
  const rafRef = useRef(0);
  const timeoutRef = useRef(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const animateTo = () => {
      const startVal = Number(valueRef.current) || 0;
      const endVal = Number(to) || 0;
      const startTime = performance.now();
      const totalDuration = duration * 1000;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / totalDuration);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = startVal + (endVal - startVal) * easedProgress;

        setValue(currentVal);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setValue(endVal);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        if (!hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          timeoutRef.current = window.setTimeout(animateTo, delay * 1000);
          return;
        }
        // Already on screen and the target changed (data loaded): move to the new number.
        window.clearTimeout(timeoutRef.current);
        cancelAnimationFrame(rafRef.current);
        timeoutRef.current = window.setTimeout(animateTo, delay * 1000);
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    // The observer can miss elements inside transformed parents (the dashboard cards sit
    // in a tilting wrapper), so also start straight away when the element is on screen.
    const rect = element.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0
      && rect.left < window.innerWidth && rect.right > 0;
    if (inView) {
      if (!hasAnimatedRef.current) hasAnimatedRef.current = true;
      window.clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
      timeoutRef.current = window.setTimeout(animateTo, delay * 1000);
    }

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
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
