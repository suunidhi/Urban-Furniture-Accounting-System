import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'

  const [formData, setFormData] = useState({
    name: '', type: 'goods', sales_price: '', cost_price: '', category_id: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        type: product.type,
        sales_price: product.sales_price,
        cost_price: product.cost_price,
        category_id: product.category_id || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', type: 'goods', sales_price: '', cost_price: '', category_id: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalCategoryId = formData.category_id;
      
      // If user selected "new" and provided a name, create the category first
      if (formData.category_id === 'new' && newCategoryName.trim()) {
        const catRes = await api.post('/products/categories', { name: newCategoryName.trim() });
        finalCategoryId = catRes.data.id;
      }

      const payload = { ...formData, category_id: finalCategoryId === 'new' ? null : finalCategoryId };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      handleCloseForm();
      fetchData();
      setNewCategoryName('');
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to archive this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to archive product');
      }
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.type === 'goods' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
        }`}>
          {row.type}
        </span>
      )
    },
    { header: 'Category', render: (row) => row.category ? row.category.name : '-' },
    { header: 'Sales Price', render: (row) => `$${Number(row.sales_price).toFixed(2)}` },
    { header: 'Cost', render: (row) => `$${Number(row.cost_price).toFixed(2)}` },
    { header: 'Stock', render: (row) => <span className={row.stock <= 0 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>{Number(row.stock || 0).toFixed(0)}</span> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenForm(row); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-900">Archive</button>
        </div>
      )
    }
  ];

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">
            {editingProduct ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={handleCloseForm} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow border border-odoo-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                  <option value="goods">Goods (Storable Product)</option>
                  <option value="service">Service</option>
                  <option value="combo">Combo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="new" className="text-odoo-primary font-semibold">+ Add New Category...</option>
                </select>
                {formData.category_id === 'new' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">New Category Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)} 
                      placeholder="e.g. Electronic, Furniture..."
                      className="block w-full border border-indigo-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-indigo-50" 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sales Price</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" step="0.01" name="sales_price" value={formData.sales_price} onChange={handleChange} className="pl-7 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} className="pl-7 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-odoo-border">
              <button type="submit" className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium">
                Save Product
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
        <h2 className="text-2xl font-light text-odoo-primary">Products</h2>
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
            New Product
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : viewMode === 'list' ? (
        <DataTable 
          columns={columns} 
          data={products} 
          isLoading={isLoading}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 relative group cursor-pointer" onClick={() => handleOpenForm(product)}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
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
                  product.type === 'goods' ? 'bg-orange-500' : 'bg-indigo-500'
                }`}>
                  {product.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{product.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      product.type === 'goods' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {product.type}
                    </span>
                    {product.category && (
                      <span className="text-xs text-gray-500 truncate">{product.category.name}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">Sales Price</div>
                  <div className="font-semibold text-gray-900">${Number(product.sales_price).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Cost</div>
                  <div className="font-semibold text-gray-900">${Number(product.cost_price).toFixed(2)}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-100 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Stock on Hand</span>
                    <span className={`font-bold ${product.stock <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {Number(product.stock || 0).toFixed(0)} Units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsList;
