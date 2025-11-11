/**
 * SOCIAL FEATURES CONTROLLER TESTS
 * ==================================
 * 
 * Comprehensive unit tests for social features controller
 * Covers community sharing, plant discussions, and expert advice
 */

const socialController = require('../../../controllers/socialController');
const User = require('../../../models/User');
const Plant = require('../../../models/Plant');
const SocialPost = require('../../../models/SocialPost');
const SocialComment = require('../../../models/SocialComment');
const ExpertAdvice = require('../../../models/ExpertAdvice');
const EmailService = require('../../../services/emailService');
const NotificationService = require('../../../services/NotificationService');
const ImageService = require('../../../services/ImageService');
const ModerationService = require('../../../services/ModerationService');

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('../../../models/Plant');
jest.mock('../../../models/SocialPost');
jest.mock('../../../models/SocialComment');
jest.mock('../../../models/ExpertAdvice');
jest.mock('../../../services/EmailService');
jest.mock('../../../services/NotificationService');
jest.mock('../../../services/ImageService');
jest.mock('../../../services/ModerationService');

describe('Social Features Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            file: null,
            files: [],
            user: {
                id: 'test-user-123',
                username: 'testuser',
                email: 'test@example.com',
                subscription_type: 'Basic'
            }
        };
        
        mockRes = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        
        mockNext = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    // UC15: Community Plant Sharing
    describe('Community Plant Sharing', () => {
        describe('POST /api/social/posts', () => {
            it('should create a new plant sharing post successfully', async () => {
                mockReq.body = {
                    title: 'My Beautiful Rose Garden',
                    content: 'Look at how my roses have grown!',
                    plantId: 'plant-123',
                    tags: ['roses', 'garden', 'blooming']
                };
                mockReq.file = {
                    filename: 'plant-image.jpg',
                    path: '/uploads/plant-image.jpg'
                };

                Plant.findById.mockResolvedValue({
                    id: 'plant-123',
                    name: 'Red Rose',
                    user_id: 'test-user-123'
                });

                ImageService.processImage.mockResolvedValue({
                    originalUrl: '/uploads/plant-image.jpg',
                    thumbnailUrl: '/uploads/thumbs/plant-image.jpg'
                });

                SocialPost.create.mockResolvedValue({
                    id: 'post-123',
                    user_id: 'test-user-123',
                    plant_id: 'plant-123',
                    title: 'My Beautiful Rose Garden',
                    content: 'Look at how my roses have grown!',
                    image_url: '/uploads/plant-image.jpg',
                    tags: ['roses', 'garden', 'blooming'],
                    created_at: new Date()
                });

                NotificationService.notifyFollowers.mockResolvedValue();

                await socialController.createPost(mockReq, mockRes);

                expect(Plant.findById).toHaveBeenCalledWith('plant-123');
                expect(ImageService.processImage).toHaveBeenCalledWith(mockReq.file);
                expect(SocialPost.create).toHaveBeenCalledWith({
                    user_id: 'test-user-123',
                    plant_id: 'plant-123',
                    title: 'My Beautiful Rose Garden',
                    content: 'Look at how my roses have grown!',
                    image_url: '/uploads/plant-image.jpg',
                    tags: ['roses', 'garden', 'blooming']
                });
                expect(NotificationService.notifyFollowers).toHaveBeenCalledWith('test-user-123', 'post-123');
                expect(mockRes.status).toHaveBeenCalledWith(201);
                expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                    message: 'Post created successfully',
                    post: expect.any(Object)
                }));
            });

            it('should handle post creation without image', async () => {
                mockReq.body = {
                    title: 'Plant Care Tips',
                    content: 'Here are some tips for caring for succulents',
                    tags: ['succulents', 'tips']
                };

                SocialPost.create.mockResolvedValue({
                    id: 'post-123',
                    user_id: 'test-user-123',
                    title: 'Plant Care Tips',
                    content: 'Here are some tips for caring for succulents',
                    tags: ['succulents', 'tips']
                });

                await socialController.createPost(mockReq, mockRes);

                expect(SocialPost.create).toHaveBeenCalledWith({
                    user_id: 'test-user-123',
                    title: 'Plant Care Tips',
                    content: 'Here are some tips for caring for succulents',
                    tags: ['succulents', 'tips']
                });
                expect(mockRes.status).toHaveBeenCalledWith(201);
            });

            it('should validate required fields', async () => {
                mockReq.body = {
                    content: 'Missing title'
                };

                await socialController.createPost(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Title and content are required'
                });
            });

            it('should validate plant ownership', async () => {
                mockReq.body = {
                    title: 'Test Post',
                    content: 'Test content',
                    plantId: 'plant-123'
                };

                Plant.findById.mockResolvedValue({
                    id: 'plant-123',
                    name: 'Test Plant',
                    user_id: 'other-user-456'
                });

                await socialController.createPost(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(403);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'You can only share your own plants'
                });
            });

            it('should handle content moderation', async () => {
                mockReq.body = {
                    title: 'Inappropriate Content',
                    content: 'This content violates community guidelines'
                };

                ModerationService.checkContent.mockResolvedValue({
                    isAppropriate: false,
                    reason: 'Inappropriate language'
                });

                await socialController.createPost(mockReq, mockRes);

                expect(ModerationService.checkContent).toHaveBeenCalledWith('This content violates community guidelines');
                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Content violates community guidelines: Inappropriate language'
                });
            });
        });

        describe('GET /api/social/posts', () => {
            it('should get community posts with pagination', async () => {
                mockReq.query = {
                    page: '1',
                    limit: '10',
                    sortBy: 'recent'
                };

                const mockPosts = [
                    {
                        id: 'post-1',
                        title: 'Beautiful Roses',
                        content: 'My roses are blooming',
                        user: { username: 'user1', avatar: 'avatar1.jpg' },
                        plant: { name: 'Red Rose', type: 'Rose' },
                        likes_count: 15,
                        comments_count: 3,
                        created_at: new Date()
                    },
                    {
                        id: 'post-2',
                        title: 'Succulent Tips',
                        content: 'Care tips for succulents',
                        user: { username: 'user2', avatar: 'avatar2.jpg' },
                        likes_count: 8,
                        comments_count: 1,
                        created_at: new Date()
                    }
                ];

                SocialPost.getWithUserAndPlant.mockResolvedValue({
                    posts: mockPosts,
                    totalCount: 25,
                    page: 1,
                    limit: 10,
                    totalPages: 3
                });

                await socialController.getPosts(mockReq, mockRes);

                expect(SocialPost.getWithUserAndPlant).toHaveBeenCalledWith({
                    page: 1,
                    limit: 10,
                    sortBy: 'recent',
                    userId: 'test-user-123'
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    posts: mockPosts,
                    pagination: {
                        totalCount: 25,
                        page: 1,
                        limit: 10,
                        totalPages: 3
                    }
                });
            });

            it('should filter posts by tags', async () => {
                mockReq.query = {
                    tags: 'roses,garden'
                };

                SocialPost.getWithUserAndPlant.mockResolvedValue({
                    posts: [],
                    totalCount: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0
                });

                await socialController.getPosts(mockReq, mockRes);

                expect(SocialPost.getWithUserAndPlant).toHaveBeenCalledWith({
                    page: 1,
                    limit: 10,
                    tags: ['roses', 'garden'],
                    userId: 'test-user-123'
                });
            });

            it('should search posts by content', async () => {
                mockReq.query = {
                    search: 'rose care'
                };

                await socialController.getPosts(mockReq, mockRes);

                expect(SocialPost.getWithUserAndPlant).toHaveBeenCalledWith({
                    page: 1,
                    limit: 10,
                    search: 'rose care',
                    userId: 'test-user-123'
                });
            });
        });

        describe('POST /api/social/posts/:postId/like', () => {
            it('should like a post successfully', async () => {
                mockReq.params.postId = 'post-123';

                SocialPost.findById.mockResolvedValue({
                    id: 'post-123',
                    user_id: 'other-user-456'
                });

                SocialPost.toggleLike.mockResolvedValue({
                    liked: true,
                    likeCount: 16
                });

                NotificationService.notifyPostLiked.mockResolvedValue();

                await socialController.toggleLike(mockReq, mockRes);

                expect(SocialPost.toggleLike).toHaveBeenCalledWith('post-123', 'test-user-123');
                expect(NotificationService.notifyPostLiked).toHaveBeenCalledWith('other-user-456', 'post-123', 'test-user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    liked: true,
                    likeCount: 16
                });
            });

            it('should unlike a post', async () => {
                mockReq.params.postId = 'post-123';

                SocialPost.findById.mockResolvedValue({
                    id: 'post-123',
                    user_id: 'other-user-456'
                });

                SocialPost.toggleLike.mockResolvedValue({
                    liked: false,
                    likeCount: 14
                });

                await socialController.toggleLike(mockReq, mockRes);

                expect(mockRes.json).toHaveBeenCalledWith({
                    liked: false,
                    likeCount: 14
                });
                expect(NotificationService.notifyPostLiked).not.toHaveBeenCalled();
            });

            it('should handle non-existent post', async () => {
                mockReq.params.postId = 'non-existent';

                SocialPost.findById.mockResolvedValue(null);

                await socialController.toggleLike(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Post not found'
                });
            });
        });
    });

    // UC16: Plant Discussion Forums
    describe('Plant Discussion Forums', () => {
        describe('POST /api/social/posts/:postId/comments', () => {
            it('should add comment to post', async () => {
                mockReq.params.postId = 'post-123';
                mockReq.body = {
                    content: 'Great tips! Thanks for sharing.'
                };

                SocialPost.findById.mockResolvedValue({
                    id: 'post-123',
                    user_id: 'post-author-456'
                });

                SocialComment.create.mockResolvedValue({
                    id: 'comment-123',
                    post_id: 'post-123',
                    user_id: 'test-user-123',
                    content: 'Great tips! Thanks for sharing.',
                    created_at: new Date()
                });

                NotificationService.notifyPostCommented.mockResolvedValue();

                await socialController.addComment(mockReq, mockRes);

                expect(SocialComment.create).toHaveBeenCalledWith({
                    post_id: 'post-123',
                    user_id: 'test-user-123',
                    content: 'Great tips! Thanks for sharing.'
                });
                expect(NotificationService.notifyPostCommented).toHaveBeenCalledWith('post-author-456', 'post-123', 'test-user-123');
                expect(mockRes.status).toHaveBeenCalledWith(201);
            });

            it('should validate comment content', async () => {
                mockReq.params.postId = 'post-123';
                mockReq.body = { content: '' };

                await socialController.addComment(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Comment content is required'
                });
            });

            it('should handle replies to comments', async () => {
                mockReq.params.postId = 'post-123';
                mockReq.body = {
                    content: 'I agree with your comment!',
                    parentCommentId: 'comment-456'
                };

                SocialPost.findById.mockResolvedValue({
                    id: 'post-123',
                    user_id: 'post-author-456'
                });

                SocialComment.findById.mockResolvedValue({
                    id: 'comment-456',
                    user_id: 'commenter-789'
                });

                SocialComment.create.mockResolvedValue({
                    id: 'reply-123',
                    parent_comment_id: 'comment-456'
                });

                await socialController.addComment(mockReq, mockRes);

                expect(SocialComment.create).toHaveBeenCalledWith({
                    post_id: 'post-123',
                    user_id: 'test-user-123',
                    content: 'I agree with your comment!',
                    parent_comment_id: 'comment-456'
                });
            });
        });

        describe('GET /api/social/posts/:postId/comments', () => {
            it('should get comments with nested replies', async () => {
                mockReq.params.postId = 'post-123';

                const mockComments = [
                    {
                        id: 'comment-1',
                        content: 'Great post!',
                        user: { username: 'user1' },
                        replies: [
                            {
                                id: 'reply-1',
                                content: 'Thank you!',
                                user: { username: 'postauthor' }
                            }
                        ]
                    },
                    {
                        id: 'comment-2',
                        content: 'Very helpful tips',
                        user: { username: 'user2' },
                        replies: []
                    }
                ];

                SocialComment.getForPost.mockResolvedValue(mockComments);

                await socialController.getComments(mockReq, mockRes);

                expect(SocialComment.getForPost).toHaveBeenCalledWith('post-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    comments: mockComments
                });
            });
        });

        describe('POST /api/social/comments/:commentId/like', () => {
            it('should like a comment', async () => {
                mockReq.params.commentId = 'comment-123';

                SocialComment.findById.mockResolvedValue({
                    id: 'comment-123',
                    user_id: 'other-user-456'
                });

                SocialComment.toggleLike.mockResolvedValue({
                    liked: true,
                    likeCount: 5
                });

                await socialController.toggleCommentLike(mockReq, mockRes);

                expect(SocialComment.toggleLike).toHaveBeenCalledWith('comment-123', 'test-user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    liked: true,
                    likeCount: 5
                });
            });
        });
    });

    // UC17: Expert Plant Advice
    describe('Expert Plant Advice', () => {
        describe('POST /api/social/expert-advice/request', () => {
            it('should create expert advice request', async () => {
                mockReq.body = {
                    title: 'Help with dying plant',
                    description: 'My plant leaves are turning yellow',
                    plantId: 'plant-123',
                    urgency: 'high',
                    category: 'disease'
                };
                mockReq.files = [
                    { filename: 'plant1.jpg', path: '/uploads/plant1.jpg' },
                    { filename: 'plant2.jpg', path: '/uploads/plant2.jpg' }
                ];

                Plant.findById.mockResolvedValue({
                    id: 'plant-123',
                    name: 'Fiddle Leaf Fig',
                    user_id: 'test-user-123'
                });

                ImageService.processImages.mockResolvedValue([
                    '/uploads/plant1.jpg',
                    '/uploads/plant2.jpg'
                ]);

                ExpertAdvice.createRequest.mockResolvedValue({
                    id: 'advice-123',
                    user_id: 'test-user-123',
                    title: 'Help with dying plant',
                    status: 'pending'
                });

                NotificationService.notifyExperts.mockResolvedValue();

                await socialController.requestExpertAdvice(mockReq, mockRes);

                expect(ExpertAdvice.createRequest).toHaveBeenCalledWith({
                    user_id: 'test-user-123',
                    plant_id: 'plant-123',
                    title: 'Help with dying plant',
                    description: 'My plant leaves are turning yellow',
                    urgency: 'high',
                    category: 'disease',
                    images: ['/uploads/plant1.jpg', '/uploads/plant2.jpg']
                });
                expect(NotificationService.notifyExperts).toHaveBeenCalledWith('advice-123', 'disease');
                expect(mockRes.status).toHaveBeenCalledWith(201);
            });

            it('should validate expert advice request', async () => {
                mockReq.body = {
                    description: 'Missing title'
                };

                await socialController.requestExpertAdvice(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Title and description are required'
                });
            });

            it('should limit advice requests for free users', async () => {
                mockReq.user.subscription_type = 'Free';

                ExpertAdvice.getUserRequestCount.mockResolvedValue(3);

                await socialController.requestExpertAdvice(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(403);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Free users are limited to 3 expert advice requests per month'
                });
            });
        });

        describe('GET /api/social/expert-advice', () => {
            it('should get expert advice requests for experts', async () => {
                mockReq.user.role = 'expert';
                mockReq.query = {
                    category: 'disease',
                    status: 'pending'
                };

                const mockRequests = [
                    {
                        id: 'advice-1',
                        title: 'Plant disease help',
                        category: 'disease',
                        urgency: 'high',
                        user: { username: 'plantlover' },
                        plant: { name: 'Fiddle Leaf Fig' }
                    }
                ];

                ExpertAdvice.getRequests.mockResolvedValue(mockRequests);

                await socialController.getExpertAdviceRequests(mockReq, mockRes);

                expect(ExpertAdvice.getRequests).toHaveBeenCalledWith({
                    category: 'disease',
                    status: 'pending',
                    expertId: 'test-user-123'
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    requests: mockRequests
                });
            });

            it('should get user own advice requests', async () => {
                const mockRequests = [
                    {
                        id: 'advice-1',
                        title: 'Help with my plant',
                        status: 'answered',
                        expert: { username: 'plantexpert' }
                    }
                ];

                ExpertAdvice.getUserRequests.mockResolvedValue(mockRequests);

                await socialController.getUserAdviceRequests(mockReq, mockRes);

                expect(ExpertAdvice.getUserRequests).toHaveBeenCalledWith('test-user-123');
                expect(mockRes.json).toHaveBeenCalledWith({
                    requests: mockRequests
                });
            });
        });

        describe('POST /api/social/expert-advice/:requestId/respond', () => {
            it('should allow expert to respond to advice request', async () => {
                mockReq.user.role = 'expert';
                mockReq.params.requestId = 'advice-123';
                mockReq.body = {
                    response: 'Your plant appears to have a fungal infection. Try treating with fungicide.',
                    recommendations: [
                        'Apply fungicide spray',
                        'Improve air circulation',
                        'Reduce watering frequency'
                    ]
                };

                ExpertAdvice.findById.mockResolvedValue({
                    id: 'advice-123',
                    user_id: 'requester-456',
                    status: 'pending'
                });

                ExpertAdvice.addResponse.mockResolvedValue({
                    id: 'response-123',
                    advice_request_id: 'advice-123',
                    expert_id: 'test-user-123'
                });

                NotificationService.notifyAdviceReceived.mockResolvedValue();
                EmailService.sendExpertAdviceEmail.mockResolvedValue();

                await socialController.respondToAdviceRequest(mockReq, mockRes);

                expect(ExpertAdvice.addResponse).toHaveBeenCalledWith({
                    advice_request_id: 'advice-123',
                    expert_id: 'test-user-123',
                    response: 'Your plant appears to have a fungal infection. Try treating with fungicide.',
                    recommendations: [
                        'Apply fungicide spray',
                        'Improve air circulation',
                        'Reduce watering frequency'
                    ]
                });
                expect(NotificationService.notifyAdviceReceived).toHaveBeenCalledWith('requester-456', 'advice-123');
                expect(mockRes.status).toHaveBeenCalledWith(201);
            });

            it('should prevent non-experts from responding', async () => {
                mockReq.user.role = 'user';
                mockReq.params.requestId = 'advice-123';

                await socialController.respondToAdviceRequest(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(403);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Only experts can respond to advice requests'
                });
            });
        });

        describe('POST /api/social/expert-advice/:responseId/rate', () => {
            it('should allow user to rate expert response', async () => {
                mockReq.params.responseId = 'response-123';
                mockReq.body = {
                    rating: 5,
                    feedback: 'Very helpful advice, my plant is recovering!'
                };

                ExpertAdvice.findResponseById.mockResolvedValue({
                    id: 'response-123',
                    advice_request: {
                        user_id: 'test-user-123'
                    },
                    expert_id: 'expert-456'
                });

                ExpertAdvice.rateResponse.mockResolvedValue({
                    rating: 5,
                    feedback: 'Very helpful advice, my plant is recovering!'
                });

                await socialController.rateExpertResponse(mockReq, mockRes);

                expect(ExpertAdvice.rateResponse).toHaveBeenCalledWith('response-123', {
                    rating: 5,
                    feedback: 'Very helpful advice, my plant is recovering!'
                });
                expect(mockRes.json).toHaveBeenCalledWith({
                    message: 'Response rated successfully'
                });
            });

            it('should validate rating range', async () => {
                mockReq.params.responseId = 'response-123';
                mockReq.body = {
                    rating: 6
                };

                await socialController.rateExpertResponse(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({
                    error: 'Rating must be between 1 and 5'
                });
            });
        });
    });

    // Error handling tests
    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            SocialPost.create.mockRejectedValue(new Error('Database connection failed'));

            mockReq.body = {
                title: 'Test Post',
                content: 'Test content'
            };

            await socialController.createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Failed to create post'
            });
        });

        it('should handle image processing errors', async () => {
            mockReq.body = {
                title: 'Test Post',
                content: 'Test content'
            };
            mockReq.file = {
                filename: 'corrupted-image.jpg'
            };

            ImageService.processImage.mockRejectedValue(new Error('Invalid image format'));

            await socialController.createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid image format'
            });
        });

        it('should handle service unavailability', async () => {
            mockReq.body = {
                content: 'Test content that needs moderation'
            };

            ModerationService.checkContent.mockRejectedValue(new Error('Moderation service unavailable'));

            // Should proceed without moderation if service is down
            SocialPost.create.mockResolvedValue({
                id: 'post-123',
                content: 'Test content that needs moderation'
            });

            await socialController.createPost(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });
});