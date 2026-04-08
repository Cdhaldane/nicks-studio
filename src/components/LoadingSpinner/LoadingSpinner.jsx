import React from 'react';
import PropTypes from 'prop-types';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '',
  overlay = false,
  fullScreen = false 
}) => {
  const getSpinnerClass = () => {
    const baseClass = 'loading-spinner';
    const sizeClass = `loading-spinner--${size}`;
    const colorClass = `loading-spinner--${color}`;
    
    return [baseClass, sizeClass, colorClass].join(' ');
  };

  const getContainerClass = () => {
    const baseClass = 'loading-container';
    const overlayClass = overlay ? 'loading-container--overlay' : '';
    const fullScreenClass = fullScreen ? 'loading-container--fullscreen' : '';
    
    return [baseClass, overlayClass, fullScreenClass].filter(Boolean).join(' ');
  };

  return (
    <div className={getContainerClass()}>
      <div className="loading-content">
        <div className={getSpinnerClass()}>
          <div className="loading-spinner__circle"></div>
          <div className="loading-spinner__circle"></div>
          <div className="loading-spinner__circle"></div>
          <div className="loading-spinner__circle"></div>
        </div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'white']),
  text: PropTypes.string,
  overlay: PropTypes.bool,
  fullScreen: PropTypes.bool,
};

export default LoadingSpinner;
