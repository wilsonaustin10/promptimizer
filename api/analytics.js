// Serverless Analytics API Endpoint
// Supports Netlify Functions or Vercel

const crypto = require('crypto');

// Configuration - Use environment variables in production
const config = {
  encryptionKey: process.env.ANALYTICS_ENCRYPTION_KEY || 'your-32-char-encryption-key-here',
  allowedOrigins: [
    'chrome-extension://*',
    'moz-extension://*',
    'https://localhost:*'
  ],
  rateLimits: {
    install: 1, // per hour per IP
    event: 100, // per hour per user
    email: 5 // per hour per IP
  }
};

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map();

// Database schema (use your preferred database)
const SCHEMAS = {
  installs: {
    id: 'UUID PRIMARY KEY',
    user_id: 'VARCHAR(64) NOT NULL', // anonymous hash
    extension_version: 'VARCHAR(20)',
    browser_type: 'VARCHAR(50)',
    install_date: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    last_active: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  },
  events: {
    id: 'UUID PRIMARY KEY',
    user_id: 'VARCHAR(64) NOT NULL', // anonymous hash
    event_type: 'VARCHAR(100) NOT NULL',
    event_data: 'TEXT', // encrypted JSON
    timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  },
  emails: {
    id: 'UUID PRIMARY KEY',
    email_hash: 'VARCHAR(64) UNIQUE', // hashed email
    email_encrypted: 'TEXT NOT NULL', // encrypted email
    user_id: 'VARCHAR(64)', // link to anonymous user
    opt_in_date: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    status: 'ENUM("active", "unsubscribed") DEFAULT "active"'
  }
};

// Encryption utilities
function encrypt(text) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(config.encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.update(text, 'utf8', 'hex');
  const encrypted = cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(config.encryptionKey, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  
  return decipher.final('utf8');
}

// Generate anonymous user ID from browser fingerprint
function generateUserId(fingerprint) {
  return crypto.createHash('sha256')
    .update(fingerprint + config.encryptionKey)
    .digest('hex')
    .substring(0, 32);
}

// Hash email for deduplication while preserving privacy
function hashEmail(email) {
  return crypto.createHash('sha256')
    .update(email.toLowerCase().trim() + config.encryptionKey)
    .digest('hex');
}

// Rate limiting
function checkRateLimit(key, limit, windowMs = 3600000) { // 1 hour default
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key).filter(time => time > windowStart);
  
  if (requests.length >= limit) {
    return false;
  }
  
  requests.push(now);
  rateLimitStore.set(key, requests);
  return true;
}

// CORS headers
function setCORSHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Max-Age', '86400');
}

// Validate and sanitize input
function validateInstallData(data) {
  const { fingerprint, version, browser } = data;
  
  if (!fingerprint || typeof fingerprint !== 'string' || fingerprint.length < 10) {
    throw new Error('Invalid fingerprint');
  }
  
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Invalid version format');
  }
  
  if (!browser || !['chrome', 'firefox', 'edge', 'safari'].includes(browser.toLowerCase())) {
    throw new Error('Invalid browser type');
  }
  
  return {
    fingerprint: fingerprint.substring(0, 100), // Limit length
    version: version,
    browser: browser.toLowerCase()
  };
}

function validateEventData(data) {
  const { user_id, event_type, event_data } = data;
  
  if (!user_id || typeof user_id !== 'string' || user_id.length !== 32) {
    throw new Error('Invalid user ID');
  }
  
  if (!event_type || typeof event_type !== 'string' || event_type.length > 100) {
    throw new Error('Invalid event type');
  }
  
  // Sanitize event data
  const sanitizedData = {};
  if (event_data && typeof event_data === 'object') {
    const allowedKeys = ['target_model', 'quality_level', 'prompt_length', 'optimization_time', 'feature', 'value'];
    for (const key of allowedKeys) {
      if (event_data[key] !== undefined) {
        sanitizedData[key] = String(event_data[key]).substring(0, 100);
      }
    }
  }
  
  return {
    user_id,
    event_type: event_type.substring(0, 100),
    event_data: sanitizedData
  };
}

function validateEmailData(data) {
  const { email, user_id } = data;
  
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  if (user_id && (typeof user_id !== 'string' || user_id.length !== 32)) {
    throw new Error('Invalid user ID');
  }
  
  return {
    email: email.toLowerCase().trim(),
    user_id: user_id || null
  };
}

// Database operations with PostgreSQL
const { Pool } = require('pg');

// Create connection pool
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

