import React from 'react';

const ResponsiveImage = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  loading = 'lazy',
  sizes = '100vw',
  priority = false,
  ...props 
}) => {
  // Extract filename without extension
  const getImageName = (imageSrc) => {
    const filename = imageSrc.split('/').pop();
    return filename.split('.')[0];
  };

  // Generate responsive image sources
  const imageName = getImageName(src);
  
  const generateSrcSet = (name, format = 'jpg') => {
    const basePath = format === 'webp' ? `${process.env.PUBLIC_URL}/optimized/webp/` : `${process.env.PUBLIC_URL}/optimized/`;
    const extension = format === 'webp' ? '.webp' : '.jpg';
    
    return [
      `${basePath}${name}-thumbnail${extension} 300w`,
      `${basePath}${name}-small${extension} 640w`,
      `${basePath}${name}-medium${extension} 1024w`,
      `${basePath}${name}-large${extension} 1920w`,
      `${basePath}${name}-hero${extension} 2560w`
    ].join(', ');
  };

  const webpSrcSet = generateSrcSet(imageName, 'webp');
  const jpegSrcSet = generateSrcSet(imageName, 'jpg');
  const fallbackSrc = `${process.env.PUBLIC_URL}/optimized/${imageName}-medium.jpg`;

  return (
    <picture className={`responsive-image ${className}`} {...props}>
      {/* WebP for modern browsers */}
      <source 
        srcSet={webpSrcSet}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* JPEG fallback */}
      <source 
        srcSet={jpegSrcSet}
        sizes={sizes}
        type="image/jpeg"
      />
      
      {/* Fallback img element */}
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'cover'
        }}
      />
    </picture>
  );
};

export default ResponsiveImage;
