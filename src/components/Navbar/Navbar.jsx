import React, { useState, useEffect } from "react";
import Cart from "../Cart/Cart";
import "./Navbar.css";
import { Link, redirect, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  let navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Adjust the scroll threshold as needed
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`nav-links ${isScrolled ? "scrolled" : ""}`}>
      <Link
        className="home-button drop-in"
        to={"https://www.instagram.com/nickolamagnolia"}
      >
        INSTAGRAM
      </Link>
      <Link
        className="home-button drop-in-2"
        onClick={() => scrollToSection("music")}
      >
        MUSIC
      </Link>
      <Link
        to={"https://linktr.ee/nickolamagnolia"}
        className="home-button drop-in"
      >
        LINKTREE
      </Link>
      <Link
        className="home-button drop-in-2"
        onClick={() => scrollToSection("bio")}
      >
        BIO
      </Link>
      <Link
        to={"https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q"}
        className="home-button drop-in"
      >
        YOUTUBE
      </Link>
      <Link
        className="home-button drop-in-2"
        onClick={() => scrollToSection("shop")}
      >
        SHOP
      </Link>
      <Link
        to={"https://www.instagram.com/direct/t/100599608092241"}
        className="home-button drop-in"
      >
        CONTACT
      </Link>
      {isScrolled && (
        <div className="nav-cart drop-in">
          <Cart />
        </div>
      )}
    </div>
  );
};

export default Navbar;
