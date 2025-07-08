import React, { useState, useCallback } from 'react';
import './OptimizedImage.css';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  loading = 'lazy',
  quality = 75,
  placeholder = 'blur',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // Create optimized image URL (for future CDN integration)
  const getOptimizedSrc = (originalSrc, width, quality) => {
    // For now, return original src
    // Later can integrate with image CDN like Cloudinary or ImageKit
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src, width, quality);

  return (
    <div className={`optimized-image-container ${className}`} {...props}>
      {!isLoaded && (
        <div className="image-placeholder">
          <div className="loading-skeleton" style={{ width, height }}>
            <div className="skeleton-shimmer"></div>
          </div>
        </div>
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
        style={{
          display: isLoaded ? 'block' : 'none',
          width: '100%',
          height: 'auto',
          objectFit: 'cover'
        }}
      />
      
      {hasError && (
        <div className="image-error" style={{ width, height }}>
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
