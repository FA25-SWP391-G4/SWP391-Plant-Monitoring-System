/**
 * Image utility functions for compression, validation, and processing
 */

/**
 * Compress an image file to reduce size while maintaining quality
 * @param {File} file - The image file to compress
 * @param {number} maxSizeMB - Maximum size in MB (default: 5)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @param {number} maxWidth - Maximum width in pixels (default: 1920)
 * @param {number} maxHeight - Maximum height in pixels (default: 1080)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, maxSizeMB = 5, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if compressed size is acceptable
            const compressedSizeMB = blob.size / (1024 * 1024);
            
            if (compressedSizeMB > maxSizeMB && quality > 0.1) {
              // Try with lower quality if still too large
              const newQuality = Math.max(0.1, quality - 0.1);
              compressImage(file, maxSizeMB, newQuality, maxWidth, maxHeight)
                .then(resolve)
                .catch(reject);
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file type and size
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum allowed size in MB
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateImageFile = (file, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    errors.push(`File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileSize: fileSizeMB
  };
};

/**
 * Extract image metadata and basic quality metrics
 * @param {File} file - The image file
 * @returns {Promise<Object>} - Image metadata
 */
export const getImageMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const metadata = {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        megapixels: (img.width * img.height) / 1000000,
        fileSize: file.size,
        fileSizeMB: file.size / (1024 * 1024),
        type: file.type,
        name: file.name,
        lastModified: file.lastModified
      };
      
      // Basic quality assessment
      const minDimension = Math.min(img.width, img.height);
      let qualityScore = 1.0;
      
      if (minDimension < 300) {
        qualityScore = 0.3; // Very low quality
      } else if (minDimension < 600) {
        qualityScore = 0.6; // Low quality
      } else if (minDimension < 1200) {
        qualityScore = 0.8; // Good quality
      }
      
      metadata.quality = {
        score: qualityScore,
        assessment: qualityScore >= 0.8 ? 'good' : qualityScore >= 0.6 ? 'fair' : 'poor',
        recommendations: qualityScore < 0.6 ? [
          'Try using a higher resolution image',
          'Ensure good lighting when taking the photo',
          'Hold the camera steady to avoid blur'
        ] : []
      };
      
      resolve(metadata);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for metadata extraction'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Create a thumbnail from an image file
 * @param {File} file - The image file
 * @param {number} size - Thumbnail size in pixels (default: 150)
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const createThumbnail = (file, size = 150) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate square crop dimensions
      const minDimension = Math.min(img.width, img.height);
      const cropX = (img.width - minDimension) / 2;
      const cropY = (img.height - minDimension) / 2;
      
      canvas.width = size;
      canvas.height = size;
      
      // Draw cropped and resized image
      ctx.drawImage(
        img,
        cropX, cropY, minDimension, minDimension,
        0, 0, size, size
      );
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to create thumbnail'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if the browser supports required image processing features
 * @returns {Object} - Support status for various features
 */
export const checkBrowserSupport = () => {
  return {
    fileReader: typeof FileReader !== 'undefined',
    canvas: typeof HTMLCanvasElement !== 'undefined',
    blob: typeof Blob !== 'undefined',
    dragDrop: 'draggable' in document.createElement('div'),
    webp: (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })()
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert file to base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.readAsDataURL(file);
  });
};

export default {
  compressImage,
  validateImageFile,
  getImageMetadata,
  createThumbnail,
  checkBrowserSupport,
  formatFileSize,
  fileToBase64
};