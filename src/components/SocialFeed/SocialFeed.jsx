import React from 'react';
import { CONSTANTS } from '../../utils/constants';
import './SocialFeed.css';

const FEEDS = [
  {
    platform: 'instagram',
    icon: 'fa-brands fa-instagram',
    label: 'Instagram',
    url: CONSTANTS.SOCIAL_LINKS.INSTAGRAM,
    color: '#E1306C',
    cta: 'Follow on Instagram',
    description: 'Behind the scenes, live shows & everyday moments',
  },
  {
    platform: 'tiktok',
    icon: 'fa-brands fa-tiktok',
    label: 'TikTok',
    url: CONSTANTS.SOCIAL_LINKS.TIKTOK,
    color: '#00f2ea',
    cta: 'Follow on TikTok',
    description: 'Clips, covers & country vibes',
  },
  {
    platform: 'youtube',
    icon: 'fa-brands fa-youtube',
    label: 'YouTube',
    url: CONSTANTS.SOCIAL_LINKS.YOUTUBE,
    color: '#FF0000',
    cta: 'Subscribe on YouTube',
    description: 'Music videos, live sessions & more',
  },
];

const SocialFeed = () => (
  <section className="social-feed" aria-label="Follow on social media">
    <h2 className="social-feed-heading">Stay Connected</h2>
    <p className="social-feed-subtext">
      Follow Nickola Magnolia for new music, tour updates & behind-the-scenes content
    </p>
    <div className="social-feed-grid">
      {FEEDS.map(({ platform, icon, url, color, cta, description }) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-feed-card"
          style={{ '--card-accent': color }}
        >
          <div className="social-feed-card-icon">
            <i className={icon} aria-hidden="true" />
          </div>
          <p className="social-feed-card-desc">{description}</p>
          <span className="social-feed-card-cta">
            {cta} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </span>
        </a>
      ))}
    </div>

    {/* Spotify Latest Release Embed */}
    <div className="social-feed-spotify">
      <iframe
        title="Latest release from Nickola Magnolia"
        src="https://open.spotify.com/embed/artist/5UrVks2tmoQ4BwTvlkQaI4?utm_source=generator&theme=0"
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="social-feed-spotify-embed"
      />
    </div>
  </section>
);

export default SocialFeed;
