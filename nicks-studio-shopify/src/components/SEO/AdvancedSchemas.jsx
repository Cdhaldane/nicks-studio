import React from 'react';

// Local business schema for better local SEO
export const LocalBusinessSchema = () => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "name": "Nickola Magnolia",
      "description": "Country & Americana music artist from the Great Lakes region",
      "url": "https://nickolamagnolia.com",
      "logo": "https://nickolamagnolia.com/nick-bio.jpg",
      "image": "https://nickolamagnolia.com/nick-bio.jpg",
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
        "knowsAbout": ["Country Music", "Americana", "Songwriting", "Guitar"]
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://nickolamagnolia.com"
      },
      "sameAs": [
        "https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4",
        "https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q",
        "https://www.instagram.com/nickolamagnolia",
        "https://music.apple.com/artist/nickola-magnolia",
        "https://www.facebook.com/nickolamagnolia"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "reviewCount": "100"
      }
    })}
  </script>
);

// FAQ Schema for common questions
export const FAQSchema = ({ faqs }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    })}
  </script>
);

// Video schema for music videos
export const VideoSchema = ({ video }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": video.name,
      "description": video.description,
      "thumbnailUrl": video.thumbnail,
      "uploadDate": video.uploadDate,
      "duration": video.duration,
      "embedUrl": video.embedUrl,
      "publisher": {
        "@type": "Organization",
        "name": "Nickola Magnolia",
        "logo": {
          "@type": "ImageObject",
          "url": "https://nickolamagnolia.com/nick-bio.jpg"
        }
      }
    })}
  </script>
);

// Review/Rating schema
export const ReviewSchema = ({ reviews }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": reviews.map((review, index) => ({
        "@type": "Review",
        "position": index + 1,
        "author": {
          "@type": "Person",
          "name": review.author
        },
        "reviewBody": review.text,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.rating,
          "bestRating": "5"
        },
        "itemReviewed": {
          "@type": "MusicGroup",
          "name": "Nickola Magnolia"
        }
      }))
    })}
  </script>
);

// Concert/Tour schema
export const ConcertSchema = ({ concerts }) => (
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": concerts.map((concert, index) => ({
        "@type": "MusicEvent",
        "position": index + 1,
        "name": concert.name,
        "startDate": concert.date,
        "location": {
          "@type": "Place",
          "name": concert.venue,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": concert.address,
            "addressLocality": concert.city,
            "addressRegion": concert.state,
            "addressCountry": "US"
          }
        },
        "performer": {
          "@type": "MusicGroup",
          "name": "Nickola Magnolia"
        },
        "offers": {
          "@type": "Offer",
          "price": concert.price || "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": concert.ticketUrl
        }
      }))
    })}
  </script>
);

export default {
  LocalBusinessSchema,
  FAQSchema,
  VideoSchema,
  ReviewSchema,
  ConcertSchema
};
