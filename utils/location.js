// Location utilities for reverse geocoding using OpenStreetMap Nominatim
import * as Location from 'expo-location';

/**
 * Get current location with coordinates
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number} | null>}
 */
export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

/**
 * Convert coordinates to human-readable address using OpenStreetMap Nominatim
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} Human-readable address or fallback to coordinates
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    console.log(`Getting address for coordinates: ${latitude}, ${longitude}`);
    
    // Call Nominatim reverse geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
      {
        headers: {
          'User-Agent': 'AttendanceApp/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.display_name) {
      console.log('Address found:', data.display_name);
      return data.display_name;
    } else {
      throw new Error('No address found in response');
    }
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    // Fallback to coordinates if address lookup fails
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get current location with both coordinates and address
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, address: string} | null>}
 */
export const getCurrentLocationWithAddress = async () => {
  try {
    // Get coordinates first
    const location = await getCurrentLocation();
    
    if (!location) {
      return null;
    }

    // Get address from coordinates
    const address = await getAddressFromCoordinates(location.latitude, location.longitude);
    
    return {
      ...location,
      address: address,
    };
  } catch (error) {
    console.error('Error getting location with address:', error);
    return null;
  }
};

/**
 * Format address for display (shorten if too long)
 * @param {string} address - Full address string
 * @param {number} maxLength - Maximum length for display
 * @returns {string} Formatted address
 */
export const formatAddressForDisplay = (address, maxLength = 50) => {
  if (!address) return 'Location not available';
  
  if (address.length <= maxLength) {
    return address;
  }
  
  // Try to find a good break point (comma, space, etc.)
  const breakPoints = [', ', ' ', '-'];
  let bestBreak = maxLength;
  
  for (const breakPoint of breakPoints) {
    const lastIndex = address.lastIndexOf(breakPoint, maxLength);
    if (lastIndex > maxLength * 0.7) { // At least 70% of max length
      bestBreak = lastIndex;
      break;
    }
  }
  
  return address.substring(0, bestBreak) + '...';
};

/**
 * Extract city and country from full address
 * @param {string} address - Full address string
 * @returns {Object} {city: string, country: string}
 */
export const extractCityAndCountry = (address) => {
  if (!address) {
    return { city: 'Unknown', country: 'Unknown' };
  }
  
  // Split by comma and get the last two parts (usually city, country)
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 2] || 'Unknown',
      country: parts[parts.length - 1] || 'Unknown',
    };
  }
  
  return { city: 'Unknown', country: 'Unknown' };
};
