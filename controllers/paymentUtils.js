/**
 * Enhanced version of handleVNPayReturn with proper CORS support
 * Processes user return from VNPay payment page with cross-domain redirect support
 */
async function handleVNPayReturn(req, res) {
    try {
        const vnpParams = req.query;
        console.log('VNPay return parameters:', vnpParams);
        
        // Add fallback for missing frontend URL
        const frontendUrl = process.env.FRONTEND_PAYMENT_RESULT_URL || 'http://localhost:3000/payment/result';
        
        // Attempt to verify the VNPay response, but handle errors gracefully
        let verificationResult;
        try {
            verificationResult = VNPayService.verifyReturnUrl(vnpParams);
        } catch (verifyError) {
            console.error('Error verifying VNPay return URL:', verifyError);
            return handleRedirect(res, `${frontendUrl}?code=99&message=Verification%20error`);
        }
        
        // If the signature is invalid, redirect to frontend with error code
        if (!verificationResult.isValid) {
            console.error('Invalid VNPay signature in return URL');
            return handleRedirect(res, `${frontendUrl}?code=97&message=Invalid%20payment%20signature`);
        }
        
        // Find payment record
        const payment = await Payment.findByVNPayTxnRef(verificationResult.orderId);
        
        if (!payment) {
            console.error(`Payment not found for orderId: ${verificationResult.orderId}`);
            return handleRedirect(res, `${frontendUrl}?code=91&message=Payment%20not%20found&orderId=${verificationResult.orderId}`);
        }
        
        // Update payment status based on VNPay response
        if (verificationResult.isSuccess) {
            await payment.markAsCompleted();
            
            // Update user to premium if this is an upgrade payment
            if (payment.user_id) {
                const user = await User.findById(payment.user_id);
                
                if (user) {
                    const currentRole = user.role;
                    
                    if (currentRole !== 'premium' && currentRole !== 'admin') {
                        await user.update({ role: 'premium' });
                        console.log(`User ${payment.user_id} upgraded to premium`);
                        
                        // Log the role change
                        await SystemLog.create(
                            'INFO',
                            'Payment',
                            `User ${payment.user_id} upgraded from ${currentRole} to premium via payment ${payment.payment_id}`
                        );
                    }
                }
            }
            
        } else {
            await payment.markAsFailed();
            
            // Log payment failure
            await SystemLog.create(
                'WARNING',
                'Payment',
                `Payment ${payment.payment_id} failed with code ${verificationResult.responseCode}`
            );
        }
        
        // Always redirect to frontend with appropriate parameters
        try {
            // Build redirect URL with result parameters
            const redirectUrl = new URL(frontendUrl);
            redirectUrl.searchParams.append('code', verificationResult.responseCode);
            redirectUrl.searchParams.append('orderId', verificationResult.orderId);
            redirectUrl.searchParams.append('amount', verificationResult.amount);
            redirectUrl.searchParams.append('status', payment.status);
            redirectUrl.searchParams.append('message', verificationResult.message);
            
            if (verificationResult.transactionNo) {
                redirectUrl.searchParams.append('transactionNo', verificationResult.transactionNo);
            }
            
            if (verificationResult.payDate) {
                redirectUrl.searchParams.append('payDate', verificationResult.payDate);
            }
            
            console.log(`Redirecting to payment result page: ${redirectUrl.toString()}`);
            return handleRedirect(res, redirectUrl.toString());
        } catch (urlError) {
            console.error('Error building redirect URL:', urlError);
            
            // Fallback to basic redirect if URL construction fails
            return handleRedirect(res, `${frontendUrl}?code=${verificationResult.responseCode}&status=${payment.status}`);
        }
        
    } catch (error) {
        console.error('VNPay Return Error:', error);
        
        // Add fallback for missing frontend URL
        const frontendUrl = process.env.FRONTEND_PAYMENT_RESULT_URL || 'http://localhost:3000/payment/result';
        
        // Even if there's an error, redirect to frontend with error code
        try {
            return handleRedirect(res, `${frontendUrl}?code=99&message=Server%20error&error=${encodeURIComponent(error.message)}`);
        } catch (redirectError) {
            console.error('Failed to redirect after error:', redirectError);
            
            // Last resort - return JSON response
            res.status(200).json({
                success: false,
                code: '99',
                message: 'Server error processing payment'
            });
        }
    }
}

/**
 * Helper function to handle redirects with x-direct-redirect header support
 * This allows for proper CORS redirects across different domains
 */
function handleRedirect(res, url) {
    // Check if URL is valid
    if (!url) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid redirect URL' 
        });
    }
    
    // Set the x-direct-redirect header for frontend to handle
    res.setHeader('x-direct-redirect', url);
    
    // Also perform the redirect for browsers that follow redirects
    return res.redirect(url);
}

module.exports = {
    handleVNPayReturn,
    handleRedirect
};