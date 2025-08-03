# Analytics Implementation Guide

This document provides a comprehensive overview of the analytics system implemented for the Promptimizer Chrome extension.

## 🎯 Project Goals

The analytics implementation meets these requirements:

✅ **Install & Active-User Tracking**: Reliable metrics with minimal overhead  
✅ **Optional Email Capture**: One-field voluntary subscription for updates  
✅ **Event-Level Usage Metrics**: Track key interactions with anonymous attribution  
✅ **No Session Management**: No login flows or persistent authentication  
✅ **Security & Privacy**: Encrypted data, opt-out mechanisms, minimal collection  

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Chrome         │    │  Serverless      │    │  Database       │
│  Extension      │───▶│  API Endpoint    │───▶│  (Encrypted)    │
│                 │    │  (Netlify/Vercel)│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
   ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
   │Analytics│              │Rate     │              │Privacy  │
   │Client   │              │Limiting │              │Controls │
   │SDK      │              │& Crypto │              │& Audit  │
   └─────────┘              └─────────┘              └─────────┘
```

## 📁 File Structure

```
promptimizer-extension/
├── api/
│   └── analytics.js              # Serverless API endpoint
├── src/
│   ├── utils/
│   │   ├── analytics.js          # Client SDK
│   │   └── privacy-controls.js   # Privacy management
│   ├── popup/
│   │   └── popup.tsx             # Event tracking integration
│   ├── background/
│   │   └── service-worker.js     # Background analytics
│   └── options/
│       ├── options.html          # Settings UI with analytics controls
│       ├── options.js            # Settings logic
│       └── options.css           # Analytics UI styling
├── ANALYTICS_SETUP.md            # Deployment guide
├── PRIVACY_POLICY.md             # Privacy documentation
└── README_ANALYTICS.md           # This file
```

## 🔧 Component Details

### 1. Serverless API (`api/analytics.js`)

**Features**:
- ✅ Multiple deployment targets (Netlify, Vercel, self-hosted)
- ✅ AES-256-GCM encryption for sensitive data
- ✅ Rate limiting (install: 1/hour, events: 100/hour, email: 5/hour)
- ✅ Input validation and sanitization
- ✅ CORS handling for extension origins

**Endpoints**:
- `POST /analytics` with `action: "install"` - Record installation
- `POST /analytics` with `action: "event"` - Track usage events
- `POST /analytics` with `action: "email"` - Capture email subscription
- `GET /analytics` with `action: "stats"` - Public statistics (optional)

**Security**:
- Environment-based encryption keys
- Parameterized database queries
- Request size limits
- IP-based rate limiting

### 2. Client SDK (`src/utils/analytics.js`)

**Features**:
- ✅ Anonymous ID generation from browser fingerprint
- ✅ Automatic install tracking and daily active users
- ✅ Event queuing when analytics is disabled
- ✅ Retry logic for critical events
- ✅ Privacy-first design with opt-out

**Key Methods**:
```javascript
// Initialize (automatic)
analytics.init()

// Track events
analytics.trackEvent('optimization_completed', {
  target_model: 'gpt-4o',
  optimization_time: 2340
})

// Email capture
analytics.recordEmail('user@example.com')

// Privacy controls
analytics.setEnabled(false)
analytics.clearData()
```

### 3. Privacy Controls (`src/utils/privacy-controls.js`)

**Features**:
- ✅ GDPR-compliant data export
- ✅ Complete data deletion
- ✅ Analytics status reporting
- ✅ User-friendly privacy information

**Key Features**:
```javascript
// Check status
privacyManager.getDataSummary()

// Export data (GDPR)
privacyManager.downloadUserData()

// Delete everything
privacyManager.clearAllData()

