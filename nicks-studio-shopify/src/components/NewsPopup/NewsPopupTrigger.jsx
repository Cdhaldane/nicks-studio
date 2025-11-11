import React, { useState } from 'react';
import NewsPopup from '../NewsPopup/NewsPopup';
import './NewsPopupTrigger.css';

const NewsPopupTrigger = ({
  triggerText = '🎵 View Tour Dates',
  position = 'bottom-right',
  style = 'floating', // "floating" or "inline"
}) => {
  const [showPopup, setShowPopup] = useState(false);

  const handleTriggerClick = () => {
    setShowPopup(true);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  const triggerClassName = `news-trigger ${style} ${position}`;

  return (
    <>
      <button
        className={triggerClassName}
        onClick={handleTriggerClick}
        title="Click to view tour dates and news"
      >
        {triggerText}
      </button>

      {showPopup && (
        <NewsPopup forceShow={true} onForceClose={handlePopupClose} />
      )}
    </>
  );
};

export default NewsPopupTrigger;
