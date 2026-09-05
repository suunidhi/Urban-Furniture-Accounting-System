import React from 'react';

const DashboardHome = () => {
  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded shadow border border-odoo-border">
        <h2 className="text-2xl mb-4 font-light text-odoo-primary">Welcome to Urban Furniture Accounting</h2>
        <p className="text-gray-600 mb-6">
          The core Master Data management modules have been added. Use the sidebar to navigate to:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-odoo-border rounded p-4 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-odoo-secondary mb-2">Contacts</h3>
            <p className="text-sm text-gray-500">Manage Customers, Vendors, and their associated details.</p>
          </div>
          
          <div className="border border-odoo-border rounded p-4 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-odoo-secondary mb-2">Products</h3>
            <p className="text-sm text-gray-500">Manage Goods, Services, and pricing information.</p>
          </div>
          
          <div className="border border-odoo-border rounded p-4 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-odoo-secondary mb-2">Chart of Accounts</h3>
            <p className="text-sm text-gray-500">View and manage your core financial accounts.</p>
          </div>
          
          <div className="border border-odoo-border rounded p-4 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-odoo-secondary mb-2">Journals</h3>
            <p className="text-sm text-gray-500">Configure financial journals for tracking specific types of entries.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
