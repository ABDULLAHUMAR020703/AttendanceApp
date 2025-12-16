// Signup Request Management
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SIGNUP_REQUESTS_KEY = '@signup_requests';
const SIGNUP_REQUESTS_FILE = 'signup_requests.json';

/**
 * Create a new signup request
 * @param {Object} userData - User signup data
 * @returns {Promise<{success: boolean, requestId?: string, error?: string}>}
 */
export const createSignupRequest = async (userData) => {
  try {
    const { username, password, name, email, role = 'employee' } = userData;
    
    // Validate required fields
    if (!username || !password || !name || !email) {
      return { success: false, error: 'All fields are required' };
    }
    
    // Check if username already exists
    const existingRequest = await getSignupRequestByUsername(username);
    if (existingRequest) {
      return { success: false, error: 'Username already exists or has a pending request' };
    }
    
    // Check if username exists in Firebase
    const { checkUsernameExists } = await import('./auth');
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      return { success: false, error: 'Username already exists' };
    }
    
    const request = {
      id: Date.now().toString(),
      username,
      password, // Store password temporarily (will be removed after approval)
      name,
      email,
      role,
      status: 'pending', // pending, approved, rejected
      requestedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null
    };
    
    // Save to AsyncStorage
    const requests = await getSignupRequests();
    requests.push(request);
    await AsyncStorage.setItem(SIGNUP_REQUESTS_KEY, JSON.stringify(requests));
    
    // Also save to file system as backup
    const filePath = `${FileSystem.documentDirectory}${SIGNUP_REQUESTS_FILE}`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(requests));
    
    console.log('✓ Signup request created:', request.id);
    return { success: true, requestId: request.id };
  } catch (error) {
    console.error('Error creating signup request:', error);
    return { success: false, error: error.message || 'Failed to create signup request' };
  }
};

/**
 * Get all signup requests
 * @param {string} status - Filter by status (pending, approved, rejected)
 * @returns {Promise<Array>}
 */
export const getSignupRequests = async (status = null) => {
  try {
    // Try AsyncStorage first
    const stored = await AsyncStorage.getItem(SIGNUP_REQUESTS_KEY);
    let requests = stored ? JSON.parse(stored) : [];
    
    // If empty, try file system
    if (requests.length === 0) {
      const filePath = `${FileSystem.documentDirectory}${SIGNUP_REQUESTS_FILE}`;
      const fileExists = await FileSystem.getInfoAsync(filePath);
      if (fileExists.exists) {
        const fileContent = await FileSystem.readAsStringAsync(filePath);
        requests = JSON.parse(fileContent);
      }
    }
    
    // Filter by status if provided
    if (status) {
      requests = requests.filter(req => req.status === status);
    }
    
    // Sort by requested date (newest first)
    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    
    return requests;
  } catch (error) {
    console.error('Error getting signup requests:', error);
    return [];
  }
};

/**
 * Get signup request by username
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
export const getSignupRequestByUsername = async (username) => {
  try {
    const requests = await getSignupRequests();
    return requests.find(req => req.username === username) || null;
  } catch (error) {
    console.error('Error getting signup request:', error);
    return null;
  }
};

/**
 * Approve a signup request
 * @param {string} requestId - Request ID
 * @param {string} approvedBy - Username of approver
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const approveSignupRequest = async (requestId, approvedBy) => {
  try {
    const requests = await getSignupRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Signup request not found' };
    }
    
    if (request.status !== 'pending') {
      return { success: false, error: `Request is already ${request.status}` };
    }
    
    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    request.approvedBy = approvedBy;
    
    // Create user in Firebase
    const { addUserToFile } = await import('./auth');
    const addResult = await addUserToFile({
      username: request.username,
      password: request.password,
      email: request.email,
      name: request.name,
      role: request.role,
      department: request.department || '',
      position: request.position || '',
      workMode: request.workMode || 'in_office',
      hireDate: request.hireDate || new Date().toISOString().split('T')[0]
    });
    
    if (!addResult.success) {
      return { success: false, error: addResult.error || 'Failed to add user to system' };
    }
    
    // Remove password from request (security)
    delete request.password;
    
    // Save updated requests
    await AsyncStorage.setItem(SIGNUP_REQUESTS_KEY, JSON.stringify(requests));
    const filePath = `${FileSystem.documentDirectory}${SIGNUP_REQUESTS_FILE}`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(requests));
    
    console.log('✓ Signup request approved:', requestId);
    return { success: true };
  } catch (error) {
    console.error('Error approving signup request:', error);
    return { success: false, error: error.message || 'Failed to approve signup request' };
  }
};

/**
 * Reject a signup request
 * @param {string} requestId - Request ID
 * @param {string} rejectedBy - Username of rejector
 * @param {string} reason - Rejection reason
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rejectSignupRequest = async (requestId, rejectedBy, reason = '') => {
  try {
    const requests = await getSignupRequests();
    const request = requests.find(req => req.id === requestId);
    
    if (!request) {
      return { success: false, error: 'Signup request not found' };
    }
    
    if (request.status !== 'pending') {
      return { success: false, error: `Request is already ${request.status}` };
    }
    
    // Update request status
    request.status = 'rejected';
    request.approvedAt = new Date().toISOString();
    request.approvedBy = rejectedBy;
    request.rejectionReason = reason;
    
    // Remove password from request (security)
    delete request.password;
    
    // Save updated requests
    await AsyncStorage.setItem(SIGNUP_REQUESTS_KEY, JSON.stringify(requests));
    const filePath = `${FileSystem.documentDirectory}${SIGNUP_REQUESTS_FILE}`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(requests));
    
    console.log('✓ Signup request rejected:', requestId);
    return { success: true };
  } catch (error) {
    console.error('Error rejecting signup request:', error);
    return { success: false, error: error.message || 'Failed to reject signup request' };
  }
};

/**
 * Get pending signup requests count
 * @returns {Promise<number>}
 */
export const getPendingSignupCount = async () => {
  try {
    const pending = await getSignupRequests('pending');
    return pending.length;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return 0;
  }
};


