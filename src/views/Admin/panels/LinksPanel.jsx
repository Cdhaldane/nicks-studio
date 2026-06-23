import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const LinksPanel = ({ Icons }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getLinks();
    setLinks(data);
    setLoading(false);
  };

  const handleChange = (id, field, value) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleToggle = (id) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  const handleAdd = () => {
    setLinks(prev => [
      ...prev,
      {
        id: Date.now().toString(36),
        title: '',
        url: '',
        icon: 'link',
        active: true,
        order: prev.length,
      },
    ]);
  };

  const handleRemove = (id) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const handleMove = (index, direction) => {
    const updated = [...links];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setLinks(updated.map((l, i) => ({ ...l, order: i })));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const result = await vercelEmailStorageService.saveLinks(links);
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
    <div className="links-panel">
      <div className="tab-toolbar">
        <div className="toolbar-info">
          <span className="toolbar-count">{links.filter(l => l.active).length} active links</span>
        </div>
        <div className="toolbar-actions">
          <button onClick={handleAdd} className="btn btn-secondary btn-sm">
            <Icons.Plus /> Add Link
          </button>
          <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving...' : <><Icons.Check /> Save</>}
          </button>
        </div>
      </div>

      {saveStatus === 'success' && <div className="toast toast-success"><Icons.Check /> Links saved</div>}

      <div className="links-layout">
        {/* Editor */}
        <div className="links-editor">
          {links.length === 0 ? (
            <div className="empty-state">
              <Icons.Globe />
              <h3>No links yet</h3>
              <p>Add links that will appear on your link-in-bio page.</p>
            </div>
          ) : (
            <div className="links-list">
              {links.map((link, index) => (
                <div key={link.id} className={`link-card ${!link.active ? 'link-inactive' : ''}`}>
                  <div className="link-card-drag">
                    <button onClick={() => handleMove(index, -1)} className="btn-icon" disabled={index === 0}>▲</button>
                    <button onClick={() => handleMove(index, 1)} className="btn-icon" disabled={index === links.length - 1}>▼</button>
                  </div>
                  <div className="link-card-fields">
                    <input
                      type="text"
                      className="link-title-input"
                      placeholder="Link title"
                      value={link.title}
                      onChange={(e) => handleChange(link.id, 'title', e.target.value)}
                    />
                    <input
                      type="url"
                      className="link-url-input"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => handleChange(link.id, 'url', e.target.value)}
                    />
                  </div>
                  <div className="link-card-actions">
                    <label className="social-toggle">
                      <input type="checkbox" checked={link.active} onChange={() => handleToggle(link.id)} />
                      <span className="toggle-slider" />
                    </label>
                    <button onClick={() => handleRemove(link.id)} className="btn-icon btn-icon-danger">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="links-preview">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title"><Icons.Smartphone /> Preview</h2>
            </div>
            <div className="panel-body">
              <div className="link-preview-phone">
                <div className="link-preview-header">
                  <div className="link-preview-avatar">NM</div>
                  <span className="link-preview-name">Nickola Magnolia</span>
                </div>
                <div className="link-preview-buttons">
                  {links.filter(l => l.active && l.title).map(link => (
                    <div key={link.id} className="link-preview-btn">
                      {link.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinksPanel;
