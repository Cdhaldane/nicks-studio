// Content management for better SEO and user experience

export const ARTIST_INFO = {
  name: "Nickola Magnolia",
  fullName: "Nickola Magnolia",
  bio: "Intertwining classic Country melodies with intimate Rock and Americana influences from the shores of the Great Lakes.",
  genres: ["Country", "Americana", "Rock"],
  location: "Great Lakes Region",
  state: "Michigan",
  country: "United States",
  foundingYear: "2020",
  
  // Social Media & Streaming
  socialMedia: {
    spotify: "https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4",
    youtube: "https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q",
    instagram: "https://www.instagram.com/nickolamagnolia",
    facebook: "https://www.facebook.com/nickolamagnolia",
    appleMusic: "https://music.apple.com/artist/nickola-magnolia",
    soundcloud: "https://soundcloud.com/nickolamagnolia",
    twitter: "@nickolamagnolia"
  },

  // Notable achievements for SEO
  achievements: [
    "Opening for Chris Janson",
    "Opening for Keith Whitley",
    "Released debut album 'Broken Lonesome' in 2022",
    "Featured stunning vocal performances",
    "Recognized for thoughtful intimate songwriting"
  ]
};

export const ALBUMS = [
  {
    name: "Broken Lonesome",
    releaseDate: "2022",
    type: "Studio Album",
    description: "Debut record featuring stunning vocal performances and thoughtful intimate songwriting",
    genre: ["Country", "Americana"],
    tracks: [], // Add track list if available
    streamingLinks: {
      spotify: "https://open.spotify.com/album/YOUR_ALBUM_ID",
      appleMusic: "https://music.apple.com/album/YOUR_ALBUM_ID",
      youtube: "https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID"
    }
  }
];

export const SEO_KEYWORDS = {
  // Primary keywords (high priority)
  primary: [
    "Nickola Magnolia",
    "country music",
    "americana music",
    "great lakes artist",
    "michigan musician",
    "country singer"
  ],
  
  // Secondary keywords (medium priority)
  secondary: [
    "broken lonesome album",
    "country americana rock",
    "great lakes music scene",
    "michigan country artist",
    "indie country music",
    "americana singer songwriter"
  ],
  
  // Long-tail keywords (specific searches)
  longTail: [
    "nickola magnolia broken lonesome",
    "country music great lakes region",
    "michigan americana artist",
    "chris janson opener nickola magnolia",
    "great lakes country singer",
    "intimate country songwriting"
  ],
  
  // Location-based keywords
  local: [
    "michigan country music",
    "great lakes americana",
    "detroit area musician",
    "michigan music scene",
    "midwest country artist"
  ],
  
  // Music industry keywords
  industry: [
    "country music artist",
    "americana musician",
    "independent artist",
    "singer songwriter",
    "live country music",
    "country music tour"
  ]
};

