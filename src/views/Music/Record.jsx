import React, { useEffect, useRef } from "react";
import "./Record.css";

const Record = ({ album, index, setCurrentSong }) => {
  const vinylRef = useRef(null);
  const stopTimer = useRef(null);

  useEffect(() => () => clearTimeout(stopTimer.current), []);

  // The vinyl's spin is driven by swapping its state class.
  const setVinylState = (state) => {
    if (vinylRef.current) vinylRef.current.className = `vinyl ${state}`;
  };

  const select = () => setCurrentSong(album);

  return (
    <div
      className="wrap noselect"
      role="button"
      tabIndex={0}
      aria-label={`Play ${album.name}`}
      onMouseEnter={() => {
        // A leave-timer still pending from a quick exit would stop the spin mid-hover.
        clearTimeout(stopTimer.current);
        setVinylState("enter");
      }}
      onMouseLeave={() => {
        setVinylState("exit");
        stopTimer.current = setTimeout(() => setVinylState("stop"), 1000);
      }}
      onClick={select}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          select();
        }
      }}
    >
      <div className="album noselect">
        <img
          src={album.images[0].url}
          alt={album.name}
          className="album-cover noselect"
        />
        <h3>{album.name}</h3>
        <a
          href={album.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen on Spotify
        </a>
      </div>
      {/* A class, not an id — there's one of these per album on the page. */}
      <div ref={vinylRef} className="vinyl">
        <div className="print"></div>
      </div>
    </div>
  );
};

export default Record;
