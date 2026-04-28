import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import './AdminDashboard.css';

const EMPTY_DATE = { date: '', city: '', venue: '', ticketsUrl: '', note: '' };

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatTourDate = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDateParts = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    year: d.getFullYear(),
  };
};

const AdminDashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [popupImageUrl, setPopupImageUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [tourDates, setTourDates] = useState([]);
  const [tourSaveStatus, setTourSaveStatus] = useState('idle');
  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const subscriberData = await vercelEmailStorageService.getSubscribers();
      const analyticsData = await vercelEmailStorageService.getAnalytics();
      const imageUrl = await vercelEmailStorageService.getPopupImage();
      const tourData = await vercelEmailStorageService.getTourDates();

      setSubscribers(subscriberData);
      setAnalytics(analyticsData);
      setPopupImageUrl(imageUrl);
      setTourDates(tourData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    await vercelEmailStorageService.exportSubscribers();
  };

  const handleDownloadJSON = async () => {
    await vercelEmailStorageService.downloadCurrentData();
  };

  const handleRemoveSubscriber = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email}?`)) {
      const result = await vercelEmailStorageService.removeSubscriber(email);
      if (result.success) {
        loadData(); // Refresh the list
        alert('Subscriber removed successfully');
      } else {
        alert(result.message);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleTourDateChange = (index, field, value) => {
    setTourDates(prev => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleAddTourDate = () => {
    setTourDates(prev => [...prev, { ...EMPTY_DATE }]);
  };

  const handleRemoveTourDate = (index) => {
    setTourDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTourDates = async () => {
    setTourSaveStatus('saving');
    const result = await vercelEmailStorageService.saveTourDates(tourDates);
    setTourSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setTourSaveStatus('idle'), 3000);
  };

  const handleSortTourDates = () => {
    setTourDates(prev => {
      const withDates = prev.filter(d => d.date);
      const withoutDates = prev.filter(d => !d.date);
      withDates.sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
      return [...withDates, ...withoutDates];
    });
  };

  const tourStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upcoming = 0;
    let past = 0;
    tourDates.forEach(d => {
      const parsed = parseLocalDate(d.date);
      if (!parsed) return;
      if (parsed >= today) upcoming += 1;
      else past += 1;
    });
    return { upcoming, past };
  }, [tourDates]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    setUploadStatus('uploading');
    const result = await vercelEmailStorageService.uploadPopupImage(file);
    if (result.success) {
      setPopupImageUrl(result.imageUrl);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } else {
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
    e.target.value = '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRecentSubscribers = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return subscribers.filter(sub => 
      new Date(sub.subscribed_at) >= cutoffDate
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Nickola Magnolia Website Management</p>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'subscribers' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscribers')}
        >
          Subscribers ({subscribers.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'tour' ? 'active' : ''}`}
          onClick={() => setActiveTab('tour')}
        >
          Tour Dates ({tourDates.length})
        </button>
        <button 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      {/* Content */}
      <main className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Analytics Grid */}
            {analytics && (
              <div className="analytics-grid">
                <div className="analytics-card card-total">
                  <div className="card-icon">📧</div>
                  <h3>Total Subscribers</h3>
                  <p className="analytics-number">{analytics.totalSubscribers}</p>
                </div>
                <div className="analytics-card card-week">
                  <div className="card-icon">🗓️</div>
                  <h3>This Week</h3>
                  <p className="analytics-number">{getRecentSubscribers(7).length}</p>
                </div>
                <div className="analytics-card card-month">
                  <div className="card-icon">📆</div>
                  <h3>This Month</h3>
                  <p className="analytics-number">{getRecentSubscribers(30).length}</p>
                </div>
                <div className="analytics-card card-growth">
                  <div className="card-icon">📈</div>
                  <h3>Growth Rate</h3>
                  <p className="analytics-number">
                    {subscribers.length > 0 ? '+' + Math.round((getRecentSubscribers(7).length / subscribers.length) * 100) + '%' : '0%'}
                  </p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="recent-activity">
              <h2>Recent Subscribers</h2>
              {getRecentSubscribers(7).length > 0 ? (
                <div className="activity-list">
                  {getRecentSubscribers(7).slice(0, 5).map((subscriber) => (
                    <div key={subscriber.id} className="activity-item">
                      <div className="activity-info">
                        <span className="activity-email">{subscriber.email}</span>
                        <span className="activity-date">{formatDate(subscriber.subscribed_at)}</span>
                      </div>
                      <span className="activity-source">{subscriber.source}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">No new subscribers this week.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="actions-grid">
                <button onClick={handleDownloadJSON} className="action-btn">
                  <i className="icon">📥</i>
                  <span>Download JSON</span>
                </button>
                <button onClick={handleExport} className="action-btn">
                  <i className="icon">📁</i>
                  <span>Export Data</span>
                </button>
                <button onClick={loadData} className="action-btn">
                  <i className="icon">🔄</i>
                  <span>Refresh Data</span>
                </button>
                <button onClick={() => setActiveTab('subscribers')} className="action-btn">
                  <i className="icon">👥</i>
                  <span>View All Subscribers</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="subscribers-tab">
            <div className="tab-header">
              <h2>All Subscribers</h2>
              <div className="header-actions">
                <button onClick={handleDownloadJSON} className="btn btn-primary">
                  Download JSON
                </button>
                <button onClick={handleExport} className="btn btn-secondary">
                  Export Data
                </button>
              </div>
            </div>

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
                    <span className="date">{formatDate(subscriber.subscribed_at)}</span>
                    <span className={`source-badge src-${subscriber.source}`}>{subscriber.source}</span>
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
        )}

        {activeTab === 'tour' && (
          <div className="tour-tab">
            <div className="tab-header tour-tab-header">
              <div className="tour-header-info">
                <h2>Tour Dates</h2>
                <div className="tour-stats">
                  <span className="tour-stat tour-stat-upcoming">
                    <span className="stat-dot" /> {tourStats.upcoming} upcoming
                  </span>
                  <span className="tour-stat tour-stat-past">
                    <span className="stat-dot" /> {tourStats.past} past
                  </span>
                </div>
              </div>
              <div className="header-actions">
                {tourDates.length > 1 && (
                  <button onClick={handleSortTourDates} className="btn btn-ghost btn-sm" title="Sort by date">
                    ↕ Sort
                  </button>
                )}
                <button onClick={handleAddTourDate} className="btn btn-secondary">
                  + Add Date
                </button>
                <button
                  onClick={handleSaveTourDates}
                  className="btn btn-primary"
                  disabled={tourSaveStatus === 'saving'}
                >
                  {tourSaveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

            {tourSaveStatus === 'success' && (
              <p className="upload-feedback success">✓ Tour dates saved!</p>
            )}
            {tourSaveStatus === 'error' && (
              <p className="upload-feedback error">Failed to save. Try again.</p>
            )}

            {tourDates.length === 0 ? (
              <div className="empty-state tour-empty-state">
                <div className="empty-state-icon">🎤</div>
                <h3>No tour dates yet</h3>
                <p>Add your first show to get started.</p>
                <button onClick={handleAddTourDate} className="btn btn-primary">
                  + Add First Date
                </button>
              </div>
            ) : (
              <div className="tour-editor-list">
                {tourDates.map((show, index) => {
                  const parts = getDateParts(show.date);
                  const parsed = parseLocalDate(show.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = parsed && parsed < today;
                  const isIncomplete = !show.date || !show.city || !show.venue;

                  return (
                    <div
                      key={index}
                      className={`tour-card ${isPast ? 'is-past' : ''} ${isIncomplete ? 'is-incomplete' : ''}`}
                    >
                      <div className="tour-card-date-block">
                        {parts ? (
                          <>
                            <span className="tour-card-month">{parts.month}</span>
                            <span className="tour-card-day">{parts.day}</span>
                            <span className="tour-card-year">{parts.weekday} · {parts.year}</span>
                          </>
                        ) : (
                          <span className="tour-card-empty-date">No date</span>
                        )}
                        {isPast && <span className="tour-card-badge">Past</span>}
                      </div>

                      <div className="tour-card-body">
                        <div className="tour-card-row tour-card-row-primary">
                          <label className="tour-field tour-field-date">
                            <span className="tour-field-label">Date</span>
                            <input
                              type="date"
                              value={show.date}
                              onChange={(e) => handleTourDateChange(index, 'date', e.target.value)}
                            />
                          </label>
                          <label className="tour-field">
                            <span className="tour-field-label">City</span>
                            <input
                              type="text"
                              value={show.city}
                              placeholder="Toronto, ON"
                              onChange={(e) => handleTourDateChange(index, 'city', e.target.value)}
                            />
                          </label>
                          <label className="tour-field">
                            <span className="tour-field-label">Venue</span>
                            <input
                              type="text"
                              value={show.venue}
                              placeholder="The Horseshoe Tavern"
                              onChange={(e) => handleTourDateChange(index, 'venue', e.target.value)}
                            />
                          </label>
                        </div>
                        <div className="tour-card-row tour-card-row-secondary">
                          <label className="tour-field">
                            <span className="tour-field-label">🎟 Tickets URL</span>
                            <input
                              type="url"
                              value={show.ticketsUrl}
                              placeholder="https://..."
                              onChange={(e) => handleTourDateChange(index, 'ticketsUrl', e.target.value)}
                            />
                          </label>
                          <label className="tour-field">
                            <span className="tour-field-label">📝 Note</span>
                            <input
                              type="text"
                              value={show.note}
                              placeholder="w/ special guest"
                              onChange={(e) => handleTourDateChange(index, 'note', e.target.value)}
                            />
                          </label>
                        </div>
                        {formatTourDate(show.date) && (
                          <div className="tour-card-preview">
                            Preview: <strong>{formatTourDate(show.date)}</strong>
                            {show.city && <> · {show.city}</>}
                            {show.venue && <> · {show.venue}</>}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveTourDate(index)}
                        className="tour-card-remove"
                        title="Remove this date"
                        aria-label="Remove tour date"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>⚙️ Settings</h2>

            {/* Popup Hero Image */}
            <div className="settings-section">
              <h3>🖼️ Popup Hero Image</h3>
              <p className="section-desc">This image appears in the newsletter signup popup shown to first-time visitors.</p>
              <div className="image-upload-section">
                <div className="image-preview-wrapper">
                  {popupImageUrl ? (
                    <img src={popupImageUrl} alt="Current popup hero" className="popup-image-preview" />
                  ) : (
                    <div className="image-placeholder">
                      <span>🖼️</span>
                      <p>Default image in use</p>
                    </div>
                  )}
                </div>
                <div className="upload-controls">
                  <label
                    className={`upload-zone${uploadStatus === 'uploading' ? ' uploading' : ''}`}
                    htmlFor="popup-image-upload"
                  >
                    <input
                      id="popup-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadStatus === 'uploading'}
                      style={{ display: 'none' }}
                    />
                    <span className="upload-icon">📷</span>
                    <span className="upload-label">
                      {uploadStatus === 'uploading' ? 'Uploading…' : 'Click to upload a new image'}
                    </span>
                    <span className="upload-hint">JPG, PNG or WebP · Max 5 MB</span>
                  </label>
                  {uploadStatus === 'success' && (
                    <p className="upload-feedback success">✓ Image updated! The popup will use the new photo.</p>
                  )}
                  {uploadStatus === 'error' && (
                    <p className="upload-feedback error">Upload failed. Please try again.</p>
                  )}
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="settings-section">
              <h3>📋 System Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Email Storage</label>
                  <span>Vercel Blob</span>
                </div>
                <div className="info-item">
                  <label>Hosting</label>
                  <span>Vercel</span>
                </div>
                <div className="info-item">
                  <label>Last Subscriber</label>
                  <span>{analytics?.lastUpdated ? formatDate(analytics.lastUpdated) : 'None yet'}</span>
                </div>
                <div className="info-item">
                  <label>Total Subscribers</label>
                  <span>{analytics?.totalSubscribers ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-actions">
                <button
                  onClick={() => alert('To delete all subscriber data, remove subscribers.json from your Vercel Blob store.')}
                  className="btn btn-error"
                  disabled
                >
                  Clear All Data (Disabled)
                </button>
                <p className="danger-note">
                  Manage data via Vercel Dashboard → Storage → Blob.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
 
