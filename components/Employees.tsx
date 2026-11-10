
import React, { useState } from 'react';
import { Employee, Assignment, Product } from '../types';
import { User, Mail, Briefcase, Plus, Search, Calendar, Package, X, ChevronRight, Box, Tag, ArrowLeftCircle, Image as ImageIcon, FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { exportEmployeeAssetsToExcel, exportEmployeeAssetsToPdf } from '../services/exportService';

interface EmployeesProps {
  employees: Employee[];
  assignments: Assignment[];
  products?: Product[];
  onAddEmployee: (employee: Employee) => void;
  onReturnAsset: (assignment: Assignment) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, assignments, products = [], onAddEmployee, onReturnAsset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    email: '',
    department: '',
    role: ''
  });

  // Filter Employees
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployee.name && newEmployee.email) {
      onAddEmployee({
        id: Date.now().toString(),
        name: newEmployee.name,
        email: newEmployee.email,
        department: newEmployee.department || 'General',
        role: newEmployee.role || 'Staff',
        joinedDate: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewEmployee({ name: '', email: '', department: '', role: '' });
    }
  };

  const getEmployeeAssignments = (empId: string) => {
    return assignments.filter(a => a.employeeId === empId && a.status === 'Active');
  };

  const handleExportExcel = (emp: Employee) => {
    try {
      setIsExportingExcel(true);
      exportEmployeeAssetsToExcel(emp, assignments, products);
    } catch (err: any) {
      alert(`Export to Excel failed: ${err.message}`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async (emp: Employee) => {
    try {
      setIsExportingPdf(true);
      await exportEmployeeAssetsToPdf(emp, assignments, products);
    } catch (err: any) {
      alert(`Generate PDF failed: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const selectedEmpAssignments = selectedEmployee ? getEmployeeAssignments(selectedEmployee.id) : [];
  const selectedEmpTotalUnits = selectedEmpAssignments.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  const selectedEmpValuation = selectedEmpAssignments.reduce((sum, a) => {
    const prod = products.find(p => p.id === a.productId || p.name === a.productName);
    return sum + (Number(a.quantity) || 0) * (prod?.price ?? 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search employees by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
        
        <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
        <Plus size={20} />
        Add Employee
        </button>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
        {filteredEmployees.map((emp) => {
        const empAssignments = getEmployeeAssignments(emp.id);
        const activeItems = empAssignments.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
        return (
            <div 
            key={emp.id} 
            onClick={() => setSelectedEmployee(emp)}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
            >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {emp.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{emp.name}</h3>
                    <p className="text-xs text-slate-500">{emp.role}</p>
                </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-500" size={20} />
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-slate-400" />
                <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{emp.email}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Joined {new Date(emp.joinedDate).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-full font-medium ${activeItems > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {activeItems} {activeItems === 1 ? 'Active Item' : 'Active Items'}
                </span>
            </div>
            </div>
        );
        })}
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add New Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={newEmployee.department} onChange={e => setNewEmployee({...newEmployee, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 mt-4">
                Add Employee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col mx-4">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                    <p className="text-slate-300 text-sm font-medium">{selectedEmployee.role} • {selectedEmployee.department}</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedEmployee.email}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Held Valuation</p>
                    <p className="text-xl font-black text-emerald-400">
                      ${selectedEmpValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400">{selectedEmpTotalUnits} units active</p>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white transition-colors p-1">
                    <X size={24} />
                  </button>
               </div>
            </div>

            {/* Quick Export Action Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Export Asset List:</span>
                <span className="text-[11px] text-slate-500 font-medium">({selectedEmpAssignments.length} unique items, {selectedEmpTotalUnits} units)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleExportExcel(selectedEmployee)}
                  disabled={isExportingExcel}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Download held assets list as Excel file (.xlsx)"
                >
                  {isExportingExcel ? (
                    <Loader2 size={15} className="animate-spin text-emerald-600" />
                  ) : (
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                  )}
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPdf(selectedEmployee)}
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                  title="Generate and download official PDF Handover Slip with photos and signatures"
                >
                  {isExportingPdf ? (
                    <Loader2 size={15} className="animate-spin text-white" />
                  ) : (
                    <FileText size={15} className="text-white" />
                  )}
                  <span>Generate PDF</span>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="text-blue-600" size={20} />
                  <span>Currently Held Assets</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                    {selectedEmpTotalUnits} Total Units
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    ${selectedEmpValuation.toFixed(2)} Total
                  </span>
                </div>
              </h3>
              
              {selectedEmpAssignments.length > 0 ? (
                <div className="space-y-3">
                  {selectedEmpAssignments.map(assign => {
                    const prod = products.find(p => p.id === assign.productId || p.name === assign.productName);
                    const unitPrice = prod?.price ?? 0;
                    const itemTotal = (Number(assign.quantity) || 0) * unitPrice;

                    return (
                      <div key={assign.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3.5 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {prod?.imageUrl ? (
                            <img src={prod.imageUrl} alt={assign.productName} className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <ImageIcon size={20} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="font-bold text-slate-800 truncate text-sm">{assign.productName}</p>
                              {assign.productNameZh && <span className="text-xs text-slate-400 truncate">({assign.productNameZh})</span>}
                            </div>
                            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs text-slate-400 mt-1">
                              <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Qty: {assign.quantity}</span>
                              <span className="font-semibold text-slate-600">${unitPrice.toFixed(2)}/ea</span>
                              <span>•</span>
                              <span className="font-bold text-emerald-600">${itemTotal.toFixed(2)}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline text-slate-400">Assigned: {new Date(assign.assignedDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                              if(window.confirm(`Confirm return of ${assign.productName} from ${selectedEmployee.name}? Stock will increase by ${assign.quantity}.`)) {
                                  onReturnAsset(assign);
                              }
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex-shrink-0 whitespace-nowrap active:scale-95"
                        >
                          <ArrowLeftCircle size={14} />
                          Return to Inventory
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Package size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">No assets currently assigned</p>
                  <p className="text-xs text-slate-400 mt-1">You can still export a clearance slip using the buttons above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
