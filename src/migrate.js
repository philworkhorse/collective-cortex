/**
 * Database migration runner
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('Running migrations...');
  
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    
    console.log(`Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    try {
      await db.query(sql);
      console.log(`✓ ${file} completed`);
    } catch (error) {
      if (error.code === '42710' || error.code === '42P07') {
        // Extension/table already exists - that's fine
        console.log(`✓ ${file} (already applied)`);
      } else {
        console.error(`✗ ${file} failed:`, error.message);
        throw error;
      }
    }
  }
  
  console.log('Migrations complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
