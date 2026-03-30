import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import vercelEmailStorageService from '../../services/vercelEmailStorageService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [popupImageUrl, setPopupImageUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
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

      setSubscribers(subscriberData);
      setAnalytics(analyticsData);
      setPopupImageUrl(imageUrl);
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
        <div className="loading">Loading admin dashboard...</div>
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
 
