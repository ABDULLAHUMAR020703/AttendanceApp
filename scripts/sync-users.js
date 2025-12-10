/**
 * Script to sync users from device storage to project users.txt file
 * 
 * This script reads the users from the device's document directory
 * and updates the project's users.txt file.
 * 
 * Usage (from project root):
 * node scripts/sync-users.js
 * 
 * Note: This requires access to the device's document directory,
 * which may not be directly accessible. For development, you can:
 * 1. Use the export function in the app to create a sync file
 * 2. Copy that file to the project root
 * 3. Or manually copy the content from the app's console logs
 */

const fs = require('fs');
const path = require('path');

// Paths
const PROJECT_USERS_FILE = path.join(__dirname, '..', 'users.txt');
const ASSETS_USERS_FILE = path.join(__dirname, '..', 'assets', 'users.txt');
const SYNC_USERS_FILE = path.join(__dirname, '..', 'users_sync.txt');

console.log('🔄 Syncing users to project files...\n');

// Check if sync file exists
if (fs.existsSync(SYNC_USERS_FILE)) {
  try {
    const syncContent = fs.readFileSync(SYNC_USERS_FILE, 'utf8');
    
    // Update project users.txt
    fs.writeFileSync(PROJECT_USERS_FILE, syncContent, 'utf8');
    console.log('✅ Updated:', PROJECT_USERS_FILE);
    
    // Update assets/users.txt
    fs.writeFileSync(ASSETS_USERS_FILE, syncContent, 'utf8');
    console.log('✅ Updated:', ASSETS_USERS_FILE);
    
    console.log('\n✨ Sync complete!');
    console.log('📝 Total users:', syncContent.trim().split('\n').length);
  } catch (error) {
    console.error('❌ Error syncing files:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  Sync file not found:', SYNC_USERS_FILE);
  console.log('\n📋 To create the sync file:');
  console.log('1. Open the app');
  console.log('2. Call syncUsersToProjectFile() from the admin dashboard');
  console.log('3. Or use the export function in utils/auth.js');
  console.log('4. Copy the generated file to project root as users_sync.txt');
  process.exit(1);
}

