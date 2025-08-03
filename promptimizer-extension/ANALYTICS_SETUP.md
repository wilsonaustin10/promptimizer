# Analytics Setup Guide

This guide explains how to set up and deploy the privacy-conscious analytics system for the Promptimizer Chrome extension.

## Overview

The analytics system consists of:

1. **Serverless Backend API**: Handles data collection with encryption
2. **Client SDK**: Browser-side analytics with privacy controls
3. **Privacy Controls**: Comprehensive opt-out and data management
4. **Optional Email Capture**: Non-intrusive update subscription

## 🔧 Backend Setup

### Option 1: Netlify Functions

1. **Deploy to Netlify**:
   ```bash
   # Copy the analytics.js file to your Netlify project
   mkdir netlify/functions
   cp api/analytics.js netlify/functions/
   ```

2. **Set Environment Variables**:
   ```bash
   # In your Netlify dashboard or CLI
   ANALYTICS_ENCRYPTION_KEY="your-32-character-hex-encryption-key"
   DATABASE_URL="your-database-connection-string"
   ```

3. **Database Setup** (PostgreSQL example):
   ```sql
   -- Create analytics tables
   CREATE TABLE installs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id VARCHAR(64) NOT NULL,
     extension_version VARCHAR(20),
     browser_type VARCHAR(50),
     install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(user_id)
   );
   
   CREATE TABLE events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id VARCHAR(64) NOT NULL,
     event_type VARCHAR(100) NOT NULL,
     event_data TEXT,
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE TABLE emails (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email_hash VARCHAR(64) UNIQUE,
     email_encrypted TEXT NOT NULL,
     user_id VARCHAR(64),
     opt_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     status VARCHAR(20) DEFAULT 'active'
   );
   
   CREATE INDEX idx_events_user_id ON events(user_id);
   CREATE INDEX idx_events_timestamp ON events(timestamp);
   CREATE INDEX idx_installs_last_active ON installs(last_active);
   ```

4. **Update API Endpoint**:
   ```typescript
   // In src/utils/analytics.js, update the endpoint
   this.apiEndpoint = 'https://your-site.netlify.app/.netlify/functions/analytics'
   ```

### Option 2: Vercel Functions

1. **Deploy to Vercel**:
   ```bash
   # Create api directory in your Vercel project
   mkdir api
   cp api/analytics.js api/
   ```

2. **Set Environment Variables**:
   ```bash
   vercel env add ANALYTICS_ENCRYPTION_KEY
   vercel env add DATABASE_URL
   ```

3. **Update API Endpoint**:
   ```typescript
   // In src/utils/analytics.js
   this.apiEndpoint = 'https://your-project.vercel.app/api/analytics'
   ```

### Option 3: Self-Hosted

1. **Express.js Server**:
   ```javascript
   const express = require('express')
   const { handler } = require('./analytics')
   
   const app = express()
   app.use(express.json())
   
   app.post('/api/analytics', async (req, res) => {
     const event = {
       httpMethod: 'POST',
       body: JSON.stringify(req.body),
       headers: req.headers
     }
     
     const result = await handler(event)
     res.status(result.statusCode).json(JSON.parse(result.body))
   })
   
   app.listen(3001)
   ```

## 🔐 Security Configuration

### Generate Encryption Key

```javascript
// Generate a secure 32-character hex key
const crypto = require('crypto')
const key = crypto.randomBytes(16).toString('hex')
console.log('ANALYTICS_ENCRYPTION_KEY=' + key)
```

### Database Security

1. **Use SSL connections**
2. **Limit database permissions** to only the required tables
3. **Enable query logging** for monitoring
4. **Set up automated backups**

## 📊 Analytics Events

### Tracked Events

The system tracks these events with minimal data:

```javascript
// User Interactions
OPTIMIZATION_STARTED: 'optimization_started'
OPTIMIZATION_COMPLETED: 'optimization_completed'
OPTIMIZATION_FAILED: 'optimization_failed'
COPY_TO_CLIPBOARD: 'copy_to_clipboard'

// Feature Usage
MODEL_CHANGED: 'model_changed'
QUALITY_CHANGED: 'quality_changed'
SETTINGS_OPENED: 'settings_opened'
CONTEXT_MENU_USED: 'context_menu_used'
STREAMING_USED: 'streaming_used'
CACHE_HIT: 'cache_hit'

// System Events
API_ERROR: 'api_error'
EXTENSION_UPDATED: 'extension_updated'
DAILY_ACTIVE: 'daily_active'

// Privacy Events
ANALYTICS_ENABLED: 'analytics_enabled'
ANALYTICS_DISABLED: 'analytics_disabled'
EMAIL_PROVIDED: 'email_provided'
```

