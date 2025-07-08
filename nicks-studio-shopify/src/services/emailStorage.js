// Email storage service for newsletter subscriptions
// This stores data directly in a JSON file on the frontend
// Note: This is for development/demo purposes only

class EmailStorageService {
  constructor() {
    this.dataFilePath = '/newsletter-subscribers.json';
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : window.location.origin;
    this.init();
  }

  // Initialize storage with default structure
  async init() {
    try {
      await this.getStoredData();
    } catch (error) {
      // If file doesn't exist or can't be read, create default structure
      const defaultData = {
        subscribers: [],
        metadata: {
          created: new Date().toISOString(),
          lastUpdated: null,
          totalSubscribers: 0
        }
      };
      await this.saveToFile(defaultData);
    }
  }

  // Get stored data from JSON file
  async getStoredData() {
    try {
      // Try to fetch from the actual JSON file first
      const response = await fetch(`${this.baseUrl}${this.dataFilePath}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Fetched newsletter data from JSON file:', data);
        return data;
      }
    } catch (error) {
      console.log('Could not fetch from JSON file, using localStorage as fallback');
    }

    // Fallback to localStorage if file can't be read
    try {
      const data = localStorage.getItem('newsletter-subscribers');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading stored email data:', error);
      return null;
    }
  }

  // Save data to the JSON file directly (frontend storage)
  async saveToFile(data) {
    try {
      // Save to localStorage as backup storage
      localStorage.setItem('newsletter-subscribers', JSON.stringify(data, null, 2));
      
      // Note: In a real frontend app, we can't write to files directly
      // This is a demo implementation that updates the JSON structure
      // The actual file would need to be manually updated or use a backend
      console.log('📝 Newsletter data updated:', data);
    } catch (error) {
      console.error('Error saving email data:', error);
      throw new Error('Failed to save email subscription');
    }
  }

  // Download the updated JSON file (Admin use only)
  downloadUpdatedFile(data, filename = 'newsletter-subscribers.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`📁 ${filename} downloaded! Replace the file in /public/ to sync with frontend.`);
  }

  // Add new subscriber
  async addSubscriber(email) {
    try {
      const data = await this.getStoredData() || {
        subscribers: [],
        metadata: { created: new Date().toISOString(), lastUpdated: null, totalSubscribers: 0 }
      };

      // Check if email already exists
      const emailExists = data.subscribers.some(sub => sub.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        throw new Error('Email already subscribed');
      }

      // Create new subscriber object
      const newSubscriber = {
        id: this.generateId(),
        email: email.toLowerCase(),
        subscribedAt: new Date().toISOString(),
        status: 'active',
        source: 'website-footer'
      };

      // Add to subscribers array
      data.subscribers.push(newSubscriber);
      data.metadata.lastUpdated = new Date().toISOString();
      data.metadata.totalSubscribers = data.subscribers.length;

      // Save updated data to localStorage
      await this.saveToFile(data);

      // Auto-download updated JSON file so you can replace it manually
      this.downloadUpdatedFile(data, 'newsletter-subscribers.json');

      // Update the actual JSON file structure for demo purposes
      // Note: This is a frontend-only approach and has limitations
      await this.updateJSONFileStructure(data);

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        subscriber: newSubscriber
      };
    } catch (error) {
      console.error('Error adding subscriber:', error);
      return {
        success: false,
        message: error.message || 'Failed to subscribe. Please try again.'
      };
    }
  }

  // Update JSON file structure (frontend demo approach)
  async updateJSONFileStructure(data) {
    try {
      // This is a demo approach - in reality, frontend can't write to files
      // For this demo, we'll show how the JSON structure should look
      console.log('🗃️ JSON structure updated with new data:', {
        totalSubscribers: data.metadata.totalSubscribers,
        lastSubscriber: data.subscribers[data.subscribers.length - 1]?.email
      });
    } catch (error) {
      console.error('Error updating JSON structure:', error);
    }
  }

  // Get all subscribers (for admin use)
  async getSubscribers() {
    const data = await this.getStoredData();
    return data ? data.subscribers : [];
  }

  // Get subscriber count
  async getSubscriberCount() {
    const data = await this.getStoredData();
    return data ? data.metadata.totalSubscribers : 0;
  }

  // Remove subscriber (unsubscribe)
  async removeSubscriber(email) {
    try {
      const data = await this.getStoredData();
      if (!data) return { success: false, message: 'No subscribers found' };

      const initialLength = data.subscribers.length;
      data.subscribers = data.subscribers.filter(sub => sub.email.toLowerCase() !== email.toLowerCase());

      if (data.subscribers.length === initialLength) {
        return { success: false, message: 'Email not found in subscribers list' };
      }

      data.metadata.lastUpdated = new Date().toISOString();
      data.metadata.totalSubscribers = data.subscribers.length;

      // Save updated data to localStorage and auto-download
      await this.saveToFile(data);
      
      // Auto-download updated JSON file
      this.downloadUpdatedFile(data, 'newsletter-subscribers.json');
      
      // Update JSON structure
      await this.updateJSONFileStructure(data);

      return {
        success: true,
        message: 'Successfully unsubscribed from newsletter'
      };
    } catch (error) {
      console.error('Error removing subscriber:', error);
      return {
        success: false,
        message: 'Failed to unsubscribe. Please try again.'
      };
    }
  }

  // Export subscribers data (for backup/migration) - Admin only
  async exportSubscribers() {
    const data = await this.getStoredData();
    if (!data) return null;

    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      exportedBy: 'EmailStorageService'
    };

    // Create downloadable JSON file - only from admin
    this.downloadUpdatedFile(exportData, `newsletter-subscribers-export-${new Date().toISOString().split('T')[0]}.json`);

    return exportData;
  }

  // Admin-only method to download current data as JSON file
  async downloadCurrentData() {
    const data = await this.getStoredData();
    if (data) {
      this.downloadUpdatedFile(data, 'newsletter-subscribers.json');
    }
  }

  // Generate unique ID for subscribers
  generateId() {
    return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get analytics data
  getAnalytics() {
    const data = this.getStoredData();
    if (!data) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSubscribers30d = data.subscribers.filter(sub => 
      new Date(sub.subscribedAt) >= thirtyDaysAgo
    ).length;

    const recentSubscribers7d = data.subscribers.filter(sub => 
      new Date(sub.subscribedAt) >= sevenDaysAgo
    ).length;

    return {
      totalSubscribers: data.metadata.totalSubscribers,
      recentSubscribers30d,
      recentSubscribers7d,
      lastUpdated: data.metadata.lastUpdated,
      created: data.metadata.created
    };
  }
}

// Create singleton instance
const emailStorageService = new EmailStorageService();

export default emailStorageService;
