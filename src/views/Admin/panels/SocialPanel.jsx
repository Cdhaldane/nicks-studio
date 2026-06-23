import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const SocialPanel = ({ Icons }) => {
  const [social, setSocial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadSocial();
  }, []);

  const loadSocial = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getSocialStats();
    setSocial(data);
    setLoading(false);
  };

  const handleChange = (id, field, value) => {
    setSocial(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleToggle = (id) => {
    setSocial(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p.id === id ? { ...p, active: !p.active } : p
      ),
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const result = await vercelEmailStorageService.saveSocialStats(social);
    setSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const totalFollowers = social?.platforms?.reduce((sum, p) => sum + (Number(p.followers || p.subscribers || 0)), 0) || 0;

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="social-panel">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Icons.Globe />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Reach</span>
            <span className="stat-card-value">{totalFollowers.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">
            <Icons.TrendingUp />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Active Platforms</span>
            <span className="stat-card-value">{social?.platforms?.filter(p => p.active).length || 0}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><Icons.Globe /> Social Platforms</h2>
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : <><Icons.Check /> Save</>}
          </button>
        </div>
        <div className="panel-body">
          {saveStatus === 'success' && (
            <div className="toast toast-success"><Icons.Check /> Social stats saved</div>
          )}
          <div className="social-list">
            {social?.platforms?.map(platform => (
              <div key={platform.id} className={`social-item ${!platform.active ? 'social-inactive' : ''}`}>
                <div className="social-item-header">
                  <label className="social-toggle">
                    <input
                      type="checkbox"
                      checked={platform.active}
                      onChange={() => handleToggle(platform.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <span className="social-platform-name">{platform.name}</span>
                </div>
                <div className="social-item-fields">
                  <label className="tour-field">
                    <span className="tour-field-label">Handle / Username</span>
                    <input
                      type="text"
                      value={platform.handle}
                      placeholder="@username"
                      onChange={(e) => handleChange(platform.id, 'handle', e.target.value)}
                    />
                  </label>
                  <label className="tour-field">
                    <span className="tour-field-label">Followers</span>
                    <input
                      type="number"
                      value={platform.followers || platform.subscribers || 0}
                      onChange={(e) => handleChange(platform.id, 'followers', parseInt(e.target.value) || 0)}
                    />
                  </label>
                  <label className="tour-field">
                    <span className="tour-field-label">Profile URL</span>
                    <input
                      type="url"
                      value={platform.url}
                      placeholder="https://..."
                      onChange={(e) => handleChange(platform.id, 'url', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPanel;