### Event Data Structure

```javascript
{
  user_id: "anonymous-hash",
  event_type: "optimization_completed",
  event_data: {
    target_model: "gpt-4o",
    quality_level: "expert",
    prompt_length: 150,
    optimization_time: 2340,
    cached: false
  },
  timestamp: "2024-01-15T10:30:00Z"
}
```

## 🛡️ Privacy Compliance

### Data Minimization

- **Anonymous IDs only** - no personal identification
- **No prompt content** stored
- **Aggregated metrics** after 90 days
- **Encrypted transmission** (HTTPS)
- **Encrypted storage** for sensitive data

### User Rights (GDPR Compliant)

1. **Opt-out anytime** via settings
2. **Data export** functionality
3. **Complete data deletion**
4. **Transparent data collection**

### Rate Limiting

The API includes built-in rate limits:

- **Install pings**: 1 per hour per IP
- **Events**: 100 per hour per user
- **Email capture**: 5 per hour per IP

## 📈 Analytics Dashboard

### Basic Queries

```sql
-- Daily active users
SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as active_users
FROM events 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date;

-- Most used features
SELECT event_type, COUNT(*) as usage_count
FROM events 
WHERE timestamp >= NOW() - INTERVAL '7 days'
AND event_type NOT IN ('daily_active')
GROUP BY event_type
ORDER BY usage_count DESC;

-- Model preferences
SELECT 
  JSON_EXTRACT(event_data, '$.target_model') as model,
  COUNT(*) as optimizations
FROM events 
WHERE event_type = 'optimization_completed'
AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY model
ORDER BY optimizations DESC;

-- Average optimization time by quality
SELECT 
  JSON_EXTRACT(event_data, '$.quality_level') as quality,
  AVG(CAST(JSON_EXTRACT(event_data, '$.optimization_time') AS UNSIGNED)) as avg_time_ms
FROM events 
WHERE event_type = 'optimization_completed'
AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY quality;
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Generate secure encryption key
- [ ] Set up database with proper permissions
- [ ] Configure environment variables
- [ ] Test API endpoints locally

### Extension Updates

- [ ] Update analytics endpoint URL
- [ ] Test analytics initialization
- [ ] Verify privacy controls work
- [ ] Test data export functionality

### Post-deployment

- [ ] Monitor error logs
- [ ] Verify events are being recorded
- [ ] Check rate limiting is working
- [ ] Test email capture (if using)

## 🐛 Troubleshooting

### Common Issues

1. **Analytics not initializing**:
   - Check browser console for module loading errors
   - Verify analytics.js is included in build
   - Check API endpoint is reachable

2. **Events not recording**:
   - Verify API endpoint configuration
   - Check network tab for failed requests
   - Confirm user has analytics enabled

3. **Privacy controls not working**:
   - Check privacy-controls.js is loaded
   - Verify chrome.storage permissions
   - Check for async/await errors

### Debug Mode

Enable debug logging:

```javascript
// Add to analytics.js constructor
this.debug = true // Enable debug logging
```

### API Testing

Test the API endpoint:

```bash
curl -X POST https://your-api-endpoint.com/analytics \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "install",
    "data": {
      "fingerprint": "test-fingerprint",
      "version": "1.0.0",
      "browser": "chrome"
    }
  }'
```

## 📧 Email Marketing Integration

If you want to integrate with email services:

### Mailchimp Integration

```javascript
// Add to analytics API
const mailchimp = require('@mailchimp/mailchimp_marketing')

async function addToMailchimp(email, userId) {
  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX
  })
  
  try {
    await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID, {
      email_address: email,
      status: 'subscribed',
      tags: ['promptimizer-extension'],
      merge_fields: {
        USER_ID: userId.substring(0, 8)
      }
    })
  } catch (error) {
    console.error('Mailchimp error:', error)
  }
}
```

## 📋 Maintenance

### Regular Tasks

1. **Weekly**: Review error logs and failed events
2. **Monthly**: Analyze usage patterns and optimize
3. **Quarterly**: Review and update privacy documentation
4. **Annually**: Security audit and key rotation

### Data Retention

Implement automated cleanup:

```sql
-- Clean old events (run monthly)
DELETE FROM events 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Clean unverified emails (run weekly)
DELETE FROM emails 
WHERE status = 'unsubscribed' 
AND opt_in_date < NOW() - INTERVAL '30 days';
```

This analytics system provides valuable insights while maintaining user privacy and compliance with data protection regulations.