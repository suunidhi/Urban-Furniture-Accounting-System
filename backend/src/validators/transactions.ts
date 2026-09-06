import { ValidationError } from '../middleware/errorHandler';

// Utility to push error
const addError = (errors: any[], path: string, message: string) => {
  errors.push({ path: [path], message });
};

// Common line validator logic
const validateLineItem = (line: any, index: number, errors: any[], isBillOrInvoice: boolean = false) => {
  if (!line.productId || isNaN(Number(line.productId)) || Number(line.productId) <= 0) {
    addError(errors, `lines.${index}.productId`, 'Product is required');
  }
  if (!line.quantity || isNaN(Number(line.quantity)) || Number(line.quantity) <= 0) {
    addError(errors, `lines.${index}.quantity`, 'Quantity must be greater than 0');
  }
  if (line.unitPrice === undefined || isNaN(Number(line.unitPrice)) || Number(line.unitPrice) < 0) {
    addError(errors, `lines.${index}.unitPrice`, 'Unit price must be non-negative');
  }
  
  if (isBillOrInvoice) {
    if (!line.accountId || isNaN(Number(line.accountId)) || Number(line.accountId) <= 0) {
      addError(errors, `lines.${index}.accountId`, 'Chart of Account is required');
    }
    // Set default tax rate if missing
    if (line.taxRate === undefined || line.taxRate === null) {
      line.taxRate = 0;
    } else if (isNaN(Number(line.taxRate)) || Number(line.taxRate) < 0) {
      addError(errors, `lines.${index}.taxRate`, 'Tax rate must be non-negative');
    }
  }
};

export const validatePurchaseOrder = (data: any) => {
  const errors: any[] = [];
  
  if (!data.vendorId || isNaN(Number(data.vendorId)) || Number(data.vendorId) <= 0) {
    addError(errors, 'vendorId', 'Vendor is required');
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    addError(errors, 'lines', 'At least one line item is required');
  } else {
    data.lines.forEach((line: any, index: number) => {
      validateLineItem(line, index, errors, false);
    });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateVendorBill = (data: any) => {
  const errors: any[] = [];

  if (!data.vendorId || isNaN(Number(data.vendorId)) || Number(data.vendorId) <= 0) {
    addError(errors, 'vendorId', 'Vendor is required');
  }
  
  if (!data.dueDate) {
    addError(errors, 'dueDate', 'Due date is required');
  }

  if (!data.journalId || isNaN(Number(data.journalId)) || Number(data.journalId) <= 0) {
    addError(errors, 'journalId', 'Journal is required');
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    addError(errors, 'lines', 'At least one line item is required');
  } else {
    data.lines.forEach((line: any, index: number) => {
      validateLineItem(line, index, errors, true);
    });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateSalesOrder = (data: any) => {
  const errors: any[] = [];

  if (!data.customerId || isNaN(Number(data.customerId)) || Number(data.customerId) <= 0) {
    addError(errors, 'customerId', 'Customer is required');
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    addError(errors, 'lines', 'At least one line item is required');
  } else {
    data.lines.forEach((line: any, index: number) => {
      validateLineItem(line, index, errors, false); // For SO we don't strictly need accountId in early validation
    });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateCustomerInvoice = (data: any) => {
  const errors: any[] = [];

  if (!data.customerId || isNaN(Number(data.customerId)) || Number(data.customerId) <= 0) {
    addError(errors, 'customerId', 'Customer is required');
  }

  if (!data.dueDate) {
    addError(errors, 'dueDate', 'Due date is required');
  }

  if (!data.journalId || isNaN(Number(data.journalId)) || Number(data.journalId) <= 0) {
    addError(errors, 'journalId', 'Journal is required');
  }

  if (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0) {
    addError(errors, 'lines', 'At least one line item is required');
  } else {
    data.lines.forEach((line: any, index: number) => {
      validateLineItem(line, index, errors, true);
    });
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validateUpdateInvoice = (data: any) => {
  const errors: any[] = [];

  // Validation logic for update is more lenient, only check if lines exist
  if (data.lines) {
    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      addError(errors, 'lines', 'At least one line item is required');
    } else {
      data.lines.forEach((line: any, index: number) => {
        validateLineItem(line, index, errors, true);
      });
    }
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};

export const validatePaymentRegistration = (data: any) => {
  const errors: any[] = [];

  if (!data.type || !['CUSTOMER', 'VENDOR'].includes(data.type)) {
    addError(errors, 'type', 'Payment type must be CUSTOMER or VENDOR');
  }

  if (!data.partnerId || isNaN(Number(data.partnerId)) || Number(data.partnerId) <= 0) {
    addError(errors, 'partnerId', 'Partner is required');
  }

  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    addError(errors, 'amount', 'Payment amount must be greater than zero');
  }

  if (!data.paymentMethod || !['CASH', 'BANK'].includes(data.paymentMethod)) {
    addError(errors, 'paymentMethod', 'Payment method must be CASH or BANK');
  }

  if (errors.length > 0) throw new ValidationError(errors);
  return data;
};
