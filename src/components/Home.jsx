import React, { useState, useEffect } from "react";
import Bio from "../Views/About/Bio";
import Music from "./Music/Music";
import Shop from "./Shop/Shop";
import Navbar from "./Navbar/Navbar";
import "./Styles.css";
import { Link, useNavigate } from "react-router-dom";
import { Parallax } from "react-scroll-parallax";
import MailchimpFormContainer from "./MailChimpForm/MailChimpForm";

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
  const [isMail, setIsMail] = useState(false);
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
        <Link
          to={"https://www.facebook.com/musicmagnolia/"}
          className="social-button"
        >
          <i className="fa-brands fa-facebook"></i>
        </Link>
        <a className="social-button" onClick={() => setIsMail(!isMail)}>
          <i className="fa-solid fa-envelope"></i>
        </a>
        {isMail && (
          <div className="email-join">
            <MailchimpFormContainer onClose={() => setIsMail(false)} />
          </div>
        )}
        <Link
          to={"https://www.tiktok.com/@nickolamagnolia"}
          className="social-button"
        >
          <i className="fa-brands fa-tiktok"></i>
        </Link>
        <Link
          to={"https://open.spotify.com/artist/5UrVks2tmoQ4BwTvlkQaI4"}
          className="social-button"
        >
          <i className="fa-brands fa-spotify"></i>
        </Link>
        <Link
          to={"https://music.apple.com/ca/artist/nickola-magnolia/1588557558"}
          className="social-button"
        >
          <i className="fa-brands fa-apple"></i>
        </Link>
      </div>
    </>
  );
};

export default Home;
