import React, { useState, useEffect } from "react";
import Bio from "./Bio";
import Music from "./Music";
import Shop from "./Shop/Shop";
import Navbar from "./Navbar/Navbar";
import "./Styles.css";
import { useNavigate } from "react-router-dom";
import { Parallax } from "react-scroll-parallax";

const imageList = [
  "n1.jpg",
  // "n2.jpg",
  // "n3.jpg",
  // Add more images as needed
];

const Home = () => {
  const [backgroundImage, setBackgroundImage] = useState(imageList[0]);
  const [imageIndex, setImageIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (imageIndex + 1) % imageList.length;
      setImageIndex(nextIndex);
      setBackgroundImage(imageList[nextIndex]);
    }, 5000); // Change image every 5000 milliseconds (5 seconds)

    return () => clearInterval(interval); // Clean up the interval
  }, [imageIndex]);

  return (
    <>
      <div
        className="home-container"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/${backgroundImage})`,
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

      <Parallax speed={10}>
        <div id="shop" className="shop-section">
          <Shop />
        </div>
      </Parallax>
    </>
  );
};

export default Home;
