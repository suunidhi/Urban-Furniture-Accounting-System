import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LoginPage } from './features/auth/LoginPage';
import { SignUpPage } from './features/auth/SignUpPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { UserManagementPage } from './features/admin/UserManagementPage';
import { CompanySettingsPage } from './features/admin/CompanySettingsPage';
import { ContactsPage } from './features/contacts/ContactsPage';
import { ProductsPage } from './features/products/ProductsPage';
import { ProductStockPage } from './features/products/ProductStockPage';
import { ChartOfAccountsPage } from './features/accounts/ChartOfAccountsPage';
import { JournalsPage } from './features/journals/JournalsPage';
import { AnalyticAccountsPage } from './features/analytics/AnalyticAccountsPage';

// Purchases
import { PurchaseOrdersPage } from './features/purchases/PurchaseOrdersPage';
import { VendorBillsPage } from './features/purchases/VendorBillsPage';

// Sales
import { SalesOrdersPage } from './features/sales/SalesOrdersPage';
import { CustomerInvoicesPage } from './features/sales/CustomerInvoicesPage';

// Accounting & Payments
import { PaymentsPage } from './features/payments/PaymentsPage';
import { JournalEntriesPage } from './features/accounting/JournalEntriesPage';
import { OCRAssistantPage } from './features/ocr/OCRAssistantPage';

// Budgets
import { BudgetsPage } from './features/budgets/BudgetsPage';

// Reports
import { ReportsPage } from './features/reports/ReportsPage';

// Portal
import { PortalInvoicesPage } from './features/portal/PortalInvoicesPage';
import { PortalBillsPage } from './features/portal/PortalBillsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'accounting/overview',
        element: <DashboardPage />,
      },

      // Master Data Routes
      {
        path: 'contacts',
        element: <ContactsPage />,
      },
      {
        path: 'sales/customers',
        element: <ContactsPage />,
      },
      {
        path: 'purchases/vendors',
        element: <ContactsPage />,
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'products/categories',
        element: <ProductsPage />,
      },
      {
        path: 'products/stock',
        element: <ProductStockPage />,
      },
      {
        path: 'accounting/chart-of-accounts',
        element: <ChartOfAccountsPage />,
      },
      {
        path: 'accounting/journals',
        element: <JournalsPage />,
      },
      {
        path: 'accounting/analytic-accounts',
        element: <AnalyticAccountsPage />,
      },

      // Purchases Routes
      {
        path: 'purchases/orders',
        element: <PurchaseOrdersPage />,
      },
      {
        path: 'purchases/bills',
        element: <VendorBillsPage />,
      },
      {
        path: 'purchases/payments',
        element: <PaymentsPage defaultType="VENDOR" />,
      },

      // Sales Routes
      {
        path: 'sales/orders',
        element: <SalesOrdersPage />,
      },
      {
        path: 'sales/invoices',
        element: <CustomerInvoicesPage />,
      },
      {
        path: 'sales/receipts',
        element: <PaymentsPage defaultType="CUSTOMER" />,
      },

      // Accounting Operational Routes
      {
        path: 'accounting/journal-entries',
        element: <JournalEntriesPage />,
      },
      {
        path: 'accounting/payments',
        element: <PaymentsPage />,
      },
      {
        path: 'accounting/ocr-assistant',
        element: <OCRAssistantPage />,
      },

      // Budgets
      {
        path: 'budgets',
        element: <BudgetsPage />,
      },
      {
        path: 'budgets/analysis',
        element: <BudgetsPage />,
      },

      // Reports
      {
        path: 'accounting/reports',
        element: <ReportsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'reports/balance-sheet',
        element: <ReportsPage />,
      },
      {
        path: 'reports/profit-loss',
        element: <ReportsPage />,
      },
      {
        path: 'reports/trial-balance',
        element: <ReportsPage />,
      },
      {
        path: 'reports/general-ledger',
        element: <ReportsPage />,
      },
      {
        path: 'reports/aged-receivable',
        element: <ReportsPage />,
      },
      {
        path: 'reports/aged-payable',
        element: <ReportsPage />,
      },
      {
        path: 'reports/budget-report',
        element: <ReportsPage />,
      },
      {
        path: 'reports/sales-analytics',
        element: <ReportsPage />,
      },
      {
        path: 'reports/purchase-analytics',
        element: <ReportsPage />,
      },

      // Customer & Vendor Self-Service Portal
      {
        path: 'portal/invoices',
        element: <PortalInvoicesPage />,
      },
      {
        path: 'portal/bills',
        element: <PortalBillsPage />,
      },
      {
        path: 'portal/payments',
        element: <PaymentsPage />,
      },

      // Admin Routes
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <CompanySettingsPage />
          </ProtectedRoute>
        ),
      },

      // Fallback
      {
        path: '*',
        element: (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center max-w-lg mx-auto my-12">
            <h2 className="text-xl font-bold text-gray-800">Module Under Configuration</h2>
            <p className="text-gray-500 text-sm mt-1">Please select an operational section from the navigation menu.</p>
          </div>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
