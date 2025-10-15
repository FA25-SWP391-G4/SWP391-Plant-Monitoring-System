const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

/**
 * Image Storage Service
 * Handles secure image storage with encryption and metadata management
 */
class ImageStorageService {
  constructor() {
    this.storageDir = path.join(__dirname, '..', 'uploads', 'disease-images');
    this.encryptionKey = process.env.IMAGE_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.algorithm = 'aes-256-gcm';
    
    // Ensure storage directory exists
    this.initializeStorage();
  }

  /**
   * Initialize storage directory
   */
  async initializeStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log('Image storage directory initialized:', this.storageDir);
    } catch (error) {
      console.error('Error initializing storage directory:', error);
    }
  }

  /**
   * Generate encryption key if not provided
   */
  generateEncryptionKey() {
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('Generated new encryption key. Set IMAGE_ENCRYPTION_KEY in environment for production.');
    return key;
  }

  /**
   * Encrypt image buffer
   */
  encryptImage(imageBuffer) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('image-data'));
      
      const encrypted = Buffer.concat([
        cipher.update(imageBuffer),
        cipher.final()
      ]);
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv,
        authTag,
        algorithm: this.algorithm
      };
    } catch (error) {
      console.error('Error encrypting image:', error);
      throw new Error('Không thể mã hóa ảnh');
    }
  }

  /**
   * Decrypt image buffer
   */
  decryptImage(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('image-data'));
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting image:', error);
      throw new Error('Không thể giải mã ảnh');
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName, userId, plantId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName) || '.jpg';
    
    return `${userId || 'anonymous'}_${plantId || 'unknown'}_${timestamp}_${random}${ext}`;
  }

  /**
   * Store image securely
   */
  async storeImage(imageBuffer, metadata = {}) {
    try {
      const {
        originalName = 'image.jpg',
        userId = null,
        plantId = null,
        analysisId = null,
        mimeType = 'image/jpeg'
      } = metadata;

      // Generate filename
      const filename = this.generateFilename(originalName, userId, plantId);
      const filePath = path.join(this.storageDir, filename);

      // Create thumbnail
      const thumbnailBuffer = await this.createThumbnail(imageBuffer);
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(this.storageDir, thumbnailFilename);

      // Encrypt original image
      const encryptedData = this.encryptImage(imageBuffer);
      
      // Prepare storage data
      const storageData = {
        metadata: {
          originalName,
          userId,
          plantId,
          analysisId,
          mimeType,
          size: imageBuffer.length,
          uploadTimestamp: new Date().toISOString(),
          filename,
          thumbnailFilename
        },
        encryption: {
          algorithm: encryptedData.algorithm,
          iv: encryptedData.iv.toString('hex'),
          authTag: encryptedData.authTag.toString('hex')
        }
      };

      // Save encrypted image
      await fs.writeFile(filePath, encryptedData.encrypted);
      
      // Save thumbnail (unencrypted for quick preview)
      await fs.writeFile(thumbnailPath, thumbnailBuffer);
      
      // Save metadata
      const metadataPath = path.join(this.storageDir, `${filename}.meta.json`);
      await fs.writeFile(metadataPath, JSON.stringify(storageData, null, 2));

      return {
        success: true,
        filename,
        thumbnailFilename,
        filePath,
        thumbnailPath,
        metadata: storageData.metadata
      };

    } catch (error) {
      console.error('Error storing image:', error);
      throw new Error('Không thể lưu trữ ảnh');
    }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(imageBuffer, size = 200) {
    try {
      return await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw new Error('Không thể tạo thumbnail');
    }
  }

  /**
   * Retrieve image
   */
  async retrieveImage(filename, getThumbnail = false) {
    try {
      const targetFilename = getThumbnail ? `thumb_${filename}` : filename;
      const filePath = path.join(this.storageDir, targetFilename);
      const metadataPath = path.join(this.storageDir, `${filename}.meta.json`);

      // Check if files exist
      try {
        await fs.access(filePath);
        await fs.access(metadataPath);
      } catch (error) {
        throw new Error('Không tìm thấy ảnh');
      }

      // Load metadata
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const storageData = JSON.parse(metadataContent);

      if (getThumbnail) {
        // Return thumbnail (unencrypted)
        const thumbnailBuffer = await fs.readFile(filePath);
        return {
          buffer: thumbnailBuffer,
          metadata: storageData.metadata,
          mimeType: 'image/jpeg'
        };
      } else {
        // Return decrypted original image
        const encryptedBuffer = await fs.readFile(filePath);
        
        const encryptedData = {
          encrypted: encryptedBuffer,
          iv: Buffer.from(storageData.encryption.iv, 'hex'),
          authTag: Buffer.from(storageData.encryption.authTag, 'hex')
        };

        const decryptedBuffer = this.decryptImage(encryptedData);
        
        return {
          buffer: decryptedBuffer,
          metadata: storageData.metadata,
          mimeType: storageData.metadata.mimeType
        };
      }

    } catch (error) {
      console.error('Error retrieving image:', error);
      throw new Error('Không thể lấy ảnh');
    }
  }

  /**
   * Delete image and associated files
   */
  async deleteImage(filename) {
    try {
      const filePath = path.join(this.storageDir, filename);
      const thumbnailPath = path.join(this.storageDir, `thumb_${filename}`);
      const metadataPath = path.join(this.storageDir, `${filename}.meta.json`);

      // Delete files if they exist
      const deletePromises = [filePath, thumbnailPath, metadataPath].map(async (path) => {
        try {
          await fs.unlink(path);
        } catch (error) {
          // File might not exist, continue
          console.warn(`Could not delete ${path}:`, error.message);
        }
      });

      await Promise.all(deletePromises);

      return {
        success: true,
        message: 'Ảnh đã được xóa thành công'
      };

    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Không thể xóa ảnh');
    }
  }

  /**
   * List stored images with metadata
   */
  async listImages(filters = {}) {
    try {
      const { userId = null, plantId = null, limit = 50, offset = 0 } = filters;
      
      const files = await fs.readdir(this.storageDir);
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
      
      const images = [];
      
      for (const metaFile of metadataFiles) {
        try {
          const metadataPath = path.join(this.storageDir, metaFile);
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          const storageData = JSON.parse(metadataContent);
          
          // Apply filters
          if (userId && storageData.metadata.userId !== userId) continue;
          if (plantId && storageData.metadata.plantId !== plantId) continue;
          
          images.push({
            filename: storageData.metadata.filename,
            thumbnailFilename: storageData.metadata.thumbnailFilename,
            metadata: storageData.metadata
          });
        } catch (error) {
          console.warn(`Error reading metadata file ${metaFile}:`, error.message);
        }
      }
      
      // Sort by upload timestamp (newest first)
      images.sort((a, b) => 
        new Date(b.metadata.uploadTimestamp) - new Date(a.metadata.uploadTimestamp)
      );
      
      // Apply pagination
      const paginatedImages = images.slice(offset, offset + limit);
      
      return {
        images: paginatedImages,
        total: images.length,
        limit,
        offset
      };

    } catch (error) {
      console.error('Error listing images:', error);
      throw new Error('Không thể lấy danh sách ảnh');
    }
  }

  /**
   * Clean up old images (data retention policy)
   */
  async cleanupOldImages(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const files = await fs.readdir(this.storageDir);
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
      
      let deletedCount = 0;
      
      for (const metaFile of metadataFiles) {
        try {
          const metadataPath = path.join(this.storageDir, metaFile);
          const metadataContent = await fs.readFile(metadataPath, 'utf8');
          const storageData = JSON.parse(metadataContent);
          
          const uploadDate = new Date(storageData.metadata.uploadTimestamp);
          
          if (uploadDate < cutoffDate) {
            await this.deleteImage(storageData.metadata.filename);
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Error processing cleanup for ${metaFile}:`, error.message);
        }
      }
      
      return {
        success: true,
        deletedCount,
        message: `Đã xóa ${deletedCount} ảnh cũ`
      };

    } catch (error) {
      console.error('Error cleaning up old images:', error);
      throw new Error('Không thể dọn dẹp ảnh cũ');
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.storageDir);
      const imageFiles = files.filter(file => !file.endsWith('.meta.json') && !file.startsWith('thumb_'));
      const thumbnailFiles = files.filter(file => file.startsWith('thumb_'));
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
      
      let totalSize = 0;
      for (const file of files) {
        try {
          const filePath = path.join(this.storageDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch (error) {
          // File might have been deleted, continue
        }
      }
      
      return {
        totalImages: imageFiles.length,
        totalThumbnails: thumbnailFiles.length,
        totalMetadataFiles: metadataFiles.length,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        storageDirectory: this.storageDir
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error('Không thể lấy thống kê lưu trữ');
    }
  }
}

module.exports = new ImageStorageService();