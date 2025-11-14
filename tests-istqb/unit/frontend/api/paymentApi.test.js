import paymentApi from './paymentApi';
import axiosClient from './axiosClient';

// Mock axiosClient
jest.mock('./axiosClient', () => ({
    post: jest.fn(),
    get: jest.fn()
}));

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: ''
    },
    writable: true
});

describe('paymentApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
        window.location.href = '';
    });

    describe('createPaymentUrl', () => {
        const mockPaymentData = {
            amount: 100000,
            orderInfo: 'Premium subscription',
            planType: 'premium_upgrade'
        };

        const mockSuccessResponse = {
            data: {
                success: true,
                paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=10000000'
            }
        };

        it('should create payment URL successfully without bank code', async () => {
            axiosClient.post.mockResolvedValue(mockSuccessResponse);

            const result = await paymentApi.createPaymentUrl(mockPaymentData);

            expect(axiosClient.post).toHaveBeenCalledWith('/payment/create', {
                amount: 100000,
                orderInfo: 'Premium subscription',
                planType: 'premium_upgrade'
            });
            expect(window.location.href).toBe(mockSuccessResponse.data.paymentUrl);
            expect(result).toEqual(mockSuccessResponse.data);
        });

        it('should create payment URL successfully with valid bank code', async () => {
            axiosClient.post.mockResolvedValue(mockSuccessResponse);
            const dataWithBankCode = { ...mockPaymentData, bankCode: 'NCB' };

            const result = await paymentApi.createPaymentUrl(dataWithBankCode);

            expect(axiosClient.post).toHaveBeenCalledWith('/payment/create', {
                amount: 100000,
                orderInfo: 'Premium subscription',
                planType: 'premium_upgrade',
                bankCode: 'NCB'
            });
            expect(window.location.href).toBe(mockSuccessResponse.data.paymentUrl);
            expect(result).toEqual(mockSuccessResponse.data);
        });

        it('should exclude bank code when it is empty string', async () => {
            axiosClient.post.mockResolvedValue(mockSuccessResponse);
            const dataWithEmptyBankCode = { ...mockPaymentData, bankCode: '' };

            await paymentApi.createPaymentUrl(dataWithEmptyBankCode);

            expect(axiosClient.post).toHaveBeenCalledWith('/payment/create', {
                amount: 100000,
                orderInfo: 'Premium subscription',
                planType: 'premium_upgrade'
            });
        });

        it('should exclude bank code when it is null string', async () => {
            axiosClient.post.mockResolvedValue(mockSuccessResponse);
            const dataWithNullBankCode = { ...mockPaymentData, bankCode: 'null' };

            await paymentApi.createPaymentUrl(dataWithNullBankCode);

            expect(axiosClient.post).toHaveBeenCalledWith('/payment/create', {
                amount: 100000,
                orderInfo: 'Premium subscription',
                planType: 'premium_upgrade'
            });
        });

        it('should exclude bank code when it is whitespace', async () => {
            axiosClient.post.mockResolvedValue(mockSuccessResponse);
            const dataWithWhitespaceBankCode = { ...mockPaymentData, bankCode: '   ' };

            await paymentApi.createPaymentUrl(dataWithWhitespaceBankCode);

            expect(axiosClient.post).toHaveBeenCalledWith('/payment/create', {
                amount: 100000,
                orderInfo: 'Premium subscription',
                planType: 'premium_upgrade'
            });
        });

        it('should trim bank code before including it', async () => {
            axiosClient.post.mockResolvedValue(mockSuccessResponse);
            const dataWithSpacedBankCode = { ...mockPaymentData, bankCode: '  NCB  ' };

            await paymentApi.createPaymentUrl(dataWithSpacedBankCode);

            expect(axiosClient.post).toHaveBeenCalledWith('/payment/create', {
                amount: 100000,
                orderInfo: 'Premium subscription',
                planType: 'premium_upgrade',
                bankCode: 'NCB'
            });
        });

        it('should throw error when response is not successful', async () => {
            const mockErrorResponse = {
                data: {
                    success: false,
                    message: 'Invalid payment data'
                }
            };
            axiosClient.post.mockResolvedValue(mockErrorResponse);

            await expect(paymentApi.createPaymentUrl(mockPaymentData)).rejects.toThrow(
                'Invalid payment URL response: {"success":false,"message":"Invalid payment data"}'
            );
        });

        it('should throw error when paymentUrl is missing', async () => {
            const mockResponseWithoutUrl = {
                data: {
                    success: true
                }
            };
            axiosClient.post.mockResolvedValue(mockResponseWithoutUrl);

            await expect(paymentApi.createPaymentUrl(mockPaymentData)).rejects.toThrow(
                'Invalid payment URL response: {"success":true}'
            );
        });

        it('should handle axios error', async () => {
            const axiosError = new Error('Network error');
            axiosClient.post.mockRejectedValue(axiosError);

            await expect(paymentApi.createPaymentUrl(mockPaymentData)).rejects.toThrow('Network error');
            expect(console.error).toHaveBeenCalledWith('[PAYMENT API] Error creating payment URL:', axiosError);
        });
    });

    describe('getPaymentStatus', () => {
        it('should get payment status successfully', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    status: 'completed',
                    orderId: 'ORDER123'
                }
            };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await paymentApi.getPaymentStatus('ORDER123');

            expect(axiosClient.get).toHaveBeenCalledWith('/payment/status/ORDER123');
            expect(result).toEqual(mockResponse);
        });

        it('should handle error when getting payment status', async () => {
            const error = new Error('Payment not found');
            axiosClient.get.mockRejectedValue(error);

            await expect(paymentApi.getPaymentStatus('INVALID')).rejects.toThrow('Payment not found');
        });
    });

    describe('getPaymentHistory', () => {
        it('should get payment history successfully', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    payments: [
                        {
                            id: 1,
                            orderId: 'ORDER123',
                            amount: 100000,
                            status: 'completed'
                        }
                    ]
                }
            };
            axiosClient.get.mockResolvedValue(mockResponse);

            const result = await paymentApi.getPaymentHistory();

            expect(axiosClient.get).toHaveBeenCalledWith('/payment/history');
            expect(result).toEqual(mockResponse);
        });

        it('should handle error when getting payment history', async () => {
            const error = new Error('Unauthorized');
            axiosClient.get.mockRejectedValue(error);

            await expect(paymentApi.getPaymentHistory()).rejects.toThrow('Unauthorized');
        });
    });
});