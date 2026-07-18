
import React, { useState, useEffect } from 'react';
import { Product, OperationType, Employee } from '../types';
import { X, ArrowDownCircle, UserPlus, Trash2, Search, ChevronDown } from 'lucide-react';

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

  const selectedProduct = products.find(p => p.id === selectedProductId);

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
        if (product.quantity <= 0) {
            alert(`"${product.name}" available stock is 0. Cannot assign.`);
            return;
        }
        if (Number(quantity) > product.quantity) {
            alert(`Cannot assign ${quantity} units. Only ${product.quantity} units are available.`);
            return;
        }
        const emp = employees.find(e => e.id === employeeId);
        if (!emp) {
            alert("Please select a valid employee.");
            return;
        }
        employeeName = emp.name;
    }

    if (type === 'SCRAP') {
        if (Number(quantity) > product.quantity) {
            alert(`Cannot scrap ${quantity} units. Only ${product.quantity} units are available.`);
            return;
        }
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Select Product</label>
            {!initialProduct ? (
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search product (EN/CN)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedProductId(''); // Reset selection on search change
                  }}
                  className="w-full pl-12 pr-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-sm font-bold transition-all"
                />
                {searchTerm && !selectedProductId && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSearchTerm(p.name);
                        }}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <div className="overflow-hidden">
                            <span className="font-bold text-slate-700 truncate block text-sm">{p.name}</span>
                            <span className="text-xs text-slate-400 font-medium block">{p.nameZh}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md">QTY: {p.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold text-sm flex justify-between items-center">
                <div className="truncate">
                  {initialProduct.name} <span className="text-sm font-medium text-slate-500 ml-1">({initialProduct.nameZh})</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 whitespace-nowrap bg-slate-200/50 px-2.5 py-1 rounded-md">QTY: {initialProduct.quantity}</span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Quantity {type !== 'INBOUND' && selectedProduct && `(Max: ${selectedProduct.quantity})`}
            </label>
            <input
              type="number"
              min="1"
              max={type !== 'INBOUND' ? selectedProduct?.quantity : undefined}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-sm font-black transition-all"
            />
            {type !== 'INBOUND' && selectedProduct && Number(quantity) > selectedProduct.quantity && (
              <p className="mt-1.5 text-xs font-bold text-red-500 animate-fade-in flex items-center gap-1.5 ml-1">
                ⚠️ Cannot exceed available stock ({selectedProduct.quantity} available)
              </p>
            )}
            {type !== 'INBOUND' && selectedProduct && selectedProduct.quantity === 0 && (
              <p className="mt-1.5 text-xs font-bold text-red-500 animate-fade-in flex items-center gap-1.5 ml-1">
                ⚠️ Out of stock. Cannot perform this operation.
              </p>
            )}
          </div>

          {/* Type Specific Fields */}
          {type === 'ASSIGN' && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Select Employee</label>
              <div className="relative">
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full pl-5 pr-10 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-sm font-bold appearance-none cursor-pointer transition-all"
                >
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          )}

          {type === 'SCRAP' && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Reason for Scrap</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Broken screen, expired, lost"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 text-sm font-medium resize-none transition-all"
              />
            </div>
          )}

          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={type !== 'INBOUND' && selectedProduct && (selectedProduct.quantity === 0 || Number(quantity) > selectedProduct.quantity || Number(quantity) <= 0)}
              className={`flex-1 px-4 py-4 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all 
                ${type === 'INBOUND' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 
                  type === 'ASSIGN' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 
                  'bg-red-600 hover:bg-red-700 shadow-red-600/20'} 
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
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
