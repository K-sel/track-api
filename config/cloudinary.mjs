/**
 * Configuration Cloudinary
 * Centralize la configuration pour l'accès à Cloudinary
 *
 * @module config/cloudinary
 */

const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Validate required environment variables
if (!cloudinaryConfig.cloudName) {
  throw new Error("CLOUDINARY_CLOUD_NAME is missing in environment variables");
}

export default cloudinaryConfig;