class AnalyticsDB {
  static async recordInstall(userId, version, browser) {
    const client = await getPool().connect();
    try {
      await client.query(
        `INSERT INTO installs (user_id, extension_version, browser_type) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id) 
         DO UPDATE SET last_active = CURRENT_TIMESTAMP, extension_version = $2`,
        [userId, version, browser]
      );
      console.log('Install recorded:', { userId, version, browser });
      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async recordEvent(userId, eventType, encryptedData) {
    const client = await getPool().connect();
    try {
      await client.query(
        'INSERT INTO events (user_id, event_type, event_data) VALUES ($1, $2, $3)',
        [userId, eventType, JSON.stringify(encryptedData)]
      );
      console.log('Event recorded:', { userId, eventType });
      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async recordEmail(emailHash, encryptedEmail, userId) {
    const client = await getPool().connect();
    try {
      await client.query(
        `INSERT INTO emails (email_hash, email_encrypted, user_id) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email_hash) DO NOTHING`,
        [emailHash, JSON.stringify(encryptedEmail), userId]
      );
      console.log('Email recorded for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async getActiveUsers(days = 7) {
    const client = await getPool().connect();
    try {
      const result = await client.query(
        `SELECT COUNT(DISTINCT user_id) as count 
         FROM events 
         WHERE timestamp > NOW() - INTERVAL '${days} days'`
      );
      return { count: parseInt(result.rows[0].count) };
    } catch (error) {
      console.error('Database error:', error);
      return { count: 0 };
    } finally {
      client.release();
    }
  }
  
  static async getInstallCount() {
    const client = await getPool().connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM installs');
      return { count: parseInt(result.rows[0].count) };
    } catch (error) {
      console.error('Database error:', error);
      return { count: 0 };
    } finally {
      client.release();
    }
  }
  
  static async testConnection() {
    const client = await getPool().connect();
    try {
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// Main handler function
exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const body = JSON.parse(event.body);
    const { action } = body;
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    
    switch (action) {
      case 'install': {
        // Rate limit install pings
        if (!checkRateLimit(`install:${clientIP}`, config.rateLimits.install)) {
          return {
            statusCode: 429,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          };
        }
        
        const validatedData = validateInstallData(body.data);
        const userId = generateUserId(validatedData.fingerprint);
        
        await AnalyticsDB.recordInstall(userId, validatedData.version, validatedData.browser);
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            success: true, 
            user_id: userId,
            message: 'Install recorded'
          })
        };
      }
      
      case 'event': {
        const validatedData = validateEventData(body.data);
        
        if (!checkRateLimit(`event:${validatedData.user_id}`, config.rateLimits.event)) {
          return {
            statusCode: 429,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          };
        }
        
        // Encrypt sensitive event data
        const encryptedData = encrypt(JSON.stringify(validatedData.event_data));
        
        await AnalyticsDB.recordEvent(
          validatedData.user_id,
          validatedData.event_type,
          encryptedData
        );
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            success: true,
            message: 'Event recorded'
          })
        };
      }
      
      case 'email': {
        if (!checkRateLimit(`email:${clientIP}`, config.rateLimits.email)) {
          return {
            statusCode: 429,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Rate limit exceeded' })
          };
        }
        
        const validatedData = validateEmailData(body.data);
        const emailHash = hashEmail(validatedData.email);
        const encryptedEmail = encrypt(validatedData.email);
        
        await AnalyticsDB.recordEmail(emailHash, encryptedEmail, validatedData.user_id);
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            success: true,
            message: 'Email recorded'
          })
        };
      }
      
      case 'stats': {
        // Public stats endpoint (optional)
        const [activeUsers, totalInstalls] = await Promise.all([
          AnalyticsDB.getActiveUsers(7),
          AnalyticsDB.getInstallCount()
        ]);
        
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: true,
            data: {
              active_users_7d: activeUsers.count,
              total_installs: totalInstalls.count
            }
          })
        };
      }
      
      case 'health': {
        // Health check endpoint
        try {
          await AnalyticsDB.testConnection();
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0'
            })
          };
        } catch (error) {
          return {
            statusCode: 503,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              status: 'unhealthy',
              error: error.message
            })
          };
        }
      }
      
      default:
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
    
  } catch (error) {
    console.error('Analytics API Error:', error);
    
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Invalid request',
        message: error.message 
      })
    };
  }
};

// For local development/testing
if (require.main === module) {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  app.use((req, res, next) => {
    setCORSHeaders(res);
    next();
  });
  
  app.post('/api/analytics', async (req, res) => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: req.headers
    };
    
    const result = await exports.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  });
  
  app.listen(3001, () => {
    console.log('Analytics API running on http://localhost:3001');
  });
}