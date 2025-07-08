// Supabase email storage service for newsletter subscriptions
import { supabase } from '../config/supabase';

class SupabaseEmailStorageService {
  constructor() {
    this.tableName = 'newsletter_subscribers';
  }

  // Add new subscriber
  async addSubscriber(email) {
    try {
      // Check if email already exists
      const { data: existingSubscriber, error: checkError } = await supabase
        .from(this.tableName)
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is what we want
        throw checkError;
      }

      if (existingSubscriber) {
        throw new Error('Email already subscribed');
      }

      // Create new subscriber
      const newSubscriber = {
        email: email.toLowerCase(),
        status: 'active',
        source: 'website-footer',
        subscribed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newSubscriber])
        .select()
        .single();

      if (error) throw error;

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      return {
        success: true,
        message: 'Successfully subscribed to newsletter',
        subscriber: data
      };
    } catch (error) {
      console.error('Error adding subscriber:', error);
      return {
        success: false,
        message: error.message || 'Failed to subscribe. Please try again.'
      };
    }
  }

  // Get all subscribers (for admin use)
  async getSubscribers() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }

  // Get subscriber count
  async getSubscriberCount() {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting subscriber count:', error);
      return 0;
    }
  }

  // Remove subscriber (unsubscribe)
  async removeSubscriber(email) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('email', email.toLowerCase());

      if (error) throw error;

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

  // Export subscribers data (for backup/migration)
  async exportSubscribers() {
    try {
      const subscribers = await this.getSubscribers();
      
      const exportData = {
        subscribers,
        exportedAt: new Date().toISOString(),
        exportedBy: 'SupabaseEmailStorageService',
        totalSubscribers: subscribers.length
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter-subscribers-export-${new Date().toISOString().split('T')[0]}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      return null;
    }
  }

  // Download current data as JSON file
  async downloadCurrentData() {
    await this.exportSubscribers();
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get analytics data
  async getAnalytics() {
    try {
      const subscribers = await this.getSubscribers();
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentSubscribers30d = subscribers.filter(sub => 
        new Date(sub.subscribed_at) >= thirtyDaysAgo
      ).length;

      const recentSubscribers7d = subscribers.filter(sub => 
        new Date(sub.subscribed_at) >= sevenDaysAgo
      ).length;

      return {
        totalSubscribers: subscribers.length,
        recentSubscribers30d,
        recentSubscribers7d,
        lastUpdated: subscribers[0]?.subscribed_at || null,
        created: subscribers[subscribers.length - 1]?.subscribed_at || null
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalSubscribers: 0,
        recentSubscribers30d: 0,
        recentSubscribers7d: 0,
        lastUpdated: null,
        created: null
      };
    }
  }

  // Real-time subscription for admin dashboard
  subscribeToChanges(callback) {
    return supabase
      .channel('newsletter_subscribers_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: this.tableName 
        }, 
        callback
      )
      .subscribe();
  }
}

// Create singleton instance
const supabaseEmailStorageService = new SupabaseEmailStorageService();

export default supabaseEmailStorageService;
