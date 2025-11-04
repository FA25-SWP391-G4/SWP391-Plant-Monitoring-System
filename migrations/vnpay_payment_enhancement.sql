-- VNPay Payment Enhancement Migration
-- Adds fields needed for community library implementation

-- Add new columns to Payments table
ALTER TABLE Payments 
ADD COLUMN IF NOT EXISTS order_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS order_info TEXT,
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS transaction_no VARCHAR(255),
ADD COLUMN IF NOT EXISTS pay_date VARCHAR(14),
ADD COLUMN IF NOT EXISTS response_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS transaction_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update status enum to match VNPay statuses
ALTER TABLE Payments DROP CONSTRAINT payments_status_check;
ALTER TABLE Payments ADD CONSTRAINT payments_status_check 
CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'completed', 'failed', 'pending'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON Payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON Payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_no ON Payments(transaction_no);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_updated_at ON Payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON Payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
