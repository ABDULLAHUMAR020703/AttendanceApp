// Note: Face verification is temporarily disabled due to compatibility issues
// This is a placeholder implementation that will work without face verification
import { Asset } from 'expo-asset';

// Configuration
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const SIMILARITY_THRESHOLD = 0.6; // Adjust this threshold as needed (0-1, higher = more strict)

let modelsLoaded = false;
let referenceDescriptors = new Map(); // Store face descriptors for each user

/**
 * Initialize face-api.js models
 * This function loads the necessary models for face detection and recognition
 * Currently disabled due to compatibility issues with Expo SDK 54
 */
export const initializeFaceAPI = async () => {
  try {
    console.log('Face verification is temporarily disabled due to compatibility issues');
    console.log('The app will work without face verification for now');
    
    // Return false to indicate face verification is not available
    modelsLoaded = false;
    return false;
    
    // TODO: Re-enable face verification when compatibility issues are resolved
    // The original implementation is commented out below:
    
    /*
    if (modelsLoaded) {
      console.log('Face API models already loaded');
      return true;
    }

    console.log('Loading face-api.js models...');
    
    // Wait for TensorFlow.js to be ready
    await tf.ready();
    console.log('TensorFlow.js is ready');
    
    // Load the models with error handling for each
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('TinyFaceDetector loaded');
    } catch (detectorError) {
      console.error('Error loading TinyFaceDetector:', detectorError);
      throw detectorError;
    }
    
    try {
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('FaceLandmark68Net loaded');
    } catch (landmarkError) {
      console.error('Error loading FaceLandmark68Net:', landmarkError);
      throw landmarkError;
    }
    
    try {
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('FaceRecognitionNet loaded');
    } catch (recognitionError) {
      console.error('Error loading FaceRecognitionNet:', recognitionError);
      throw recognitionError;
    }
    
    modelsLoaded = true;
    console.log('All face-api.js models loaded successfully');
    return true;
    */
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    modelsLoaded = false;
    return false;
  }
};

/**
 * Load reference face descriptor for a user
 * This function loads and processes the reference image for face comparison
 * @param {string} username - Username to load reference for
 * @returns {Promise<boolean>} - Success status
 */
export const loadReferenceFace = async (username) => {
  try {
    if (!modelsLoaded) {
      const initialized = await initializeFaceAPI();
      if (!initialized) {
        throw new Error('Failed to initialize face API models');
      }
    }

    // Construct the path to the reference image
    // For Expo, we need to use require() for assets
    let referenceImage;
    try {
      // Try to load the reference image based on username
      if (username === 'testuser') {
        referenceImage = require('../assets/faces/testuser.jpg');
      } else {
        // For future extensibility - add more users here
        // referenceImage = require(`../assets/faces/${username}.jpg`);
        throw new Error(`No reference image found for user: ${username}`);
      }
    } catch (requireError) {
      throw new Error(`Reference image not found for ${username}. Please ensure assets/faces/${username}.jpg exists.`);
    }

    // Convert asset to URI
    const asset = Asset.fromModule(referenceImage);
    await asset.downloadAsync();
    
    if (!asset.localUri) {
      throw new Error('Failed to load reference image asset');
    }

    // Load and process the reference image
    const referenceImg = await faceapi.bufferToImage(asset.localUri);
    const referenceDescriptor = await faceapi
      .detectSingleFace(referenceImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!referenceDescriptor) {
      throw new Error('No face detected in reference image');
    }

    // Store the descriptor for this user
    referenceDescriptors.set(username, referenceDescriptor.descriptor);
    console.log(`Reference face loaded successfully for ${username}`);
    return true;
  } catch (error) {
    console.error(`Error loading reference face for ${username}:`, error);
    return false;
  }
};

/**
 * Verify if the captured face matches the reference face
 * Currently disabled due to compatibility issues with Expo SDK 54
 * @param {string} capturedImageUri - URI of the captured image
 * @param {string} username - Username to verify against
 * @returns {Promise<{success: boolean, confidence?: number, error?: string}>}
 */
