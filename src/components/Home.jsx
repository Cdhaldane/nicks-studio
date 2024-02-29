import React, { useState, useEffect } from "react";
import Bio from "./Bio";
import Music from "./Music/Music";
import Shop from "./Shop/Shop";
import Navbar from "./Navbar/Navbar";
import "./Styles.css";
import { useNavigate } from "react-router-dom";
import { Parallax } from "react-scroll-parallax";

const imageList = [
  "n1.jpg",
  "n2.jpg",
  "n3.jpg",
  "n5.jpg",
  "n6.jpg",
  // Add more images as needed
];

const Home = () => {
  const [backgroundImage, setBackgroundImage] = useState(imageList[0]);
  const [backgroundImagePosition, setBackgroundImagePosition] = useState("top");
  const [imageIndex, setImageIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    // if mobile return
    if (window.innerWidth < 768) setBackgroundImage("n5.jpg");

    const interval = setInterval(() => {
      let nextIndex = (imageIndex + 1) % imageList.length;
      setImageIndex(nextIndex);
      setBackgroundImage(imageList[nextIndex]);

      if (nextIndex === 3) {
        setBackgroundImagePosition("0% 30%");
      }
    }, 15000); // (15 seconds)

    return () => clearInterval(interval); // Clean up the interval
  }, [imageIndex]);

  return (
    <>
      <div
        className="home-container"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/${backgroundImage})`,
          backgroundPosition: backgroundImagePosition,
        }}
      >
        <div className="stack drop-in home-stack" style={{ "--stacks": 3 }}>
          <span style={{ "--index": 0 }}>NICKOLA MAGNOLIA</span>
          <span className="bio-back">NICKOLA MAGNOLIA</span>
          <span style={{ "--index": 1 }}>NICKOLA MAGNOLIA</span>
          <span style={{ "--index": 2 }}>NICKOLA MAGNOLIA</span>
        </div>
      </div>
      <div id="bio" className="bio-section">
        <Bio />
      </div>
      <div id="music" className="music-section">
        <Parallax speed={-5}>
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
