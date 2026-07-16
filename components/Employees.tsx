
import React, { useState } from 'react';
import { Employee, Assignment } from '../types';
import { User, Mail, Briefcase, Plus, Search, Calendar, Package, X, ChevronRight, Box, Tag, ArrowLeftCircle } from 'lucide-react';

interface EmployeesProps {
  employees: Employee[];
  assignments: Assignment[];
  onAddEmployee: (employee: Employee) => void;
  onReturnAsset: (assignment: Assignment) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, assignments, onAddEmployee, onReturnAsset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
        const activeItems = getEmployeeAssignments(emp.id).length;
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
                    {activeItems} Active Items
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                    <p className="text-slate-300">{selectedEmployee.role} • {selectedEmployee.department}</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedEmployee.email}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="text-blue-600" />
                Assigned Assets
              </h3>
              
              {getEmployeeAssignments(selectedEmployee.id).length > 0 ? (
                <div className="space-y-3">
                  {getEmployeeAssignments(selectedEmployee.id).map(assign => (
                    <div key={assign.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <p className="font-bold text-slate-800">{assign.productName}</p>
                        {assign.productNameZh && <p className="text-xs text-slate-500">{assign.productNameZh}</p>}
                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                             <span>Qty: {assign.quantity}</span>
                             <span>Assigned: {new Date(assign.assignedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                            if(window.confirm(`Confirm return of ${assign.productName} from ${selectedEmployee.name}? Stock will increase by ${assign.quantity}.`)) {
                                onReturnAsset(assign);
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                      >
                        <ArrowLeftCircle size={14} />
                        Return to Inventory
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No items currently assigned.</p>
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
