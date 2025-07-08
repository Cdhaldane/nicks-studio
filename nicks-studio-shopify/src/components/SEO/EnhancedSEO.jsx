import React from 'react';
import { Helmet } from 'react-helmet-async';
import { generateMetaTags, generateOpenGraphTags, generateTwitterTags, generateCanonicalUrl } from '../utils/advancedSEO';

const EnhancedSEO = ({ 
  page = 'home',
  content = {},
  customTitle,
  customDescription,
  customKeywords,
  customImage,
  additionalSchema = []
}) => {
  const meta = generateMetaTags(page, content);
  const currentUrl = window.location.href;
  const canonicalUrl = generateCanonicalUrl(window.location.pathname);
  
  // Override defaults with custom values if provided
  const finalMeta = {
    title: customTitle || meta.title,
    description: customDescription || meta.description,
    keywords: customKeywords || meta.keywords,
    image: customImage || meta.image
  };

  const ogTags = generateOpenGraphTags(finalMeta, canonicalUrl);
  const twitterTags = generateTwitterTags(finalMeta);
  const fullImageUrl = finalMeta.image.startsWith('http') 
    ? finalMeta.image 
    : `${window.location.origin}${finalMeta.image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalMeta.title}</title>
      <meta name="title" content={finalMeta.title} />
      <meta name="description" content={finalMeta.description} />
      <meta name="keywords" content={finalMeta.keywords} />
      <meta name="author" content="Nickola Magnolia" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="General" />
      <meta name="distribution" content="Global" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      {Object.entries(ogTags).map(([property, content]) => (
        <meta key={property} property={property} content={content} />
      ))}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalMeta.title} />
      
      {/* Twitter */}
      {Object.entries(twitterTags).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}
      <meta name="twitter:image:alt" content={finalMeta.title} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#d83b65" />
      <meta name="msapplication-TileColor" content="#d83b65" />
      <meta name="application-name" content="Nickola Magnolia" />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="US-MI" />
      <meta name="geo.placename" content="Michigan" />
      <meta name="geo.position" content="42.3314;-84.5467" />
      <meta name="ICBM" content="42.3314, -84.5467" />
      
      {/* Music Industry Tags */}
      <meta name="music:musician" content="Nickola Magnolia" />
      <meta name="music:genre" content="Country, Americana" />
      <meta name="music:release_date" content="2022" />
      
      {/* Performance Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta httpEquiv="x-ua-compatible" content="IE=edge" />
      
      {/* Preconnect to improve performance */}
      <link rel="preconnect" href="https://open.spotify.com" />
      <link rel="preconnect" href="https://www.youtube.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${window.location.origin}/#website`,
              "url": window.location.origin,
              "name": "Nickola Magnolia Official Website",
              "description": "Official website of Nickola Magnolia - Country & Americana music from the Great Lakes",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              },
              "inLanguage": "en-US"
            },
            {
              "@type": "MusicGroup",
              "@id": `${window.location.origin}/#musicgroup`,
              "name": "Nickola Magnolia",
              "alternateName": ["Nickola Magnolia Music"],
              "description": finalMeta.description,
              "url": canonicalUrl,
              "image": {
                "@type": "ImageObject",
                "url": fullImageUrl,
                "width": 1200,
                "height": 630
              },
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/nick-bio.jpg`
              },
              "genre": ["Country", "Americana", "Rock"],
              "foundingLocation": {
                "@type": "Place",
                "name": "Great Lakes Region",
                "addressRegion": "Michigan",
                "addressCountry": "US"
              },
              "member": {
                "@type": "Person",
                "name": "Nickola Magnolia",
                "jobTitle": "Musician",
                "description": "Country & Americana artist from the Great Lakes region"
              },
              "sameAs": [
                "https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4",
                "https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q",
                "https://www.instagram.com/nickolamagnolia",
                "https://music.apple.com/artist/nickola-magnolia",
                "https://www.facebook.com/nickolamagnolia"
              ],
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
              }
            },
            {
              "@type": "WebPage",
              "@id": canonicalUrl,
              "url": canonicalUrl,
              "name": finalMeta.title,
              "description": finalMeta.description,
              "datePublished": "2022-01-01",
              "dateModified": new Date().toISOString().split('T')[0],
              "inLanguage": "en-US",
              "isPartOf": {
                "@id": `${window.location.origin}/#website`
              },
              "about": {
                "@id": `${window.location.origin}/#musicgroup`
              },
              "primaryImageOfPage": {
                "@type": "ImageObject",
                "url": fullImageUrl
              },
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": window.location.pathname === '/' ? [] : [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": window.location.origin
                  }
                ]
              }
            },
            ...additionalSchema
          ]
        })}
      </script>
      
      {/* Google Analytics 4 */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </script>
      
      {/* Rich Snippet Testing */}
      {process.env.NODE_ENV === 'development' && (
        <meta name="google-site-verification" content="dev-testing" />
      )}
    </Helmet>
  );
};

export default EnhancedSEO;
