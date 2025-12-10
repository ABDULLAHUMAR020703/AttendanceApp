# System Architecture & User Management Guide

## Table of Contents
1. [Overview](#overview)
2. [Code Architecture](#code-architecture)
3. [Authentication System](#authentication-system)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Employee Data Structure](#employee-data-structure)
6. [Firebase Integration](#firebase-integration)
7. [Ticket Routing System](#ticket-routing-system)
8. [Data Storage](#data-storage)
9. [Login Flow](#login-flow)
10. [Employee Management](#employee-management)

---

## Overview

This attendance management system uses **Firebase Authentication** and **Firestore** for user management, with **AsyncStorage** for local data persistence. The system supports three authentication roles with different permission levels and automatic ticket routing based on departments.

The codebase follows a **modular, feature-based architecture** where each feature is self-contained and isolated, ensuring features don't interfere with each other and the code is deployment-ready.

---

## Code Architecture

### Modular Structure

The application is organized into three main layers:

#### 1. Core (`core/`)
Core infrastructure that the entire app depends on:
- **`config/`**: Firebase and app configuration
- **`contexts/`**: React Context providers (Auth, Theme)
- **`navigation/`**: Navigation setup and routing
- **`services/`**: Core services (storage abstraction)

#### 2. Features (`features/`)
Self-contained feature modules:
- **`auth/`**: Authentication (login, signup, biometric)
- **`attendance/`**: Attendance tracking (check-in/out, history)
- **`tickets/`**: Ticket management and routing
- **`leave/`**: Leave request management
- **`employees/`**: Employee management
- **`notifications/`**: Notification system
- **`calendar/`**: Calendar and events
- **`analytics/`**: Analytics and dashboards

Each feature contains:
- `screens/` - UI components
- `services/` - Business logic
- `utils/` - Feature-specific utilities
- `index.js` - Public API exports

#### 3. Shared (`shared/`)
Reusable code across features:
- **`components/`**: Reusable UI components (Logo, Trademark, etc.)
- **`utils/`**: Shared utilities (responsive, export)
- **`constants/`**: Constants and enums (roles, workModes, routes)
- **`hooks/`**: Shared React hooks

### Architecture Benefits

1. **Feature Isolation**: Changes to one feature don't affect others
2. **Clear Dependencies**: Features only import from `shared/` and `core/`
3. **Deployment Ready**: Clear structure for CI/CD pipelines
4. **Maintainability**: Easy to find and modify code by feature
5. **Scalability**: Easy to add new features without affecting existing ones

### Import Patterns

```javascript
// Import from features
import { authenticateUser } from '../features/auth';

// Import from shared
import { ROLES } from '../shared/constants/roles';
import { WORK_MODES } from '../shared/constants/workModes';

// Import from core
import { useAuth } from '../core/contexts/AuthContext';
import { storage } from '../core/services/storage';
```

### Navigation Structure

- **`AppNavigator.js`**: Main router that decides between auth and main navigation
- **`AuthNavigator.js`**: Handles login/signup flow
- **`MainNavigator.js`**: Routes based on user role (employee, manager, super_admin)

For detailed architecture documentation, see `docs/MODULAR_ARCHITECTURE.md`.

---

## Authentication System

### How Authentication Works

1. **User Login Process:**
   - User enters username or email + password
   - System checks if input is username (no `@`) or email
   - If username: Queries Firestore to find user's email
   - Authenticates with Firebase using email + password
   - Retrieves user data from Firestore
   - Combines with employee data from AsyncStorage (if available)
   - Sets user session in AuthContext

2. **Authentication Methods:**
   - **Username Login**: `testuser` → System finds email → Firebase Auth
   - **Email Login**: `testuser@company.com` → Direct Firebase Auth

3. **Password Storage:**
   - Passwords are **NOT stored in Firestore** (security best practice)
   - Passwords are hashed and stored in **Firebase Authentication**
   - Cannot retrieve original passwords (by design)

---

## User Roles & Permissions

### Role Hierarchy

The system has **3 authentication roles** (not position-based):

#### 1. `super_admin`
**Full System Access**

**Permissions:**
- ✅ Create new users
- ✅ Approve signup requests
- ✅ Manage all employees (all departments)
- ✅ Access all dashboards
- ✅ View all attendance records
- ✅ Assign tickets manually
- ✅ System administration
- ✅ Can manage managers and super admins

**Example Users:**
- `testadmin` (System Administrator)

#### 2. `manager`
**Department-Level Access**

**Permissions:**
- ✅ Manage employees in their department only
- ✅ View attendance records
- ✅ Access HR dashboard
- ✅ Approve leave requests (their department)
- ✅ View tickets assigned to them
- ✅ Cannot manage super admins
- ❌ Cannot create users
- ❌ Cannot approve signups

**Example Users:**
- `hrmanager` (HR Department)
- `techmanager` (Engineering Department)
- `salesmanager` (Sales Department)

**How Managers are Identified:**
- Role: `manager`
- Department: `HR`, `Engineering`, `Sales`, etc.
- Username can be anything (e.g., `hrmanager`, `techmanager`)

#### 3. `employee`
**Basic Access**

**Permissions:**
- ✅ Check in/out
- ✅ View own attendance records
- ✅ Create tickets
- ✅ Request leave/work mode changes
- ✅ View own profile
- ❌ Cannot manage other employees
- ❌ Cannot view other employees' data
- ❌ Cannot access admin dashboards

**Example Users:**
- `testuser`, `john.doe`, `jane.smith`, etc.

### Role vs Position

**Important Distinction:**

- **Role** (`role` field): Authentication/access control
  - Values: `super_admin`, `manager`, `employee`
  - Controls what you can do in the system

- **Position** (`position` field): Job title/description
  - Values: `AI Engineer`, `Senior AI Engineer`, `AI Intern`, `HR Manager`, etc.
  - Descriptive only, does NOT control access
  - Used for HR hierarchy mapping

**Example:**
```json
{
  "username": "techmanager",
  "role": "manager",           // ← Controls access
  "position": "Engineering Manager",  // ← Just a title
  "department": "Engineering"
}
```

---

## Employee Data Structure

### Complete User Object

Every user/employee has the following structure:

```json
{
  "id": "emp_001",                    // Unique employee ID
  "uid": "firebase_auth_uid",         // Firebase Authentication UID
  "username": "testuser",             // Login username (unique)
  "email": "testuser@company.com",    // Email (unique, for Firebase Auth)
  "name": "Test User",                // Full name
  "role": "employee",                 // Auth role: super_admin, manager, employee
  "department": "Engineering",        // Department name
  "position": "AI Engineer",          // Job title/position
  "workMode": "in_office",            // in_office, semi_remote, fully_remote
  "hireDate": "2023-01-15",          // YYYY-MM-DD format
  "isActive": true,                   // Active status
  "createdAt": "2023-01-15T00:00:00.000Z",
  "updatedAt": "2023-01-15T00:00:00.000Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique employee identifier (e.g., `emp_001`) |
| `uid` | string | Yes* | Firebase Auth UID (if using Firebase) |
| `username` | string | Yes | Login username, must be unique |
| `email` | string | Yes | Email address, must be unique, used for Firebase Auth |
| `name` | string | Yes | Full name of the employee |
| `role` | string | Yes | `super_admin`, `manager`, or `employee` |
| `department` | string | No | Department name (e.g., `Engineering`, `HR`, `Sales`) |
| `position` | string | No | Job title (e.g., `AI Engineer`, `HR Manager`) |
| `workMode` | string | No | `in_office`, `semi_remote`, or `fully_remote` |
| `hireDate` | string | No | Date in `YYYY-MM-DD` format |
| `isActive` | boolean | Yes | Whether employee is active |
| `createdAt` | string | Yes | ISO 8601 timestamp |
| `updatedAt` | string | Yes | ISO 8601 timestamp |

---

## Firebase Integration

### Overview

The application uses **Firebase** as the primary backend service for authentication and user data management. Firebase provides secure, scalable, and real-time capabilities for the attendance management system.

### Firebase Services Used

1. **Firebase Authentication** - User authentication and session management
2. **Cloud Firestore** - NoSQL database for user profiles and data
3. **Firebase Configuration** - Centralized app configuration

### Firebase Configuration

The Firebase configuration is located in `core/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
```

### Firebase Initialization

The app initializes Firebase with React Native-specific settings:

```javascript
// Initialize Firebase App
app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with React Native compatibility
db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
```

**Key Features:**
- **AsyncStorage Persistence**: Auth state persists across app restarts
- **Long Polling**: Ensures Firestore works reliably in React Native
- **Error Handling**: Graceful fallbacks if initialization fails

### Firebase Authentication

#### What is Stored in Firebase Auth?

- **Email**: Used as the primary login identifier
- **Password**: Hashed and encrypted (not retrievable)
- **UID**: Unique user identifier (used as Firestore document ID)
- **Session State**: Automatically managed by Firebase

#### Authentication Methods Supported

1. **Email/Password Authentication** (Primary)
   - Users can login with email or username
   - If username is provided, system looks up email in Firestore
   - Password is verified by Firebase Authentication

2. **Session Persistence**
   - Uses AsyncStorage for offline persistence
   - Automatically restores session on app restart
   - `onAuthStateChanged` listener updates app state

#### Authentication Flow

```javascript
// 1. User enters username or email
authenticateUser(usernameOrEmail, password)

// 2. If username, find email in Firestore
if (!usernameOrEmail.includes('@')) {
  const userDoc = await getDocs(
    query(usersRef, where('username', '==', username))
  );
  email = userDoc.data().email;
}

// 3. Authenticate with Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 4. Get user data from Firestore
const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
```

#### Authentication Error Handling

The system handles various Firebase Auth errors:

- `auth/user-not-found`: User doesn't exist
- `auth/wrong-password`: Incorrect password
- `auth/invalid-email`: Invalid email format
- `auth/user-disabled`: Account disabled
- `auth/too-many-requests`: Rate limiting
- `auth/email-already-in-use`: Email already registered
- `auth/weak-password`: Password too weak

### Firestore Database

#### Collection Structure

```
Firestore Database
└── users (collection)
    ├── {uid_1} (document)
    │   ├── uid: "firebase_auth_uid"
    │   ├── username: "testuser"
    │   ├── email: "testuser@company.com"
    │   ├── name: "Test User"
    │   ├── role: "employee"
    │   ├── department: "Engineering"
    │   ├── position: "AI Engineer"
    │   ├── workMode: "in_office"
    │   ├── hireDate: "2023-01-15"
    │   ├── isActive: true
    │   ├── createdAt: "2023-01-15T00:00:00.000Z"
    │   └── updatedAt: "2023-01-15T00:00:00.000Z"
    ├── {uid_2} (document)
    └── ...
```

**Important Notes:**
- **Document ID**: Always the Firebase Auth UID (not username)
- **Username Field**: Stored as a field for querying
- **Email Field**: Must match Firebase Auth email
- **Role Field**: Controls access (`super_admin`, `manager`, `employee`)

#### Firestore Security Rules

**Development Rules (Permissive):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Production Rules (Recommended):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin');
      
      // Only super_admin and managers can write
      allow write: if request.auth != null && 
                      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin' ||
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager');
    }
  }
}
```

### Firebase API Usage

#### Creating Users

```javascript
// 1. Create in Firebase Authentication
const userCredential = await createUserWithEmailAndPassword(
  auth, 
  email, 
  password
);

// 2. Create Firestore document
await setDoc(doc(db, 'users', userCredential.user.uid), {
  uid: userCredential.user.uid,
  username,
  email,
  name,
  role,
  department,
  position,
  workMode,
  hireDate,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

#### Querying Users

```javascript
// Find user by username
const usersRef = collection(db, 'users');
const q = query(usersRef, where('username', '==', username));
const querySnapshot = await getDocs(q);

// Get user by UID
const userDoc = await getDoc(doc(db, 'users', uid));
const userData = userDoc.data();
```

#### Updating Users

```javascript
// Update user role
await setDoc(doc(db, 'users', userId), {
  role: newRole,
  updatedAt: new Date().toISOString()
}, { merge: true });

// Update multiple fields
await setDoc(doc(db, 'users', userId), {
  department: newDepartment,
  position: newPosition,
  workMode: newWorkMode,
  updatedAt: new Date().toISOString()
}, { merge: true });
```

### Firebase Authentication State Management

The app uses `onAuthStateChanged` listener to track authentication state:

```javascript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is signed in
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      setUser(combinedUser);
    } else {
      // User is signed out
      setUser(null);
    }
  });

  return () => unsubscribe();
}, []);
```

### What Goes to Firebase?

#### ✅ Stored in Firebase

1. **Firebase Authentication**
   - Email addresses
   - Hashed passwords
   - User UIDs
   - Session tokens

2. **Firestore `users` Collection**
   - Complete user profiles
   - Username, email, name
   - Role, department, position
   - Work mode, hire date
   - Active status
   - Timestamps

### What Does NOT Go to Firebase?

#### ❌ Stored Locally (AsyncStorage)

- **Attendance Records**: `@attendance_records`
- **Tickets**: `@tickets`
- **Notifications**: `@notifications`
- **Signup Requests**: `@signup_requests`
- **Leave Requests**: `@leave_requests`
- **Employee List Cache**: `@company_employees` (synced from Firebase)

**Why?**
- Attendance and tickets are device-specific
- Notifications are local to each device
- Reduces Firebase read/write costs
- Faster local access

### Firebase Migration

#### From Local Storage to Firebase

The app has been fully migrated from local file storage:

**Before (Legacy):**
- `users.txt` file in device storage
- FileSystem operations
- Manual file parsing

**After (Current):**
- Firebase Authentication for credentials
- Firestore for user data
- Automatic sync across devices
- Built-in offline support

#### Migration Script

Use `scripts/migrate-users-to-firebase.mjs` to migrate from `users.txt`:

```bash
npm run migrate-users
```

The script:
1. Reads `users.txt` from project root
2. Parses user data
3. Creates Firebase Auth accounts
4. Creates Firestore documents
5. Includes all user fields

### Firebase Best Practices

1. **Security**
   - Use production security rules in production
   - Never expose API keys in client code (use environment variables)
   - Implement proper role-based access control

2. **Performance**
   - Use Firestore queries efficiently
   - Cache frequently accessed data in AsyncStorage
   - Implement pagination for large datasets

3. **Error Handling**
   - Always handle Firebase errors gracefully
   - Provide user-friendly error messages
   - Log errors for debugging

4. **Offline Support**
   - Firebase Auth persists automatically
   - Firestore has built-in offline cache
   - AsyncStorage provides additional offline storage

### Firebase Troubleshooting

#### Common Issues

**1. "Missing or insufficient permissions"**
- Check Firestore security rules
- Verify rules are published
- Ensure user is authenticated

**2. "Firebase: No Firebase App '[DEFAULT]' has been created"**
- Check `core/config/firebase.js` initialization
- Ensure `initializeApp()` is called before other services
- Verify Firebase configuration is correct

**3. "User not found"**
- Check if user exists in Firebase Authentication
- Verify Firestore document exists
- Check username field matches

**4. Authentication not persisting**
- Verify AsyncStorage is working
- Check `getReactNativePersistence` is used
- Ensure app has storage permissions

### Firebase Setup Reference

For complete setup instructions, see:
- **`docs/FIREBASE_SETUP.md`** - Step-by-step Firebase setup guide
- **`core/config/firebase.js`** - Firebase configuration file
- **`features/auth/services/authService.js`** - Authentication service implementation

---

## Ticket Routing System

### How Tickets are Routed

When a user creates a ticket:

1. **Category Selection:**
   - User selects category: `Technical`, `HR`, `Finance`, `Facilities`, or `Other`

2. **Super Admin Notification:**
   - All super admins receive notification immediately
   - Ticket is visible to super admins in dashboard

3. **Automatic Department Routing:**
   - System maps category to department:
     - `Technical` → `Engineering` → Finds `techmanager`
     - `HR` → `HR` → Finds `hrmanager`
     - `Finance` → `Finance` → Finds Finance manager (if exists)
     - `Facilities` → `Facilities` → Finds Facilities manager (if exists)
     - `Other` → No auto-assignment (super admin only)

4. **Auto-Assignment:**
   - If department manager exists:
     - Ticket automatically assigned to that manager
     - Status changes from `open` to `in_progress`
     - Manager receives notification
   - If no manager found:
     - Ticket remains unassigned
     - All managers notified about unassigned ticket

### Category to Department Mapping

```javascript
{
  "technical": "Engineering",    // → techmanager
  "hr": "HR",                    // → hrmanager
  "finance": "Finance",          // → Finance manager
  "facilities": "Facilities",    // → Facilities manager
  "other": null                  // → No auto-assignment
}
```

### Ticket Flow Example

**Scenario:** Employee creates a Technical ticket

1. Employee (`testuser`) creates ticket with category `Technical`
2. Super admin (`testadmin`) gets notification
3. System finds `Engineering` department
4. System finds manager with `role: "manager"` AND `department: "Engineering"` → `techmanager`
5. Ticket auto-assigned to `techmanager`
6. `techmanager` receives notification
7. Ticket status: `in_progress`

---

## Data Storage

### Storage Locations

#### 1. Firebase (Cloud)
- **Authentication**: Email/password credentials
- **Firestore `users` collection**: Complete user profile data

#### 2. AsyncStorage (Local Device)
- **Key**: `@company_employees`
- **Data**: Array of employee objects (same structure as Firestore)
- **Purpose**: Local cache, offline access, employee management

#### 3. AsyncStorage (Other Data)
- **Key**: `@attendance_records` - Attendance data
- **Key**: `@tickets` - Ticket data
- **Key**: `@notifications` - Notification data
- **Key**: `@signup_requests` - Pending signup requests

### Data Synchronization

- **Firebase** is the source of truth for user authentication
- **AsyncStorage** employee list is synced with Firebase
- When user is created:
  1. Created in Firebase Authentication
  2. Document created in Firestore `users` collection
  3. Employee added to AsyncStorage `@company_employees`

---

## Login Flow

### Step-by-Step Process

```
1. User enters username/email + password
   ↓
2. Check if input is username or email
   ↓
3. If username → Query Firestore for email
   ↓
4. Authenticate with Firebase (email + password)
   ↓
5. Get Firebase Auth UID
   ↓
6. Fetch user document from Firestore (users/{uid})
   ↓
7. Optionally fetch employee data from AsyncStorage
   ↓
8. Combine data into user object
   ↓
9. Set user in AuthContext
   ↓
10. Navigate to appropriate dashboard:
    - employee → EmployeeDashboard
    - manager/super_admin → AdminDashboard
```

### Code Flow

```javascript
// 1. User enters credentials
authenticateUser(usernameOrEmail, password)

// 2. Check if username or email
if (!usernameOrEmail.includes('@')) {
  // Find email from Firestore
  const userDoc = await getDocs(query(usersRef, where('username', '==', username)));
  email = userDoc.data().email;
}

// 3. Firebase Authentication
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 4. Get user data from Firestore
const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
const userData = userDoc.data();

// 5. Return user object
return {
  success: true,
  user: {
    username: userData.username,
    role: userData.role,
    uid: userCredential.user.uid,
    email: userCredential.user.email
  }
};
```

---

## Employee Management

### Creating Employees

**Who can create:**
- `super_admin` only

**Process:**
1. Super admin fills form (username, password, name, email, role, department, position, etc.)
2. System checks if username exists
3. Creates user in Firebase Authentication
4. Creates document in Firestore `users` collection
5. Adds employee to AsyncStorage `@company_employees`
6. If role is `manager`, can manage employees in their department

### Updating Employees

**Who can update:**
- `super_admin`: Can update anyone
- `manager`: Can update employees in their department only

**Fields that can be updated:**
- Role (super_admin only)
- Department
- Position
- Work mode
- Hire date
- Active status

### Employee Roles by Department

**Engineering Department:**
- Manager: `techmanager` (role: `manager`)
- Employees: `testuser`, `john.doe`, `david.brown`

**HR Department:**
- Manager: `hrmanager` (role: `manager`)
- Employees: `emily.davis`

**Sales Department:**
- Manager: `salesmanager` (role: `manager`)
- Employees: `mike.johnson`

**Other Departments:**
- Design: `jane.smith`
- Marketing: `sarah.williams`
- Management: `testadmin` (super_admin)

---

## Key Concepts Summary

### 1. Authentication Roles (3 total)
- `super_admin`: Full access
- `manager`: Department-level access
- `employee`: Basic access

### 2. Position vs Role
- **Role**: Controls access (`super_admin`, `manager`, `employee`)
- **Position**: Job title (`AI Engineer`, `HR Manager`, etc.) - descriptive only

### 3. Department-Based Routing
- Managers identified by: `role: "manager"` + `department: "X"`
- Tickets routed to managers based on department
- Managers can only manage employees in their department

### 4. Firebase Structure
- **Authentication**: Email/password (hashed, stored in Firebase Auth)
- **Firestore**: User profile data (no passwords, document ID = Firebase Auth UID)
- **Configuration**: `core/config/firebase.js`
- **Initialization**: AsyncStorage persistence, long polling for React Native
- **Security**: Firestore security rules for role-based access

### 5. Data Flow
- Login → Firebase Auth → Firestore → AsyncStorage (optional)
- Create User → Firebase Auth + Firestore + AsyncStorage
- Tickets → AsyncStorage → Auto-route to department manager

---

## Example User Scenarios

### Scenario 1: Employee Login
```
Username: testuser
Password: testuser123
→ Role: employee
→ Department: Engineering
→ Position: AI Engineer
→ Dashboard: EmployeeDashboard
→ Can: Check in/out, view own attendance, create tickets
```

### Scenario 2: Manager Login
```
Username: techmanager
Password: techmanager123
→ Role: manager
→ Department: Engineering
→ Position: Engineering Manager
→ Dashboard: AdminDashboard
→ Can: Manage Engineering employees, view tickets assigned to them
```

### Scenario 3: Super Admin Login
```
Username: testadmin
Password: testadmin123
→ Role: super_admin
→ Department: Management
→ Position: System Administrator
→ Dashboard: AdminDashboard
→ Can: Everything (create users, manage all employees, assign tickets)
```

---

## Migration from users.txt

If migrating from `users.txt` format:

```
Format: username,password:xxx,role:xxx
Example: testuser,password:testuser123,role:employee
```

**Migration Process:**
1. Parse `users.txt` file
2. For each user:
   - Create in Firebase Authentication (email + password)
   - Create document in Firestore `users` collection
   - Add to AsyncStorage `@company_employees`
3. Use migration script: `npm run migrate-users`

---

## Troubleshooting

### Common Issues

**1. "User not found" error:**
- Check if user exists in Firestore `users` collection
- Verify username/email is correct
- Check if user document has all required fields

**2. "Invalid password" error:**
- Password is stored in Firebase Auth (hashed)
- Cannot retrieve original password
- Use Firebase Console to reset password

**3. Ticket not routing to manager:**
- Verify manager exists with correct `role: "manager"`
- Verify manager's `department` matches ticket category mapping
- Check if manager is `isActive: true`

**4. Manager cannot manage employees:**
- Verify manager's `department` matches employee's `department`
- Check if manager's `role` is `"manager"` (not `"employee"`)
- Verify employee is not a `super_admin` (managers can't manage super admins)

---

## Best Practices

1. **Always use Firebase as source of truth** for authentication
2. **Keep AsyncStorage synced** with Firestore for offline access
3. **Use department field** to identify managers, not username
4. **Position is descriptive only** - don't use for access control
5. **Role determines permissions** - always check `role` field for access control
6. **Tickets auto-route** - ensure managers have correct department

---

## File References

### Data Structure Examples
- **User Data Structure**: `users.json`, `asyncStorage-users-example.json`

### Documentation
- **Modular Architecture**: `docs/MODULAR_ARCHITECTURE.md`
- **Firebase Setup**: `docs/FIREBASE_SETUP.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Migration Guide**: `docs/MIGRATION_GUIDE.md`

### Code Locations (New Modular Structure)
- **Auth Service**: `features/auth/services/authService.js`
- **Auth Feature**: `features/auth/index.js`
- **Employee Utils**: `utils/employees.js` (legacy, being migrated)
- **Ticket Utils**: `utils/ticketManagement.js` (legacy, being migrated)
- **Core Auth Context**: `core/contexts/AuthContext.js`
- **Core Navigation**: `core/navigation/AppNavigator.js`
- **Shared Constants**: `shared/constants/roles.js`, `shared/constants/workModes.js`

### Scripts
- **Migration Script**: `scripts/migrate-users-to-firebase.mjs`

### Legacy Code (Being Migrated)
- **Legacy Auth**: `utils/auth.js` (use `features/auth` instead)
- **Legacy Screens**: `screens/` (being migrated to feature modules)
- **Legacy Utils**: `utils/` (being migrated to feature modules)

---

---

## Firebase Quick Reference

### Configuration File
- **Location**: `core/config/firebase.js`
- **Exports**: `auth`, `db`, `app`

### Authentication Service
- **Location**: `features/auth/services/authService.js`
- **Functions**: `authenticateUser`, `createUser`, `updateUserRole`, `updateUserInfo`, `checkUsernameExists`

### Firestore Collections
- **`users`**: User profiles (document ID = Firebase Auth UID)

### Firebase Services
- **Authentication**: Email/password with AsyncStorage persistence
- **Firestore**: NoSQL database with React Native long polling
- **Error Handling**: Comprehensive error codes and messages

### Migration
- **Script**: `scripts/migrate-users-to-firebase.mjs`
- **Command**: `npm run migrate-users`
- **Source**: `users.txt` → Firebase Auth + Firestore

For detailed Firebase setup, see `docs/FIREBASE_SETUP.md`.

---

*Last Updated: 2025-01-02*

