const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { uploadImage, deleteImage, getImageInfo } = require('./uploadController');
const SystemLog = require('../models/SystemLog');

// Mock dependencies
jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        unlink: jest.fn(),
        stat: jest.fn()
    }
}));

jest.mock('sharp');
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-123')
}));

jest.mock('../models/SystemLog', () => ({
    info: jest.fn(),
    error: jest.fn()
}));


describe('Upload Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            file: null,
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('uploadImage', () => {
        const mockBuffer = Buffer.from('fake-image-data');
        const mockProcessedBuffer = Buffer.from('processed-image-data');

        beforeEach(() => {
            const mockSharp = {
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(mockProcessedBuffer)
            };
            sharp.mockReturnValue(mockSharp);
        });

        it('should return error when no file is provided', async () => {
            await uploadImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'No image file provided'
            });
        });

        it('should successfully upload and process plant image', async () => {
            req.file = {
                buffer: mockBuffer,
                originalname: 'test-plant.jpg'
            };
            req.body.type = 'plant';

            await uploadImage(req, res);

            expect(sharp).toHaveBeenCalledWith(mockBuffer);
            expect(fs.writeFile).toHaveBeenCalledWith(
                expect.stringContaining('plant_test-uuid-123.jpg'),
                mockProcessedBuffer
            );
            expect(SystemLog.info).toHaveBeenCalledWith(
                'UploadController',
                'uploadImage',
                expect.stringContaining('Image uploaded successfully')
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Image uploaded successfully',
                data: {
                    url: '/uploads/plant_test-uuid-123.jpg',
                    filename: 'plant_test-uuid-123.jpg',
                    original_name: 'test-plant.jpg',
                    size: mockProcessedBuffer.length,
                    type: 'plant'
                }
            });
        });

        it('should successfully upload and process profile image with correct dimensions', async () => {
            req.file = {
                buffer: mockBuffer,
                originalname: 'profile.jpg'
            };
            req.body.type = 'profile';

            const mockSharp = {
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(mockProcessedBuffer)
            };
            sharp.mockReturnValue(mockSharp);

            await uploadImage(req, res);

            expect(mockSharp.resize).toHaveBeenCalledWith(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
            });
            expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 90 });
        });

        it('should use default options for general image type', async () => {
            req.file = {
                buffer: mockBuffer,
                originalname: 'general.jpg'
            };
            req.body.type = 'general';

            const mockSharp = {
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockResolvedValue(mockProcessedBuffer)
            };
            sharp.mockReturnValue(mockSharp);

            await uploadImage(req, res);

            expect(mockSharp.resize).toHaveBeenCalledWith(800, 600, {
                fit: 'inside',
                withoutEnlargement: true
            });
            expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 85 });
        });

        it('should handle file size limit error', async () => {
            req.file = {
                buffer: mockBuffer,
                originalname: 'large-file.jpg'
            };

            const error = new Error('File too large');
            error.code = 'LIMIT_FILE_SIZE';
            fs.writeFile.mockRejectedValue(error);

            await uploadImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'File size too large. Maximum size is 5MB.'
            });
        });

        it('should handle image processing error', async () => {
            req.file = {
                buffer: mockBuffer,
                originalname: 'corrupt.jpg'
            };

            sharp.mockReturnValue({
                resize: jest.fn().mockReturnThis(),
                jpeg: jest.fn().mockReturnThis(),
                toBuffer: jest.fn().mockRejectedValue(new Error('Invalid image'))
            });

            await uploadImage(req, res);

            expect(SystemLog.error).toHaveBeenCalledWith(
                'UploadController',
                'uploadImage',
                'Failed to process image'
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to upload image'
            });
        });
    });

    describe('deleteImage', () => {
        it('should successfully delete an existing image', async () => {
            req.params.filename = 'test-image.jpg';
            fs.access.mockResolvedValue();
            fs.unlink.mockResolvedValue();

            await deleteImage(req, res);

            expect(fs.access).toHaveBeenCalledWith(
                expect.stringContaining('test-image.jpg')
            );
            expect(fs.unlink).toHaveBeenCalledWith(
                expect.stringContaining('test-image.jpg')
            );
            expect(SystemLog.info).toHaveBeenCalledWith(
                'UploadController',
                'deleteImage',
                'Image deleted successfully: test-image.jpg'
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Image deleted successfully'
            });
        });

        it('should return error for invalid filename with path traversal', async () => {
            req.params.filename = '../../../etc/passwd';

            await deleteImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid filename'
            });
        });

        it('should return error for filename with forward slashes', async () => {
            req.params.filename = 'folder/image.jpg';

            await deleteImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid filename'
            });
        });

        it('should return error when file not found', async () => {
            req.params.filename = 'nonexistent.jpg';
            fs.access.mockRejectedValue(new Error('File not found'));

            await deleteImage(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'File not found'
            });
        });

        it('should handle unexpected errors', async () => {
            req.params.filename = 'test.jpg';
            fs.access.mockRejectedValue(new Error('Permission denied'));

            await deleteImage(req, res);

            expect(SystemLog.error).toHaveBeenCalledWith(
                'UploadController',
                'deleteImage',
                'Permission denied'
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to delete image'
            });
        });
    });

    describe('getImageInfo', () => {
        it('should return file information for existing image', async () => {
            req.params.filename = 'test-image.jpg';
            const mockStats = {
                size: 1024,
                birthtime: '2023-01-01T00:00:00.000Z',
                mtime: '2023-01-02T00:00:00.000Z'
            };
            fs.stat.mockResolvedValue(mockStats);

            await getImageInfo(req, res);

            expect(fs.stat).toHaveBeenCalledWith(
                expect.stringContaining('test-image.jpg')
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    filename: 'test-image.jpg',
                    size: 1024,
                    created: '2023-01-01T00:00:00.000Z',
                    modified: '2023-01-02T00:00:00.000Z',
                    url: '/uploads/test-image.jpg'
                }
            });
        });

        it('should return error for invalid filename', async () => {
            req.params.filename = '../malicious.jpg';

            await getImageInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Invalid filename'
            });
        });

        it('should return error when file not found', async () => {
            req.params.filename = 'missing.jpg';
            fs.stat.mockRejectedValue(new Error('ENOENT'));

            await getImageInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'File not found'
            });
        });

        it('should handle unexpected errors', async () => {
            req.params.filename = 'test.jpg';
            fs.stat.mockRejectedValue(new Error('Permission denied'));

            await getImageInfo(req, res);

            expect(SystemLog.error).toHaveBeenCalledWith(
                'UploadController',
                'getImageInfo',
                'Permission denied'
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to get image information'
            });
        });
    });
});