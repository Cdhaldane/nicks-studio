const API_BASE = process.env.REACT_APP_API_URL || '/api';

class VercelEmailStorageService {
  async addSubscriber(email, source = 'website-footer') {
    try {
      const response = await fetch(`${API_BASE}/newsletter-subscribe`, {
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
      const response = await fetch(`${API_BASE}/newsletter-subscribers`);
      const data = await response.json();
      return data.subscribers || [];
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }

  async removeSubscriber(email) {
    try {
      const response = await fetch(`${API_BASE}/newsletter-subscribers`, {
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
}

const vercelEmailStorageService = new VercelEmailStorageService();
export default vercelEmailStorageService;
