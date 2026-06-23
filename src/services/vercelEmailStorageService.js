const API_BASE = process.env.REACT_APP_API_URL || '/api';

class VercelEmailStorageService {
  async addSubscriber(email, source = 'website-footer') {
    try {
      const response = await fetch(`${API_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to subscribe' };
      }

      return { success: true, message: data.message, subscriber: data.subscriber };
    } catch (error) {
      console.error('Subscribe error:', error);
      return { success: false, message: 'Failed to subscribe. Please try again.' };
    }
  }

  async getSubscribers() {
    try {
      const response = await fetch(`${API_BASE}/newsletter`);
      const data = await response.json();
      return data.subscribers || [];
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }

  async importSubscribers(subscribers, source = 'import') {
    try {
      const response = await fetch(`${API_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribers, source }),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Import failed.' };
      }

      return { success: true, ...data };
    } catch (error) {
      console.error('Import subscribers error:', error);
      return { success: false, message: 'Import failed. Please try again.' };
    }
  }

  async removeSubscriber(email) {
    try {
      const response = await fetch(`${API_BASE}/newsletter`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      return { success: false, message: 'Failed to remove subscriber.' };
    }
  }

  async getAnalytics() {
    const subscribers = await this.getSubscribers();
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    return {
      totalSubscribers: subscribers.length,
      recentSubscribers7d: subscribers.filter(
        s => new Date(s.subscribed_at) >= sevenDaysAgo
      ).length,
      recentSubscribers30d: subscribers.filter(
        s => new Date(s.subscribed_at) >= thirtyDaysAgo
      ).length,
      lastUpdated: subscribers[0]?.subscribed_at || null,
    };
  }

  async getPopupImage() {
    try {
      const response = await fetch(`${API_BASE}/admin-popup-image?t=${Date.now()}`);
      const data = await response.json();
      return data.imageUrl || null;
    } catch {
      return null;
    }
  }

  async uploadPopupImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const [header, imageData] = reader.result.split(',');
          const mimeType = header.match(/:(.*?);/)[1];
          const response = await fetch(`${API_BASE}/admin-popup-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData, mimeType, fileName: file.name }),
          });
          resolve(await response.json());
        } catch {
          resolve({ success: false, message: 'Upload failed' });
        }
      };
      reader.onerror = () => resolve({ success: false, message: 'Failed to read file' });
      reader.readAsDataURL(file);
    });
  }

  async exportSubscribers() {
    await this.downloadCurrentData();
  }

  async downloadCurrentData() {
    const subscribers = await this.getSubscribers();
    const payload = { subscribers, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getTourDates() {
    try {
      const response = await fetch(`${API_BASE}/admin-tour-dates?t=${Date.now()}`);
      const data = await response.json();
      return data.tourDates || [];
    } catch (error) {
      console.error('Error fetching tour dates:', error);
      return [];
    }
  }

  async saveTourDates(tourDates) {
    try {
      const response = await fetch(`${API_BASE}/admin-tour-dates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourDates }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message, tourDates: data.tourDates };
    } catch (error) {
      console.error('Error saving tour dates:', error);
      return { success: false, message: 'Failed to save tour dates' };
    }
  }

  async getSiteAnalytics() {
    try {
      const response = await fetch(`${API_BASE}/analytics?t=${Date.now()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching site analytics:', error);
      return null;
    }
  }

  // ── Spotify Stats ──
  async getSpotifyStats() {
    try {
      const response = await fetch(`${API_BASE}/spotify-stats?t=${Date.now()}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching Spotify stats:', error);
      return { artist: null, topTracks: [], recentAlbums: [] };
    }
  }

  // ── Square Orders (Merch) ──
  async getMerchOrders(limit = 20) {
    try {
      const response = await fetch(`${API_BASE}/square-orders?limit=${limit}&t=${Date.now()}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { orders: [], count: 0 };
    }
  }

  // ── Setlists ──
  async getSetlists() {
    try {
      const response = await fetch(`${API_BASE}/admin-setlists?t=${Date.now()}`);
      const data = await response.json();
      return data.setlists || [];
    } catch (error) {
      console.error('Error fetching setlists:', error);
      return [];
    }
  }

  async saveSetlists(setlists) {
    try {
      const response = await fetch(`${API_BASE}/admin-setlists`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setlists }),
      });
      const data = await response.json();
      return { success: response.ok, setlists: data.setlists };
    } catch (error) {
      return { success: false, message: 'Failed to save setlists' };
    }
  }

  async createSetlist(setlist) {
    try {
      const response = await fetch(`${API_BASE}/admin-setlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setlist }),
      });
      const data = await response.json();
      return { success: response.ok, setlist: data.setlist };
    } catch (error) {
      return { success: false, message: 'Failed to create setlist' };
    }
  }

  async deleteSetlist(id) {
    try {
      const response = await fetch(`${API_BASE}/admin-setlists`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return { success: response.ok };
    } catch (error) {
      return { success: false };
    }
  }

  // ── Booking Requests ──
  async getBookingRequests() {
    try {
      const response = await fetch(`${API_BASE}/admin-booking-requests?t=${Date.now()}`);
      const data = await response.json();
      return data.requests || [];
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      return [];
    }
  }

  async updateBookingRequest(id, status) {
    try {
      const response = await fetch(`${API_BASE}/admin-booking-requests`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      return { success: response.ok, requests: data.requests };
    } catch (error) {
      return { success: false };
    }
  }

  async deleteBookingRequest(id) {
    try {
      const response = await fetch(`${API_BASE}/admin-booking-requests`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return { success: response.ok };
    } catch (error) {
      return { success: false };
    }
  }

  // ── Link-in-Bio ──
  async getLinks() {
    try {
      const response = await fetch(`${API_BASE}/admin-links?t=${Date.now()}`);
      const data = await response.json();
      return data.links || [];
    } catch (error) {
      console.error('Error fetching links:', error);
      return [];
    }
  }

  async saveLinks(links) {
    try {
      const response = await fetch(`${API_BASE}/admin-links`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });
      const data = await response.json();
      return { success: response.ok, links: data.links };
    } catch (error) {
      return { success: false, message: 'Failed to save links' };
    }
  }

  // ── Press Kit ──
  async getPressKit() {
    try {
      const response = await fetch(`${API_BASE}/admin-press-kit?t=${Date.now()}`);
      const data = await response.json();
      return data.pressKit || null;
    } catch (error) {
      console.error('Error fetching press kit:', error);
      return null;
    }
  }

  async savePressKit(pressKit) {
    try {
      const response = await fetch(`${API_BASE}/admin-press-kit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pressKit }),
      });
      const data = await response.json();
      return { success: response.ok, pressKit: data.pressKit };
    } catch (error) {
      return { success: false, message: 'Failed to save press kit' };
    }
  }

  // ── Social Media ──
  async getSocialStats() {
    try {
      const response = await fetch(`${API_BASE}/admin-social?t=${Date.now()}`);
      const data = await response.json();
      return data.social || null;
    } catch (error) {
      console.error('Error fetching social stats:', error);
      return null;
    }
  }

  async saveSocialStats(social) {
    try {
      const response = await fetch(`${API_BASE}/admin-social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social }),
      });
      const data = await response.json();
      return { success: response.ok, social: data.social };
    } catch (error) {
      return { success: false, message: 'Failed to save social stats' };
    }
  }
}

const vercelEmailStorageService = new VercelEmailStorageService();
export default vercelEmailStorageService;
