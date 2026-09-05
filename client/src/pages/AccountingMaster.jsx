import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export default function AccountingMaster() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('accounts');
  
  // State for forms
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'expense' });
  const [newJournal, setNewJournal] = useState({ name: '', type: 'general' });
  const [newAnalytic, setNewAnalytic] = useState({ name: '', type: 'expense' });

  // Queries
  const { data: accounts } = useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get('/accounts')).data });
  const { data: journals } = useQuery({ queryKey: ['journals'], queryFn: async () => (await api.get('/journals')).data });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: async () => (await api.get('/analytic-accounts')).data });

  // Mutations
  const addAccount = useMutation({ mutationFn: (acc) => api.post('/accounts', acc), onSuccess: () => { queryClient.invalidateQueries(['accounts']); setNewAccount({ code: '', name: '', type: 'expense' }) }});
  const addJournal = useMutation({ mutationFn: (jrn) => api.post('/journals', jrn), onSuccess: () => { queryClient.invalidateQueries(['journals']); setNewJournal({ name: '', type: 'general' }) }});
  const addAnalytic = useMutation({ mutationFn: (anl) => api.post('/analytic-accounts', anl), onSuccess: () => { queryClient.invalidateQueries(['analytics']); setNewAnalytic({ name: '', type: 'expense' }) }});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Accounting Configuration</h1>

      <div className="flex border-b border-gray-light">
        <button onClick={() => setActiveTab('accounts')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'accounts' ? 'border-b-2 border-primary text-primary' : 'text-gray-dark hover:text-primary'}`}>Chart of Accounts</button>
        <button onClick={() => setActiveTab('journals')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'journals' ? 'border-b-2 border-primary text-primary' : 'text-gray-dark hover:text-primary'}`}>Journals</button>
        <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 font-medium text-sm ${activeTab === 'analytics' ? 'border-b-2 border-primary text-primary' : 'text-gray-dark hover:text-primary'}`}>Analytic Accounts</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-light">
        {activeTab === 'accounts' && (
          <div className="p-6 space-y-6">
            <div className="flex gap-4 items-end bg-background-secondary p-4 rounded-md">
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Code</label><input type="text" className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newAccount.code} onChange={e => setNewAccount({...newAccount, code: e.target.value})} /></div>
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Name</label><input type="text" className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} /></div>
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Type</label><select className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})}><option value="asset">Asset</option><option value="liability">Liability</option><option value="expense">Expense</option><option value="income">Income</option><option value="capital">Capital</option></select></div>
              <button onClick={() => addAccount.mutate(newAccount)} disabled={!newAccount.code || !newAccount.name} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-[#5a3b52] disabled:opacity-50">Add Account</button>
            </div>
            <table className="min-w-full divide-y divide-gray-light">
              <thead><tr><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Code</th><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Name</th><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Type</th></tr></thead>
              <tbody className="divide-y divide-gray-light text-sm">
                {accounts?.map(acc => <tr key={acc.id}><td className="py-3">{acc.code}</td><td className="py-3 font-medium">{acc.name}</td><td className="py-3 capitalize text-gray-dark">{acc.type}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'journals' && (
          <div className="p-6 space-y-6">
            <div className="flex gap-4 items-end bg-background-secondary p-4 rounded-md">
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Name</label><input type="text" className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newJournal.name} onChange={e => setNewJournal({...newJournal, name: e.target.value})} /></div>
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Type</label><select className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newJournal.type} onChange={e => setNewJournal({...newJournal, type: e.target.value})}><option value="sale">Sale</option><option value="purchase">Purchase</option><option value="bank">Bank</option><option value="cash">Cash</option><option value="general">General</option></select></div>
              <button onClick={() => addJournal.mutate(newJournal)} disabled={!newJournal.name} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-[#5a3b52] disabled:opacity-50">Add Journal</button>
            </div>
            <table className="min-w-full divide-y divide-gray-light">
              <thead><tr><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Name</th><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Type</th></tr></thead>
              <tbody className="divide-y divide-gray-light text-sm">
                {journals?.map(jrn => <tr key={jrn.id}><td className="py-3 font-medium">{jrn.name}</td><td className="py-3 capitalize text-gray-dark">{jrn.type}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 space-y-6">
            <div className="flex gap-4 items-end bg-background-secondary p-4 rounded-md">
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Name</label><input type="text" className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newAnalytic.name} onChange={e => setNewAnalytic({...newAnalytic, name: e.target.value})} /></div>
              <div className="flex-1"><label className="block text-xs font-medium text-gray-dark mb-1">Type</label><select className="w-full px-3 py-2 border border-gray-light rounded-md text-sm" value={newAnalytic.type} onChange={e => setNewAnalytic({...newAnalytic, type: e.target.value})}><option value="income">Income</option><option value="expense">Expense</option></select></div>
              <button onClick={() => addAnalytic.mutate(newAnalytic)} disabled={!newAnalytic.name} className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-[#5a3b52] disabled:opacity-50">Add Analytic Account</button>
            </div>
            <table className="min-w-full divide-y divide-gray-light">
              <thead><tr><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Name</th><th className="text-left text-xs font-medium text-gray-dark uppercase pb-2">Type</th></tr></thead>
              <tbody className="divide-y divide-gray-light text-sm">
                {analytics?.map(anl => <tr key={anl.id}><td className="py-3 font-medium">{anl.name}</td><td className="py-3 capitalize text-gray-dark">{anl.type}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
