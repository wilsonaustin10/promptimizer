-- Promptimizer Analytics Database Schema
-- PostgreSQL compatible

-- Create database (run as superuser)
-- CREATE DATABASE promptimizer_analytics WITH ENCODING='UTF8';

-- Connect to the database
-- \c promptimizer_analytics;

-- Create tables
CREATE TABLE IF NOT EXISTS installs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    extension_version VARCHAR(20),
    browser_type VARCHAR(50),
    install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_id UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data TEXT, -- Encrypted JSON payload
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash VARCHAR(64) NOT NULL,
    email_encrypted TEXT NOT NULL,
    user_id VARCHAR(64),
    opt_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    last_contact TIMESTAMP,
    CONSTRAINT unique_email_hash UNIQUE(email_hash),
    CONSTRAINT valid_status CHECK (status IN ('active', 'unsubscribed', 'bounced'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id_timestamp ON events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_installs_last_active ON installs(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status) WHERE status = 'active';

-- Create views for common queries
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
    DATE(timestamp) as date,
    COUNT(DISTINCT user_id) as active_users
FROM events 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

CREATE OR REPLACE VIEW feature_usage AS
SELECT 
    event_type,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users
FROM events 
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
    AND event_type NOT IN ('daily_active', 'install')
GROUP BY event_type
ORDER BY usage_count DESC;

-- Data retention function (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS void AS $$
BEGIN
    -- Delete events older than 90 days
    DELETE FROM events WHERE timestamp < CURRENT_DATE - INTERVAL '90 days';
    
    -- Delete unsubscribed emails older than 30 days
    DELETE FROM emails 
    WHERE status = 'unsubscribed' 
    AND opt_in_date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create read-only user for analytics dashboards (optional)
-- CREATE USER analytics_reader WITH PASSWORD 'secure_password';
-- GRANT CONNECT ON DATABASE promptimizer_analytics TO analytics_reader;
-- GRANT USAGE ON SCHEMA public TO analytics_reader;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;

-- Sample queries for monitoring
/*
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Recent events
SELECT event_type, COUNT(*) 
FROM events 
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- Active users today
SELECT COUNT(DISTINCT user_id) as active_today
FROM events
WHERE DATE(timestamp) = CURRENT_DATE;
*/