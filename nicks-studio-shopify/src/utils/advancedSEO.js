// Advanced SEO utilities for better Google search visibility

// Generate dynamic meta tags based on content
export const generateMetaTags = (page, content = {}) => {
  const baseUrl = 'https://nickolamagnolia.com';
  const defaultImage = '/nick-bio.jpg';
  
  const pageMeta = {
    home: {
      title: "Nickola Magnolia - Country & Americana Music from the Great Lakes",
      description: "Intertwining classic Country melodies with intimate Rock and Americana influences from the shores of the Great Lakes. Listen to new music, shop merchandise, and tour dates.",
      keywords: "Nickola Magnolia, country music, americana, great lakes, country artist, music, albums, tour, merchandise, michigan artist",
      image: defaultImage
    },
    music: {
      title: "Music - Nickola Magnolia | Albums & Songs",
      description: "Discover the latest albums and singles from Nickola Magnolia. Stream Country & Americana music from the Great Lakes region on Spotify and other platforms.",
      keywords: "Nickola Magnolia music, country albums, americana songs, spotify artist, new music releases, great lakes country",
      image: content.albumImage || defaultImage
    },
    shop: {
      title: "Shop - Nickola Magnolia | Official Merchandise",
      description: "Shop official Nickola Magnolia merchandise including t-shirts, hoodies, vinyl records, and more. Support your favorite Country & Americana artist from the Great Lakes.",
      keywords: "Nickola Magnolia merchandise, country music merch, band t-shirts, vinyl records, artist shop, americana merchandise",
      image: content.productImage || defaultImage
    },
    about: {
      title: "About Nickola Magnolia | Country & Americana Artist Biography",
      description: "Learn about Nickola Magnolia, a Country & Americana artist from the Great Lakes region. Read her story, musical journey, and notable performances.",
      keywords: "Nickola Magnolia biography, country artist bio, americana musician, great lakes artist, broken lonesome album",
      image: defaultImage
    },
    privacy: {
      title: "Privacy Policy - Nickola Magnolia",
      description: "Privacy Policy for Nickola Magnolia's official website. Learn how we collect, use, and protect your personal information.",
      keywords: "privacy policy, data protection, personal information, website privacy",
      image: defaultImage
    },
    terms: {
      title: "Terms of Service - Nickola Magnolia",
      description: "Terms of Service for Nickola Magnolia's official website. Read our terms and conditions for using our website and services.",
      keywords: "terms of service, terms and conditions, website terms, legal",
      image: defaultImage
    },
    accessibility: {
      title: "Accessibility Statement - Nickola Magnolia",
      description: "Our commitment to making Nickola Magnolia's website accessible to all users. Learn about our accessibility features and how to get help.",
      keywords: "accessibility statement, web accessibility, inclusive design, disability access",
      image: defaultImage
    }
  };

  return pageMeta[page] || pageMeta.home;
};

// Generate Open Graph tags for social media
export const generateOpenGraphTags = (meta, url) => {
  return {
    'og:type': 'website',
    'og:title': meta.title,
    'og:description': meta.description,
    'og:image': `https://nickolamagnolia.com${meta.image}`,
    'og:url': url,
    'og:site_name': 'Nickola Magnolia Official Website',
    'og:locale': 'en_US',
    'music:musician': 'Nickola Magnolia',
    'music:genre': 'Country, Americana'
  };
};

// Generate Twitter Card tags
export const generateTwitterTags = (meta) => {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': meta.title,
    'twitter:description': meta.description,
    'twitter:image': `https://nickolamagnolia.com${meta.image}`,
    'twitter:creator': '@nickolamagnolia',
    'twitter:site': '@nickolamagnolia'
  };
};

// Generate canonical URL
export const generateCanonicalUrl = (path) => {
  const baseUrl = 'https://nickolamagnolia.com';
  const cleanPath = path.replace(/\?.*$/, ''); // Remove query parameters
  return `${baseUrl}${cleanPath}`;
};

// Generate breadcrumb schema
export const generateBreadcrumbs = (path) => {
  const baseUrl = 'https://nickolamagnolia.com';
  const pathSegments = path.split('/').filter(segment => segment);
  
  const breadcrumbs = [
    { name: 'Home', url: baseUrl }
  ];

  let currentPath = '';
  pathSegments.forEach(segment => {
    currentPath += `/${segment}`;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      name: name,
      url: `${baseUrl}${currentPath}`
    });
  });

  return breadcrumbs;
};

// Local SEO data for music venues and events
export const localSEOData = {
  region: "Great Lakes",
  state: "Michigan",
  country: "United States",
  genres: ["Country", "Americana", "Rock"],
  influences: ["Classic Country", "Indie Rock", "Folk"],
  venues: [
    "The Fillmore Detroit",
    "Saint Andrews Hall",
    "The Magic Bag",
    "Bell's Brewery",
    "Founders Brewing"
  ]
};

// Keywords for different pages
export const seoKeywords = {
  primary: [
    "Nickola Magnolia",
    "country music",
    "americana",
    "great lakes artist",
    "michigan musician"
  ],
  music: [
    "broken lonesome album",
    "country songs",
    "americana music",
    "spotify artist",
    "new music releases"
  ],
  tours: [
    "tour dates",
    "live music",
    "concerts",
    "music events",
    "venue bookings"
  ],
  merchandise: [
    "band merch",
    "artist merchandise",
    "vinyl records",
    "t-shirts",
    "country music apparel"
  ]
};

// Performance optimization for SEO
export const seoOptimizations = {
  // Critical CSS inlining
  criticalCSS: `
    /* Critical CSS for above-the-fold content */
    .hero-container { display: block; }
    .nav-container { display: flex; }
    body { font-family: 'Inter', sans-serif; }
  `,
  
  // Preconnect to external domains
  preconnectDomains: [
    'https://open.spotify.com',
    'https://www.youtube.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],
  
  // DNS prefetch for external resources
  dnsPrefetchDomains: [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com'
  ]
};

// Analytics and tracking
export const trackingCodes = {
  googleAnalytics: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
  facebookPixel: 'XXXXXXXXX', // Replace with actual Facebook Pixel ID
  googleTagManager: 'GTM-XXXXXXX' // Replace with actual GTM ID
};

// Content suggestions for better SEO
export const contentSuggestions = {
  blogTopics: [
    "Behind the Scenes: Recording 'Broken Lonesome'",
    "Great Lakes Music Scene: A Local Perspective",
    "Songwriting Process: From Inspiration to Recording",
    "Tour Life: Stories from the Road",
    "Musical Influences: The Artists That Shaped My Sound"
  ],
  
  faqContent: [
    {
      question: "What genre of music does Nickola Magnolia play?",
      answer: "Nickola Magnolia creates Country and Americana music with Rock influences, drawing inspiration from the Great Lakes region."
    },
    {
      question: "Where can I listen to Nickola Magnolia's music?",
      answer: "You can stream Nickola Magnolia's music on Spotify, Apple Music, YouTube, and other major streaming platforms."
    },
    {
      question: "Does Nickola Magnolia tour?",
      answer: "Yes, Nickola Magnolia regularly performs live shows across the Great Lakes region and beyond. Check the tour dates for upcoming shows."
    },
    {
      question: "How can I book Nickola Magnolia for an event?",
      answer: "For booking inquiries, please contact us through the official website or social media channels."
    }
  ]
};

export default {
  generateMetaTags,
  generateOpenGraphTags,
  generateTwitterTags,
  generateCanonicalUrl,
  generateBreadcrumbs,
  localSEOData,
  seoKeywords,
  seoOptimizations,
  trackingCodes,
  contentSuggestions
};
