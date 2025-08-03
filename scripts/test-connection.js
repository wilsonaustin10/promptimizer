#!/usr/bin/env node

/**
 * Test different connection methods to Supabase
 */

const { Client } = require('pg');

const directConnection = "postgresql://postgres:3CcBevuDwDV3LfUz@db.tvkashueqykuckrmzvft.supabase.co:5432/postgres";

// Try different connection configurations
const connections = [
  {
    name: "Direct with SSL",
    config: {
      connectionString: directConnection,
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: "Direct with SSL required",
    config: {
      connectionString: directConnection + "?sslmode=require",
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: "IPv4 only",
    config: {
      connectionString: directConnection,
      ssl: { rejectUnauthorized: false },
      options: '--inet-socket-addresses=ipv4'
    }
  }
];

async function testConnection(connection) {
  const client = new Client(connection.config);
  
  try {
    console.log(`🔄 Testing: ${connection.name}`);
    await client.connect();
    console.log(`✅ ${connection.name} - SUCCESS!`);
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log(`   Database: ${result.rows[0].version.split(' ')[0]}`);
    
    return true;
  } catch (error) {
    console.log(`❌ ${connection.name} - FAILED: ${error.message}`);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  console.log('🚀 Testing Supabase connections...\n');
  
  let anySuccess = false;
  
  for (const connection of connections) {
    const success = await testConnection(connection);
    if (success) {
      anySuccess = true;
      break; // Stop on first success
    }
    console.log(''); // Add spacing
  }
  
  if (!anySuccess) {
    console.log('\n❌ All connection attempts failed.');
    console.log('\n🔧 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Click Settings → Database');
    console.log('3. Try the "Session pooler" connection string instead');
    console.log('4. Check if your project is paused (free tier auto-pauses)');
    console.log('5. Verify your password is correct');
    console.log('\n📋 Session pooler format:');
    console.log('postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres');
  } else {
    console.log('\n🎉 Connection successful! You can now run the database setup.');
  }
}

main().catch(console.error);