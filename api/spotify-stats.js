/**
 * Spotify Artist Stats (server-side proxy)
 * GET /api/spotify-stats → { artist, topTracks, recentAlbums }
 */

const ARTIST_ID = '5UrVks2tmoQ4BwTvlkQaI4'; // Nickola Magnolia

async function getToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.access_token;
}

async function fetchSpotify(endpoint, token) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = await getToken();
    if (!token) {
      return res.status(200).json({ error: 'Spotify not configured', artist: null, topTracks: [], recentAlbums: [] });
    }

    const [artist, topTracksData, albumsData] = await Promise.all([
      fetchSpotify(`/artists/${ARTIST_ID}`, token),
      fetchSpotify(`/artists/${ARTIST_ID}/top-tracks?market=US`, token),
      fetchSpotify(`/artists/${ARTIST_ID}/albums?include_groups=album,single&market=US&limit=10`, token),
    ]);

    return res.status(200).json({
      artist: artist ? {
        name: artist.name,
        monthlyListeners: artist.followers?.total || 0,
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0,
        genres: artist.genres || [],
        images: artist.images || [],
        externalUrl: artist.external_urls?.spotify || '',
      } : null,
      topTracks: (topTracksData?.tracks || []).slice(0, 10).map(t => ({
        name: t.name,
        album: t.album?.name || '',
        popularity: t.popularity,
        previewUrl: t.preview_url,
        externalUrl: t.external_urls?.spotify || '',
        durationMs: t.duration_ms,
        albumImage: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '',
      })),
      recentAlbums: (albumsData?.items || []).map(a => ({
        name: a.name,
        releaseDate: a.release_date,
        totalTracks: a.total_tracks,
        type: a.album_type,
        image: a.images?.[1]?.url || a.images?.[0]?.url || '',
        externalUrl: a.external_urls?.spotify || '',
      })),
    });
  } catch (error) {
    console.error('Spotify stats error:', error);
    return res.status(200).json({ error: error.message, artist: null, topTracks: [], recentAlbums: [] });
  }
};