// Privacy information
privacyManager.getPrivacyInfo()
```

### 4. UI Integration

**Settings Page (`src/options/options.html` + `.js`)**:
- ✅ Analytics enable/disable toggle
- ✅ Optional email capture field
- ✅ Real-time analytics status display
- ✅ Privacy controls (export, delete, info)
- ✅ User-friendly privacy explanations

**Popup Tracking (`src/popup/popup.tsx`)**:
- ✅ Optimization start/complete/failure events
- ✅ Model and quality level changes
- ✅ Copy-to-clipboard actions
- ✅ Context menu usage detection
- ✅ Streaming feature usage

**Background Service (`src/background/service-worker.js`)**:
- ✅ Extension install/update tracking
- ✅ API call success/failure events
- ✅ Context menu integration

## 📊 Tracked Events

### Core User Actions
```javascript
{
  OPTIMIZATION_STARTED: 'optimization_started',
  OPTIMIZATION_COMPLETED: 'optimization_completed', 
  OPTIMIZATION_FAILED: 'optimization_failed',
  COPY_TO_CLIPBOARD: 'copy_to_clipboard'
}
```

### Feature Usage
```javascript
{
  MODEL_CHANGED: 'model_changed',
  QUALITY_CHANGED: 'quality_changed',
  SETTINGS_OPENED: 'settings_opened',
  CONTEXT_MENU_USED: 'context_menu_used',
  STREAMING_USED: 'streaming_used',
  CACHE_HIT: 'cache_hit'
}
```

### System Events
```javascript
{
  API_ERROR: 'api_error',
  EXTENSION_UPDATED: 'extension_updated',
  DAILY_ACTIVE: 'daily_active'
}
```

### Privacy Events
```javascript
{
  ANALYTICS_ENABLED: 'analytics_enabled',
  ANALYTICS_DISABLED: 'analytics_disabled',
  EMAIL_PROVIDED: 'email_provided'
}
```

## 🔒 Privacy & Security Implementation

### Data Minimization
- **Anonymous IDs only**: No personal identification
- **No content collection**: Prompts never stored or transmitted
- **Aggregation-friendly**: Individual events deleted after 90 days
- **Minimal metadata**: Only essential usage patterns

### Encryption
- **In Transit**: HTTPS for all communications
- **At Rest**: AES-256-GCM for sensitive fields
- **Email Protection**: Hashed for deduplication, encrypted for storage
- **Key Management**: Environment-based, rotatable keys

### User Control
- **Default State**: Analytics enabled with clear disclosure
- **Easy Opt-Out**: One-click disable in settings
- **Data Export**: JSON download of all user data
- **Complete Deletion**: Remove all traces from system
- **Granular Control**: Separate toggles for analytics and email

## 🚀 Deployment Guide

### Quick Start

1. **Deploy Backend**:
   ```bash
   # Copy API file to your serverless platform
   cp api/analytics.js netlify/functions/
   ```

2. **Configure Environment**:
   ```bash
   ANALYTICS_ENCRYPTION_KEY="your-32-char-hex-key"
   DATABASE_URL="your-database-connection"
   ```

3. **Update Extension**:
   ```javascript
   // In src/utils/analytics.js
   this.apiEndpoint = 'https://your-site.netlify.app/.netlify.functions/analytics'
   ```

4. **Database Schema**:
   ```sql
   CREATE TABLE installs (
     id UUID PRIMARY KEY,
     user_id VARCHAR(64) UNIQUE,
     extension_version VARCHAR(20),
     browser_type VARCHAR(50),
     install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE TABLE events (
     id UUID PRIMARY KEY,
     user_id VARCHAR(64),
     event_type VARCHAR(100),
     event_data TEXT, -- encrypted JSON
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   CREATE TABLE emails (
     id UUID PRIMARY KEY,
     email_hash VARCHAR(64) UNIQUE,
     email_encrypted TEXT,
     user_id VARCHAR(64),
     opt_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     status VARCHAR(20) DEFAULT 'active'
   );
   ```

### Production Checklist

**Security**:
- [ ] Generate secure encryption key
- [ ] Enable database SSL
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Enable request logging

**Privacy**:
- [ ] Review data collection practices
- [ ] Test opt-out functionality
- [ ] Verify data export works
- [ ] Test complete data deletion
- [ ] Update privacy policy

**Monitoring**:
- [ ] Set up error logging
- [ ] Monitor API performance
- [ ] Track rate limit violations
- [ ] Monitor data storage growth

## 📈 Analytics Insights

### Key Metrics Dashboard

```sql
-- Daily Active Users (7 days)
SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as dau
FROM events 
WHERE event_type = 'daily_active'
AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp);

-- Feature Adoption
SELECT event_type, COUNT(*) as usage_count
FROM events 
WHERE timestamp >= NOW() - INTERVAL '30 days'
AND event_type IN ('optimization_completed', 'copy_to_clipboard', 'streaming_used')
GROUP BY event_type;

-- Model Preferences
SELECT 
  JSON_EXTRACT(event_data, '$.target_model') as model,
  COUNT(*) as optimizations
FROM events 
WHERE event_type = 'optimization_completed'
GROUP BY model;

-- Performance Metrics
SELECT 
  AVG(CAST(JSON_EXTRACT(event_data, '$.optimization_time') AS UNSIGNED)) as avg_time,
  JSON_EXTRACT(event_data, '$.quality_level') as quality
FROM events 
WHERE event_type = 'optimization_completed'
GROUP BY quality;
```

## 🔧 Customization Guide

### Adding New Events

1. **Define the event**:
   ```javascript
   // In analytics.js
   const ANALYTICS_EVENTS = {
     NEW_FEATURE_USED: 'new_feature_used'
   }
   ```

2. **Track in the UI**:
   ```javascript
   // In your component
   window.analytics?.trackEvent(ANALYTICS_EVENTS.NEW_FEATURE_USED, {
     feature_name: 'advanced_mode',
     success: true
   })
   ```

3. **Validate in API**:
   ```javascript
   // In api/analytics.js validateEventData()
   const allowedKeys = [...existing, 'feature_name', 'success']
   ```

### Custom Email Integration

```javascript
// Example: Mailchimp integration
async function addToMailchimp(email, userId) {
  const mailchimp = require('@mailchimp/mailchimp_marketing')
  
  await mailchimp.lists.addListMember(LIST_ID, {
    email_address: email,
    status: 'subscribed',
    merge_fields: { USER_ID: userId.substring(0, 8) }
  })
}
```

### Additional Privacy Controls

```javascript
// Custom data retention
async function customRetentionPolicy() {
  // Delete events older than 30 days for EU users
  if (isEUUser()) {
    await deleteOldEvents(30)
  }
}
```

## 🧪 Testing

### Unit Tests

```javascript
// Test analytics initialization
test('analytics initializes correctly', async () => {
  const analytics = new AnalyticsClient()
  await analytics.init()
  expect(analytics.isInitialized).toBe(true)
})

// Test privacy controls
test('user can export data', async () => {
  const data = await privacyManager.exportUserData()
  expect(data.analytics_summary).toBeDefined()
  expect(data.extension_settings).toBeDefined()
})
```

### Integration Tests

```javascript
// Test API endpoint
test('analytics API accepts events', async () => {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      action: 'event',
      data: { user_id: 'test', event_type: 'test_event' }
    })
  })
  expect(response.ok).toBe(true)
})
```

## 📋 Maintenance

### Regular Tasks

**Weekly**:
- [ ] Check error logs
- [ ] Monitor API performance
- [ ] Review privacy requests

**Monthly**:
- [ ] Clean old event data
- [ ] Update analytics dashboard
- [ ] Review security logs

**Quarterly**:
- [ ] Security audit
- [ ] Privacy policy review
- [ ] Performance optimization

### Troubleshooting

Common issues and solutions:

1. **Events not recording**: Check API endpoint and network connectivity
2. **Privacy controls not working**: Verify chrome.storage permissions
3. **High API latency**: Review database performance and optimize queries
4. **Rate limiting issues**: Monitor usage patterns and adjust limits

This implementation provides a robust, privacy-conscious analytics foundation that respects user privacy while providing valuable insights for product improvement.