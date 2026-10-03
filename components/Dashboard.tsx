import React, { useState, useMemo } from 'react';
import { Product, Assignment, InventoryStats } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, AlertTriangle, PackageCheck, DollarSign } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  assignments: Assignment[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ products, assignments = [] }) => {
  const [chartCategory, setChartCategory] = useState<string>('All');
  
  const stats: InventoryStats = useMemo(() => {
    const totalProducts = products.length;
    // Total value includes Available Stock + Active Usage (excludes scrapped)
    const totalValue = products.reduce((acc, p) => {
      const activeUsage = assignments
        .filter(a => a.productId === p.id && a.status === 'Active')
        .reduce((sum, a) => sum + a.quantity, 0);
      return acc + ((p.quantity + activeUsage) * p.price);
    }, 0);
    const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;
    
    const categoryMap = new Map<string, number>();
    products.forEach(p => {
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
    });
    const categories = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    return { totalProducts, totalValue, lowStockCount, categories };
  }, [products, assignments]);

  const filteredChartProducts = useMemo(() => {
    if (chartCategory === 'All') return products;
    return products.filter(p => p.category === chartCategory);
  }, [products, chartCategory]);

  // Show all products without slicing
  const stockLevelData = useMemo(() => {
    return filteredChartProducts.map(p => {
      const activeUnits = assignments
        .filter(a => a.productId === p.id && a.status === 'Active')
        .reduce((sum, a) => sum + a.quantity, 0);

      const nameLabel = p.nameZh ? `${p.name} (${p.nameZh})` : p.name;
      const shortName = nameLabel.length > 15 ? nameLabel.substring(0, 14) + '…' : nameLabel;

      return {
        id: p.id,
        fullName: nameLabel,
        displayName: shortName,
        stock: p.quantity,
        active: activeUnits,
        min: p.minStock,
        isLow: p.quantity <= p.minStock
      };
    });
  }, [filteredChartProducts, assignments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Value</p>
            <p className="text-2xl font-bold text-slate-900">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Available Stock + Active Usage</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Products</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <PackageCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
            <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.lowStockCount}</p>
          </div>
          <div className={`p-3 rounded-full ${stats.lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active Categories</p>
            <p className="text-2xl font-bold text-slate-900">{stats.categories.length}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full text-purple-600">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stock Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Real-time Stock Levels</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing all {stockLevelData.length} items in warehouse
              </p>
            </div>
            {stats.categories.length > 1 && (
              <select
                value={chartCategory}
                onChange={(e) => setChartCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-600 focus:outline-none cursor-pointer self-start sm:self-auto"
              >
                <option value="All">All Categories ({products.length})</option>
                {stats.categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name} ({c.value})</option>
                ))}
              </select>
            )}
          </div>

          {stockLevelData.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: `${Math.max(420, stockLevelData.length * 48)}px`, height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockLevelData} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="displayName" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
                              <p className="font-bold text-sm text-slate-100 leading-tight">{data.fullName}</p>
                              <div className="pt-1.5 border-t border-slate-700/60 space-y-1">
                                <p className="flex justify-between gap-4">
                                  <span className="text-slate-400">Available Stock:</span>
                                  <span className={`font-mono font-bold ${data.isLow ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {data.stock} units
                                  </span>
                                </p>
                                {data.active > 0 && (
                                  <p className="flex justify-between gap-4">
                                    <span className="text-slate-400">Active Usage:</span>
                                    <span className="font-mono font-bold text-blue-400">
                                      {data.active} units
                                    </span>
                                  </p>
                                )}
                                <p className="flex justify-between gap-4">
                                  <span className="text-slate-400">Min Alert Level:</span>
                                  <span className="font-mono text-slate-300">
                                    {data.min} units
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="stock" radius={[4, 4, 0, 0]} name="Current Stock">
                      {stockLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isLow ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400 text-xs font-bold">
              No items in this category
            </div>
          )}

          <div className="flex gap-4 mt-4 justify-center text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span>Healthy Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>Below Min Level</span>
            </div>
          </div>
        </div>

        {/* Category Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Inventory by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
