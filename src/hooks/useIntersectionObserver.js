import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for Intersection Observer
 * @param {object} options - IntersectionObserver options
 * @returns {array} - [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting, entry];
};

/**
 * Custom hook for lazy loading images
 * @param {string} src - Image source
 * @param {object} options - IntersectionObserver options
 * @returns {object} - { ref, isLoaded, isInView }
 */
export const useLazyImage = (src, options = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [ref, isInView] = useIntersectionObserver(options);

  useEffect(() => {
    if (isInView && !isLoaded && src) {
      const image = new Image();
      image.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      image.src = src;
    }
  }, [isInView, isLoaded, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isInView,
  };
};

/**
 * Custom hook for animating elements on scroll
 * @param {object} options - Animation options
 * @returns {object} - { ref, isVisible, hasAnimated }
 */
export const useScrollAnimation = (options = {}) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.2,
    ...options,
  });

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isVisible, hasAnimated]);

  return {
    ref,
    isVisible,
    hasAnimated,
  };
};
