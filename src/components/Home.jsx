import React from "react";

import "./Styles.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="stack" style={{ "--stacks": 3 }}>
        <span style={{ "--index": 0 }}>NICKOLA MAGNOLIA</span>
        <span className="home-title-back">NICKOLA MAGNOLIA</span>
        <span style={{ "--index": 1 }}>NICKOLA MAGNOLIA</span>
        <span style={{ "--index": 2 }}>NICKOLA MAGNOLIA</span>
        <span className="home-line left"></span>
        <span className="home-line right"></span>
      </div>

      <div className="home-links-container">
        <button className="home-button">INSTAGRAM</button>
        <button className="home-button">SPOTIFY</button>
        <button className="home-button">LINKTREE</button>
        <button
          className="home-button"
          onClick={() => (window.location.href = "/bio")}
        >
          BIO
        </button>
        <button className="home-button">YOUTUBE</button>
        <button className="home-button">FACEBOOK</button>
        <button className="home-button">CONTACT</button>
      </div>

      <img
        className="home-image"
        src={"/assets/nick-couch.jpg"}
        alt="Nickola Magnolia"
      />
    </div>
  );
};

export default Home;
