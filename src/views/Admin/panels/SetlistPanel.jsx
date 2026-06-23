import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const SetlistPanel = ({ Icons }) => {
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSetlist, setActiveSetlist] = useState(null);
  const [newName, setNewName] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    loadSetlists();
  }, []);

  const loadSetlists = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getSetlists();
    setSetlists(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const result = await vercelEmailStorageService.createSetlist({ name: newName.trim(), songs: [] });
    if (result.success) {
      setSetlists(prev => [...prev, result.setlist]);
      setActiveSetlist(result.setlist);
      setNewName('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this setlist?')) return;
    const result = await vercelEmailStorageService.deleteSetlist(id);
    if (result.success) {
      setSetlists(prev => prev.filter(s => s.id !== id));
      if (activeSetlist?.id === id) setActiveSetlist(null);
    }
  };

  const handleSongAdd = () => {
    if (!activeSetlist) return;
    setActiveSetlist(prev => ({
      ...prev,
      songs: [...prev.songs, { id: Date.now().toString(36), title: '', duration: '', notes: '' }],
    }));
  };

  const handleSongChange = (songId, field, value) => {
    setActiveSetlist(prev => ({
      ...prev,
      songs: prev.songs.map(s => s.id === songId ? { ...s, [field]: value } : s),
    }));
  };

  const handleSongRemove = (songId) => {
    setActiveSetlist(prev => ({
      ...prev,
      songs: prev.songs.filter(s => s.id !== songId),
    }));
  };

  const handleMoveSong = (index, direction) => {
    if (!activeSetlist) return;
    const songs = [...activeSetlist.songs];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= songs.length) return;
    [songs[index], songs[newIndex]] = [songs[newIndex], songs[index]];
    setActiveSetlist(prev => ({ ...prev, songs }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    const updated = setlists.map(s => s.id === activeSetlist.id ? activeSetlist : s);
    const result = await vercelEmailStorageService.saveSetlists(updated);
    if (result.success) {
      setSetlists(result.setlists);
      setSaveStatus('success');
    } else {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleFieldChange = (field, value) => {
    setActiveSetlist(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body"><div className="empty-state-inline"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div className="setlist-panel">
      <div className="setlist-layout">
        {/* Setlist Sidebar */}
        <div className="setlist-sidebar">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Setlists</h2>
            </div>
            <div className="panel-body">
              <div className="setlist-create-row">
                <input
                  type="text"
                  className="setlist-name-input"
                  placeholder="New setlist name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button onClick={handleCreate} className="btn btn-primary btn-sm" disabled={!newName.trim()}>
                  <Icons.Plus />
                </button>
              </div>

              <div className="setlist-list">
                {setlists.length === 0 ? (
                  <p className="no-activity">No setlists yet. Create one above.</p>
                ) : (
                  setlists.map(sl => (
                    <div
                      key={sl.id}
                      className={`setlist-list-item ${activeSetlist?.id === sl.id ? 'active' : ''}`}
                      onClick={() => setActiveSetlist(sl)}
                    >
                      <div className="setlist-list-info">
                        <span className="setlist-list-name">{sl.name}</span>
                        <span className="setlist-list-meta">{sl.songs?.length || 0} songs{sl.venue ? ` · ${sl.venue}` : ''}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(sl.id); }} className="btn-icon btn-icon-danger">
                        <Icons.Trash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Setlist Editor */}
        <div className="setlist-editor">
          {!activeSetlist ? (
            <div className="empty-state">
              <Icons.Music />
              <h3>Select a setlist</h3>
              <p>Choose a setlist from the left or create a new one.</p>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">{activeSetlist.name}</h2>
                <div className="toolbar-actions">
                  <button onClick={handleSongAdd} className="btn btn-secondary btn-sm">
                    <Icons.Plus /> Add Song
                  </button>
                  <button onClick={handleSave} className="btn btn-primary btn-sm" disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? 'Saving...' : <><Icons.Check /> Save</>}
                  </button>
                </div>
              </div>
              <div className="panel-body">
                {saveStatus === 'success' && <div className="toast toast-success"><Icons.Check /> Setlist saved</div>}

                {/* Setlist metadata */}
                <div className="setlist-meta-row">
                  <label className="tour-field">
                    <span className="tour-field-label">Show Date</span>
                    <input type="date" value={activeSetlist.showDate || ''} onChange={(e) => handleFieldChange('showDate', e.target.value)} />
                  </label>
                  <label className="tour-field">
                    <span className="tour-field-label">Venue</span>
                    <input type="text" value={activeSetlist.venue || ''} placeholder="Venue name" onChange={(e) => handleFieldChange('venue', e.target.value)} />
                  </label>
                  <label className="tour-field">
                    <span className="tour-field-label">Notes</span>
                    <input type="text" value={activeSetlist.notes || ''} placeholder="Set notes..." onChange={(e) => handleFieldChange('notes', e.target.value)} />
                  </label>
                </div>

                {/* Song List */}
                {activeSetlist.songs.length === 0 ? (
                  <div className="empty-state-inline" style={{ marginTop: 16 }}>
                    <Icons.Music />
                    <p>No songs yet. Click "Add Song" to build your setlist.</p>
                  </div>
                ) : (
                  <div className="song-list">
                    {activeSetlist.songs.map((song, index) => (
                      <div key={song.id} className="song-item">
                        <span className="song-number">{index + 1}</span>
                        <div className="song-fields">
                          <input
                            type="text"
                            className="song-title-input"
                            placeholder="Song title"
                            value={song.title}
                            onChange={(e) => handleSongChange(song.id, 'title', e.target.value)}
                          />
                          <input
                            type="text"
                            className="song-duration-input"
                            placeholder="4:30"
                            value={song.duration}
                            onChange={(e) => handleSongChange(song.id, 'duration', e.target.value)}
                          />
                          <input
                            type="text"
                            className="song-notes-input"
                            placeholder="Notes..."
                            value={song.notes}
                            onChange={(e) => handleSongChange(song.id, 'notes', e.target.value)}
                          />
                        </div>
                        <div className="song-actions">
                          <button onClick={() => handleMoveSong(index, -1)} className="btn-icon" disabled={index === 0}>▲</button>
                          <button onClick={() => handleMoveSong(index, 1)} className="btn-icon" disabled={index === activeSetlist.songs.length - 1}>▼</button>
                          <button onClick={() => handleSongRemove(song.id)} className="btn-icon btn-icon-danger"><Icons.Trash /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeSetlist.songs.length > 0 && (
                  <div className="setlist-summary">
                    {activeSetlist.songs.length} songs · Est. {
                      (() => {
                        const totalMin = activeSetlist.songs.reduce((sum, s) => {
                          const parts = (s.duration || '0:00').split(':');
                          return sum + (parseInt(parts[0] || 0) * 60) + parseInt(parts[1] || 0);
                        }, 0);
                        return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
                      })()
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetlistPanel;
