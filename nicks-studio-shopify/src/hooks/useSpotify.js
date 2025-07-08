import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for Spotify API integration
 * @returns {object} - { albums, loading, error, refreshAlbums }
 */
export const useSpotify = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Get Spotify access token
  const getSpotifyToken = useCallback(async () => {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      setError('Spotify credentials not configured');
      setLoading(false);
      return;
    }

    const url = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await axios.post(url, data.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('Spotify token response:', response.data);
      const accessToken = response.data.access_token;
      setToken(accessToken);
      return accessToken;
    } catch (error) {
      console.error('Error fetching Spotify token:', error);
      setError('Failed to authenticate with Spotify');
      return null;
    }
  }, []);

  // Fetch artist albums
  const fetchAlbums = useCallback(async (accessToken) => {
    const artistId = '5UrVks2tmoQ4BwTvlkQaI4'; // Nickola Magnolia's Spotify ID
    const url = `https://api.spotify.com/v1/artists/${artistId}/albums`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          include_groups: 'album,single',
          market: 'US',
          limit: 20,
        },
      });

      // Filter out duplicates and sort by release date
      const uniqueAlbums = response.data.items
        .filter((album, index, self) => 
          index === self.findIndex(a => a.name === album.name)
        )
        .sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
      setAlbums(uniqueAlbums);
      setError(null);
    } catch (error) {
      console.error('Error fetching albums:', error);
      setError('Failed to fetch albums');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Spotify data
  useEffect(() => {
    const initializeSpotify = async () => {
      setLoading(true);
      const accessToken = await getSpotifyToken();
      if (accessToken) {
        await fetchAlbums(accessToken);
      }
    };

    initializeSpotify();
  }, [getSpotifyToken, fetchAlbums]);

  // Refresh albums
  const refreshAlbums = useCallback(async () => {
    if (token) {
      setLoading(true);
      await fetchAlbums(token);
    }
  }, [token, fetchAlbums]);

  return {
    token,
    albums,
    loading,
    error,
    refreshAlbums,
  };
};

/**
 * Custom hook for getting track features
 * @param {string} trackId - Spotify track ID
 * @returns {object} - { features, loading, error }
 */
export const useTrackFeatures = (trackId) => {
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!trackId) return;

    const fetchTrackFeatures = async () => {
      setLoading(true);
      try {
        // This would require a server endpoint to handle the request
        // as audio features require additional permissions
        const response = await axios.get(`/api/spotify/track/${trackId}/features`);
        setFeatures(response.data);
      } catch (error) {
        console.error('Error fetching track features:', error);
        setError('Failed to fetch track features');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackFeatures();
  }, [trackId]);

  return { features, loading, error };
};
