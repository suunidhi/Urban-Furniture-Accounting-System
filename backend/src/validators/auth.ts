export class AppValidationError extends Error {
  public errors: { field?: string; message: string }[];
  constructor(errors: { field?: string; message: string }[]) {
    super('Validation failed');
    this.name = 'AppValidationError';
    this.errors = errors;
  }
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Helper function to validate if a string is a valid email
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateLogin = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  // Check if loginId is provided and is a string
  if (!data.loginId || typeof data.loginId !== 'string') {
    errors.push({ field: 'loginId', message: 'Login ID is required' });
  }

  // Check if password is provided and is a string
  if (!data.password || typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  // If there are errors, throw our custom validation error
  if (errors.length > 0) throw new AppValidationError(errors);

  return data;
};

export const validateSignup = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  // Validate Name
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }

  // Validate Login ID (Length and allowed characters)
  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.length < 6) {
    errors.push({ field: 'loginId', message: 'Login ID must be at least 6 characters' });
  } else if (data.loginId.length > 12) {
    errors.push({ field: 'loginId', message: 'Login ID cannot exceed 12 characters' });
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.loginId)) {
    errors.push({ field: 'loginId', message: 'Login ID can only contain letters, numbers, and underscores' });
  }

  // Validate Email
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email address' });
  }

  // Validate Role
  const validRoles = ['ADMIN', 'ACCOUNTANT', 'CONTACT_USER'];
  if (data.role && !validRoles.includes(data.role)) {
    errors.push({ field: 'role', message: 'Invalid role' });
  }

  // Validate Password complexity
  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  } else if (!passwordRegex.test(data.password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character' });
  }

  // Ensure passwords match
  if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  if (errors.length > 0) throw new AppValidationError(errors);

  // Set default role if not provided
  if (!data.role) data.role = 'ACCOUNTANT';

  return data;
};

export const validateCreateUser = (data: any) => {
  // Same logic as signup, but role is strictly required and contactId is optional
  const errors: { field?: string; message: string }[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  if (!data.loginId || typeof data.loginId !== 'string' || data.loginId.length < 6) errors.push({ field: 'loginId', message: 'Login ID must be at least 6 characters' });
  else if (data.loginId.length > 12) errors.push({ field: 'loginId', message: 'Login ID cannot exceed 12 characters' });
  else if (!/^[a-zA-Z0-9_]+$/.test(data.loginId)) errors.push({ field: 'loginId', message: 'Login ID can only contain letters, numbers, and underscores' });

  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) errors.push({ field: 'email', message: 'Invalid email address' });

  const validRoles = ['ADMIN', 'ACCOUNTANT', 'CONTACT_USER'];
  if (!data.role || !validRoles.includes(data.role)) errors.push({ field: 'role', message: 'Role is required and must be valid' });

  if (data.contactId !== undefined && data.contactId !== null && typeof data.contactId !== 'number') {
    errors.push({ field: 'contactId', message: 'Contact ID must be a number' });
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  else if (!passwordRegex.test(data.password)) errors.push({ field: 'password', message: 'Password must contain uppercase, lowercase, and special character' });

  if (data.password !== data.confirmPassword) errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateForgotPassword = (data: any) => {
  const errors: { field?: string; message: string }[] = [];
  if (!data.loginId || typeof data.loginId !== 'string') errors.push({ field: 'loginId', message: 'Login ID is required' });
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) errors.push({ field: 'email', message: 'Invalid email address' });
  
  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateResetPassword = (data: any) => {
  const errors: { field?: string; message: string }[] = [];
  if (!data.loginId || typeof data.loginId !== 'string') errors.push({ field: 'loginId', message: 'Login ID is required' });
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) errors.push({ field: 'email', message: 'Invalid email address' });
  
  if (!data.newPassword || typeof data.newPassword !== 'string' || data.newPassword.length < 8) errors.push({ field: 'newPassword', message: 'Password must be at least 8 characters' });
  else if (!passwordRegex.test(data.newPassword)) errors.push({ field: 'newPassword', message: 'Password must contain uppercase, lowercase, and special character' });

  if (data.newPassword !== data.confirmPassword) errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};
