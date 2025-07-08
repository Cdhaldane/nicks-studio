import React, { useState, useEffect } from "react";
import Cart from "../Cart/Cart";
import "./Navbar.css";
import { Link, redirect, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [isOpen, setIsOpen] = useState(true);
  const [active, setActive] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/about") {
      setActive("about");
    } else if (location.pathname === "/music") {
      setActive("listen");
    } else if (location.pathname === "/shop") {
      setActive("shop");
    }
  }, []);

  const [isMobile, setIsMobile] = useState(width <= 1250);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const el = document.querySelector(".nav-links");
      if (!el.contains(event.target) && isMobile) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isScrolled]);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      if (window.innerWidth > 1250) {
        setIsOpen(true);
        setIsMobile(false);
      } else {
        setIsOpen(false);
        setIsMobile(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div
        className={`nav-links drop-in ${
          isOpen && isMobile ? "expanded" : "not-expanded  "
        }`}
      >
        {isOpen && !isMobile && (
          <>
            <Link
              to={"/about"}
              onClick={() => setActive("about")}
              className="nav-button"
              style={{
                color: active === "about" ? "var(--dpink)" : "var(--white)",
                scale: active === "about" ? "1.2" : "1",
              }}
            >
              About
            </Link>
            <Link
              to={"/music"}
              onClick={() => setActive("listen")}
              className="nav-button"
              style={{
                color: active === "listen" ? "var(--dpink)" : "var(--white)",
                scale: active === "listen" ? "1.2" : "1",
              }}
            >
              Listen
            </Link>
            <Link
              to={"https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q"}
              className="nav-button"
            >
              Watch
            </Link>
          </>
        )}
        <div
          className={`nav-title ${isMobile ? "mobile-title" : ""}`}
          onClick={() => navigate("/")}
        >
          <span>Nickola Magnolia</span>
          <span className="back">Nickola Magnolia</span>
        </div>
        {isOpen && !isMobile && (
          <>
            <Link
              to={"/shop"}
              onClick={() => setActive("shop")}
              className="nav-button"
              style={{
                color: active === "shop" ? "var(--dpink)" : "var(--white)",
                scale: active === "shop" ? "1.2" : "1",
              }}
            >
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
            <Link
              to={"/about"}
              onClick={() => setActive("about")}
              className="nav-button"
              style={{
                color: active === "about" ? "var(--dpink)" : "var(--white)",
              }}
            >
              About
            </Link>
            <Link
              to={"/music"}
              onClick={() => setActive("listen")}
              className="nav-button"
              style={{
                color: active === "listen" ? "var(--dpink)" : "var(--white)",
              }}
            >
              Listen
            </Link>
            <Link
              to={"https://www.youtube.com/channel/UC18RGyNPiUxzPAEUFNuvH_Q"}
              className="nav-button"
            >
              Watch
            </Link>
            <Link
              to={"/shop"}
              onClick={() => setActive("shop")}
              className="nav-button"
              style={{
                color: active === "shop" ? "var(--dpink)" : "var(--white)",
              }}
            >
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
      </div>
      <div className="nav-cart drop-in">
        <Cart />
      </div>
    </>
  );
};

export default Navbar;
