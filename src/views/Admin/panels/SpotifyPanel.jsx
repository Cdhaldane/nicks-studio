import React, { useState, useEffect } from 'react';
import vercelEmailStorageService from '../../../services/vercelEmailStorageService';

const SpotifyPanel = ({ Icons }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await vercelEmailStorageService.getSpotifyStats();
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><Icons.Music /> Spotify Stats</h2>
        </div>
        <div className="panel-body">
          <div className="empty-state-inline"><div className="loading-spinner" /></div>
        </div>
      </div>
    );
  }

  if (!stats?.artist) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><Icons.Music /> Spotify Stats</h2>
        </div>
        <div className="panel-body">
          <div className="empty-state-inline">
            <Icons.Music />
            <p>Spotify not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your environment.</p>
          </div>
        </div>
      </div>
    );
  }

  const { artist, topTracks, recentAlbums } = stats;

  return (
    <div className="spotify-panel">
      {/* Artist Overview */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-green">
            <Icons.Users />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Followers</span>
            <span className="stat-card-value">{artist.followers.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Icons.TrendingUp />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Popularity</span>
            <span className="stat-card-value">{artist.popularity}/100</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-blue">
            <Icons.Music />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Releases</span>
            <span className="stat-card-value">{recentAlbums.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon icon-amber">
            <Icons.Zap />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Top Tracks</span>
            <span className="stat-card-value">{topTracks.length}</span>
          </div>
        </div>
      </div>

      {/* Top Tracks */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><Icons.TrendingUp /> Top Tracks</h2>
          {artist.externalUrl && (
            <a href={artist.externalUrl} target="_blank" rel="noopener noreferrer" className="panel-action">
              Open Spotify <Icons.ExternalLink />
            </a>
          )}
        </div>
        <div className="panel-body">
          <div className="track-list">
            {topTracks.map((track, i) => (
              <div key={i} className="track-item">
                <span className="track-rank">{i + 1}</span>
                {track.albumImage && (
                  <img src={track.albumImage} alt="" className="track-thumb" />
                )}
                <div className="track-info">
                  <span className="track-name">{track.name}</span>
                  <span className="track-album">{track.album}</span>
                </div>
                <div className="track-popularity">
                  <div className="popularity-bar">
                    <div className="popularity-fill" style={{ width: `${track.popularity}%` }} />
                  </div>
                  <span className="popularity-value">{track.popularity}</span>
                </div>
                {track.externalUrl && (
                  <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className="track-link">
                    <Icons.ExternalLink />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Releases */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title"><Icons.Music /> Recent Releases</h2>
        </div>
        <div className="panel-body">
          <div className="album-grid">
            {recentAlbums.map((album, i) => (
              <a key={i} href={album.externalUrl} target="_blank" rel="noopener noreferrer" className="album-card">
                {album.image && <img src={album.image} alt={album.name} className="album-cover" />}
                <div className="album-info">
                  <span className="album-name">{album.name}</span>
                  <span className="album-meta">{album.type} · {album.releaseDate?.slice(0, 4)} · {album.totalTracks} tracks</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPanel;
