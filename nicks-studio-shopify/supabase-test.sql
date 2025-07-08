-- Test the newsletter_subscribers table setup
-- Run this after creating the main table

-- Test 1: Insert a subscriber
INSERT INTO newsletter_subscribers (email, source) 
VALUES ('test-subscriber@example.com', 'manual-test')
ON CONFLICT (email) DO NOTHING;

-- Test 2: Query all subscribers
SELECT 
    id,
    email,
    status,
    source,
    subscribed_at,
    created_at
FROM newsletter_subscribers 
ORDER BY subscribed_at DESC;

-- Test 3: Count subscribers
SELECT COUNT(*) as total_subscribers 
FROM newsletter_subscribers 
WHERE status = 'active';

-- Test 4: Get recent subscribers (last 7 days)
SELECT COUNT(*) as recent_subscribers_7d
FROM newsletter_subscribers 
WHERE subscribed_at >= NOW() - INTERVAL '7 days'
AND status = 'active';

-- Test 5: Get recent subscribers (last 30 days)
SELECT COUNT(*) as recent_subscribers_30d
FROM newsletter_subscribers 
WHERE subscribed_at >= NOW() - INTERVAL '30 days'
AND status = 'active';

-- Clean up test data (optional)
-- DELETE FROM newsletter_subscribers WHERE email = 'test-subscriber@example.com';
