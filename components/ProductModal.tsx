
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { X, Sparkles, Loader2, DollarSign, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  categories: string[];
  product?: Product;
  warehouseId: string;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, categories, product, warehouseId }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    nameZh: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    minStock: 5,
    description: '',
    imageUrl: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        nameZh: '',
        sku: '',
        category: categories[0] || 'Other',
        quantity: 0,
        price: 0,
        minStock: 5,
        description: '',
        imageUrl: ''
      });
    }
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' || name === 'minStock' ? Number(value) : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const desc = await generateProductDescription(formData.name!, formData.category as string);
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nameZh || !formData.sku) return;
    
    const newProduct: Product = {
      id: product?.id || crypto.randomUUID(),
      warehouseId: product?.warehouseId || warehouseId,
      name: formData.name!,
      nameZh: formData.nameZh!,
      sku: formData.sku!,
      category: formData.category || 'Other',
      quantity: formData.quantity || 0,
      price: formData.price || 0,
      minStock: formData.minStock || 0,
      description: formData.description || '',
      lastUpdated: new Date().toISOString(),
      imageUrl: formData.imageUrl
    };
    onSave(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in md:p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-full md:h-auto max-h-[100vh] md:max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-50 bg-slate-50/30">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">{product ? 'Update Asset' : 'New Asset Entry'}</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Configure your product parameters in the system.</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Product Image</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={triggerImageUpload}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden group relative"
                >
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 mb-1">Upload a photo</p>
                  <p className="text-xs text-slate-500 mb-3">JPG, PNG, GIF up to 2MB. Recommended 1:1 ratio.</p>
                  <button type="button" onClick={triggerImageUpload} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-slate-50 transition-colors">Choose File</button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Label (EN)</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                readOnly={!!product}
                className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50/50 text-sm font-medium ${product ? 'opacity-50' : ''}`}
                placeholder="e.g. Server Rack A1"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Label (ZH)</label>
              <input
                type="text"
                name="nameZh"
                value={formData.nameZh}
                onChange={handleChange}
                required
                readOnly={!!product}
                className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50/50 text-sm font-medium ${product ? 'opacity-50' : ''}`}
                placeholder="e.g. 服务器机架"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Stock ID / SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                readOnly={!!product}
                className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50/50 text-sm font-mono ${product ? 'opacity-50' : ''}`}
                placeholder="SKU-XXXXX"
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full pl-5 pr-10 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50/50 text-sm font-bold appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-[38px] text-slate-400 pointer-events-none" size={16} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-1 md:col-span-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  readOnly={!!product}
                  className={`w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none bg-slate-50/50 text-sm font-black ${product ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Unit Price ($)</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none bg-slate-50/50 text-sm font-black text-emerald-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Min. Threshold</label>
                <input
                  type="number"
                  name="minStock"
                  min="0"
                  value={formData.minStock}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none bg-slate-50/50 text-sm font-black text-red-500"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Details</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !formData.name}
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-30"
                >
                  {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI Auto-Fill
                </button>
              </div>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50/50 text-sm font-medium resize-none leading-relaxed"
                placeholder="Specify hardware specifications or notes..."
              />
            </div>
          </div>
        </form>

        <div className="p-6 md:p-8 border-t border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-3">
          <button
            onClick={onClose}
            className="order-2 md:order-1 flex-1 px-8 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="order-1 md:order-2 flex-1 px-8 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all"
          >
            {product ? 'Save & Update' : 'Create'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;
