import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';
import { SOCIAL_MEDIA } from '../../../utils/constants';

// The footer's canonical link list, shaped for this panel. Used to seed the
// panel the first time (or when stored data predates the links-based model).
const seedPlatforms = () =>
  SOCIAL_MEDIA.map(({ platform, label, icon, url }) => ({
    id: platform,
    name: label,
    icon,
    url,
    active: true,
  }));

// Stored data is the new links model only when every entry carries an icon —
// older saved data tracked follower counts and had no icon, so we re-seed.
const isLinksModel = (platforms) =>
  Array.isArray(platforms) &&
  platforms.length > 0 &&
  platforms.every((p) => typeof p.icon === 'string' && p.icon);

const SocialPanel = ({ Icons }) => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadSocial();
  }, []);

  const loadSocial = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getSocialStats();
    setPlatforms(isLinksModel(data?.platforms) ? data.platforms : seedPlatforms());
    setLoading(false);
  };

  const handleChange = (id, field, value) => {
    setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleToggle = (id) => {
    setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= platforms.length) return;
    const updated = [...platforms];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPlatforms(updated);
  };

  const handleReset = () => {
    setPlatforms(seedPlatforms());
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const result = await vercelEmailStorageService.saveSocialStats({ platforms });
    setSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const activeCount = platforms.filter((p) => p.active).length;

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="social-panel">
      <div className="tab-toolbar">
        <div className="toolbar-info">
          <span className="toolbar-count">{activeCount} of {platforms.length} shown in footer</span>
        </div>
        <div className="toolbar-actions">
          <button onClick={handleReset} className="btn btn-ghost btn-sm">Reset to defaults</button>
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : <><Icons.Check /> Save</>}
          </button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <div className="toast toast-success"><Icons.Check /> Social links saved</div>
      )}
      {saveStatus === 'error' && (
        <div className="toast toast-error">Couldn't save. Please try again.</div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-text">
            <h2 className="panel-title"><Icons.Globe /> Footer Social Links</h2>
            <span className="panel-subtitle">Reorder, edit URLs, and toggle which links appear in the site footer.</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="social-list">
            {platforms.map((platform, index) => (
              <div key={platform.id} className={`social-item ${!platform.active ? 'social-inactive' : ''}`}>
                <div className="social-reorder">
                  <button
                    onClick={() => handleMove(index, -1)}
                    className="btn-icon"
                    disabled={index === 0}
                    aria-label={`Move ${platform.name} up`}
                  >▲</button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    className="btn-icon"
                    disabled={index === platforms.length - 1}
                    aria-label={`Move ${platform.name} down`}
                  >▼</button>
                </div>

                <span className="social-icon-preview" aria-hidden="true">
                  <i className={platform.icon} />
                </span>

                <div className="social-item-main">
                  <span className="social-platform-name">{platform.name}</span>
                  <input
                    type="url"
                    className="social-url-input"
                    value={platform.url}
                    placeholder="https://..."
                    onChange={(e) => handleChange(platform.id, 'url', e.target.value)}
                  />
                </div>

                <label className="social-toggle" title={platform.active ? 'Shown in footer' : 'Hidden from footer'}>
                  <input
                    type="checkbox"
                    checked={platform.active}
                    onChange={() => handleToggle(platform.id)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPanel;
