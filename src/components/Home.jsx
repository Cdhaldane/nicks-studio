import React, { useState, useEffect } from "react";

import "./Styles.css";

const imageList = [
  "nick-bio.jpg",
  "nick-couch.jpg",
  // Add more images as needed
];

const Home = () => {
  const [backgroundImage, setBackgroundImage] = useState(imageList[0]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (imageIndex + 1) % imageList.length;
      setImageIndex(nextIndex);
      setBackgroundImage(imageList[nextIndex]);
    }, 5000); // Change image every 5000 milliseconds (5 seconds)

    return () => clearInterval(interval); // Clean up the interval
  }, [imageIndex]);

  return (
    <div
      className="home-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/${backgroundImage})`,
      }}
    >
      <div className="stack drop-in" style={{ "--stacks": 3 }}>
        <h1 className="home-title-back">NICKOLA MAGNOLIA</h1>
        <span style={{ "--index": 0 }}>NICKOLA MAGNOLIA</span>
        <span style={{ "--index": 1 }}>NICKOLA MAGNOLIA</span>
        <span style={{ "--index": 2 }}>NICKOLA MAGNOLIA</span>
      </div>
      <span className="home-line left fade-up"></span>
      <span className="home-line right fade-down"></span>
      <span className="home-line-horizontal top fade-up"></span>
      <span className="home-line-horizontal bottom fade-down"></span>

      <div className="home-links-container ">
        <button className="home-button drop-in">INSTAGRAM</button>
        <button className="home-button drop-in-2">SPOTIFY</button>
        <button className="home-button drop-in">LINKTREE</button>
        <button
          className="home-button drop-in-2"
          onClick={() => (window.location.href = "/bio")}
        >
          BIO
        </button>
        <button className="home-button drop-in">YOUTUBE</button>
        <button className="home-button drop-in-2">FACEBOOK</button>
        <button className="home-button drop-in">CONTACT</button>
      </div>

      {/* <img
        className="home-image"
        src={process.env.PUBLIC_URL + "/nick-couch.jpg"}
        alt="Nickola Magnolia"
      /> */}
    </div>
  );
};

export default Home;