export const CONTENT_SUGGESTIONS = {
  // Blog post ideas for SEO content
  blogTopics: [
    {
      title: "The Great Lakes Sound: How Geography Shapes My Music",
      keywords: ["great lakes music", "michigan country", "regional sound"],
      description: "Exploring how the Great Lakes region influences country and americana music"
    },
    {
      title: "Recording 'Broken Lonesome': Behind the Scenes",
      keywords: ["broken lonesome", "recording process", "studio sessions"],
      description: "An inside look at creating the debut album"
    },
    {
      title: "Opening for Country Legends: Lessons from the Stage",
      keywords: ["chris janson", "keith whitley", "opening act", "live performance"],
      description: "What I learned performing with established country artists"
    },
    {
      title: "Songwriting in the Digital Age: Staying Authentic",
      keywords: ["songwriting", "authentic country", "music creation"],
      description: "Maintaining artistic integrity in modern country music"
    },
    {
      title: "The Michigan Music Scene: Hidden Gems and Rising Stars",
      keywords: ["michigan music", "local venues", "music scene"],
      description: "Spotlight on the vibrant Great Lakes music community"
    }
  ],

  // FAQ content for better search coverage
  faqs: [
    {
      question: "What genre of music does Nickola Magnolia play?",
      answer: "Nickola Magnolia creates Country and Americana music with Rock influences, drawing inspiration from the Great Lakes region.",
      keywords: ["genre", "country americana", "music style"]
    },
    {
      question: "Where is Nickola Magnolia from?",
      answer: "Nickola Magnolia is from the Great Lakes region, specifically Michigan, which heavily influences her musical style and songwriting.",
      keywords: ["location", "michigan", "great lakes", "origin"]
    },
    {
      question: "What is 'Broken Lonesome' about?",
      answer: "'Broken Lonesome' is Nickola Magnolia's debut record released in 2022, featuring songs of change, death, heartbreak, hope and belonging.",
      keywords: ["broken lonesome", "debut album", "2022 release"]
    },
    {
      question: "Where can I listen to Nickola Magnolia's music?",
      answer: "You can stream Nickola Magnolia's music on Spotify, Apple Music, YouTube, and other major streaming platforms.",
      keywords: ["streaming", "spotify", "apple music", "listen"]
    },
    {
      question: "Does Nickola Magnolia tour?",
      answer: "Yes, Nickola Magnolia regularly performs live shows and has opened for notable artists like Chris Janson and Keith Whitley.",
      keywords: ["tour", "live shows", "concerts", "performances"]
    }
  ],

  // Meta descriptions for different pages
  metaDescriptions: {
    home: "Discover Nickola Magnolia - Country & Americana music from the Great Lakes. Stream 'Broken Lonesome' and find tour dates, merchandise, and more.",
    music: "Listen to Nickola Magnolia's country and americana music. Stream albums, discover new songs, and explore the complete discography.",
    about: "Learn about Nickola Magnolia, country & americana artist from Michigan. Read her biography, musical journey, and career highlights.",
    shop: "Shop official Nickola Magnolia merchandise. Find t-shirts, vinyl records, and exclusive items from your favorite country artist.",
    tour: "Find Nickola Magnolia tour dates and concert information. Get tickets to see live country and americana performances near you."
  }
};

export const SCHEMA_TEMPLATES = {
  // Event schema template
  musicEvent: (eventData) => ({
    "@type": "MusicEvent",
    "name": eventData.name,
    "description": eventData.description,
    "startDate": eventData.startDate,
    "endDate": eventData.endDate,
    "location": {
      "@type": "Place",
      "name": eventData.venue,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": eventData.address,
        "addressLocality": eventData.city,
        "addressRegion": eventData.state,
        "addressCountry": "US"
      }
    },
    "performer": {
      "@type": "MusicGroup",
      "name": "Nickola Magnolia"
    },
    "offers": {
      "@type": "Offer",
      "price": eventData.price || "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": eventData.ticketUrl
    }
  }),

  // Product schema template
  product: (productData) => ({
    "@type": "Product",
    "name": productData.name,
    "description": productData.description,
    "image": productData.image,
    "brand": {
      "@type": "Brand",
      "name": "Nickola Magnolia"
    },
    "offers": {
      "@type": "Offer",
      "price": productData.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Nickola Magnolia Official Store"
      }
    }
  })
};

// Utility functions for SEO
export const seoUtils = {
  // Generate page-specific keywords
  generateKeywords: (page, customKeywords = []) => {
    const baseKeywords = SEO_KEYWORDS.primary;
    const pageKeywords = SEO_KEYWORDS[page] || [];
    return [...baseKeywords, ...pageKeywords, ...customKeywords].join(', ');
  },

  // Generate meta description
  generateDescription: (page, customDescription = null) => {
    return customDescription || CONTENT_SUGGESTIONS.metaDescriptions[page] || CONTENT_SUGGESTIONS.metaDescriptions.home;
  },

  // Generate social media hashtags
  generateHashtags: () => [
    '#NickolaMagnolia',
    '#CountryMusic',
    '#AmericanaMusic', 
    '#GreatLakes',
    '#MichiganMusic',
    '#BrokenLonesome',
    '#IndependentArtist',
    '#CountryLife',
    '#MusicLife',
    '#LiveMusic'
  ],

  // Format artist name for different contexts
  formatArtistName: (context = 'default') => {
    const formats = {
      default: ARTIST_INFO.name,
      formal: ARTIST_INFO.fullName,
      social: '@nickolamagnolia',
      hashtag: '#NickolaMagnolia'
    };
    return formats[context] || formats.default;
  }
};

export default {
  ARTIST_INFO,
  ALBUMS,
  SEO_KEYWORDS,
  CONTENT_SUGGESTIONS,
  SCHEMA_TEMPLATES,
  seoUtils
};
