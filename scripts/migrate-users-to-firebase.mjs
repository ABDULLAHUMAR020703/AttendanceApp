/**
 * Migration script to import users from users.txt to Firebase
 * Run with: node scripts/migrate-users-to-firebase.mjs
 * Or: npm run migrate-users
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration (same as config/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyByLF4IV7KNfVHkFywimANGoWo_2mpdb2E",
  authDomain: "attendanceapp-8c711.firebaseapp.com",
  projectId: "attendanceapp-8c711",
  storageBucket: "attendanceapp-8c711.firebasestorage.app",
  messagingSenderId: "481410140032",
  appId: "1:481410140032:web:3667cba45c34463259e365",
  measurementId: "G-KTWFRYJSER"
};

// Work mode constants
const WORK_MODES = {
  IN_OFFICE: 'in_office',
  SEMI_REMOTE: 'semi_remote',
  FULLY_REMOTE: 'fully_remote'
};

// Map usernames to their complete employee data
const userEmployeeMap = {
  'testuser': {
    name: 'Test User',
    email: 'testuser@company.com',
    role: 'employee',
    department: 'Engineering',
    position: 'AI Engineer',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2023-01-15'
  },
  'testadmin': {
    name: 'Test Admin',
    email: 'testadmin@company.com',
    role: 'super_admin',
    department: 'Management',
    position: 'System Administrator',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2023-01-01'
  },
  'john.doe': {
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'employee',
    department: 'Engineering',
    position: 'Senior AI Engineer',
    workMode: WORK_MODES.SEMI_REMOTE,
    hireDate: '2022-06-10'
  },
  'jane.smith': {
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: 'employee',
    department: 'Design',
    position: 'UI/UX Designer',
    workMode: WORK_MODES.FULLY_REMOTE,
    hireDate: '2022-08-20'
  },
  'mike.johnson': {
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'employee',
    department: 'Sales',
    position: 'Sales Manager',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2022-03-15'
  },
  'sarah.williams': {
    name: 'Sarah Williams',
    email: 'sarah.williams@company.com',
    role: 'employee',
    department: 'Marketing',
    position: 'Marketing Specialist',
    workMode: WORK_MODES.SEMI_REMOTE,
    hireDate: '2023-02-01'
  },
  'david.brown': {
    name: 'David Brown',
    email: 'david.brown@company.com',
    role: 'employee',
    department: 'Engineering',
    position: 'DevOps Engineer',
    workMode: WORK_MODES.FULLY_REMOTE,
    hireDate: '2022-11-05'
  },
  'emily.davis': {
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'employee',
    department: 'HR',
    position: 'HR Coordinator',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2023-04-12'
  },
  'hrmanager': {
    name: 'HR Manager',
    email: 'hrmanager@company.com',
    role: 'manager',
    department: 'HR',
    position: 'HR Manager',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2022-03-01'
  },
  'techmanager': {
    name: 'Tech Manager',
    email: 'techmanager@company.com',
    role: 'manager',
    department: 'Engineering',
    position: 'Engineering Manager',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2022-02-15'
  },
  'salesmanager': {
    name: 'Sales Manager',
    email: 'salesmanager@company.com',
    role: 'manager',
    department: 'Sales',
    position: 'Sales Manager',
    workMode: WORK_MODES.IN_OFFICE,
    hireDate: '2022-01-20'
  }
};

/**
 * Parse users from users.txt format
 */
function parseUsers(content) {
  const users = [];
  const lines = content.trim().split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length >= 3) {
      const username = parts[0].trim();
      const passwordPart = parts[1].trim();
      const rolePart = parts[2].trim();
      
      const passwordMatch = passwordPart.match(/password:(.+)/);
      const roleMatch = rolePart.match(/role:(.+)/);
      
      if (passwordMatch && roleMatch) {
        // Get employee data from map, or use defaults
        const employeeData = userEmployeeMap[username] || {
          name: username
            .replace(/\./g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()),
          email: `${username}@company.com`,
          role: roleMatch[1],
          department: '',
          position: '',
          workMode: WORK_MODES.IN_OFFICE,
          hireDate: new Date().toISOString().split('T')[0]
        };
        
        users.push({
          username,
          password: passwordMatch[1],
          ...employeeData
        });
      }
    }
  }
  return users;
}

/**
 * Check if username exists in Firebase
 */
async function checkUsernameExists(db, username) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Create user in Firebase
 */
async function createUser(auth, db, userData) {
  try {
    const { 
      username, 
      password, 
      email, 
      name, 
      role,
      department = '',
      position = '',
      workMode = 'in_office',
      hireDate = new Date().toISOString().split('T')[0]
    } = userData;
    
    if (!username || !password || !role) {
      return { success: false, error: 'Username, password, and role are required' };
    }
    
    if (!email) {
      return { success: false, error: 'Email is required for Firebase authentication' };
    }
    
    // Check if username already exists
    const usernameExists = await checkUsernameExists(db, username);
    if (usernameExists) {
      return { success: false, error: 'Username already exists' };
    }
    
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user document in Firestore with all fields
      const userDocData = {
        uid: firebaseUser.uid,
        username,
        email,
        name: name || username,
        role,
        department: department || '',
        position: position || '',
        workMode: workMode || 'in_office',
        hireDate: hireDate || new Date().toISOString().split('T')[0],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
      
      return { success: true, uid: firebaseUser.uid };
    } catch (error) {
      let errorMessage = 'Failed to create user';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { success: false, error: error.message || 'Failed to add user' };
  }
}

/**
 * Main migration function
 */
async function migrateUsers() {
  try {
    console.log('\n🔄 Initializing Firebase...\n');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // Read users.txt file
    const usersFilePath = join(__dirname, '..', 'users.txt');
    console.log(`📖 Reading users from: ${usersFilePath}\n`);
    
    let usersData;
    try {
      usersData = readFileSync(usersFilePath, 'utf-8');
    } catch (error) {
      console.error('❌ Error reading users.txt:', error.message);
      console.error('   Make sure users.txt exists in the project root directory.');
      process.exit(1);
    }
    
    // Parse users
    const users = parseUsers(usersData);
    console.log(`📋 Found ${users.length} users to migrate\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in users.txt');
      process.exit(0);
    }
    
    const results = [];
    
    console.log('🚀 Starting migration...\n');
    console.log('='.repeat(60));
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        console.log(`[${i + 1}/${users.length}] Creating: ${user.username} (${user.name})...`);
        const result = await createUser(auth, db, user);
        
        if (result.success) {
          results.push({ username: user.username, success: true });
          console.log(`   ✅ Created: ${user.username} - ${user.name}`);
          console.log(`      Role: ${user.role}, Department: ${user.department || 'N/A'}`);
        } else {
          results.push({ username: user.username, success: false, error: result.error });
          console.log(`   ❌ Failed: ${user.username} - ${result.error}`);
        }
        
        // Add delay to avoid rate limiting
        if (i < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        results.push({ username: user.username, success: false, error: error.message });
        console.error(`   ❌ Error: ${user.username} - ${error.message}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Complete');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total: ${results.length}`);
    
    if (failCount > 0) {
      console.log(`\n❌ Failed users:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.username}: ${r.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();

