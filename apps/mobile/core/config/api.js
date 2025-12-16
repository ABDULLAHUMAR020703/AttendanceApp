// API Gateway Configuration
// This can be overridden via environment variables or app config

// Default API Gateway URL
// For development: use 'http://localhost:3000' (if using emulator) or 'http://10.0.2.2:3000' (Android emulator)
// For production: update with actual production URL
// Note: For physical devices, use your computer's IP address (e.g., 'http://192.168.1.100:3000')
export const API_GATEWAY_URL = 'http://localhost:3000';

// API Gateway timeout in milliseconds
export const API_TIMEOUT = 10000; // 10 seconds

