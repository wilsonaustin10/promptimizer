# 🚀 Quick Supabase Setup

Having trouble connecting to Supabase? Here's the solution:

## Step 1: Install Dependencies

```bash
cd scripts
npm install
cd ..
```

## Step 2: Get the Correct Connection String

1. Go to your Supabase dashboard
2. Click on your project
3. Go to **Settings** → **Database**
4. Look for **Connection String** section
5. Choose **"Session pooler"** (not Direct connection)
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

## Step 3: Run the Setup Script

```bash
node scripts/setup-supabase.js "your-session-pooler-connection-string"
```

## Alternative: Manual Setup via Supabase Dashboard

If the script still doesn't work, you can set up the database manually:

1. Go to your Supabase dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy and paste the contents of `scripts/create-database.sql`
5. Click **"Run"**

## What Connection String to Use for Vercel?

For **production deployment**, use the **"Session pooler"** connection string, not the direct one.

The pooler string looks like:
```
postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## Troubleshooting

### Error: "Connection timeout"
- Make sure you're using the Session pooler string
- Check if your IP is allowlisted in Supabase dashboard

### Error: "Password authentication failed"
- Double-check your password
- Try resetting the database password in Supabase dashboard

### Error: "SSL required"
- The script handles SSL automatically
- For manual connections, add `?sslmode=require` to the connection string

### Still having issues?

Run this to test your connection:
```bash
node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'YOUR_CONNECTION_STRING',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => {
  console.log('✅ Connection successful!');
  client.end();
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
});
"
```