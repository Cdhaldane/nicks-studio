import React, { useRef } from "react";
import "./Record.css";

const Record = ({ album, index }) => {
  const vinylRef = useRef(null);

  return (
    <div
      className="wrap noselect"
      onMouseEnter={() => {
        vinylRef.current.className = "enter";
      }}
      onMouseLeave={() => {
        vinylRef.current.className = "exit";
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
      <div ref={vinylRef} id="vinyl">
        <div className="print"></div>
      </div>
    </div>
  );
};

export default Record;
