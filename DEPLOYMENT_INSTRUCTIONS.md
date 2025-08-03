# 🚀 Deployment Instructions for Promptimizer Analytics

This guide will help you deploy the analytics system for your Chrome extension.

## Prerequisites

- [ ] Vercel account (free tier is sufficient)
- [ ] PostgreSQL database (I recommend [Supabase](https://supabase.com) or [Neon](https://neon.tech) for free tier)
- [ ] Git repository for your project

## Step 1: Generate Security Keys

Run the key generation script:

```bash
node scripts/generate-keys.js
```

Save the output securely - you'll need:
- `ANALYTICS_ENCRYPTION_KEY` - for data encryption
- `DATABASE_URL` format for your database connection

## Step 2: Set Up PostgreSQL Database

### Option A: Using Supabase (Recommended for free tier)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection Pooling" mode)
5. Run the database setup:

```bash
# Connect to your database and run:
psql "your-connection-string" < scripts/create-database.sql
```

### Option B: Using Neon

1. Create account at [neon.tech](https://neon.tech)
2. Create new database
3. Copy connection string
4. Run setup script as above

### Option C: Existing PostgreSQL

Just ensure you have a database and run the setup script.

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Deploy the Project

From the project root directory:

```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# When asked:
# - Set up and deploy: Y
# - Which scope: Choose your account
# - Link to existing project: N
# - Project name: promptimizer-analytics (or your choice)
# - Directory: ./ (current directory)
# - Override settings: N
```

### 3.3 Set Environment Variables

```bash
# Add your encryption key
vercel env add ANALYTICS_ENCRYPTION_KEY production

# Paste your key when prompted

# Add your database URL
vercel env add DATABASE_URL production

# Paste your PostgreSQL connection string when prompted
```

### 3.4 Deploy to Production

```bash
vercel --prod
```

Save the deployment URL - it will look like:
`https://promptimizer-analytics-xxxxx.vercel.app`

## Step 4: Update Chrome Extension

### 4.1 Update Analytics Endpoint

Edit `promptimizer-extension/src/utils/analytics.js`:

```javascript
// Line 8 - Update with your Vercel URL
this.apiEndpoint = options.apiEndpoint || 'https://YOUR-PROJECT.vercel.app/api/analytics';
```

### 4.2 Update Manifest Permissions

Edit `promptimizer-extension/manifest.json`:

```json
// Add your Vercel domain to host_permissions
"host_permissions": [
  "https://api.openai.com/*",
  "https://api.anthropic.com/*", 
  "https://generativelanguage.googleapis.com/*",
  "https://YOUR-PROJECT.vercel.app/*"  // <- Add this
],
```

Also update the CSP in the same file:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'; worker-src 'self'; connect-src https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://YOUR-PROJECT.vercel.app; default-src 'self'"
}
```

### 4.3 Build the Extension

```bash
cd promptimizer-extension
npm install
npm run build
```

## Step 5: Test the Deployment

Run the test script:

```bash
./scripts/test-deployment.sh https://YOUR-PROJECT.vercel.app
```

All tests should pass! ✅

## Step 6: Load Updated Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `promptimizer-extension/dist` folder
5. Test the extension - analytics should now be working!

## 📊 Monitoring Your Analytics

### View Real-time Logs

```bash
vercel logs --follow
```

### Check Database Stats

Connect to your database and run:

```sql
-- Total installs
SELECT COUNT(*) FROM installs;

-- Active users today
SELECT COUNT(DISTINCT user_id) FROM events 
WHERE DATE(timestamp) = CURRENT_DATE;

-- Popular features
SELECT event_type, COUNT(*) as count 
FROM events 
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_type 
ORDER BY count DESC;
```

### View Analytics Dashboard

Visit: `https://YOUR-PROJECT.vercel.app/api/analytics`

POST request with:
```json
{"action": "stats"}
```

## 🔒 Security Checklist

- [ ] Environment variables are set in Vercel (never in code)
- [ ] Database uses SSL connection
- [ ] API endpoint uses HTTPS
- [ ] Extension manifest limits API access to your domain
- [ ] No sensitive data in git repository

## 🚨 Troubleshooting

### "Database connection failed"
- Check DATABASE_URL format
- Ensure SSL mode is enabled
- Verify database is accessible from Vercel

### "CORS error in extension"
- Verify your Vercel domain is in manifest.json
- Check CSP settings include your domain
- Ensure API returns proper CORS headers

### "Rate limiting not working"
- This is normal in development
- Vercel may use multiple IPs
- Rate limiting works best with user-based limits

## 📈 Next Steps

1. **Set up monitoring**: Use Vercel Analytics or integrate with your preferred service
2. **Create dashboard**: Build a simple web dashboard using the stats endpoint
3. **Email integration**: Set up Mailchimp or SendGrid for email campaigns
4. **Backup strategy**: Configure automated database backups

## Need Help?

- Check Vercel logs: `vercel logs`
- Test individual endpoints using the test script
- Review ANALYTICS_SETUP.md for detailed configuration options

Your analytics system is now ready! 🎉