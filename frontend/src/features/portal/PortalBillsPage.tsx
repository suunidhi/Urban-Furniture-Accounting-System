import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { VendorBill } from '../../types';
import { Receipt, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Pagination } from '../../components/ui/Pagination';

export const PortalBillsPage: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = React.useState(1);

  // Fetch Vendor Bills for logged-in contact user
  const { data: bills, isLoading } = useQuery<VendorBill[]>({
    queryKey: ['portal-bills'],
    queryFn: async () => {
      const res = await api.get('/vendor-bills');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-[#714B67] to-[#4c2f44] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-purple-200 block mb-1">
            Supplier / Vendor Portal
          </span>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Vendor'}</h1>
          <p className="text-sm text-purple-100 mt-1">
            Review status of submitted invoices, payment settlements, and remittance advice.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs backdrop-blur-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Automated Remittance Reconciled</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#714B67]" />
            Your Submitted Vendor Bills
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Total {bills?.length || 0} Bills
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading your vendor bills...</div>
        ) : !bills || bills.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No vendor bills recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Bill Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Disbursed Amount</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bills?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-4 font-semibold text-[#714B67]">
                      {bill.billNumber}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(bill.billDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(bill.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      ₹{Number(bill.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 font-semibold text-emerald-700">
                      ₹{Number(bill.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-700">
                      ₹{Number(bill.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      {bill.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {bills && bills.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={bills.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
