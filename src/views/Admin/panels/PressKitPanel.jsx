import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const PressKitPanel = ({ Icons }) => {
  const [pressKit, setPressKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadPressKit();
  }, []);

  const loadPressKit = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getPressKit();
    setPressKit(data);
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setPressKit(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (group, field, value) => {
    setPressKit(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const result = await vercelEmailStorageService.savePressKit(pressKit);
    setSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleExportEPK = () => {
    const epk = {
      ...pressKit,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(epk, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pressKit.artistName?.replace(/\s+/g, '-').toLowerCase() || 'press-kit'}-epk.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBio = () => {
    const text = pressKit.bio || pressKit.shortBio || '';
    navigator.clipboard.writeText(text);
    setSaveStatus('copied');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="press-kit-panel">
      <div className="tab-toolbar">
        <div className="toolbar-info">
          <span className="toolbar-count">Electronic Press Kit</span>
        </div>
        <div className="toolbar-actions">
          <button onClick={handleCopyBio} className="btn btn-ghost btn-sm">
            <Icons.Check /> Copy Bio
          </button>
          <button onClick={handleExportEPK} className="btn btn-secondary btn-sm">
            <Icons.Download /> Export EPK
          </button>
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : <><Icons.Check /> Save</>}
          </button>
        </div>
      </div>

      {saveStatus === 'success' && <div className="toast toast-success"><Icons.Check /> Press kit saved</div>}
      {saveStatus === 'copied' && <div className="toast toast-success"><Icons.Check /> Bio copied to clipboard</div>}

      {/* Basic Info */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Artist Information</h2>
        </div>
        <div className="panel-body">
          <div className="press-form-grid">
            <label className="tour-field">
              <span className="tour-field-label">Artist Name</span>
              <input type="text" value={pressKit.artistName || ''} onChange={(e) => handleChange('artistName', e.target.value)} />
            </label>
            <label className="tour-field">
              <span className="tour-field-label">Genre</span>
              <input type="text" value={pressKit.genre || ''} placeholder="Indie / Folk / Rock" onChange={(e) => handleChange('genre', e.target.value)} />
            </label>
            <label className="tour-field">
              <span className="tour-field-label">Hometown</span>
              <input type="text" value={pressKit.hometown || ''} placeholder="City, State/Province" onChange={(e) => handleChange('hometown', e.target.value)} />
            </label>
            <label className="tour-field">
              <span className="tour-field-label">Booking Email</span>
              <input type="email" value={pressKit.bookingEmail || ''} placeholder="booking@..." onChange={(e) => handleChange('bookingEmail', e.target.value)} />
            </label>
            <label className="tour-field">
              <span className="tour-field-label">Management Email</span>
              <input type="email" value={pressKit.managementEmail || ''} placeholder="mgmt@..." onChange={(e) => handleChange('managementEmail', e.target.value)} />
            </label>
            <label className="tour-field">
              <span className="tour-field-label">Contact Email</span>
              <input type="email" value={pressKit.contactEmail || ''} placeholder="contact@..." onChange={(e) => handleChange('contactEmail', e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Biography</h2>
        </div>
        <div className="panel-body">
          <label className="tour-field">
            <span className="tour-field-label">Short Bio (1-2 sentences)</span>
            <textarea
              className="press-textarea"
              rows={2}
              value={pressKit.shortBio || ''}
              placeholder="A brief one-liner for social media and quick references..."
              onChange={(e) => handleChange('shortBio', e.target.value)}
            />
          </label>
          <label className="tour-field" style={{ marginTop: 12 }}>
            <span className="tour-field-label">Full Bio</span>
            <textarea
              className="press-textarea"
              rows={6}
              value={pressKit.bio || ''}
              placeholder="Full artist biography for press releases, venue submissions, and EPKs..."
              onChange={(e) => handleChange('bio', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Streaming Links */}
      <div className="analytics-two-col">
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Streaming Links</h2>
          </div>
          <div className="panel-body">
            <div className="press-links-list">
              {Object.entries(pressKit.streamingLinks || {}).map(([key, value]) => (
                <label key={key} className="tour-field">
                  <span className="tour-field-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type="url"
                    value={value}
                    placeholder="https://..."
                    onChange={(e) => handleNestedChange('streamingLinks', key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Social Links</h2>
          </div>
          <div className="panel-body">
            <div className="press-links-list">
              {Object.entries(pressKit.socialLinks || {}).map(([key, value]) => (
                <label key={key} className="tour-field">
                  <span className="tour-field-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type="url"
                    value={value}
                    placeholder="https://..."
                    onChange={(e) => handleNestedChange('socialLinks', key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressKitPanel;
