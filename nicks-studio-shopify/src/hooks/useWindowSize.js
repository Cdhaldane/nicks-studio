import { useState, useEffect } from 'react';

/**
 * Custom hook for tracking window size
 * @returns {object} - { width, height, isMobile, isTablet, isDesktop }
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
  };
};

/**
 * Custom hook for detecting device type
 * @returns {object} - { isMobile, isTablet, isDesktop }
 */
export const useDevice = () => {
  const { width } = useWindowSize();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
};

/**
 * Custom hook for responsive breakpoints
 * @returns {object} - { sm, md, lg, xl }
 */
export const useBreakpoints = () => {
  const { width } = useWindowSize();

  return {
    sm: width >= 576,
    md: width >= 768,
    lg: width >= 1024,
    xl: width >= 1280,
  };
};
