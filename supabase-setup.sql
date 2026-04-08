-- Newsletter Subscribers Table Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create the newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    source VARCHAR(100) DEFAULT 'website-footer' NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);

-- Enable Row Level Security (RLS)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for newsletter signup)
CREATE POLICY "Allow public inserts" ON newsletter_subscribers
    FOR INSERT 
    WITH CHECK (true);

-- Create policy to allow public reads (for admin dashboard)
CREATE POLICY "Allow public reads" ON newsletter_subscribers
    FOR SELECT 
    USING (true);

-- Create policy to allow public updates (for status changes)
CREATE POLICY "Allow public updates" ON newsletter_subscribers
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- Create policy to allow public deletes (for unsubscribe)
CREATE POLICY "Allow public deletes" ON newsletter_subscribers
    FOR DELETE 
    USING (true);

-- Add comments for documentation
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscriber emails for Nickola Magnolia website';
COMMENT ON COLUMN newsletter_subscribers.id IS 'Unique identifier for each subscriber';
COMMENT ON COLUMN newsletter_subscribers.email IS 'Subscriber email address (unique)';
COMMENT ON COLUMN newsletter_subscribers.status IS 'Subscription status (active, unsubscribed, etc.)';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Where the subscription came from';
COMMENT ON COLUMN newsletter_subscribers.subscribed_at IS 'When the user subscribed';
COMMENT ON COLUMN newsletter_subscribers.created_at IS 'When the record was created';

-- Insert a test subscriber (optional - remove if you don't want test data)
-- INSERT INTO newsletter_subscribers (email, source) 
-- VALUES ('test@example.com', 'initial-setup')
-- ON CONFLICT (email) DO NOTHING;
