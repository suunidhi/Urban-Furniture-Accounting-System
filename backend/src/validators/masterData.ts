import { AppValidationError } from './auth';

// Helper function to check if a value is a valid email
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateContact = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  // Validate Name
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }

  // Validate Type
  const validTypes = ['CUSTOMER', 'VENDOR', 'BOTH'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Type must be CUSTOMER, VENDOR, or BOTH' });
  }

  // Validate Email if provided
  if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
    if (!isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email address' });
    }
  }

  if (errors.length > 0) throw new AppValidationError(errors);

  // Set default country if not provided
  if (!data.country) data.country = 'India';

  return data;
};

export const validateCategory = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Category name must be at least 2 characters' });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateProduct = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  // Check Product Name
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Product name must be at least 2 characters' });
  }

  // Check Product Type
  const validTypes = ['GOODS', 'SERVICE', 'COMBO'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Type must be GOODS, SERVICE, or COMBO' });
  }

  // Validate numeric fields (sales price and cost price)
  const salesPrice = Number(data.salesPrice);
  if (isNaN(salesPrice) || salesPrice < 0) {
    errors.push({ field: 'salesPrice', message: 'Sales price must be non-negative' });
  } else {
    data.salesPrice = salesPrice;
  }

  const costPrice = Number(data.costPrice);
  if (isNaN(costPrice) || costPrice < 0) {
    errors.push({ field: 'costPrice', message: 'Cost price must be non-negative' });
  } else {
    data.costPrice = costPrice;
  }

  // Validate category relation
  const categoryId = Number(data.categoryId);
  if (isNaN(categoryId) || categoryId <= 0 || !Number.isInteger(categoryId)) {
    errors.push({ field: 'categoryId', message: 'Category is required' });
  } else {
    data.categoryId = categoryId;
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateAccount = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    errors.push({ field: 'code', message: 'Account code is required' });
  }

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Account name must be at least 2 characters' });
  }

  const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE', 'OTHER_EXPENSE'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Invalid account type' });
  }

  if (data.parentId) {
    const parentId = Number(data.parentId);
    if (isNaN(parentId) || parentId <= 0 || !Number.isInteger(parentId)) {
      errors.push({ field: 'parentId', message: 'Parent ID must be a positive integer' });
    } else {
      data.parentId = parentId;
    }
  }

  if (errors.length > 0) throw new AppValidationError(errors);

  if (data.isActive === undefined) data.isActive = true;

  return data;
};

export const validateJournal = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Journal name must be at least 2 characters' });
  }

  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    errors.push({ field: 'code', message: 'Journal code is required' });
  }

  const validTypes = ['SALES', 'PURCHASE', 'BANK', 'CASH', 'GENERAL'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Invalid journal type' });
  }

  if (data.defaultDebitAccountId) {
    data.defaultDebitAccountId = Number(data.defaultDebitAccountId);
  }
  if (data.defaultCreditAccountId) {
    data.defaultCreditAccountId = Number(data.defaultCreditAccountId);
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateAnalyticAccount = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Analytic account name must be at least 2 characters' });
  }

  const validTypes = ['INCOME', 'EXPENSE'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Type must be INCOME or EXPENSE' });
  }

  if (errors.length > 0) throw new AppValidationError(errors);

  if (data.isActive === undefined) data.isActive = true;

  return data;
};
