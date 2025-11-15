/**
 * Phone number parsing utility for profile data
 * Handles the conversion between combined phone numbers (backend) 
 * and split country_code/phone_number format (frontend)
 */

export const parsePhoneNumber = (fullPhoneNumber, defaultCountryCode = '+84') => {
  if (!fullPhoneNumber) {
    return {
      phoneNumber: '',
      countryCode: defaultCountryCode
    };
  }

  const phone = fullPhoneNumber.toString().trim();
  
  // Check for bracketed country code first: (+84)123456789
  const bracketMatch = phone.match(/^(\(\+\d{1,3}\))(.*)$/);
  if (bracketMatch) {
    // Extract country code from brackets: (+84) -> +84
    const countryCode = bracketMatch[1].replace(/[()]/g, '');
    return {
      phoneNumber: bracketMatch[2].trim(),
      countryCode: countryCode
    };
  }
  
  // Check for standard country code: +84123456789
  if (phone.startsWith('+')) {
    const match = phone.match(/^(\+\d{1,3})(.*)$/);
    if (match) {
      return {
        phoneNumber: match[2].trim(),
        countryCode: match[1]
      };
    }
  }
  
  // If no country code found, treat entire string as phone number
  return {
    phoneNumber: phone,
    countryCode: defaultCountryCode
  };
};

export const combinePhoneNumber = (countryCode, phoneNumber) => {
  if (!phoneNumber) return '';
  // Ensure country code has brackets for consistent formatting
  const formattedCode = countryCode ? `(${countryCode})` : '(+84)';
  return `${formattedCode}${phoneNumber}`;
};