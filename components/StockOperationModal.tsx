
import React, { useState, useEffect } from 'react';
import { Product, OperationType, Employee } from '../types';
import { X, ArrowDownCircle, UserPlus, Trash2, Search } from 'lucide-react';

interface StockOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: OperationType;
  products: Product[];
  employees: Employee[];
  initialProduct?: Product;
}

const StockOperationModal: React.FC<StockOperationModalProps> = ({ 
  isOpen, onClose, onSubmit, type, products, employees, initialProduct 
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setSearchTerm(initialProduct.name);
    } else {
      setSelectedProductId('');
      setSearchTerm('');
    }
    setQuantity(1);
    setEmployeeId('');
    setReason('');
  }, [initialProduct, isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    let employeeName = '';
    if (type === 'ASSIGN') {
        const emp = employees.find(e => e.id === employeeId);
        if (!emp) {
            alert("Please select a valid employee.");
            return;
        }
        employeeName = emp.name;
    }

    onSubmit({
      productId: selectedProductId,
      productName: product.name,
      productNameZh: product.nameZh,
      quantity: Number(quantity),
      employeeId,
      employeeName,
      reason,
      type
    });
    onClose();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.nameZh && p.nameZh.includes(searchTerm)) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTitle = () => {
    switch (type) {
      case 'INBOUND': return 'Inbound Stock';
      case 'ASSIGN': return 'Assign Asset to Employee';
      case 'SCRAP': return 'Scrap Asset';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'INBOUND': return <ArrowDownCircle className="text-green-500" size={24} />;
      case 'ASSIGN': return <UserPlus className="text-blue-500" size={24} />;
      case 'SCRAP': return <Trash2 className="text-red-500" size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl font-bold text-slate-900">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Product Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Select Product</label>
            {!initialProduct ? (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search product (EN/CN)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedProductId(''); // Reset selection on search change
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
                {searchTerm && !selectedProductId && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSearchTerm(p.name);
                        }}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <div className="overflow-hidden">
                            <span className="font-medium text-slate-700 truncate block">{p.name}</span>
                            <span className="text-xs text-slate-500 block">{p.nameZh}</span>
                        </div>
                        <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">Qty: {p.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                {initialProduct.name} <span className="text-sm text-slate-500">({initialProduct.nameZh})</span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>

          {/* Type Specific Fields */}
          {type === 'ASSIGN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'SCRAP' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Scrap</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Broken screen, expired, lost"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-white font-medium rounded-lg shadow-md transition-all 
                ${type === 'INBOUND' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 
                  type === 'ASSIGN' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 
                  'bg-red-600 hover:bg-red-700 shadow-red-500/30'}`}
            >
              Confirm
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StockOperationModal;
