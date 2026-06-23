import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const BookingPanel = ({ Icons }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getBookingRequests();
    setRequests(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id, status) => {
    const result = await vercelEmailStorageService.updateBookingRequest(id, status);
    if (result.success) {
      setRequests(result.requests);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking request?')) return;
    const result = await vercelEmailStorageService.deleteBookingRequest(id);
    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="booking-panel">
      <div className="tab-toolbar">
        <div className="toolbar-info">
          <span className="toolbar-count">{requests.length} total requests</span>
          {pendingCount > 0 && (
            <span className="booking-pending-badge">{pendingCount} pending</span>
          )}
        </div>
        <div className="toolbar-actions">
          <div className="filter-pills">
            {['all', 'pending', 'accepted', 'declined'].map(f => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Icons.Calendar />
          <h3>{filter === 'all' ? 'No booking requests yet' : `No ${filter} requests`}</h3>
          <p>
            {filter === 'all'
              ? 'Requests will appear here when people submit the booking form on your site.'
              : `No requests with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="booking-list">
          {filtered.map(request => (
            <div key={request.id} className={`booking-card booking-${request.status}`}>
              <div className="booking-card-header">
                <div className="booking-requester">
                  <div className="activity-avatar">{request.name[0].toUpperCase()}</div>
                  <div className="booking-requester-info">
                    <span className="booking-name">{request.name}</span>
                    <span className="booking-email">{request.email}</span>
                  </div>
                </div>
                <span className={`booking-status-badge status-${request.status}`}>
                  {request.status}
                </span>
              </div>

              <div className="booking-card-body">
                <div className="booking-details-grid">
                  {request.eventDate && (
                    <div className="booking-detail">
                      <Icons.Calendar />
                      <span>{new Date(request.eventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  {request.venue && (
                    <div className="booking-detail">
                      <Icons.MapPin />
                      <span>{request.venue}{request.city ? `, ${request.city}` : ''}</span>
                    </div>
                  )}
                  {request.eventType && (
                    <div className="booking-detail">
                      <Icons.Mic />
                      <span>{request.eventType}</span>
                    </div>
                  )}
                  {request.budget && (
                    <div className="booking-detail">
                      <Icons.TrendingUp />
                      <span>{request.budget}</span>
                    </div>
                  )}
                </div>
                <p className="booking-message">{request.message}</p>
                <span className="booking-date">Received {new Date(request.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="booking-card-actions">
                {request.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdateStatus(request.id, 'accepted')} className="btn btn-primary btn-sm">
                      <Icons.Check /> Accept
                    </button>
                    <button onClick={() => handleUpdateStatus(request.id, 'declined')} className="btn btn-secondary btn-sm">
                      Decline
                    </button>
                  </>
                )}
                {request.status !== 'pending' && (
                  <button onClick={() => handleUpdateStatus(request.id, 'pending')} className="btn btn-ghost btn-sm">
                    Reset to Pending
                  </button>
                )}
                <button onClick={() => handleDelete(request.id)} className="btn-icon btn-icon-danger">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingPanel;
