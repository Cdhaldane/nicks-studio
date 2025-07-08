import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Custom hook for managing SEO across the application
export const useSEO = () => {
  const location = useLocation();

  useEffect(() => {
    // Update page view for analytics
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname,
      });
    }

    // Update social media tracking pixels
    if (typeof fbq !== 'undefined') {
      fbq('track', 'PageView');
    }

    // Scroll to top on route change (good for UX and SEO)
    window.scrollTo(0, 0);
  }, [location]);

  return null;
};

// Hook for structured data management
export const useStructuredData = (schemaType, data) => {
  useEffect(() => {
    // Add structured data to page
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    script.id = `schema-${schemaType}`;

    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      const existingScript = document.getElementById(`schema-${schemaType}`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [schemaType, data]);
};

// Hook for canonical URL management
export const useCanonical = (url) => {
  useEffect(() => {
    const canonicalUrl = url || window.location.href.split('?')[0];
    
    // Remove existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalUrl;
    document.head.appendChild(link);

    return () => {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.remove();
      }
    };
  }, [url]);
};

// Hook for managing Open Graph images
export const useOpenGraphImage = (imageUrl) => {
  useEffect(() => {
    const fullImageUrl = imageUrl?.startsWith('http') 
      ? imageUrl 
      : `${window.location.origin}${imageUrl || '/nick-bio.jpg'}`;

    // Update Open Graph image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', fullImageUrl);

    // Update Twitter image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', fullImageUrl);
  }, [imageUrl]);
};

// Hook for performance monitoring (Core Web Vitals)
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }

    // Monitor page load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      console.log('Page Load Time:', loadTime);
      
      // Send to analytics if available
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_load_time', {
          value: loadTime,
          event_category: 'Performance'
        });
      }
    });
  }, []);
};

export default {
  useSEO,
  useStructuredData,
  useCanonical,
  useOpenGraphImage,
  usePerformanceMonitoring
};
