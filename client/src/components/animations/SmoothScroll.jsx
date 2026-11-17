import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * SmoothScroll: Wraps the application with Lenis smooth scrolling.
 * Provides butter-smooth inertial scrolling, velocity syncing,
 * and automatic scroll restoration on route changes.
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Initialize Lenis with tailored inertia & dampening
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential deceleration curve
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Connect Lenis to requestAnimationFrame loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Make lenis globally accessible for programmatic scroll (e.g. #tables-section)
    window.__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  // Handle route and hash navigation smoothly
  useEffect(() => {
    if (!lenisRef.current) return;

    if (location.hash) {
      const targetElement = document.querySelector(location.hash);
      if (targetElement) {
        // Smooth scroll to anchor
        setTimeout(() => {
          lenisRef.current?.scrollTo(targetElement, { offset: -80, duration: 1.2 });
        }, 100);
        return;
      }
    }

    // Scroll to top immediately on fresh route transition
    lenisRef.current.scrollTo(0, { immediate: true });
  }, [location.pathname, location.hash]);

  return <>{children}</>;
}
