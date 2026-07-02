/**
 * Cleans text by trimming outer spacing and collapsing multiple spaces into one.
 */
export function cleanText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Real-time filter to reject numeric characters and non-text symbols.
 * Allows letters, spaces, and minor text characters: . , - ( ) '
 */
export function restrictText(value: string): string {
  return value.replace(/[0-9]/g, '').replace(/[^a-zA-Z\s.,\-()']/g, '');
}

/**
 * Real-time filter to allow numbers only and restrict max length.
 */
export function restrictNumber(value: string, maxLength?: number): string {
  const digits = value.replace(/[^0-9]/g, '');
  if (maxLength !== undefined) {
    return digits.slice(0, maxLength);
  }
  return digits;
}

/**
 * Validates email format.
 */
export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'This field is required.';
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

/**
 * Validates mobile numbers (exactly 10 digits).
 */
export function validateMobile(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'This field is required.';
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return 'Phone number must be between 7 and 15 digits.';
  }
  return null;
}

/**
 * Validates password strength (min 8 characters).
 */
export function validatePassword(value: string): string | null {
  if (!value) return 'This field is required.';
  if (value.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  // Check complexity: at least one letter and one number
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}