export const verifyFace = async (capturedImageUri, username) => {
  try {
    console.log('Face verification is temporarily disabled');
    
    // Return a failure result since face verification is not available
    return {
      success: false,
      error: 'Face verification is temporarily disabled due to compatibility issues'
    };
    
    // TODO: Re-enable the original implementation when compatibility issues are resolved
    /*
    if (!modelsLoaded) {
      const initialized = await initializeFaceAPI();
      if (!initialized) {
        return {
          success: false,
          error: 'Face API models not loaded'
        };
      }
    }

    // Check if we have a reference descriptor for this user
    const referenceDescriptor = referenceDescriptors.get(username);
    if (!referenceDescriptor) {
      // Try to load the reference face if not already loaded
      const loaded = await loadReferenceFace(username);
      if (!loaded) {
        return {
          success: false,
          error: `No reference image available for user: ${username}`
        };
      }
    }

    // Load the captured image
    const capturedImg = await faceapi.bufferToImage(capturedImageUri);
    
    // Detect face in captured image
    const capturedDescriptor = await faceapi
      .detectSingleFace(capturedImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!capturedDescriptor) {
      return {
        success: false,
        error: 'No face detected in captured image. Please ensure your face is clearly visible.'
      };
    }

    // Calculate face distance (lower distance = more similar)
    const distance = faceapi.euclideanDistance(
      referenceDescriptor,
      capturedDescriptor.descriptor
    );

    // Convert distance to similarity score (0-1, higher = more similar)
    const similarity = 1 - distance;
    const confidence = Math.max(0, Math.min(1, similarity));

    console.log(`Face verification for ${username}: distance=${distance.toFixed(3)}, confidence=${confidence.toFixed(3)}`);

    // Check if similarity meets threshold
    const isMatch = confidence >= SIMILARITY_THRESHOLD;

    return {
      success: isMatch,
      confidence: confidence,
      error: isMatch ? null : `Face verification failed. Confidence: ${(confidence * 100).toFixed(1)}% (minimum required: ${(SIMILARITY_THRESHOLD * 100).toFixed(1)}%)`
    };
    */
  } catch (error) {
    console.error('Error during face verification:', error);
    return {
      success: false,
      error: `Face verification error: ${error.message}`
    };
  }
};

/**
 * Preload reference faces for better performance
 * Call this function when the app starts to load all reference images
 * @param {string[]} usernames - Array of usernames to preload
 */
export const preloadReferenceFaces = async (usernames) => {
  console.log('Preloading reference faces...');
  const results = [];
  
  for (const username of usernames) {
    try {
      const success = await loadReferenceFace(username);
      results.push({ username, success });
    } catch (error) {
      console.error(`Failed to preload reference for ${username}:`, error);
      results.push({ username, success: false, error: error.message });
    }
  }
  
  console.log('Reference faces preloading completed:', results);
  return results;
};

/**
 * Check if models are loaded
 * @returns {boolean}
 */
export const areModelsLoaded = () => {
  return modelsLoaded;
};

/**
 * Get loaded usernames
 * @returns {string[]}
 */
export const getLoadedUsernames = () => {
  return Array.from(referenceDescriptors.keys());
};

/**
 * Clear all loaded reference faces (useful for memory management)
 */
export const clearReferenceFaces = () => {
  referenceDescriptors.clear();
  console.log('Reference faces cleared');
};

/**
 * Get the similarity threshold
 * @returns {number}
 */
export const getSimilarityThreshold = () => {
  return SIMILARITY_THRESHOLD;
};

/**
 * Set a new similarity threshold
 * @param {number} threshold - New threshold (0-1)
 */
export const setSimilarityThreshold = (threshold) => {
  if (threshold >= 0 && threshold <= 1) {
    SIMILARITY_THRESHOLD = threshold;
    console.log(`Similarity threshold updated to: ${threshold}`);
  } else {
    console.warn('Similarity threshold must be between 0 and 1');
  }
};
