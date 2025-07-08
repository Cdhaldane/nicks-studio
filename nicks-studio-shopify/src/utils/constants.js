// Application constants
export const CONSTANTS = {
  // Breakpoints
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
  },

  // Animation timings
  ANIMATION_DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },

  // API endpoints
  API_ENDPOINTS: {
    SPOTIFY_TOKEN: 'https://accounts.spotify.com/api/token',
    SPOTIFY_ARTIST: 'https://api.spotify.com/v1/artists',
  },

  // Storage keys
  STORAGE_KEYS: {
    THEME: 'nickola_theme',
    CART: 'nickola_cart',
    USER_PREFERENCES: 'nickola_preferences',
  },

  // Social media links
  SOCIAL_LINKS: {
    INSTAGRAM: 'https://www.instagram.com/nickolamagnolia',
    YOUTUBE: 'https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q',
    FACEBOOK: 'https://www.facebook.com/musicmagnolia/',
    TIKTOK: 'https://www.tiktok.com/@nickolamagnolia',
    SPOTIFY: 'https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4',
    APPLE_MUSIC: 'https://music.apple.com/ca/artist/nickola-magnolia/1588557558',
  },

  // Image rotation settings
  IMAGE_ROTATION: {
    INTERVAL: 15000, // 15 seconds
    IMAGES: ['n1.jpg', 'n2.jpg', 'n6.jpg'],
  },

  // Spotify artist ID
  SPOTIFY_ARTIST_ID: '5UrVks2tmoQ4BwTvlkQaI4',

  // Default settings
  DEFAULTS: {
    EMAIL_SIGNUP_DELAY: 5000,
    CART_ANIMATION_DURATION: 300,
    SCROLL_ANIMATION_THRESHOLD: 0.1,
  },

  // Error messages
  ERROR_MESSAGES: {
    SPOTIFY_AUTH_FAILED: 'Failed to authenticate with Spotify',
    SPOTIFY_FETCH_FAILED: 'Failed to fetch albums',
    SHOPIFY_FETCH_FAILED: 'Failed to fetch products',
    NETWORK_ERROR: 'Network error occurred',
    GENERIC_ERROR: 'An error occurred. Please try again.',
  },

  // Success messages
  SUCCESS_MESSAGES: {
    ITEM_ADDED_TO_CART: 'Item added to cart successfully',
    EMAIL_SUBSCRIBED: 'Successfully subscribed to newsletter',
    FORM_SUBMITTED: 'Form submitted successfully',
  },

  // Loading states
  LOADING_STATES: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
  },

  // Theme colors (matching CSS variables)
  COLORS: {
    PRIMARY: '#d83b65',
    SECONDARY: '#000000',
    TEXT: '#f3f3f3',
    BLUE: '#527af9',
    BLACK: '#141414',
    WHITE: '#ffffff',
    PINK: '#d83b65',
    DPINK: '#962344',
    GREEN: '#2cd37a',
    RED: '#e26262',
    YELLOW: '#ddc036',
  },
};

// Navigation menu items
export const NAVIGATION_ITEMS = [
  { path: '/', label: 'Home', exact: true },
  { path: '/about', label: 'About' },
  { path: '/music', label: 'Listen' },
  { path: '/shop', label: 'Merchandise' },
  { 
    path: 'https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q', 
    label: 'Watch', 
    external: true 
  },
];

// Social media configuration
export const SOCIAL_MEDIA = [
  {
    platform: 'instagram',
    url: CONSTANTS.SOCIAL_LINKS.INSTAGRAM,
    icon: 'fa-brands fa-instagram',
    label: 'Instagram',
  },
  {
    platform: 'youtube',
    url: CONSTANTS.SOCIAL_LINKS.YOUTUBE,
    icon: 'fa-brands fa-youtube',
    label: 'YouTube',
  },
  {
    platform: 'facebook',
    url: CONSTANTS.SOCIAL_LINKS.FACEBOOK,
    icon: 'fa-brands fa-facebook',
    label: 'Facebook',
  },
  {
    platform: 'tiktok',
    url: CONSTANTS.SOCIAL_LINKS.TIKTOK,
    icon: 'fa-brands fa-tiktok',
    label: 'TikTok',
  },
  {
    platform: 'spotify',
    url: CONSTANTS.SOCIAL_LINKS.SPOTIFY,
    icon: 'fa-brands fa-spotify',
    label: 'Spotify',
  },
  {
    platform: 'apple',
    url: CONSTANTS.SOCIAL_LINKS.APPLE_MUSIC,
    icon: 'fa-brands fa-apple',
    label: 'Apple Music',
  },
];

// SEO and meta data
export const SEO = {
  DEFAULT_TITLE: 'Nickola Magnolia - Country & Americana Artist',
  DEFAULT_DESCRIPTION: 'Intertwining classic Country melodies with intimate Rock and Americana influences from the shores of the Great Lakes.',
  KEYWORDS: 'Nickola Magnolia, Country Music, Americana, Canadian Artist, Music, Albums, Merchandise',
  SITE_URL: 'https://nickolamagnolia.com',
  TWITTER_HANDLE: '@nickolamagnolia',
  FACEBOOK_APP_ID: '',
};
