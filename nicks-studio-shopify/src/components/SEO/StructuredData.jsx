import React from 'react';

// Schema.org structured data components for better SEO
export const PersonSchema = ({ name, description, image, url, sameAs = [] }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": name,
      "description": description,
      "image": image,
      "url": url,
      "sameAs": sameAs,
      "jobTitle": "Musician",
      "worksFor": {
        "@type": "Organization",
        "name": "Independent Artist"
      }
    })}
  </script>
);

export const MusicAlbumSchema = ({ album, artist }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      "name": album.name,
      "albumProductionType": "https://schema.org/StudioAlbum",
      "albumReleaseType": "https://schema.org/AlbumRelease",
      "byArtist": {
        "@type": "MusicGroup",
        "name": artist
      },
      "datePublished": album.release_date,
      "image": album.images?.[0]?.url,
      "genre": ["Country", "Americana"],
      "url": album.external_urls?.spotify
    })}
  </script>
);

export const MusicEventSchema = ({ event }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      "name": event.name,
      "description": event.description,
      "startDate": event.startDate,
      "endDate": event.endDate,
      "location": {
        "@type": "Place",
        "name": event.venue,
        "address": event.address
      },
      "performer": {
        "@type": "MusicGroup",
        "name": "Nickola Magnolia"
      },
      "url": event.url
    })}
  </script>
);

export const WebsiteSchema = () => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Nickola Magnolia Official Website",
      "description": "Official website of Nickola Magnolia - Country & Americana music from the Great Lakes",
      "url": "https://nickolamagnolia.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://nickolamagnolia.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Nickola Magnolia Music",
        "logo": {
          "@type": "ImageObject",
          "url": "https://nickolamagnolia.com/nick-bio.jpg"
        }
      }
    })}
  </script>
);

export const BreadcrumbSchema = ({ items }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    })}
  </script>
);
