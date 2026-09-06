import { ValidationError } from '../middleware/errorHandler';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const loginIdRegex = /^[a-zA-Z0-9_]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Utility to push error
const addError = (errors: any[], path: string, message: string) => {
  errors.push({ path: [path], message });
};

export const validateLogin = (data: any) => {
  const errors: any[] = [];
  
  // Login ID validation
  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.trim() === '') {
    addError(errors, 'loginId', 'Login ID is required');
  }

  // Password validation
  if (!data.password || typeof data.password !== 'string' || data.password.trim() === '') {
    addError(errors, 'password', 'Password is required');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateSignup = (data: any) => {
  const errors: any[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Name must be at least 2 characters');
  }

  // Login ID logic: strict length and regex matching
  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.length < 6) {
    addError(errors, 'loginId', 'Login ID must be at least 6 characters');
  } else if (data.loginId.length > 12) {
    addError(errors, 'loginId', 'Login ID cannot exceed 12 characters');
  } else if (!loginIdRegex.test(data.loginId)) {
    addError(errors, 'loginId', 'Login ID can only contain letters, numbers, and underscores');
  }

  // Email format check
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email)) {
    addError(errors, 'email', 'Invalid email address');
  }

  // Role validation
  if (data.role && !['ADMIN', 'ACCOUNTANT', 'CONTACT_USER'].includes(data.role)) {
    addError(errors, 'role', 'Invalid role');
  }
  // Default fallback for role if missing (like Zod default)
  const role = data.role || 'ACCOUNTANT';

  // Password complex regex check
  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    addError(errors, 'password', 'Password must be more than 8 characters');
  } else if (!passwordRegex.test(data.password)) {
    addError(errors, 'password', 'Password must contain at least one uppercase letter, one lowercase letter, and one special character');
  }

  if (!data.confirmPassword || typeof data.confirmPassword !== 'string' || data.confirmPassword.trim() === '') {
    addError(errors, 'confirmPassword', 'Password confirmation is required');
  } else if (data.password !== data.confirmPassword) {
    addError(errors, 'confirmPassword', 'Passwords do not match');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return { ...data, role }; // Return data with injected defaults
};

export const validateCreateUser = (data: any) => {
  const errors: any[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Name must be at least 2 characters');
  }

  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.length < 6) {
    addError(errors, 'loginId', 'Login ID must be at least 6 characters');
  } else if (data.loginId.length > 12) {
    addError(errors, 'loginId', 'Login ID cannot exceed 12 characters');
  } else if (!loginIdRegex.test(data.loginId)) {
    addError(errors, 'loginId', 'Login ID can only contain letters, numbers, and underscores');
  }

  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email)) {
    addError(errors, 'email', 'Invalid email address');
  }

  if (!data.role || !['ADMIN', 'ACCOUNTANT', 'CONTACT_USER'].includes(data.role)) {
    addError(errors, 'role', 'Role must be valid');
  }

  if (data.contactId !== undefined && data.contactId !== null && typeof data.contactId !== 'number') {
    addError(errors, 'contactId', 'Contact ID must be a number');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    addError(errors, 'password', 'Password must be more than 8 characters');
  } else if (!passwordRegex.test(data.password)) {
    addError(errors, 'password', 'Password must contain at least one uppercase letter, one lowercase letter, and one special character');
  }

  if (!data.confirmPassword || typeof data.confirmPassword !== 'string' || data.confirmPassword.trim() === '') {
    addError(errors, 'confirmPassword', 'Password confirmation is required');
  } else if (data.password !== data.confirmPassword) {
    addError(errors, 'confirmPassword', 'Passwords do not match');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateForgotPassword = (data: any) => {
  const errors: any[] = [];
  
  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.trim() === '') {
    addError(errors, 'loginId', 'Login ID is required');
  }
  
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email)) {
    addError(errors, 'email', 'Invalid email address');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateVerifySignupOtp = (data: any) => {
  const errors: any[] = [];
  
  if (!data.userId || typeof data.userId !== 'number') {
    addError(errors, 'userId', 'Valid User ID is required');
  }
  
  // OTP logic: strictly 6 chars
  if (!data.otpCode || typeof data.otpCode !== 'string' || data.otpCode.length !== 6) {
    addError(errors, 'otpCode', 'OTP must be exactly 6 characters');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateResetPassword = (data: any) => {
  const errors: any[] = [];

  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.trim() === '') {
    addError(errors, 'loginId', 'Login ID is required');
  }
  
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email)) {
    addError(errors, 'email', 'Invalid email address');
  }
  
  if (!data.otpCode || typeof data.otpCode !== 'string' || data.otpCode.length !== 6) {
    addError(errors, 'otpCode', 'OTP must be exactly 6 characters');
  }

  if (!data.newPassword || typeof data.newPassword !== 'string' || data.newPassword.length < 8) {
    addError(errors, 'newPassword', 'Password must be more than 8 characters');
  } else if (!passwordRegex.test(data.newPassword)) {
    addError(errors, 'newPassword', 'Password must contain at least one uppercase letter, one lowercase letter, and one special character');
  }

  if (!data.confirmPassword || typeof data.confirmPassword !== 'string' || data.confirmPassword.trim() === '') {
    addError(errors, 'confirmPassword', 'Password confirmation is required');
  } else if (data.newPassword !== data.confirmPassword) {
    addError(errors, 'confirmPassword', 'Passwords do not match');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};
