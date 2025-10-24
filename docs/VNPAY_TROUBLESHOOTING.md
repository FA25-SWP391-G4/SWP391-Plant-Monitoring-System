# VNPay Integration Troubleshooting Guide

## Common Issues and Solutions

### Invalid Signature Error

If you encounter the "Sai chữ ký - Invalid signature" error when integrating VNPay, check the following:

1. **Use VNPay's `sortObject` function**: 
   - The `sortObject` function provided by VNPay's demo code is critical
   - It handles encoding with a specific format (spaces as '+' not '%20')
   - Do not modify this function

2. **Include all required parameters**:
   - Make sure all required parameters listed in the VNPay documentation are included
   - Missing parameters will cause the signature to be invalid

3. **Correct encoding settings**:
   - When creating the signature string, use `encode: true` with the qs module
   - For redirect URLs, ensure proper encoding is maintained

4. **Use valid order type codes**:
   - Do not use "other" as `vnp_OrderType` value
   - Use actual VNPay category codes (e.g., 190004 for subscriptions)
   - See complete list in the VNPay documentation

5. **Use correct hash algorithm**:
   - VNPay 2.1.0 uses SHA512
   - Ensure you're using the correct hash algorithm for your version

6. **Check IP address format**:
   - The IP address should be in IPv4 format
   - Remove IPv6 prefixes like '::ffff:'

## Parameter Reference

### Order Type Codes (Sample)

| STT | Mã | Loại đơn hàng |
|-----|-----|--------------|
| 1 | 100000 | Thực Phẩm - Tiêu Dùng |
| 45 | 190000 | Giải trí & Đào tạo |
| 49 | 190004 | Thẻ học trực tuyến/Thẻ hội viên |

### Payment Integration Workflow

1. **Create Payment URL**:
   - Sort parameters alphabetically using VNPay's `sortObject`
   - Create signature with SHA512
   - Encode parameters correctly
   - Add signature to parameters
   - Create final URL

2. **Handle Return Callback**:
   - Extract parameters from callback URL
   - Sort parameters the same way as when creating URL
   - Create signature using the same method
   - Compare with provided signature
   - Process payment based on result

3. **Handle IPN Notification**:
   - Extract parameters from IPN request
   - Verify signature using the same method
   - Update order status based on result
   - Return appropriate response to VNPay

## Code Examples

### Sort and Encode Parameters
```javascript
// This is the official VNPay implementation for sorting and encoding parameters
static sortObject(obj) {
    const sorted = {};
    const str = [];
    let key;
    
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    
    str.sort();
    
    for (key = 0; key < str.length; key++) {
        const originalKey = decodeURIComponent(str[key]);
        // Critical: Replace %20 with + as required by VNPay
        sorted[str[key]] = encodeURIComponent(obj[originalKey]).replace(/%20/g, "+");
    }
    
    return sorted;
}
```

### Creating the Signature
```javascript
// Sort parameters
const sortedParams = sortObject(vnpParams);

// Create signature string
const signData = qs.stringify(sortedParams, { encode: true });

// Create secure hash
const hmac = crypto.createHmac('sha512', secretKey);
const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
```

## Additional Resources

- [VNPay Sandbox Documentation](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- [VNPay Response Codes](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/bien-response.html)
- [VNPay Category Codes](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/bien-loaihanghoa.html)