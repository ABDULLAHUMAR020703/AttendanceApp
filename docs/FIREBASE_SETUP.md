# Firebase Setup Guide

This guide will help you set up Firebase for the Attendance App. The app now uses Firebase Authentication and Firestore for all user management, replacing the local file-based system.

## Prerequisites

- A Firebase account (create one at [firebase.google.com](https://firebase.google.com))
- Node.js and npm installed
- The Attendance App project set up

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "Attendance App")
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

## Step 2: Enable Firebase Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Go to the **Sign-in method** tab
4. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Set Up Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Start in production mode** (for production)
4. Select a location for your database (choose the closest to your users)
5. Click **Enable**

### Set Up Firestore Security Rules (Important!)

**You must configure Firestore security rules to fix "Missing or insufficient permissions" errors.**

Go to **Firestore Database** > **Rules** tab and use one of the following:

**For Development (Permissive - Use only during development):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection (contains all user/employee data)
    match /users/{userId} {
      // Allow authenticated users to read
      allow read: if request.auth != null;
      
      // Allow queries for username lookup (needed for username-based login before authentication)
      allow list: if true;
      
      // Allow authenticated users to write
      allow write: if request.auth != null;
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**For Production (Recommended - Role-based access with username login support):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection (contains all user/employee data)
    match /users/{userId} {
      // Allow authenticated users to read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow super_admin to read all
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
      
      // Allow queries for username lookup (needed for username-based login before authentication)
      // This allows the app to query users by username to find their email
      allow list: if true;
      
      // Only super_admin and managers can write
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin' ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager');
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Important Notes:**
- The `allow list: if true;` rule is required to support username-based login, as the app needs to query Firestore by username before the user is authenticated
- For production, consider restricting the list rule to only allow queries on the `username` field for better security
- After updating rules, click **Publish** to apply them

**Note**: The app only uses the `users` collection in Firestore. Signup requests and other data are stored locally in AsyncStorage, not in Firestore.

**Important**: After updating the rules, click **Publish** to apply them.

## Step 4: Get Your Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click the **Web** icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "Attendance App")
6. Copy the Firebase configuration object

## Step 5: Configure Firebase in the App

1. Open `core/config/firebase.js` in your project
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};
```

3. Save the file

## Step 6: Install Firebase Dependencies

Firebase is already included in `package.json`, but if you need to reinstall:

```bash
npm install firebase
```

## Step 7: Test the Integration

1. Start your app:
   ```bash
   npm start
   ```

2. The app will automatically:
   - Use Firebase Authentication for login
   - Store user data in Firestore
   - Handle authentication state changes

3. Check the console logs for:
   - "Firebase initialized successfully"
   - Any error messages

## How It Works

### Authentication Flow

1. **User Login**:
   - User enters username or email and password
   - App authenticates with Firebase Authentication
   - If username is used, app looks up email in Firestore
   - Firebase handles password verification

2. **User Signup**:
   - User submits signup request
   - Admin approves request
   - User account is created in Firebase Authentication
   - User document is created in Firestore with role, username, etc.

3. **Session Management**:
   - Firebase automatically handles session persistence
   - Uses AsyncStorage internally for auth state
   - `onAuthStateChanged` listener updates app state

### Data Storage

- **Firebase Authentication**: Stores email/password credentials
- **Firestore `users` collection**: Stores complete user data:
  - `uid` - Firebase Auth UID
  - `username` - Login username
  - `email` - Email address
  - `name` - Full name
  - `role` - employee, manager, or super_admin
  - `department` - Department name
  - `position` - Job title/position
  - `workMode` - in_office, semi_remote, or fully_remote
  - `hireDate` - Date hired (YYYY-MM-DD)
  - `isActive` - Active status
  - `createdAt` - Creation timestamp
  - `updatedAt` - Last update timestamp
- **AsyncStorage**: Only used for app settings and attendance records (not users)

### Migration from File-Based System

The app has been migrated from local file storage to Firebase:
- ❌ No more `users.txt` file operations
- ❌ No more FileSystem for user storage
- ✅ All users stored in Firebase
- ✅ Automatic sync across devices
- ✅ Built-in offline support

## Creating Initial Users

Since the app no longer uses `users.txt`, you need to create initial users in Firebase:

### Option 1: Through the App

1. Use the "Create User" feature in the admin dashboard
2. Or approve signup requests

### Option 2: Through Firebase Console

1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter email and password
4. Then go to **Firestore Database** > **users** collection
5. Create a document with the user's UID and add:
   ```json
   {
     "username": "testuser",
     "email": "testuser@example.com",
     "name": "Test User",
     "role": "employee",
     "department": "Engineering",
     "position": "AI Engineer",
     "workMode": "in_office",
     "hireDate": "2023-01-15",
     "isActive": true,
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

### Option 3: Migrate from users.txt (Recommended for Initial Setup)

Use the migration script to import all users from `users.txt`:

1. Run the migration script from the project root:
   ```bash
   node scripts/migrate-users-to-firebase.mjs
   ```

2. The script will:
   - Read `users.txt` from the project root
   - Create Firebase Authentication accounts for all users
   - Create Firestore documents with complete user data
   - Include all fields: username, email, name, role, department, position, workMode, hireDate
   - Show progress and results in the console

**Note**: Make sure you have:
- Firebase Admin SDK configured (if using server-side migration)
- Or use the client-side migration through the app's admin dashboard

## Troubleshooting

### "Missing or insufficient permissions" Error

This error typically occurs when:
1. **Username Login**: The app tries to query Firestore by username before authentication. The security rules must allow queries (`allow list`) for username lookup.
2. **After Authentication**: The app tries to read user data from Firestore, but rules don't allow authenticated users to read their own document.

**Solutions:**
- Ensure your security rules include `allow list: if true;` to allow username queries
- Ensure authenticated users can read their own document: `allow read: if request.auth != null && request.auth.uid == userId;`
- Make sure rules are published after updating
- Verify the user is authenticated (check Firebase Auth state)

### "User not found" Error

This can occur in two scenarios:

1. **Username Login**: User doesn't exist in Firestore
   - Check if user document exists in Firestore `users` collection
   - Verify the `username` field matches what the user entered
   - Run the migration script if Firestore is empty

2. **Email Login**: User exists in Firebase Auth but not in Firestore
   - Check if user exists in Firebase Authentication
   - Verify user document exists in Firestore `users` collection (document ID = Firebase Auth UID)
   - Create the Firestore document if it's missing

**Important**: Users must exist in BOTH Firebase Authentication AND Firestore. If Firestore is empty, login will fail even if users exist in Firebase Auth.

### Authentication Not Working

- Verify Firebase configuration in `core/config/firebase.js`
- Check Firebase project settings
- Ensure Email/Password authentication is enabled
- Check console for error messages

## Security Best Practices

1. **Use Production Security Rules**: Don't use test mode in production
2. **Enable Email Verification**: Consider enabling email verification in Firebase
3. **Strong Passwords**: Enforce strong password requirements
4. **Role-Based Access**: Use custom claims for role-based access control
5. **Regular Backups**: Set up Firestore backups

## Support

For more information, visit:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

