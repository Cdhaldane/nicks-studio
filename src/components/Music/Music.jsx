import React, { useRef, useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import Record from "./Record/Record";
import Player from "./Player";
import "react-multi-carousel/lib/styles.css";
import axios from "axios";

import "./Music.css";

const Music = () => {
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(0);
  const [currentSong, setCurrentSong] = useState();
  const [token, setToken] = useState();
  const [loading, setLoading] = useState(true);

  const timelineRef = useRef(null);

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      slidesToSlide: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
      slidesToSlide: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      slidesToSlide: 1,
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
      setToken(response.data.access_token);
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
    getSpotifyToken().then(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="shop-container">
        <div className="loading"></div>
      </div>
    );

  return (
    <div className="music-container">
      <Player currentSong={currentSong} token={token} />
      <Carousel
        responsive={responsive}
        ssr
        containerClass="container-with-dots"
        itemClass="image-item"
      >
        {albums.map((album, index) => (
          <Record
            album={album}
            key={index}
            setCurrentSong={(e) => setCurrentSong(e)}
          />
        ))}
      </Carousel>
    </div>
  );
};

export default Music;
