// Supabase email storage service for newsletter subscriptions
import { supabase } from '../config/supabase';

class SupabaseEmailStorageService {
  constructor() {
    this.tableName = 'newsletter_subscribers';
  }

  // Add new subscriber
  async addSubscriber(email, source = 'website-footer') {
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
        source,
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

  // Get the current popup image URL from site settings
  async getPopupImage() {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'popup_image_url')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || null;
    } catch (error) {
      console.error('Error fetching popup image:', error);
      return null;
    }
  }

  // Upload a new popup image to Supabase Storage and persist the URL
  async uploadPopupImage(file) {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { success: false, message: 'File must be an image.' };
      }

      // Validate file size (max 5 MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, message: 'Image must be smaller than 5 MB.' };
      }

      // Remove all existing files in the bucket to keep it clean
      const { data: existingFiles } = await supabase.storage
        .from('popup-images')
        .list();

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('popup-images')
          .remove(existingFiles.map(f => f.name));
      }

      // Upload the new file
      const ext = file.name.split('.').pop().toLowerCase();
      const fileName = `popup-image-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('popup-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('popup-images')
        .getPublicUrl(fileName);

      // Persist the URL in site_settings
      const { error: settingsError } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'popup_image_url', value: publicUrl, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (settingsError) throw settingsError;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading popup image:', error);
      return { success: false, message: error.message || 'Upload failed. Please try again.' };
    }
  }

  // Reset the popup image back to the default (removes the stored override)
  async deletePopupImage() {
    try {
      const { data: existingFiles } = await supabase.storage
        .from('popup-images')
        .list();

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('popup-images')
          .remove(existingFiles.map(f => f.name));
      }

      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('key', 'popup_image_url');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error resetting popup image:', error);
      return { success: false, message: error.message };
    }
  }
}

// Create singleton instance
const supabaseEmailStorageService = new SupabaseEmailStorageService();

export default supabaseEmailStorageService;
