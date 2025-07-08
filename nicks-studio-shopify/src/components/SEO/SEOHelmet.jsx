import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHelmet = ({ 
  title = "Nickola Magnolia - Country & Americana Music from the Great Lakes",
  description = "Intertwining classic Country melodies with intimate Rock and Americana influences from the shores of the Great Lakes. Listen to new music, shop merchandise, and tour dates.",
  keywords = "Nickola Magnolia, country music, americana, great lakes, country artist, music, albums, tour, merchandise",
  image = "/nick-bio.jpg",
  url = window.location.href,
  type = "website",
  author = "Nickola Magnolia",
  siteName = "Nickola Magnolia Official Website"
}) => {
  const canonicalUrl = url.split('?')[0]; // Remove query parameters for canonical URL
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:creator" content="@nickolamagnolia" />
      <meta name="twitter:site" content="@nickolamagnolia" />
      
      {/* Music-specific Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MusicGroup",
          "name": "Nickola Magnolia",
          "genre": ["Country", "Americana", "Rock"],
          "description": description,
          "url": canonicalUrl,
          "image": fullImageUrl,
          "foundingLocation": {
            "@type": "Place",
            "name": "Great Lakes Region"
          },
          "member": {
            "@type": "Person",
            "name": "Nickola Magnolia"
          },
          "sameAs": [
            "https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4",
            "https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q",
            "https://www.instagram.com/nickolamagnolia"
          ]
        })}
      </script>
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#d83b65" />
      <meta name="msapplication-TileColor" content="#d83b65" />
      <meta name="application-name" content="Nickola Magnolia" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="US-MI" />
      <meta name="geo.placename" content="Michigan" />
      
      {/* Music Industry Tags */}
      <meta name="music:musician" content="Nickola Magnolia" />
      <meta name="music:album" content="Latest Albums" />
      <meta name="music:genre" content="Country, Americana" />
    </Helmet>
  );
};

export default SEOHelmet;
