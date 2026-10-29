import { adminFetch } from './adminAuth';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * Largest image the admin can upload. Images travel as base64 JSON (~1.33x
 * their size) and Vercel rejects request bodies over 4.5 MB, so 3 MB is the
 * real ceiling even though the API itself would accept 5 MB.
 */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

class VercelEmailStorageService {
  // ── Email campaigns ──
  // These hit admin-only endpoints and carry the session token issued at login.

  /** Sends a single preview copy so the client can check it before the real blast. */
  async sendTestEmail({ to, subject, body }) {
    try {
      const response = await adminFetch(`${API_BASE}/newsletter?action=test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await adminFetch(`${API_BASE}/newsletter?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await adminFetch(`${API_BASE}/newsletter?action=preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await adminFetch(`${API_BASE}/newsletter?action=campaigns&t=${Date.now()}`);
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
      const response = await adminFetch(
        `${API_BASE}/newsletter?action=recipients&id=${encodeURIComponent(id)}&t=${Date.now()}`,
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
      const response = await adminFetch(`${API_BASE}/newsletter`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.subscribers || [];
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }

  async importSubscribers(subscribers, source = 'import') {
    try {
      const response = await adminFetch(`${API_BASE}/newsletter`, {
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
      const response = await adminFetch(`${API_BASE}/newsletter`, {
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

  /** Signup counts, computed from a subscriber list the caller already has. */
  getAnalytics(subscribers) {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    return {
      totalSubscribers: subscribers.length,
      // Who a campaign would actually reach; rows without a status predate it and count as active.
      activeSubscribers: subscribers.filter(s => (s.status || 'active') === 'active').length,
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
      const response = await adminFetch(`${API_BASE}/admin?resource=tour-dates`, {
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
      const response = await adminFetch(`${API_BASE}/admin?resource=booking-requests&t=${Date.now()}`);
      const data = await response.json();
      return data.requests || [];
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      return [];
    }
  }

  async updateBookingRequest(id, status) {
    try {
      const response = await adminFetch(`${API_BASE}/admin?resource=booking-requests`, {
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
      const response = await adminFetch(`${API_BASE}/admin?resource=booking-requests`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return { success: response.ok };
    } catch (error) {
      return { success: false };
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
      const response = await adminFetch(`${API_BASE}/admin?resource=announcement`, {
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
          const response = await adminFetch(`${API_BASE}/admin?resource=announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData, mimeType, fileName: file.name }),
          });
          if (response.status === 413) {
            resolve({ success: false, message: 'That image is too large to upload. Please use one under 3 MB.' });
            return;
          }
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
      const response = await adminFetch(`${API_BASE}/admin?resource=social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message, social: data.social };
    } catch (error) {
      return { success: false, message: 'Failed to save social stats' };
    }
  }
}

const vercelEmailStorageService = new VercelEmailStorageService();
export default vercelEmailStorageService;
