import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import supabaseEmailStorageService from '../../services/supabaseEmailStorage';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const subscriberData = await supabaseEmailStorageService.getSubscribers();
      const analyticsData = await supabaseEmailStorageService.getAnalytics();
      
      setSubscribers(subscriberData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    await supabaseEmailStorageService.exportSubscribers();
  };

  const handleDownloadJSON = async () => {
    await supabaseEmailStorageService.downloadCurrentData();
  };

  const handleRemoveSubscriber = async (email) => {
    if (window.confirm(`Are you sure you want to remove ${email}?`)) {
      const result = await supabaseEmailStorageService.removeSubscriber(email);
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
                <div className="analytics-card">
                  <h3>Total Subscribers</h3>
                  <p className="analytics-number">{analytics.totalSubscribers}</p>
                </div>
                <div className="analytics-card">
                  <h3>This Week</h3>
                  <p className="analytics-number">{getRecentSubscribers(7).length}</p>
                </div>
                <div className="analytics-card">
                  <h3>This Month</h3>
                  <p className="analytics-number">{getRecentSubscribers(30).length}</p>
                </div>
                <div className="analytics-card">
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
                    {console.log(subscriber)}
                    <span className="email">{subscriber.email}</span>
                    <span className="date">{formatDate(subscriber.subscribed_at)}</span>
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
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>System Information</h2>
            
            <div className="settings-section">
              <h3>Newsletter System</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Storage Method:</label>
                  <span>Supabase Database (Production)</span>
                </div>
                <div className="info-item">
                  <label>Data Format:</label>
                  <span>PostgreSQL</span>
                </div>
                <div className="info-item">
                  <label>Created:</label>
                  <span>{analytics?.created ? formatDate(analytics.created) : 'Unknown'}</span>
                </div>
                <div className="info-item">
                  <label>Last Updated:</label>
                  <span>{analytics?.lastUpdated ? formatDate(analytics.lastUpdated) : 'Never'}</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Production Notes</h3>
              <div className="production-notes">
                <p>� <strong>Production Mode:</strong> Data stored in Supabase database</p>
                <p>� <strong>Real-time:</strong> Live updates and analytics</p>
                <p>🔒 <strong>Security:</strong> Row Level Security enabled</p>
                <p>☁️ <strong>Hosting:</strong> GitHub Pages with custom domain</p>
                <p>� <strong>Scalable:</strong> Unlimited subscribers supported</p>
              </div>
            </div>

            <div className="settings-section danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-actions">
                <button 
                  onClick={() => {
                    alert('Data deletion must be done through Supabase dashboard for security.');
                  }}
                  className="btn btn-error"
                  disabled
                >
                  Clear All Data (Disabled)
                </button>
                <p className="danger-note">
                  To delete subscriber data, use the Supabase dashboard for security.
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
