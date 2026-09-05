import { AppValidationError } from './auth';

export const validatePurchaseOrder = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  const vendorId = Number(data.vendorId);
  if (isNaN(vendorId) || vendorId <= 0 || !Number.isInteger(vendorId)) {
    errors.push({ field: 'vendorId', message: 'Vendor is required' });
  } else {
    data.vendorId = vendorId;
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    errors.push({ field: 'lines', message: 'At least one line item is required' });
  } else {
    data.lines.forEach((line: any, index: number) => {
      const productId = Number(line.productId);
      if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
        errors.push({ field: `lines[${index}].productId`, message: 'Product is required' });
      } else {
        line.productId = productId;
      }

      const quantity = Number(line.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push({ field: `lines[${index}].quantity`, message: 'Quantity must be greater than 0' });
      } else {
        line.quantity = quantity;
      }

      const unitPrice = Number(line.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({ field: `lines[${index}].unitPrice`, message: 'Unit price must be non-negative' });
      } else {
        line.unitPrice = unitPrice;
      }
    });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateVendorBill = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  const vendorId = Number(data.vendorId);
  if (isNaN(vendorId) || vendorId <= 0 || !Number.isInteger(vendorId)) {
    errors.push({ field: 'vendorId', message: 'Vendor is required' });
  } else {
    data.vendorId = vendorId;
  }

  if (!data.dueDate) {
    errors.push({ field: 'dueDate', message: 'Due date is required' });
  }

  const journalId = Number(data.journalId);
  if (isNaN(journalId) || journalId <= 0 || !Number.isInteger(journalId)) {
    errors.push({ field: 'journalId', message: 'Journal is required' });
  } else {
    data.journalId = journalId;
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    errors.push({ field: 'lines', message: 'At least one line item is required' });
  } else {
    data.lines.forEach((line: any, index: number) => {
      const productId = Number(line.productId);
      if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
        errors.push({ field: `lines[${index}].productId`, message: 'Product is required' });
      } else {
        line.productId = productId;
      }

      const accountId = Number(line.accountId);
      if (isNaN(accountId) || accountId <= 0 || !Number.isInteger(accountId)) {
        errors.push({ field: `lines[${index}].accountId`, message: 'Chart of Account is required' });
      } else {
        line.accountId = accountId;
      }

      const quantity = Number(line.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push({ field: `lines[${index}].quantity`, message: 'Quantity must be greater than 0' });
      } else {
        line.quantity = quantity;
      }

      const unitPrice = Number(line.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({ field: `lines[${index}].unitPrice`, message: 'Unit price must be non-negative' });
      } else {
        line.unitPrice = unitPrice;
      }
    });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateSalesOrder = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  const customerId = Number(data.customerId);
  if (isNaN(customerId) || customerId <= 0 || !Number.isInteger(customerId)) {
    errors.push({ field: 'customerId', message: 'Customer is required' });
  } else {
    data.customerId = customerId;
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    errors.push({ field: 'lines', message: 'At least one line item is required' });
  } else {
    data.lines.forEach((line: any, index: number) => {
      const productId = Number(line.productId);
      if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
        errors.push({ field: `lines[${index}].productId`, message: 'Product is required' });
      } else {
        line.productId = productId;
      }

      const quantity = Number(line.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push({ field: `lines[${index}].quantity`, message: 'Quantity must be greater than 0' });
      } else {
        line.quantity = quantity;
      }

      const unitPrice = Number(line.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({ field: `lines[${index}].unitPrice`, message: 'Unit price must be non-negative' });
      } else {
        line.unitPrice = unitPrice;
      }
    });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validateCustomerInvoice = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  const customerId = Number(data.customerId);
  if (isNaN(customerId) || customerId <= 0 || !Number.isInteger(customerId)) {
    errors.push({ field: 'customerId', message: 'Customer is required' });
  } else {
    data.customerId = customerId;
  }

  if (!data.dueDate) {
    errors.push({ field: 'dueDate', message: 'Due date is required' });
  }

  const journalId = Number(data.journalId);
  if (isNaN(journalId) || journalId <= 0 || !Number.isInteger(journalId)) {
    errors.push({ field: 'journalId', message: 'Journal is required' });
  } else {
    data.journalId = journalId;
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    errors.push({ field: 'lines', message: 'At least one line item is required' });
  } else {
    data.lines.forEach((line: any, index: number) => {
      const productId = Number(line.productId);
      if (isNaN(productId) || productId <= 0 || !Number.isInteger(productId)) {
        errors.push({ field: `lines[${index}].productId`, message: 'Product is required' });
      } else {
        line.productId = productId;
      }

      const accountId = Number(line.accountId);
      if (isNaN(accountId) || accountId <= 0 || !Number.isInteger(accountId)) {
        errors.push({ field: `lines[${index}].accountId`, message: 'Chart of Account is required' });
      } else {
        line.accountId = accountId;
      }

      const quantity = Number(line.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push({ field: `lines[${index}].quantity`, message: 'Quantity must be greater than 0' });
      } else {
        line.quantity = quantity;
      }

      const unitPrice = Number(line.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({ field: `lines[${index}].unitPrice`, message: 'Unit price must be non-negative' });
      } else {
        line.unitPrice = unitPrice;
      }
    });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};

export const validatePaymentRegistration = (data: any) => {
  const errors: { field?: string; message: string }[] = [];

  const validTypes = ['CUSTOMER', 'VENDOR'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push({ field: 'type', message: 'Invalid payment type' });
  }

  const partnerId = Number(data.partnerId);
  if (isNaN(partnerId) || partnerId <= 0 || !Number.isInteger(partnerId)) {
    errors.push({ field: 'partnerId', message: 'Partner is required' });
  } else {
    data.partnerId = partnerId;
  }

  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Payment amount must be greater than zero' });
  } else {
    data.amount = amount;
  }

  const validMethods = ['CASH', 'BANK'];
  if (!data.paymentMethod || !validMethods.includes(data.paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Invalid payment method' });
  }

  if (errors.length > 0) throw new AppValidationError(errors);
  return data;
};
