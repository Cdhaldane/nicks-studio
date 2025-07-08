import React, { useState, useEffect } from 'react';
import emailStorageService from '../../services/emailStorage';
import './NewsletterAdmin.css';

const NewsletterAdmin = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    try {
      const subscriberData = emailStorageService.getSubscribers();
      const analyticsData = emailStorageService.getAnalytics();
      
      setSubscribers(subscriberData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading newsletter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    emailStorageService.exportSubscribers();
  };

  const handleRemoveSubscriber = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email}?`)) {
      const result = await emailStorageService.removeSubscriber(email);
      if (result.success) {
        loadData(); // Refresh the list
        alert('Subscriber removed successfully');
      } else {
        alert(result.message);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="newsletter-admin">
        <div className="loading">Loading newsletter data...</div>
      </div>
    );
  }

  return (
    <div className="newsletter-admin">
      <header className="admin-header">
        <h1>Newsletter Subscribers</h1>
        <button onClick={handleExport} className="btn btn-secondary">
          Export JSON
        </button>
      </header>

      {analytics && (
        <div className="analytics-grid">
          <div className="analytics-card">
            <h3>Total Subscribers</h3>
            <p className="analytics-number">{analytics.totalSubscribers}</p>
          </div>
          <div className="analytics-card">
            <h3>Last 7 Days</h3>
            <p className="analytics-number">{analytics.recentSubscribers7d}</p>
          </div>
          <div className="analytics-card">
            <h3>Last 30 Days</h3>
            <p className="analytics-number">{analytics.recentSubscribers30d}</p>
          </div>
          <div className="analytics-card">
            <h3>Last Updated</h3>
            <p className="analytics-date">
              {analytics.lastUpdated ? formatDate(analytics.lastUpdated) : 'Never'}
            </p>
          </div>
        </div>
      )}

      <div className="subscribers-section">
        <h2>Subscribers List</h2>
        {subscribers.length === 0 ? (
          <div className="empty-state">
            <p>No subscribers yet. The list will appear here when people sign up!</p>
          </div>
        ) : (
          <div className="subscribers-table">
            <div className="table-header">
              <span>Email</span>
              <span>Subscribed</span>
              <span>Source</span>
              <span>Actions</span>
            </div>
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="table-row">
                <span className="email">{subscriber.email}</span>
                <span className="date">{formatDate(subscriber.subscribedAt)}</span>
                <span className="source">{subscriber.source}</span>
                <span className="actions">
                  <button 
                    onClick={() => handleRemoveSubscriber(subscriber.email)}
                    className="btn btn-sm btn-error"
                  >
                    Remove
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-info">
        <h3>Development Notes</h3>
        <ul>
          <li>📧 Emails are stored in browser localStorage for development</li>
          <li>🔒 In production, integrate with a proper backend API</li>
          <li>📊 Consider services like Mailchimp, ConvertKit, or custom API</li>
          <li>📂 Data can be exported as JSON for migration</li>
        </ul>
      </div>
    </div>
  );
};

export default NewsletterAdmin;
