import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Parallax } from 'react-scroll-parallax';
import MailchimpFormContainer from '../../components/MailChimpForm/MailChimpForm';
import ResponsiveImage from '../../components/ResponsiveImage/ResponsiveImage';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CONSTANTS, SOCIAL_MEDIA } from '../../utils/constants';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { WebsiteSchema, PersonSchema, BreadcrumbSchema } from '../../components/SEO/StructuredData';
import SocialFeed from '../../components/SocialFeed/SocialFeed';
import '../../Styles.css';

const Home = () => {
  const [imageIndex, setImageIndex] = useState(0);
  const [isMail, setIsMail] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [lastVisit, setLastVisit] = useLocalStorage('lastVisit', null);
  const { isMobile } = useWindowSize();
  const [heroRef, isHeroVisible] = useIntersectionObserver({ threshold: 0.1 });

  // Track page visit
  useEffect(() => {
    setLastVisit(Date.now());
  }, []); // Empty dependency array - only run once on mount

  // Hero animation trigger
  useEffect(() => {
    if (isHeroVisible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isHeroVisible, hasAnimated]);

  // Image rotation effect
  useEffect(() => {
    if (isMobile) return;

    const interval = setInterval(() => {
      setImageIndex(prev => (prev + 1) % CONSTANTS.IMAGE_ROTATION.IMAGES.length);
    }, CONSTANTS.IMAGE_ROTATION.INTERVAL);

    return () => clearInterval(interval);
  }, [isMobile]);

  // Get current hero image for ResponsiveImage component
  const getCurrentHeroImage = useCallback(() => {
    const images = CONSTANTS.IMAGE_ROTATION.IMAGES;
    const currentImage = images[imageIndex] || images[0];
    return currentImage; // Just return the base filename (e.g., "n1.jpg")
  }, [imageIndex]);

  // Close email modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMail) {
        setIsMail(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMail]);

  // Handle email modal toggle
  const handleEmailToggle = useCallback(() => {
    setIsMail(prev => !prev);
  }, []);

  // Handle email modal close
  const handleEmailClose = useCallback(() => {
    setIsMail(false);
  }, []);

  // Render social media buttons
  const renderSocialButtons = () => {
    return SOCIAL_MEDIA.map(({ platform, url, icon, label }) => (
      <Link
        key={platform}
        className="social-button"
        to={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        <i className={icon}></i>
      </Link>
    ));
  };

  return (
    <>
      <SEOHelmet 
        title="Nickola Magnolia - Country & Americana Music from the Great Lakes"
        description="Country & Americana from the shores of the Great Lakes. Hometown record release show June 11, 2026 in Northumberland County, Ontario. New music, tour dates, and merchandise."
        keywords="Nickola Magnolia, country music, americana, great lakes, country artist, albums, tour, merchandise, hometown record release, June 11 2026, album release show Ontario, live music Northumberland County, things to do Port Hope, things to do Cobourg, things to do Peterborough, concerts near me June 2026, country music Ontario live, Calgary Stampede 2026 lineup, Calgary Stampede concerts July 2026, Nashville North lineup 2026, Calgary Stampede country artists, live music Calgary Stampede"
        type="website"
        url={window.location.href}
      />
      <WebsiteSchema />
      <PersonSchema 
        name="Nickola Magnolia"
        description="Country & Americana musician from the Great Lakes region, blending classic country melodies with intimate rock influences"
        image={`${window.location.origin}/nick-bio.jpg`}
        url={window.location.href}
        sameAs={[
          "https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4",
          "https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q",
          "https://www.instagram.com/nickolamagnolia"
        ]}
      />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: window.location.origin }
        ]}
      />

      <div 
        ref={heroRef}
        className={`home-container ${hasAnimated ? 'animate' : ''}`}
      >
        <ResponsiveImage
          src={getCurrentHeroImage().replace('.jpg', '')} // Remove extension as ResponsiveImage expects base name
          alt="Nickola Magnolia - Country & Americana Artist"
          className="hero-image"
          loading="eager"
          sizes="100vw"
          priority={true}
        />
        
        {/* Hero overlay content */}
        <div className="hero-overlay">
          <Parallax speed={-5}>
            <div className="hero-content">
              <img
                src={`${process.env.PUBLIC_URL}/logo-trans.png`}
                alt="Nickola Magnolia"
                className="hero-logo"
              />
              <h1 className="hero-title animate-in">
                <span className="hero-subtitle">Country & Americana</span>
              </h1>
            </div>
          </Parallax>
        </div>
      </div>

      {/* Social media feed section */}
      {/* <SocialFeed /> */}

      {/* Social media section */}
      <div className="socials">
        {renderSocialButtons()}
        
        {/* Email signup button */}
        <button 
          className="social-button email-button" 
          onClick={handleEmailToggle}
          aria-label="Join our email list"
        >
          <i className="fa-solid fa-envelope"></i>
        </button>

        {/* Email signup modal */}
        {isMail && (
          <div 
            className="email-join"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-signup-title"
          >
            <MailchimpFormContainer 
              onClose={handleEmailClose}
              title="Join our email list"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
