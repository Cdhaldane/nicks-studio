import React, { useState, useEffect, useMemo } from 'react';
import fallbackDates from '../../data/tour-dates.json';
import './TourSchedule.css';

const TourSchedule = ({ showAsSection = true }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [tourDates, setTourDates] = useState(fallbackDates);

  useEffect(() => {
    const apiBase =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:4001'
        : '';

    fetch(`${apiBase}/api/admin-tour-dates?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched tour dates:', data);
        if (Array.isArray(data.tourDates) && data.tourDates.length > 0) {
          console.log('Using fetched tour dates:', data.tourDates);
          setTourDates(data.tourDates);
        }
      })
      .catch(() => {
        // keep fallback
      });
  }, []);

  const upcomingDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tourDates
      .filter(show => new Date(show.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tourDates]);

  if (!showAsSection) {
    return (
      <div className="tour-image-container">
        <img
          src={`${process.env.PUBLIC_URL}/nick_tour.jpg`}
          alt="Tour Schedule"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {!imageLoaded && <div className="tour-loading">Loading tour dates...</div>}
      </div>
    );
  }

  return (
    <section className="tour-schedule-section">
      <div className="tour-container">
        <h2 className="tour-title">Tour Dates</h2>

        {/* <div className="tour-image-wrapper">
          <img
            src={`${process.env.PUBLIC_URL}/nick_tour.jpg`}
            alt="Tour Schedule"
            className="tour-schedule-image"
            onLoad={() => setImageLoaded(true)}
          />
        </div> */}

        {upcomingDates.length > 0 ? (
          <div className="tour-dates-list">
            {upcomingDates.map((show, index) => (
              <div key={index} className="tour-date-item">
                <div className="tour-date-info">
                  <span className="tour-date">
                    {new Date(show.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="tour-city">{show.city}</span>
                  <span className="tour-venue">
                    {show.venue}
                    {show.note && <span className="tour-note"> — {show.note}</span>}
                  </span>
                </div>
                {show.ticketsUrl && (
                  <a
                    href={show.ticketsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tour-tickets-btn"
                  >
                    Tickets
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="tour-empty">
            <p>No upcoming shows scheduled.</p>
            <p className="tour-empty-sub">
              Follow on{' '}
              <a
                href="https://www.instagram.com/nickolamagnolia"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>{' '}
              for announcements.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TourSchedule;