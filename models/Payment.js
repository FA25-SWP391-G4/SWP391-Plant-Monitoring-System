const { pool } = require('../config/db');
const { isValidUUID } = require('../utils/uuidGenerator');

class Payment {
    constructor(paymentData) {
        this.payment_id = paymentData.payment_id;
        this.user_id = paymentData.user_id;
        this.vnpay_txn_ref = paymentData.vnpay_txn_ref;
        this.amount = paymentData.amount;
        this.status = paymentData.status;
        this.created_at = paymentData.created_at;
        this.order_id = paymentData.order_id;
        this.order_info = paymentData.order_info;
        this.bank_code = paymentData.bank_code;
        this.transaction_no = paymentData.transaction_no;
        this.response_code = paymentData.response_code;
        this.updated_at = paymentData.updated_at;
    }

    // Static method to find all payments
    static async findAll(limit = 100) {
        try {
            const query = `
                SELECT p.*, CONCAT(u.given_name, ' ', u.family_name) as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                ORDER BY p.created_at DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new Payment(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find payment by ID
    static async findById(id) {
        try {
            const query = `
                SELECT p.*, CONCAT(u.given_name, ' ', u.family_name) as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.payment_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Payment(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find payment by VNPay transaction reference
    static async findByVNPayTxnRef(txnRef) {
        try {
            const query = `
                SELECT p.*, u.family_name as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.vnpay_txn_ref = $1
            `;
            const result = await pool.query(query, [txnRef]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Payment(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find payments by user ID
    static async findByUserId(userId, limit = 50) {
        // Validate UUID
        if (!isValidUUID(userId)) {
            console.error('[PAYMENT] Invalid user_id UUID:', userId);
            return [];
        }

        try {
            const query = `
                SELECT p.*, u.family_name as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.user_id = $1
                ORDER BY p.created_at DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new Payment(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find payments by status
    static async findByStatus(status, limit = 100) {
        try {
            const query = `
                SELECT p.*, u.family_name as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.status = $1
                ORDER BY p.created_at DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [status, limit]);
            return result.rows.map(row => new Payment(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find pending payments
    static async findPending() {
        try {
            return await Payment.findByStatus('pending');
        } catch (error) {
            throw error;
        }
    }

    // Static method to find completed payments for a user
    static async findCompletedByUserId(userId) {
        // Validate UUID
        if (!isValidUUID(userId)) {
            console.error('[PAYMENT] Invalid user_id UUID:', userId);
            return [];
        }

        try {
            const query = `
                SELECT p.*, u.family_name as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.user_id = $1 AND p.status = 'completed'
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Payment(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to get payment statistics
    static async getPaymentStats(days = 30) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    AVG(CASE WHEN status = 'completed' THEN amount END) as avg_payment_amount
                FROM payments 
                WHERE created_at >= NOW() - INTERVAL '${days} days'
            `;
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Create or update payment
    async save() {
        // Validate user_id UUID
        if (!isValidUUID(this.user_id)) {
            console.error('[PAYMENT] Invalid user_id UUID in save:', this.user_id);
            throw new Error('Valid user_id UUID is required');
        }

        try {
            if (this.payment_id) {
                // Update existing payment
                const query = `
                    UPDATE payments 
                    SET user_id = $1, vnpay_txn_ref = $2, amount = $3, status = $4
                    WHERE payment_id = $5
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.vnpay_txn_ref,
                    this.amount,
                    this.status,
                    this.payment_id
                ]);
                
                const updatedPayment = new Payment(result.rows[0]);
                Object.assign(this, updatedPayment);
                return this;
            } else {
                // Create new payment
                const query = `
                    INSERT INTO payments (user_id, vnpay_txn_ref, amount, status)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.vnpay_txn_ref,
                    parseFloat(this.amount),
                    this.status || 'pending'
                ]);
                
                const newPayment = new Payment(result.rows[0]);
                Object.assign(this, newPayment);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Update payment status
    async updateStatus(newStatus) {
        try {
            const validStatuses = ['completed', 'failed', 'pending'];
            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            const query = `
                UPDATE payments 
                SET status = $1
                WHERE payment_id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [newStatus, this.payment_id]);
            
            if (result.rows.length > 0) {
                this.status = newStatus;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Mark payment as completed
    async markAsCompleted() {
        return await this.updateStatus('completed');
    }

    // Mark payment as failed
    async markAsFailed() {
        return await this.updateStatus('failed');
    }

    // Delete payment
    async delete() {
        try {
            if (!this.payment_id) {
                throw new Error('Cannot delete payment without ID');
            }

            const query = 'DELETE FROM payments WHERE payment_id = $1';
            await pool.query(query, [this.payment_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Static method to create payment
    static async createPayment(userId, amount, vnpayTxnRef = null) {
        try {
            // Validate user ID
            if (!userId) {
                console.error('Payment creation error: Missing userId');
                throw new Error('Cannot create payment without user ID');
            }
            
            console.log(`Creating payment record: UserID=${userId}, Amount=${amount}, TxnRef=${vnpayTxnRef}`);
            
            const payment = new Payment({
                user_id: userId,
                vnpay_txn_ref: vnpayTxnRef,
                amount: amount,
                status: 'pending'
            });
            
            const savedPayment = await payment.save();
            console.log(`Payment created successfully: PaymentID=${savedPayment.payment_id}, UserID=${savedPayment.user_id}`);
            
            return savedPayment;
        } catch (error) {
            console.error('Payment creation error:', error);
            throw error;
        }
    }

    // Static method to generate VNPay transaction reference
    static generateVNPayTxnRef() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TXN${timestamp}${random}`;
    }

    // Check if payment is expired (for pending payments older than 30 minutes)
    isExpired() {
        if (this.status !== 'pending') {
            return false;
        }
        
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        return new Date(this.created_at) < thirtyMinutesAgo;
    }

    // Get payment age in human readable format
    getAgeString() {
        if (!this.created_at) {
            return 'Unknown';
        }
        
        const now = new Date();
        const paymentTime = new Date(this.created_at);
        const diffMs = now - paymentTime;
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    }

    // Format amount as currency
    getFormattedAmount() {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(this.amount);
    }

    // Enhanced methods for VNPay community library integration

    // Static method to find payment by order ID (VNPay community library)
    static async findByOrderId(orderId) {
        try {
            const query = `
                SELECT p.*, CONCAT(u.given_name, ' ', u.family_name) as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.order_id = $1
            `;
            const result = await pool.query(query, [orderId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Payment(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find payment by order ID and user ID for security
    static async findByOrderIdAndUserId(orderId, userId) {
        // Validate UUID
        if (!isValidUUID(userId)) {
            console.error('[PAYMENT] Invalid user_id UUID:', userId);
            return null;
        }

        try {
            const query = `
                SELECT p.*, CONCAT(u.given_name, ' ', u.family_name) as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.order_id = $1 AND p.user_id = $2
            `;
            const result = await pool.query(query, [orderId, userId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Payment(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to create payment with enhanced fields
    static async create(paymentData) {
        // Validate required fields
        if (!paymentData.user_id || !paymentData.amount) {
            throw new Error('Missing required fields: user_id and amount');
        }

        // Validate UUID
        if (!isValidUUID(paymentData.user_id)) {
            throw new Error('Invalid user_id UUID');
        }

        try {
            const query = `
                INSERT INTO payments (
                    user_id, order_id, amount, order_info, bank_code, 
                    ip_address, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING payment_id
            `;
            
            const values = [
                paymentData.user_id,
                paymentData.order_id,
                paymentData.amount,
                paymentData.order_info || null,
                paymentData.bank_code || null,
                paymentData.ip_address || null,
                paymentData.status || 'PENDING',
                paymentData.created_at || new Date()
            ];

            const result = await pool.query(query, values);
            return result.rows[0].payment_id;
        } catch (error) {
            throw error;
        }
    }

    // Static method to update payment by order ID
    static async updateByOrderId(orderId, updateData) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            // Build dynamic update query
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(updateData[key]);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            const query = `
                UPDATE payments 
                SET ${fields.join(', ')}
                WHERE order_id = $${paramCount}
                RETURNING *
            `;
            values.push(orderId);

            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Payment(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Enhanced findByUserId with pagination support
    static async findByUserId(userId, options = {}) {
        // Validate UUID
        if (!isValidUUID(userId)) {
            console.error('[PAYMENT] Invalid user_id UUID:', userId);
            return [];
        }

        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        try {
            const query = `
                SELECT p.*, u.family_name as user_name, u.email 
                FROM payments p
                LEFT JOIN users u ON p.user_id = u.user_id
                WHERE p.user_id = $1
                ORDER BY p.created_at DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [userId, limit, offset]);
            return result.rows.map(row => new Payment(row));
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            payment_id: this.payment_id,
            user_id: this.user_id,
            vnpay_txn_ref: this.vnpay_txn_ref,
            order_id: this.order_id,
            amount: this.amount,
            formatted_amount: this.getFormattedAmount(),
            order_info: this.order_info,
            bank_code: this.bank_code,
            transaction_no: this.transaction_no,
            response_code: this.response_code,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at,
            age_string: this.getAgeString(),
            is_expired: this.isExpired()
        };
    }
}

module.exports = Payment;
