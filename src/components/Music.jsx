import React, { useRef, useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import Record from "./Record/Record";
import "react-multi-carousel/lib/styles.css";
import axios from "axios";

import "./Music.css";

const Music = () => {
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(0);

  const timelineRef = useRef(null);

  const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  const getSpotifyToken = async () => {
    let SPOTIFY_TOKEN = "601e49493f2740068487677b71264ad2";
    let SPOTIFY_SECRET = "7d9622e634584277956aaad772de0385";
    const url = "https://accounts.spotify.com/api/token";
    const data = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SPOTIFY_TOKEN,
      client_secret: SPOTIFY_SECRET,
    });

    try {
      const response = await axios.post(url, data.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      getArtistData(response.data.access_token);
    } catch (error) {
      console.error("Error fetching Spotify token:", error);
    }
  };

  const getArtistData = async (token) => {
    const url =
      "https://api.spotify.com/v1/artists/5UrVks2tmoQ4BwTvlkQaI4/albums";

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAlbums(response.data.items);
    } catch (error) {
      console.error("Error fetching artist data:", error);
    }
  };

  useEffect(() => {
    getSpotifyToken();
  }, []);

  return (
    <div className="music-container">
      <Carousel
        rewind
        slidesToSlide={2}
        responsive={responsive}
        draggable={true}
      >
        {albums.map((album, index) => (
          <Record album={album} key={index} />
        ))}
      </Carousel>
    </div>
  );
};

export default Music;
