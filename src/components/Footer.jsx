import React from "react";
import "./Styles.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <p className="footer-title">NICKOLA MAGNOLIA</p>
        <a
          href="https://facebook.com/nicksmusic"
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a
          href="https://twitter.com/nicksmusic"
          target="_blank"
          rel="noopener noreferrer"
        >
          Twitter
        </a>
        <a
          href="https://instagram.com/nicksmusic"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
        <a href="mailto:nick@example.com">Contact</a>
      </div>

      <p className="footer-copy">© Nick's Music 2023. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
