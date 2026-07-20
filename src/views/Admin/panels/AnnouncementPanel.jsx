import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const EMPTY_ANNOUNCEMENT = {
  enabled: false,
  eyebrow: '',
  title: '',
  description: '',
  linkUrl: '',
  linkText: '',
  imageUrl: '',
  showSignup: false,
  updatedAt: null,
};

const AnnouncementPanel = ({ Icons }) => {
  const [announcement, setAnnouncement] = useState(EMPTY_ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getAnnouncement();
    if (data) setAnnouncement({ ...EMPTY_ANNOUNCEMENT, ...data });
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setValidationError(null);
    setAnnouncement((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setUploadStatus('uploading');
    const result = await vercelEmailStorageService.uploadAnnouncementImage(file);
    if (result.success && result.imageUrl) {
      setAnnouncement((prev) => ({ ...prev, imageUrl: result.imageUrl }));
      setUploadStatus('success');
    } else {
      setUploadStatus('error');
    }
    setTimeout(() => setUploadStatus('idle'), 3000);
  };

  const handleRemoveImage = () => {
    setAnnouncement((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSave = async () => {
    if (announcement.enabled && !announcement.title.trim()) {
      setValidationError('Add a title before turning the popup on.');
      return;
    }
    setSaveStatus('saving');
    const result = await vercelEmailStorageService.saveAnnouncement(announcement);
    if (result.success && result.announcement) {
      setAnnouncement({ ...EMPTY_ANNOUNCEMENT, ...result.announcement });
    }
    setSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="announcement-panel">
      <div className="tab-toolbar">
        <div className="toolbar-info">
          <span className="toolbar-count">
            {announcement.enabled ? 'Popup is live on the site' : 'Popup is turned off'}
          </span>
        </div>
        <div className="toolbar-actions">
          <label className="social-toggle" title={announcement.enabled ? 'Popup shown to visitors' : 'Popup hidden'}>
            <input
              type="checkbox"
              checked={announcement.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : <><Icons.Check /> Save &amp; Publish</>}
          </button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <div className="toast toast-success"><Icons.Check /> Announcement saved — visitors will see the update</div>
      )}
      {saveStatus === 'error' && (
        <div className="toast toast-error">Couldn't save. Please try again.</div>
      )}
      {validationError && (
        <div className="toast toast-error">{validationError}</div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-text">
            <h2 className="panel-title"><Icons.Megaphone /> Announcement Popup</h2>
            <span className="panel-subtitle">
              Shown once per visitor. Saving any change shows the popup to everyone again — including people who dismissed the old one.
            </span>
          </div>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="announcement-eyebrow">Small label (above the title)</label>
              <input
                id="announcement-eyebrow"
                type="text"
                className="form-input"
                value={announcement.eyebrow}
                placeholder="e.g. Upcoming Show"
                onChange={(e) => handleChange('eyebrow', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="announcement-title">Title</label>
              <input
                id="announcement-title"
                type="text"
                className="form-input"
                value={announcement.title}
                placeholder="e.g. Nickola Magnolia Unplugged"
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label" htmlFor="announcement-description">Description</label>
              <textarea
                id="announcement-description"
                className="form-textarea"
                value={announcement.description}
                placeholder="What's happening, when, and where. Line breaks are kept."
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="announcement-link-url">Button link (tickets URL)</label>
              <input
                id="announcement-link-url"
                type="url"
                className="form-input"
                value={announcement.linkUrl}
                placeholder="https://www.eventbrite.ca/e/..."
                onChange={(e) => handleChange('linkUrl', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="announcement-link-text">Button text</label>
              <input
                id="announcement-link-text"
                type="text"
                className="form-input"
                value={announcement.linkText}
                placeholder="Get Tickets"
                onChange={(e) => handleChange('linkText', e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label" htmlFor="announcement-show-signup">Email sign-up</label>
              <div className="toggle-row">
                <label className="social-toggle" title={announcement.showSignup ? 'Sign-up shown in popup' : 'Sign-up hidden'}>
                  <input
                    id="announcement-show-signup"
                    type="checkbox"
                    checked={announcement.showSignup}
                    onChange={(e) => handleChange('showSignup', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-row-text">
                  Add an email field to the popup so fans can join the newsletter list without leaving it.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-text">
            <h2 className="panel-title"><Icons.Image /> Popup Image (optional)</h2>
            <span className="panel-subtitle">
              Shown above the text — a show poster works great. Remember to hit Save &amp; Publish after uploading.
            </span>
          </div>
        </div>
        <div className="panel-body">
          <div className="image-upload-section">
            <div className="image-preview-wrapper">
              {announcement.imageUrl ? (
                <img src={announcement.imageUrl} alt="Current announcement" className="popup-image-preview" />
              ) : (
                <div className="image-placeholder">
                  <Icons.Image />
                  <p>No image — text-only popup</p>
                </div>
              )}
            </div>
            <div className="upload-controls">
              <label
                className={`upload-zone${uploadStatus === 'uploading' ? ' uploading' : ''}`}
                htmlFor="announcement-image-upload"
              >
                <input
                  id="announcement-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadStatus === 'uploading'}
                  style={{ display: 'none' }}
                />
                <Icons.Upload />
                <span className="upload-label">
                  {uploadStatus === 'uploading' ? 'Uploading...' : 'Click to upload an image'}
                </span>
                <span className="upload-hint">JPG, PNG or WebP · Max 5 MB</span>
              </label>
              {announcement.imageUrl && (
                <button onClick={handleRemoveImage} className="btn btn-ghost btn-sm">
                  <Icons.Trash /> Remove image
                </button>
              )}
              {uploadStatus === 'success' && (
                <div className="toast toast-success">
                  <Icons.Check /> Image uploaded — save to publish it
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="toast toast-error">
                  <Icons.AlertCircle /> Upload failed. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-text">
            <h2 className="panel-title"><Icons.Eye /> Preview</h2>
            <span className="panel-subtitle">Roughly how the popup will look to visitors.</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="announcement-preview">
            {announcement.imageUrl && (
              <img src={announcement.imageUrl} alt="" className="preview-image" />
            )}
            {announcement.eyebrow && <span className="preview-eyebrow">{announcement.eyebrow}</span>}
            <h3 className="preview-title">{announcement.title || 'Your title here'}</h3>
            {announcement.description && <p className="preview-description">{announcement.description}</p>}
            {announcement.linkUrl && (
              <span className="preview-cta">{announcement.linkText || 'Learn More'}</span>
            )}
            {announcement.showSignup && (
              <div className="preview-signup">
                <span className="preview-signup-label">Get shows and new music in your inbox</span>
                <div className="preview-signup-row">
                  <span className="preview-signup-input">your@email.com</span>
                  <span className="preview-signup-btn">Subscribe</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPanel;
