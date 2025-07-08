import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/helpers';
import { CONSTANTS } from '../utils/constants';

// Theme context
const ThemeContext = createContext();

// Theme reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'SET_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  theme: storage.get(CONSTANTS.STORAGE_KEYS.THEME, 'dark'),
  preferences: storage.get(CONSTANTS.STORAGE_KEYS.USER_PREFERENCES, {
    animations: true,
    sound: true,
    autoplay: false,
    reducedMotion: false,
  }),
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Persist theme to localStorage
  useEffect(() => {
    storage.set(CONSTANTS.STORAGE_KEYS.THEME, state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Persist preferences to localStorage
  useEffect(() => {
    storage.set(CONSTANTS.STORAGE_KEYS.USER_PREFERENCES, state.preferences);
  }, [state.preferences]);

  // Set theme
  const setTheme = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  // Toggle theme
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  // Set preferences
  const setPreferences = (preferences) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  };

  const value = {
    theme: state.theme,
    preferences: state.preferences,
    setTheme,
    toggleTheme,
    setPreferences,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// App context for global state
const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_MOBILE_MENU_OPEN':
      return { ...state, mobileMenuOpen: action.payload };
    case 'SET_MODAL_OPEN':
      return { ...state, modalOpen: action.payload };
    default:
      return state;
  }
};

const appInitialState = {
  loading: false,
  error: null,
  user: null,
  mobileMenuOpen: false,
  modalOpen: false,
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, appInitialState);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setUser = (user) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setMobileMenuOpen = (open) => {
    dispatch({ type: 'SET_MOBILE_MENU_OPEN', payload: open });
  };

  const setModalOpen = (open) => {
    dispatch({ type: 'SET_MODAL_OPEN', payload: open });
  };

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    setUser,
    setMobileMenuOpen,
    setModalOpen,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
