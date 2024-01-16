import React, { useState, useEffect } from "react";
import Bio from "./Bio";
import Music from "./Music";
import Shop from "./Shop/Shop";
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

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <div
        className="home-container"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/${backgroundImage})`,
        }}
      >
        <div className="home stack drop-in" style={{ "--stacks": 3 }}>
          <h1 className="home-title-back">NICKOLA MAGNOLIA</h1>
          <span style={{ "--index": 0 }}>NICKOLA MAGNOLIA</span>
          <span style={{ "--index": 1 }}>NICKOLA MAGNOLIA</span>
          <span style={{ "--index": 2 }}>NICKOLA MAGNOLIA</span>
        </div>
        {/* <span className="home-line left fade-up"></span>
      <span className="home-line right fade-down"></span>
      <span className="home-line-horizontal top fade-up"></span>
      <span className="home-line-horizontal bottom fade-down"></span> */}

        <div className="home-links-container ">
          <button className="home-button drop-in">INSTAGRAM</button>
          <button
            className="home-button drop-in-2"
            onClick={() => scrollToSection("music")}
          >
            MUSIC
          </button>
          <button className="home-button drop-in">LINKTREE</button>
          <button
            className="home-button drop-in-2"
            onClick={() => scrollToSection("bio")}
          >
            BIO
          </button>
          <button className="home-button drop-in">YOUTUBE</button>
          <button
            className="home-button drop-in-2"
            onClick={() => navigate("./shop")}
          >
            SHOP
          </button>
          <button className="home-button drop-in">CONTACT</button>
        </div>

        {/* <img
        className="home-image"
        src={process.env.PUBLIC_URL + "/nick-couch.jpg"}
        alt="Nickola Magnolia"
      /> */}
      </div>
      <div id="bio" className="bio-section">
        <Bio />
      </div>
      <Parallax speed={-5}>
        <div id="music" className="music-section">
          <Music />
        </div>
      </Parallax>
      <Parallax speed={10}>
        <div id="shop" className="shop-section">
          <Shop />
        </div>
      </Parallax>
    </div>
  );
};

export default Home;
