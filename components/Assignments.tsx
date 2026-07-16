
import React, { useState } from 'react';
import { Assignment } from '../types';
import { User, Calendar, Tag, Search, Box, UserCheck } from 'lucide-react';

interface AssignmentsProps {
  assignments: Assignment[];
}

const Assignments: React.FC<AssignmentsProps> = ({ assignments }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssignments = assignments.filter(a => 
    a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by employee or product..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{assignment.employeeName}</h3>
                    <p className="text-xs text-slate-500">Employee</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  assignment.status === 'Active' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {assignment.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Box size={16} className="text-slate-400" />
                  <span className="font-medium">{assignment.productName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Tag size={16} />
                    <span>Qty: {assignment.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={16} />
                    <span>{new Date(assignment.assignedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {/* Audit Trail */}
                <div className="pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                   <UserCheck size={12} />
                   <span>Assigned by: {assignment.performedBy || 'System'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500">
            <User size={48} className="mx-auto mb-3 text-slate-200" />
            <p>No active assignments found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
