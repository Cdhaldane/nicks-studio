// Newsletter Management Utilities

// Quick access functions for development/debugging
export const newsletterUtils = {
  // View all subscribers in console
  viewSubscribers: () => {
    const data = JSON.parse(localStorage.getItem('newsletter-subscribers') || '{"subscribers":[]}');
    console.log('📧 Newsletter Subscribers:', data.subscribers);
    console.table(data.subscribers);
    return data.subscribers;
  },

  // Get subscriber count
  getCount: () => {
    const data = JSON.parse(localStorage.getItem('newsletter-subscribers') || '{"subscribers":[]}');
    console.log(`📊 Total Subscribers: ${data.subscribers.length}`);
    return data.subscribers.length;
  },

  // Clear all subscribers (for testing)
  clearAll: () => {
    if (window.confirm('Are you sure you want to clear all newsletter subscribers?')) {
      localStorage.removeItem('newsletter-subscribers');
      console.log('🗑️ All newsletter subscribers cleared');
      return true;
    }
    return false;
  },

  // Add test subscribers for development
  addTestData: () => {
    const testEmails = [
      'fan1@example.com',
      'musiclover@test.com',
      'country.fan@demo.com',
      'test.subscriber@example.org'
    ];

    // Import the service dynamically to avoid circular imports
    import('../services/emailStorage.js').then(({ default: emailService }) => {
      testEmails.forEach(async (email, index) => {
        setTimeout(async () => {
          const result = await emailService.addSubscriber(email);
          console.log(`Added test subscriber: ${email}`, result);
        }, index * 100);
      });
    });
  },

  // Export data as downloadable file
  export: () => {
    const data = JSON.parse(localStorage.getItem('newsletter-subscribers') || '{"subscribers":[]}');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('📁 Newsletter data exported');
  }
};

// Make available globally in development
if (process.env.NODE_ENV === 'development') {
  window.newsletter = newsletterUtils;
  console.log('🔧 Newsletter utilities available at window.newsletter');
  console.log('Available commands:');
  console.log('- newsletter.viewSubscribers() - View all subscribers');
  console.log('- newsletter.getCount() - Get subscriber count');
  console.log('- newsletter.clearAll() - Clear all subscribers');
  console.log('- newsletter.addTestData() - Add test subscribers');
  console.log('- newsletter.export() - Export subscriber data');
}

export default newsletterUtils;
