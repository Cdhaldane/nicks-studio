#!/usr/bin/env node

// Simple script to sync newsletter subscribers from localStorage to JSON file
// Run this script when you want to update the JSON file with new subscribers

const fs = require('fs');
const path = require('path');

// Path to the JSON file
const jsonFilePath = path.join(__dirname, '..', 'src', 'data', 'newsletter-subscribers.json');

// Function to create/update the JSON file
function updateJsonFile(data) {
  try {
    // Ensure the directory exists
    const dir = path.dirname(jsonFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the data to the JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    console.log('✅ JSON file updated successfully!');
    console.log(`📁 File location: ${jsonFilePath}`);
    console.log(`📊 Total subscribers: ${data.subscribers.length}`);
  } catch (error) {
    console.error('❌ Error updating JSON file:', error);
  }
}

// Sample data structure
const sampleData = {
  subscribers: [
    {
      id: "sub_1641234567890_abc123def",
      email: "fan@example.com",
      subscribedAt: "2024-07-08T12:34:56.789Z",
      status: "active",
      source: "website-footer"
    }
  ],
  metadata: {
    created: "2024-07-08T12:00:00.000Z",
    lastUpdated: "2024-07-08T12:34:56.789Z",
    totalSubscribers: 1
  }
};

// Check if we're being called with data
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--sample') {
  // Create sample data
  updateJsonFile(sampleData);
} else if (args.length > 0 && args[0] === '--help') {
  console.log(`
📧 Newsletter JSON Sync Script

Usage:
  node scripts/sync-subscribers.js [options]

Options:
  --sample    Create sample data in JSON file
  --help      Show this help message

Examples:
  node scripts/sync-subscribers.js --sample
  
Note: 
  In development, the app will automatically download updated JSON files
  when new subscribers are added. Replace the file in src/data/ manually.
  `);
} else {
  // Check if localStorage data exists (would need to be manually provided)
  console.log(`
📧 Newsletter JSON Sync

This script helps sync subscriber data to the JSON file.

Current JSON file location: ${jsonFilePath}

To update with new data:
1. Copy localStorage data from browser console
2. Save it as a JSON file
3. Replace the file in src/data/newsletter-subscribers.json

Or run with --sample to create sample data.
  `);
}

module.exports = { updateJsonFile };
