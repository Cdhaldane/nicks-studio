import React, { useState } from 'react';
import './TourSchedule.css';

const TourSchedule = ({ showAsSection = true }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const tourDates = [
    { date: '2025-01-15', city: 'New York', venue: 'Madison Square Garden', ticketsUrl: 'https://ticketmaster.com' },
    { date: '2025-01-20', city: 'Los Angeles', venue: 'Hollywood Bowl', ticketsUrl: 'https://ticketmaster.com' },
    { date: '2025-01-25', city: 'Chicago', venue: 'United Center', ticketsUrl: 'https://ticketmaster.com' },
    // Add more dates as needed
  ];

  if (!showAsSection) {
    // Return just the image for popup use
    return (
      <div className="tour-image-container">
        <img 
          src={`${process.env.PUBLIC_URL}/nick_tour.jpg`}
          alt="Tour Schedule"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {!imageLoaded && <div className="tour-loading">Loading tour dates...</div>}
      </div>
    );
  }

  return (
    <section className="tour-schedule-section">
      <div className="tour-container">
        <h2 className="tour-title">🎵 Tour Dates</h2>
        
        {/* Tour Image */}
        <div className="tour-image-wrapper">
          <img 
            src={`${process.env.PUBLIC_URL}/nick_tour.jpg`}
            alt="Tour Schedule"
            className="tour-schedule-image"
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Optional: Tour Dates List */}
        <div className="tour-dates-list">
          {tourDates.map((show, index) => (
            <div key={index} className="tour-date-item">
              <div className="tour-date-info">
                <span className="tour-date">{new Date(show.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</span>
                <span className="tour-city">{show.city}</span>
                <span className="tour-venue">{show.venue}</span>
              </div>
              <a 
                href={show.ticketsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="tour-tickets-btn"
              >
                Tickets
              </a>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="tour-cta">
          <a 
            href="https://www.ticketmaster.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="tour-cta-btn"
          >
            View All Tour Dates & Get Tickets 🎫
          </a>
        </div>
      </div>
    </section>
  );
};

export default TourSchedule;