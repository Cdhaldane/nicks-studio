import React, { useState, useEffect } from "react";
import Bio from "./Bio";
import Music from "./Music/Music";
import Shop from "./Shop/Shop";
import Navbar from "./Navbar/Navbar";
import "./Styles.css";
import { Link, useNavigate } from "react-router-dom";
import { Parallax } from "react-scroll-parallax";

const imageList = [
  "n1.jpg",
  "n2.jpg",
  // "n3.jpg",
  // "n5.jpg",
  // "n6.jpg",
  // Add more images as needed
];

const Home = () => {
  const [backgroundImage, setBackgroundImage] = useState(imageList[0]);
  const [backgroundImagePosition, setBackgroundImagePosition] = useState("top");
  const [imageIndex, setImageIndex] = useState(0);
  const isMobile = window.innerWidth < 768;

  const navigate = useNavigate();

  useEffect(() => {
    // if mobile return
    if (window.innerWidth < 768) setBackgroundImage("n5.jpg");

    const interval = setInterval(() => {
      let nextIndex = (imageIndex + 1) % imageList.length;
      setImageIndex(nextIndex);
      // setBackgroundImage(imageList[nextIndex]);

      // if (nextIndex === 3) {
      //   setBackgroundImagePosition("0% 30%");
      // }
    }, 15000); // (15 seconds)

    return () => clearInterval(interval); // Clean up the interval
  }, [imageIndex]);

  return (
    <>
      <div className="home-container">
        {isMobile ? (
          <img
            src={process.env.PUBLIC_URL + "/n6.jpg"}
            alt="Nickola Magnolia"
          />
        ) : (
          <img
            src={process.env.PUBLIC_URL + "/n2.jpg"}
            alt="Nickola Magnolia"
          />
        )}
      </div>
      <div className="socials">
        <Link
          to={"https://linktr.ee/nickolamagnolia"}
          className="social-button"
        >
          <i className="fa-brands fa-twitter "></i>
        </Link>
        <Link
          className="social-button"
          to={"https://www.instagram.com/nickolamagnolia"}
        >
          <i className="fa-brands fa-instagram"></i>
        </Link>
        <Link
          to={"https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q"}
          className="social-button"
        >
          <i className="fa-brands fa-youtube"></i>
        </Link>
      </div>
      <div id="bio" className="bio-section">
        <Bio />
      </div>
      <div id="music" className="music-section">
        <div className="nav-title bio music">
          <span>Music</span>
          <span className="back">Music</span>
        </div>
        <Parallax speed={-3}>
          <Music />
        </Parallax>
      </div>

      <div id="shop" className="shop-section">
        <Shop />
      </div>
    </>
  );
};

export default Home;
