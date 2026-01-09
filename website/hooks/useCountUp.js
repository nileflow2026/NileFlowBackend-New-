import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for animating numbers with count-up effect
 * @param {number} end - Target number to count to
 * @param {number} duration - Animation duration in milliseconds (default: 2000)
 * @param {number} start - Starting number (default: 0)
 * @returns {number} Current animated value
 */
export const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Reset if end value changes
    if (end === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - percentage, 3);

      const currentCount = start + (end - start) * easeOut;
      countRef.current = currentCount;
      setCount(currentCount);

      if (percentage < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end); // Ensure we end exactly at target
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      startTimeRef.current = null;
    };
  }, [end, duration, start]);

  return Math.round(count);
};

/**
 * Hook for staggered count-up animations (multiple numbers)
 * @param {number[]} values - Array of target values
 * @param {number} duration - Animation duration per value
 * @param {number} staggerDelay - Delay between starting each animation (default: 100ms)
 * @returns {number[]} Array of current animated values
 */
export const useStaggeredCountUp = (
  values,
  duration = 2000,
  staggerDelay = 100
) => {
  const [counts, setCounts] = useState(values.map(() => 0));
  const [startedAnimations, setStartedAnimations] = useState([]);

  useEffect(() => {
    const timers = values.map((_, index) => {
      return setTimeout(() => {
        setStartedAnimations((prev) => [...prev, index]);
      }, index * staggerDelay);
    });

    return () => timers.forEach(clearTimeout);
  }, [values, staggerDelay]);

  const animatedValues = values.map((value, index) => {
    const shouldAnimate = startedAnimations.includes(index);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return shouldAnimate ? useCountUp(value, duration) : 0;
  });

  return animatedValues;
};

export default useCountUp;
