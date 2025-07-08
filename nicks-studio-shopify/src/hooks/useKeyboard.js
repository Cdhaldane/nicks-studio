import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard events
 * @param {object} keyBindings - Object mapping keys to functions
 * @param {array} deps - Dependencies array
 */
export const useKeyboard = (keyBindings, deps = []) => {
  const handleKeyDown = useCallback((event) => {
    const key = event.key.toLowerCase();
    const binding = keyBindings[key];
    
    if (binding && typeof binding === 'function') {
      event.preventDefault();
      binding(event);
    }
  }, [keyBindings, ...deps]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Custom hook for escape key handling
 * @param {function} callback - Function to call on escape
 * @param {boolean} enabled - Whether the hook is enabled
 */
export const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, enabled]);
};

/**
 * Custom hook for arrow key navigation
 * @param {function} onArrowUp - Function to call on arrow up
 * @param {function} onArrowDown - Function to call on arrow down
 * @param {function} onArrowLeft - Function to call on arrow left
 * @param {function} onArrowRight - Function to call on arrow right
 * @param {boolean} enabled - Whether the hook is enabled
 */
export const useArrowKeys = (
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleArrowKeys = (event) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp && onArrowUp();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown && onArrowDown();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft && onArrowLeft();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight && onArrowRight();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleArrowKeys);
    return () => document.removeEventListener('keydown', handleArrowKeys);
  }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, enabled]);
};
