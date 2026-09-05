import React, { useState, useEffect } from 'react';
import api from '../../api';

const ReportsList = () => {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('PL'); // 'PL' or 'BS'

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const [bsRes, plRes] = await Promise.all([
        api.get('/reports/balance-sheet'),
        api.get('/reports/profit-loss')
      ]);
      setBalanceSheet(bsRes.data);
      setProfitLoss(plRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const downloadCSV = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'PL') {
      csvContent += "Category,Account,Amount\n";
      csvContent += "Income,,\n";
      profitLoss.income.forEach(acc => {
        csvContent += `Income,${acc.name},${acc.balance.toFixed(2)}\n`;
      });
      csvContent += `Total Income,,${profitLoss.total_income.toFixed(2)}\n\n`;
      
      csvContent += "Expenses,,\n";
      profitLoss.expenses.forEach(acc => {
        csvContent += `Expenses,${acc.name},${acc.balance.toFixed(2)}\n`;
      });
      csvContent += `Total Expenses,,${profitLoss.total_expenses.toFixed(2)}\n\n`;
      csvContent += `Net Income,,${profitLoss.net_profit.toFixed(2)}\n`;
    } else {
      csvContent += "Assets,Amount,Liabilities & Capital,Amount\n";
      
      // We need to pair them up side by side for the CSV
      const maxRows = Math.max(balanceSheet.assets.length, balanceSheet.liabilities.length + balanceSheet.capital.length);
      const rightSide = [...balanceSheet.liabilities, ...balanceSheet.capital];
      
      for (let i = 0; i < maxRows; i++) {
        const asset = balanceSheet.assets[i] || { name: '', balance: 0 };
        const liability = rightSide[i] || { name: '', balance: 0 };
        
        csvContent += `${asset.name},${asset.name ? asset.balance.toFixed(2) : ''},${liability.name},${liability.name ? liability.balance.toFixed(2) : ''}\n`;
      }
      
      csvContent += `Total Assets,${balanceSheet.total_assets.toFixed(2)},Total Liabilities & Capital,${(balanceSheet.total_liabilities + balanceSheet.total_capital).toFixed(2)}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type === 'PL' ? 'Profit_Loss_Report' : 'Balance_Sheet'}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !balanceSheet || !profitLoss) {
    return <div className="p-6 text-center">Loading Reports...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-light text-odoo-primary">Financial Reports</h2>
        <div className="flex bg-gray-100 rounded p-1 border border-gray-200">
          <button 
            onClick={() => setActiveTab('PL')}
            className={`px-4 py-2 text-sm rounded transition-colors ${activeTab === 'PL' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Profit & Loss
          </button>
          <button 
            onClick={() => setActiveTab('BS')}
            className={`px-4 py-2 text-sm rounded transition-colors ${activeTab === 'BS' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Balance Sheet
          </button>
        </div>
      </div>

      {activeTab === 'PL' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none print:m-0">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="px-5 py-2 bg-odoo-primary text-white font-medium rounded-lg hover:bg-odoo-primaryHover transition shadow-sm">
                Print PDF
              </button>
              <button onClick={() => downloadCSV('PL')} className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm">
                Download CSV
              </button>
            </div>
            <div className="px-6 py-2 border border-gray-300 rounded-full font-bold text-gray-700 bg-white">
              2026
            </div>
            <button className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition">
              Back
            </button>
          </div>

          {/* Document Content */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Profit and Loss Report</h1>
            
            <table className="w-full text-left border-collapse border border-gray-300">
              <tbody>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <td className="p-4 font-bold text-gray-800 w-2/3">Income</td>
                  <td className="p-4 font-bold text-right text-gray-800">Balance</td>
                </tr>
                {profitLoss.income.length === 0 && (
                   <tr className="border-b border-gray-300">
                    <td className="p-4 text-gray-600 pl-8">No income recorded</td>
                    <td className="p-4 text-right text-gray-800 font-medium">$0.00</td>
                   </tr>
                )}
                {profitLoss.income.map(acc => (
                  <tr key={acc.id} className="border-b border-gray-300">
                    <td className="p-4 text-gray-700 pl-8">{acc.name}</td>
                    <td className="p-4 text-right text-gray-800 font-medium">${acc.balance.toFixed(2)}</td>
                  </tr>
                ))}
                
                <tr className="bg-gray-50 border-b border-gray-300">
                  <td className="p-4 font-bold text-gray-800">Total Income</td>
                  <td className="p-4 text-right text-green-700 font-bold">${profitLoss.total_income.toFixed(2)}</td>
                </tr>

                <tr className="bg-gray-100 border-b border-gray-300">
                  <td className="p-4 font-bold text-gray-800">Expenses</td>
                  <td className="p-4 font-bold text-right text-gray-800"></td>
                </tr>
                {profitLoss.expenses.length === 0 && (
                   <tr className="border-b border-gray-300">
                    <td className="p-4 text-gray-600 pl-8">No expenses recorded</td>
                    <td className="p-4 text-right text-gray-800 font-medium">$0.00</td>
                   </tr>
                )}
                {profitLoss.expenses.map(acc => (
                  <tr key={acc.id} className="border-b border-gray-300">
                    <td className="p-4 text-gray-700 pl-8">{acc.name}</td>
                    <td className="p-4 text-right text-gray-800 font-medium">${acc.balance.toFixed(2)}</td>
                  </tr>
                ))}
                
                <tr className="bg-gray-50 border-b border-gray-300">
                  <td className="p-4 font-bold text-gray-800">Total Expenses</td>
                  <td className="p-4 text-right text-red-700 font-bold">${profitLoss.total_expenses.toFixed(2)}</td>
                </tr>

                <tr className="bg-gray-200 border-t-4 border-gray-400">
                  <td className="p-5 font-bold text-gray-900 text-lg">Net Income</td>
                  <td className="p-5 text-right font-bold text-lg text-gray-900">${profitLoss.net_profit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'BS' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none print:m-0">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center print:hidden">
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="px-5 py-2 bg-odoo-primary text-white font-medium rounded-lg hover:bg-odoo-primaryHover transition shadow-sm">
                Print PDF
              </button>
              <button onClick={() => downloadCSV('BS')} className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm">
                Download CSV
              </button>
            </div>
            <div className="px-6 py-2 border border-gray-300 rounded-full font-bold text-gray-700 bg-white">
              2026
            </div>
            <button className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition">
              Back
            </button>
          </div>

          {/* Document Content */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Balance Sheet</h1>
            
            <div className="grid grid-cols-2 border border-gray-300">
              {/* Assets Column */}
              <div className="border-r border-gray-300">
                <div className="bg-gray-100 p-4 font-bold text-center border-b border-gray-300 text-gray-800">Assets</div>
                <div className="p-4 min-h-[300px]">
                  {balanceSheet.assets.length === 0 && <div className="text-gray-400 text-sm">No assets found</div>}
                  {balanceSheet.assets.map(acc => (
                    <div key={acc.id} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">{acc.name}</span>
                      <span className="font-medium text-gray-800">${acc.balance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-100 p-4 font-bold flex justify-between border-t border-gray-300">
                  <span>Total Asset</span>
                  <span className="text-blue-700">${balanceSheet.total_assets.toFixed(2)}</span>
                </div>
              </div>

              {/* Liabilities & Capital Column */}
              <div>
                <div className="bg-gray-100 p-4 font-bold text-center border-b border-gray-300 text-gray-800">Liabilities</div>
                <div className="p-4 min-h-[300px]">
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 mt-1">Capital</h4>
                  {balanceSheet.capital.length === 0 && <div className="text-gray-400 text-sm mb-4">No capital accounts</div>}
                  {balanceSheet.capital.map(acc => (
                    <div key={acc.id} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">{acc.name}</span>
                      <span className="font-medium text-gray-800">${acc.balance.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 mt-6">Liabilities</h4>
                  {balanceSheet.liabilities.length === 0 && <div className="text-gray-400 text-sm">No liability accounts</div>}
                  {balanceSheet.liabilities.map(acc => (
                    <div key={acc.id} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">{acc.name}</span>
                      <span className="font-medium text-gray-800">${acc.balance.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-100 p-4 font-bold flex justify-between border-t border-gray-300">
                  <span>Total Liability</span>
                  <span className="text-orange-700">${(balanceSheet.total_liabilities + balanceSheet.total_capital).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsList;
