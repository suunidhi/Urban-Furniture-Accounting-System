import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  Package, 
  Search, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Boxes, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export const ProductStockPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['product-stock-summary'],
    queryFn: async () => {
      const res = await api.get('/products/stock-summary');
      return res.data.data;
    },
  });

  const products = stockData?.products || [];
  const totals = stockData?.totals || {
    totalProducts: 0,
    totalStockUnits: 0,
    totalValuation: 0,
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p: any) => p.category))) as string[];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-[#714B67]" />
            Product & Inventory Stock Summary
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Financial stock aggregation calculated in real time from posted Vendor Bills (In) and Customer Invoices (Out)
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catalog SKUs</span>
            <span className="p-2 bg-purple-50 text-[#714B67] rounded-xl">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totals.totalProducts} Products</div>
          <div className="text-xs text-gray-400">Total active catalog offerings</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Stock Units</span>
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totals.totalStockUnits} Units</div>
          <div className="text-xs text-teal-700 font-medium">Net purchases less customer dispatches</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Inventory Valuation</span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#714B67]">
            ₹{Number(totals.totalValuation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-700 font-medium">Asset value at standard cost price</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === 'ALL'
                ? 'bg-[#714B67] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#714B67] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Calculating inventory ledger positions...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No stock records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Cost (₹)</th>
                  <th className="py-3 px-4 text-right">Sale (₹)</th>
                  <th className="py-3 px-4 text-right">Purchased (In)</th>
                  <th className="py-3 px-4 text-right">Sold (Out)</th>
                  <th className="py-3 px-4 text-right font-bold">On Hand</th>
                  <th className="py-3 px-4 text-right">Valuation (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p: any) => {
                  const marginPct = p.salesPrice > 0 ? (((p.salesPrice - p.costPrice) / p.salesPrice) * 100).toFixed(0) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">
                        {p.category}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-700">
                        ₹{Number(p.costPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-900 font-medium">
                        ₹{Number(p.salesPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                        +{p.quantityPurchased}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600 font-semibold">
                        -{p.quantitySold}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.currentStock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.currentStock} Units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                        ₹{Number(p.stockValuation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
