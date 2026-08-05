import { authHeaders } from './adminAuth';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

class VercelEmailStorageService {
  // ── Email campaigns ──
  // These hit admin-only endpoints and carry the session token issued at login.

  /** Sends a single preview copy so the client can check it before the real blast. */
  async sendTestEmail({ to, subject, body }) {
    try {
      const response = await fetch(`${API_BASE}/newsletter?action=test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      console.error('Test send error:', error);
      return { success: false, message: 'Could not reach the server. Please try again.' };
    }
  }

  /** Queues a campaign to every active subscriber. */
  async sendCampaign({ subject, body }) {
    try {
      const response = await fetch(`${API_BASE}/newsletter?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subject, body }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message, campaign: data.campaign || null };
    } catch (error) {
      console.error('Send campaign error:', error);
      return { success: false, message: 'Could not reach the server. Please try again.' };
    }
  }

  /**
   * Renders the composer's text through the real email template, so the preview
   * is the actual email rather than the panel's guess at it.
   */
  async renderPreview({ subject, body }) {
    try {
      const response = await fetch(`${API_BASE}/newsletter?action=preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ subject, body }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Could not render the preview.' };
      }
      return { success: true, html: data.html };
    } catch (error) {
      console.error('Preview render error:', error);
      return { success: false, message: 'Could not reach the server. Please try again.' };
    }
  }

  /** Campaign history plus today's remaining send allowance. */
  async getCampaigns() {
    try {
      const response = await fetch(`${API_BASE}/newsletter?action=campaigns&t=${Date.now()}`, {
        headers: authHeaders(),
      });
      if (!response.ok) return { campaigns: [], quota: null, verifyAddress: null };
      const data = await response.json();
      return {
        campaigns: data.campaigns || [],
        quota: data.quota || null,
        verifyAddress: data.verifyAddress || null,
      };
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return { campaigns: [], quota: null, verifyAddress: null };
    }
  }

  /**
   * Per-recipient breakdown for one campaign: who has been mailed, who is still
   * queued, and who failed. Returns null when the detail can't be fetched.
   */
  async getCampaignRecipients(id) {
    try {
      const response = await fetch(
        `${API_BASE}/newsletter?action=recipients&id=${encodeURIComponent(id)}&t=${Date.now()}`,
        { headers: authHeaders() }
      );
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Could not load recipients.' };
      }
      return {
        success: true,
        campaign: data.campaign || null,
        sent: data.sent || [],
        pending: data.pending || [],
        failed: data.failed || [],
        sentListComplete: data.sentListComplete !== false,
        pendingListComplete: data.pendingListComplete !== false,
      };
    } catch (error) {
      console.error('Error fetching campaign recipients:', error);
      return { success: false, message: 'Could not reach the server. Please try again.' };
    }
  }

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
      const response = await fetch(`${API_BASE}/admin?resource=popup-image&t=${Date.now()}`);
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
          const response = await fetch(`${API_BASE}/admin?resource=popup-image`, {
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
      const response = await fetch(`${API_BASE}/admin?resource=tour-dates&t=${Date.now()}`);
      const data = await response.json();
      return data.tourDates || [];
    } catch (error) {
      console.error('Error fetching tour dates:', error);
      return [];
    }
  }

  async saveTourDates(tourDates) {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=tour-dates`, {
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
      const response = await fetch(`${API_BASE}/square?action=orders&limit=${limit}&t=${Date.now()}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { orders: [], count: 0 };
    }
  }

  // ── Setlists ──
  async getSetlists() {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=setlists&t=${Date.now()}`);
      const data = await response.json();
      return data.setlists || [];
    } catch (error) {
      console.error('Error fetching setlists:', error);
      return [];
    }
  }

  async saveSetlists(setlists) {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=setlists`, {
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
      const response = await fetch(`${API_BASE}/admin?resource=setlists`, {
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
      const response = await fetch(`${API_BASE}/admin?resource=setlists`, {
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
  // Public submission from the booking form → stored for the admin Bookings panel.
  async submitBookingRequest(payload) {
    try {
      const response = await fetch(`${API_BASE}/booking-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to submit request.' };
      }
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Booking request error:', error);
      return { success: false, message: 'Something went wrong. Please try again.' };
    }
  }

  async getBookingRequests() {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=booking-requests&t=${Date.now()}`);
      const data = await response.json();
      return data.requests || [];
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      return [];
    }
  }

  async updateBookingRequest(id, status) {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=booking-requests`, {
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
      const response = await fetch(`${API_BASE}/admin?resource=booking-requests`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return { success: response.ok };
    } catch (error) {
      return { success: false };
    }
  }

  // ── Press Kit ──
  async getPressKit() {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=press-kit&t=${Date.now()}`);
      const data = await response.json();
      return data.pressKit || null;
    } catch (error) {
      console.error('Error fetching press kit:', error);
      return null;
    }
  }

  async savePressKit(pressKit) {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=press-kit`, {
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

  // ── Announcement Popup ──
  async getAnnouncement() {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=announcement&t=${Date.now()}`);
      const data = await response.json();
      return data.announcement || null;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      return null;
    }
  }

  async saveAnnouncement(announcement) {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=announcement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message, announcement: data.announcement };
    } catch (error) {
      return { success: false, message: 'Failed to save announcement' };
    }
  }

  async uploadAnnouncementImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const [header, imageData] = reader.result.split(',');
          const mimeType = header.match(/:(.*?);/)[1];
          const response = await fetch(`${API_BASE}/admin?resource=announcement`, {
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

  // ── Social Media ──
  async getSocialStats() {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=social&t=${Date.now()}`);
      const data = await response.json();
      return data.social || null;
    } catch (error) {
      console.error('Error fetching social stats:', error);
      return null;
    }
  }

  async saveSocialStats(social) {
    try {
      const response = await fetch(`${API_BASE}/admin?resource=social`, {
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
