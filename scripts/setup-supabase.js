#!/usr/bin/env node

/**
 * Setup script for Supabase database
 * This handles SSL connections and runs the SQL setup
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/setup-supabase.js "postgresql://..."');
  console.error('\nExample:');
  console.error('node scripts/setup-supabase.js "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"');
  process.exit(1);
}

const connectionString = args[0];

// Supabase requires SSL
const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (remove comments and empty lines)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📋 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
          console.log('✅ Success\n');
        } catch (err) {
          console.error(`❌ Error in statement ${i + 1}:`, err.message);
          console.error('Statement:', statement.substring(0, 50) + '...\n');
        }
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('installs', 'events', 'emails')
      ORDER BY table_name;
    `);

    console.log('\n✅ Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test insert
    await client.query(`
      INSERT INTO installs (user_id, extension_version, browser_type) 
      VALUES ('test-setup-user', '1.0.0', 'chrome')
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log('✅ Insert test passed');

    // Test select
    const result = await client.query('SELECT COUNT(*) FROM installs');
    console.log(`✅ Select test passed - ${result.rows[0].count} installs found`);

    // Clean up test data
    await client.query("DELETE FROM installs WHERE user_id = 'test-setup-user'");
    console.log('✅ Cleanup test passed\n');

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Connection string for Vercel:');
    console.log(connectionString);
    console.log('\n⚠️  Important: Use the "Session pooler" connection string from Supabase dashboard for production!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check your password is correct');
    console.error('2. Ensure your Supabase project is active');
    console.error('3. Try using the "Session pooler" connection string from Supabase dashboard');
    console.error('4. Make sure your IP is not blocked (check Supabase dashboard settings)');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run setup
setupDatabase();