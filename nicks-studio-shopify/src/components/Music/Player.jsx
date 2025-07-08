import React, { useState, useEffect } from "react";

import "./Music.css";

const Player = ({ currentSong, token }) => {
  useEffect(() => {
    console.log("Current song:", currentSong);
  }, [currentSong]);

  return (
    <div className="player-container">
      {/* {currentSong ? (
        <div>
          <h1>{currentSong.name}</h1>
          <p>{currentSong.artists[0].name}</p>
          <img src={currentSong.images[0].url} alt="Album Cover" />
          <audio controls>
            <source src={currentSong.uri} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : (
        <p>Loading...</p>
      )} */}
    </div>
  );
};

export default Player;
