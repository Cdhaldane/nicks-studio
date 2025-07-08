# Custom React hooks for the application

This directory contains reusable custom hooks that encapsulate component logic and provide clean interfaces for common functionality.

## Hooks Available

- `useLocalStorage.js` - Persistent local storage state management
- `useSpotify.js` - Spotify API integration
- `useIntersectionObserver.js` - Intersection Observer for lazy loading
- `useShopify.js` - Shopify API integration
- `useKeyboard.js` - Keyboard event handling
- `useWindowSize.js` - Window size tracking for responsive design

## Usage

Import hooks as needed in your components:

```javascript
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSpotify } from '../hooks/useSpotify';
```
