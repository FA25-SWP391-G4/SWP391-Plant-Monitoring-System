# VNPay Payment Method Options

This document explains the payment method options available when integrating with VNPay.

## Payment Method Codes

When creating a payment URL, you can specify a preferred payment method using the `bankCode` parameter. If you don't provide this parameter, VNPay will show a payment method selection page to the user.

### Available Payment Methods

| Code | Payment Method | Description |
|------|---------------|-------------|
| `VNPAYQR` | QR Code Payment | Thanh toán quét mã QR |
| `VNBANK` | Local ATM/Bank Account | Thẻ ATM - Tài khoản ngân hàng nội địa |
| `INTCARD` | International Card | Thẻ thanh toán quốc tế |

## Web Implementation

### Payment Method Selection UI

The premium page now includes a payment method selection interface in the payment dialog:

```jsx
{/* Payment Method Selection */}
<div className="space-y-4 mb-6">
  <button 
    className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg"
    onClick={() => handlePayment(selectedPlan, 'VNPAYQR')}
    disabled={isProcessing}
  >
    <span className="flex items-center">
      <svg className="h-6 w-6 mr-3 text-blue-600" /* ... */ />
      {t('payment.vnpayQR', 'Thanh toán quét mã QR')}
    </span>
  </button>
  
  <button onClick={() => handlePayment(selectedPlan, 'VNBANK')}>
    {t('payment.vnbank', 'Thẻ ATM - Tài khoản ngân hàng nội địa')}
  </button>
  
  <button onClick={() => handlePayment(selectedPlan, 'INTCARD')}>
    {t('payment.intcard', 'Thẻ thanh toán quốc tế')}
  </button>
</div>
```

### Updated Payment Handler

```javascript
// In the premium page component
const handlePayment = async (paymentType, bankCode = '') => {
  setIsProcessing(true);
  setPaymentError(null);
  
  try {
    // Determine amount based on selected plan
    let amount = paymentType === 'monthly' ? 20000 : 
                 paymentType === 'annual' ? 200000 : 399000;
    let description = `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Premium Subscription`;
    
    // Create payment URL with bank code
    const response = await paymentApi.createPaymentUrl({
      amount,
      orderInfo: description,
      orderType: 190004,
      planType: paymentType,
      bankCode: bankCode, // Pass the selected payment method
      directRedirect: true
    });
```

### Mobile App Example

```javascript
// In your React Native payment screen
const initiatePayment = async (paymentMethod) => {
  try {
    const paymentData = {
      amount: product.price,
      orderInfo: `Purchase ${product.title}`,
      orderType: 'subscription',
      bankCode: paymentMethod // 'VNPAYQR', 'VNBANK', or 'INTCARD'
    };
    
    const payment = await createServerPayment(paymentData, false);
    navigation.navigate('PaymentWebView', { paymentUrl: payment.paymentUrl });
  } catch (error) {
    Alert.alert('Payment Error', error.message);
  }
};
```

## User Experience

- If you specify a payment method, the user will be taken directly to that payment flow
- If you don't specify a payment method, the user will see VNPay's payment method selection screen
- For the best user experience, you can offer a choice of payment methods in your app's UI before initiating the payment

## Testing

When testing in the sandbox environment, make sure to:

1. Try each payment method to ensure they work correctly
2. Test the user flow without a specified payment method
3. Verify that the payment details are correctly passed for each method