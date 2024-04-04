import React, { useState, useEffect } from "react";
import Cart from "../Cart/Cart";
import "./Navbar.css";
import { Link, redirect, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [isOpen, setIsOpen] = useState(true);

  // useEffect(() => {
  //   const handleWindowSizeChange = () => {
  //     setWidth(window.innerWidth);
  //   };
  //   window.addEventListener("resize", handleWindowSizeChange);
  //   return () => {
  //     window.removeEventListener("resize", handleWindowSizeChange);
  //   };
  // }, []);

  const isMobile = width <= 768;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Adjust the scroll threshold as needed
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isScrolled]);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`nav-links drop-in ${isOpen && isMobile ? "expanded" : ""}`}
    >
      {isOpen && !isMobile && (
        <>
          <Link to={"https://linktr.ee/nickolamagnolia"} className="nav-button">
            Socials
          </Link>
          <Link onClick={() => scrollToSection("music")} className="nav-button">
            Listen
          </Link>
          <Link onClick={() => scrollToSection("bio")} className="nav-button">
            Bio
          </Link>
        </>
      )}
      <div className={`nav-title ${isMobile ? "mobile-title" : ""}`}>
        <span>Nickola Magnolia</span>
        <span className="back">Nickola Magnolia</span>
      </div>
      {isOpen && !isMobile && (
        <>
          <Link onClick={() => scrollToSection("shop")} className="nav-button">
            Merchandise
          </Link>
          <Link
            to={"https://www.instagram.com/direct/t/100599608092241"}
            className="nav-button"
          >
            Contact
          </Link>
        </>
      )}
      {isMobile && (
        <div className="nav-links-bars" onClick={() => setIsOpen(!isOpen)}>
          <i class="fa-solid fa-bars"></i>
        </div>
      )}
      {isMobile && isOpen && (
        <div className="mobile-links">
          <Link to={"https://linktr.ee/nickolamagnolia"} className="nav-button">
            Socials
          </Link>
          <Link onClick={() => scrollToSection("music")} className="nav-button">
            Listen
          </Link>
          <Link onClick={() => scrollToSection("bio")} className="nav-button">
            Bio
          </Link>
          <Link onClick={() => scrollToSection("shop")} className="nav-button">
            Merchandise
          </Link>
          <Link
            to={"https://www.instagram.com/direct/t/100599608092241"}
            className="nav-button"
          >
            Contact
          </Link>
        </div>
      )}
      <div className="nav-cart drop-in">
        <Cart />
      </div>
      {/* {isOpen && (
        <>
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
        </>
      )} */}
    </div>
  );
};

export default Navbar;
