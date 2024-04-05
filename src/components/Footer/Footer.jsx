import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <p className="footer-title">NICKOLA MAGNOLIA</p>
        <div className="footer-socials">
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
      </div>

      <p className="footer-copy">© Nick's Music 2023. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
