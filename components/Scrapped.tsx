
import React from 'react';
import { ScrappedItem } from '../types';
import { Trash2, Calendar, AlertCircle } from 'lucide-react';

interface ScrappedProps {
  scrappedItems: ScrappedItem[];
}

const Scrapped: React.FC<ScrappedProps> = ({ scrappedItems }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Trash2 className="text-red-500" size={20} />
            Scrapped Assets Log
          </h3>
          <p className="text-sm text-slate-500 mt-1">History of removed or damaged inventory.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Scrapped By</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scrappedItems.length > 0 ? (
                scrappedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.productName}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-mono">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 bg-red-50 px-3 py-1 rounded-lg w-fit">
                        <AlertCircle size={14} className="text-red-500" />
                        {item.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.performedBy || 'System'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(item.scrappedDate).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Trash2 size={48} className="mx-auto mb-3 text-slate-200" />
                    <p>No scrapped items recorded.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Scrapped;
