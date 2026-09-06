import { ValidationError } from '../middleware/errorHandler';

// Utility to push error
const addError = (errors: any[], path: string, message: string) => {
  errors.push({ path: [path], message });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateContact = (data: any) => {
  const errors: any[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Name must be at least 2 characters');
  }

  if (!data.type || !['CUSTOMER', 'VENDOR', 'BOTH'].includes(data.type)) {
    addError(errors, 'type', 'Valid type (CUSTOMER, VENDOR, BOTH) is required');
  }

  if (data.email && data.email !== '') {
    if (typeof data.email !== 'string' || !emailRegex.test(data.email)) {
      addError(errors, 'email', 'Invalid email address');
    }
  }

  if (errors.length > 0) throw new ValidationError(errors);
  
  // Return with default
  return {
    ...data,
    country: data.country || 'India'
  };
};

export const validateCategory = (data: any) => {
  const errors: any[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Category name must be at least 2 characters');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateProduct = (data: any) => {
  const errors: any[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Product name must be at least 2 characters');
  }

  if (!data.type || !['GOODS', 'SERVICE', 'COMBO'].includes(data.type)) {
    addError(errors, 'type', 'Valid product type is required');
  }

  if (data.salesPrice === undefined || isNaN(Number(data.salesPrice)) || Number(data.salesPrice) < 0) {
    addError(errors, 'salesPrice', 'Sales price must be non-negative');
  }

  if (data.costPrice === undefined || isNaN(Number(data.costPrice)) || Number(data.costPrice) < 0) {
    addError(errors, 'costPrice', 'Cost price must be non-negative');
  }

  if (!data.categoryId || isNaN(Number(data.categoryId)) || Number(data.categoryId) <= 0) {
    addError(errors, 'categoryId', 'Category is required');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateAccount = (data: any) => {
  const errors: any[] = [];

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    addError(errors, 'code', 'Account code is required');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Account name must be at least 2 characters');
  }

  if (!data.type || !['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'OTHER_EXPENSE'].includes(data.type)) {
    addError(errors, 'type', 'Valid account type is required');
  }

  if (errors.length > 0) throw new ValidationError(errors);

  return {
    ...data,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
  };
};

export const validateJournal = (data: any) => {
  const errors: any[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Journal name must be at least 2 characters');
  }

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    addError(errors, 'code', 'Journal code is required');
  }

  if (!data.type || !['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL'].includes(data.type)) {
    addError(errors, 'type', 'Valid journal type is required');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateAnalyticAccount = (data: any) => {
  const errors: any[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    addError(errors, 'name', 'Analytic account name must be at least 2 characters');
  }

  if (!data.type || !['INCOME', 'EXPENSE'].includes(data.type)) {
    addError(errors, 'type', 'Valid analytic account type is required');
  }

  if (errors.length > 0) throw new ValidationError(errors);

  return {
    ...data,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
  };
};
