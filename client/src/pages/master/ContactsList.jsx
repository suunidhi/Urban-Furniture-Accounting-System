import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const ContactsList = () => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'

  // Form state
  const [formData, setFormData] = useState({
    name: '', type: 'customer', email: '', mobile: '', 
    address_line: '', city: '', state: '', pincode: ''
  });

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/contacts');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleOpenForm = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name, type: contact.type, email: contact.email || '', 
        mobile: contact.mobile || '', address_line: contact.address_line || '', 
        city: contact.city || '', state: contact.state || '', pincode: contact.pincode || ''
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '', type: 'customer', email: '', mobile: '', 
        address_line: '', city: '', state: '', pincode: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts', formData);
      }
      handleCloseForm();
      fetchContacts();
    } catch (err) {
      console.error(err);
      alert('Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to archive this contact?')) {
      try {
        await api.delete(`/contacts/${id}`);
        fetchContacts();
      } catch (err) {
        console.error(err);
        alert('Failed to archive contact');
      }
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.type === 'customer' ? 'bg-green-100 text-green-800' : 
          row.type === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {row.type}
        </span>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'City', accessor: 'city' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleOpenForm(row); }}
            className="text-indigo-600 hover:text-indigo-900"
          >
            Edit
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            className="text-red-600 hover:text-red-900"
          >
            Archive
          </button>
        </div>
      )
    }
  ];

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">
            {editingContact ? 'Edit Contact' : 'New Contact'}
          </h2>
          <button 
            onClick={handleCloseForm}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Discard
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow border border-odoo-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm bg-white">
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address Line</label>
                <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm" />
              </div>
            </div>
            <div className="pt-4 flex gap-3 border-t border-odoo-border">
              <button type="submit" className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-odoo-primary">Contacts</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded p-1 border border-gray-200">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              List
            </button>
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium"
          >
            New Contact
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : viewMode === 'list' ? (
        <DataTable 
          columns={columns} 
          data={contacts} 
          isLoading={isLoading}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 relative group cursor-pointer" onClick={() => handleOpenForm(contact)}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Archive"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded flex items-center justify-center text-white text-lg font-bold shrink-0 ${
                  contact.type === 'customer' ? 'bg-green-500' : 
                  contact.type === 'vendor' ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{contact.name}</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      contact.type === 'customer' ? 'bg-green-100 text-green-800' : 
                      contact.type === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {contact.type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                {contact.email && (
                  <div className="flex items-center gap-2 truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.mobile && (
                  <div className="flex items-center gap-2 truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="truncate">{contact.mobile}</span>
                  </div>
                )}
                {contact.city && (
                  <div className="flex items-center gap-2 truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{contact.city}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsList;
