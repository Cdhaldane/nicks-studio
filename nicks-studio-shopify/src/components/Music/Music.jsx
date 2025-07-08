import React, { useRef, useState, useEffect, useCallback } from "react";
import Carousel from "react-multi-carousel";
import Record from "./Record/Record";
import Player from "./Player";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { useWindowSize } from "../../hooks/useWindowSize";
import { useSpotify } from "../../hooks/useSpotify";
import SEOHelmet from "../SEO/SEOHelmet";
import { MusicAlbumSchema, BreadcrumbSchema } from "../SEO/StructuredData";
import "react-multi-carousel/lib/styles.css";
import "./Music.css";

const Music = () => {
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [error, setError] = useState(null);
  
  const { isMobile, isTablet } = useWindowSize();
  const { token, loading, error: spotifyError } = useSpotify();

  console.log("Music component rendered", token);
  const timelineRef = useRef(null);

  // Dynamic responsive configuration based on screen size
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1400 },
      items: 4,
      slidesToSlide: 2,
    },
    desktop: {
      breakpoint: { max: 1400, min: 1024 },
      items: 3,
      slidesToSlide: 2,
    },
    tablet: {
      breakpoint: { max: 1024, min: 640 },
      items: 2,
      slidesToSlide: 1,
    },
    mobile: {
      breakpoint: { max: 640, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  // Fetch artist albums using the token from useSpotify hook
  const fetchAlbums = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/artists/5UrVks2tmoQ4BwTvlkQaI4/albums?include_groups=album,single&market=US&limit=50",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setAlbums(data.items || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching albums:", err);
      setError("Failed to load albums. Please try again later.");
    }
  }, [token]);

  // Fetch albums when token is available
  useEffect(() => {
    if (token) {
      fetchAlbums();
    }
  }, [token, fetchAlbums]);

  // Handle song selection
  const handleSongSelect = useCallback((album) => {
    setCurrentSong(album);
    setCurrentAlbum(albums.indexOf(album));
  }, [albums]);

  // Custom arrow components for better styling
  const CustomLeftArrow = ({ onClick }) => (
    <button
      className="react-multi-carousel-arrow react-multi-carousel-arrow--left"
      onClick={onClick}
      aria-label="Previous albums"
    >
      <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
    </button>
  );

  const CustomRightArrow = ({ onClick }) => (
    <button
      className="react-multi-carousel-arrow react-multi-carousel-arrow--right"
      onClick={onClick}
      aria-label="Next albums"
    >
      <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
    </button>
  );

  // Loading state
  if (loading) {
    return (
      <div className="music-container">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading music...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || spotifyError || (albums.length === 0 && !loading)) {
    return (
      <div className="music-container">
        <div className="error-container">
          <h2>Unable to Load Music</h2>
          <p>{error || spotifyError}</p>
          <button
            onClick={fetchAlbums}
            className="retry-button"
            aria-label="Retry loading music"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No albums found
  if (albums.length === 0) {
    return (
      <div className="music-container">
        <div className="no-albums-container">
          <h2>No Albums Found</h2>
          <p>Check back later for new releases!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-container" id="main-content">
      <SEOHelmet 
        title="Music - Nickola Magnolia | Albums & Songs"
        description="Discover the latest albums and singles from Nickola Magnolia. Stream Country & Americana music from the Great Lakes region on Spotify and other platforms."
        keywords="Nickola Magnolia music, country albums, americana songs, spotify artist, new music releases, great lakes country"
        image={albums[currentAlbum]?.images?.[0]?.url || "/nick-bio.jpg"}
        url={window.location.href}
        type="music.album"
      />
      {albums[currentAlbum] && (
        <MusicAlbumSchema 
          album={albums[currentAlbum]}
          artist="Nickola Magnolia"
        />
      )}
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: window.location.origin },
          { name: "Music", url: `${window.location.origin}/music` }
        ]}
      />

      <header className="music-header">
        <h1>Music</h1>
        <p>Discover the latest albums and singles from Nickola Magnolia</p>
      </header>

      <Player currentSong={currentSong} token={token} />
      
      <div className="carousel-wrapper">
        <Carousel
          responsive={responsive}
          infinite={albums.length > 3}
          autoPlay={false}
          keyBoardControl={true}
          containerClass="container-with-dots"
          itemClass="image-item"
          customLeftArrow={<CustomLeftArrow />}
          customRightArrow={<CustomRightArrow />}
          dotListClass="custom-dot-list"
          // showDots={isMobile}
          // arrows={!isMobile}
          swipeable={true}
          draggable={true}
          centerMode={false}
          focusOnSelect={false}
          removeArrowOnDeviceType={["tablet", "mobile"]}
          partialVisible={false}
          additionalTransfrom={0}
          beforeChange={(nextSlide, { currentSlide }) => {
            // Optional: Add analytics tracking here
            if (window.gtag) {
              window.gtag('event', 'carousel_slide', {
                event_category: 'Music',
                event_label: `Slide ${nextSlide}`,
              });
            }
          }}
        >
          {albums.map((album, index) => (
            <Record
              key={`${album.id}-${index}`}
              album={album}
              index={index}
              setCurrentSong={handleSongSelect}
              isActive={currentAlbum === index}
            />
          ))}
        </Carousel>
      </div>
      
      {albums.length > 0 && (
        <div className="music-footer">
          <p>
            {albums.length} album{albums.length !== 1 ? 's' : ''} available
          </p>
          <a
            href="https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4"
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-profile-link"
          >
            <i className="fa-brands fa-spotify" aria-hidden="true"></i>
            Follow on Spotify
          </a>
        </div>
      )}
    </div>
  );
};

export default Music;
