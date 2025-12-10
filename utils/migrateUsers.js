// Migration utility to import users from users.txt to Firebase
import { addUserToFile } from './auth';
import { WORK_MODES } from './workModes';

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
 * @param {string} content - File content
 * @returns {Array} Array of user objects with complete data
 */
const parseUsers = (content) => {
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
};

/**
 * Migrate users from users.txt format to Firebase
 * @returns {Promise<{total: number, success: number, failed: number, results: Array}>}
 */
export const migrateUsersFromFile = async () => {
  const usersData = `testuser,password:testuser123,role:employee
testadmin,password:testadmin123,role:super_admin
john.doe,password:john123,role:employee
jane.smith,password:jane123,role:employee
mike.johnson,password:mike123,role:employee
sarah.williams,password:sarah123,role:employee
david.brown,password:david123,role:employee
emily.davis,password:emily123,role:employee
hrmanager,password:hrmanager123,role:manager
techmanager,password:techmanager123,role:manager
salesmanager,password:salesmanager123,role:manager`;

  const users = parseUsers(usersData);
  const results = [];

  console.log(`\n🔄 Starting migration of ${users.length} users to Firebase...\n`);

  for (const user of users) {
    try {
      console.log(`Creating user: ${user.username} (${user.name})...`);
      const result = await addUserToFile(user);
      
      if (result.success) {
        results.push({ username: user.username, success: true });
        console.log(`✓ Created: ${user.username} - ${user.name} (${user.role}, ${user.department || 'No dept'})`);
      } else {
        results.push({ username: user.username, success: false, error: result.error });
        console.log(`✗ Failed: ${user.username} - ${result.error}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({ username: user.username, success: false, error: error.message });
      console.error(`✗ Error: ${user.username} - ${error.message}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Migration Complete`);
  console.log(`${'='.repeat(50)}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total: ${results.length}`);
  
  if (failCount > 0) {
    console.log(`\n❌ Failed users:`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.username}: ${r.error}`);
    });
  }
  
  console.log(`\n${'='.repeat(50)}\n`);

  return {
    total: results.length,
    success: successCount,
    failed: failCount,
    results
  };
};

