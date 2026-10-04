import React, { useState } from 'react';
import { DeliveryStaff, DeliveryRoute } from '../../types';
import {
  UserPlus,
  Bike,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Navigation,
  X,
  Search
} from 'lucide-react';

interface StaffManagementProps {
  staffList: DeliveryStaff[];
  routes: DeliveryRoute[];
  onSaveStaff: (staff: DeliveryStaff) => void;
  onDeleteStaff: (id: string) => void;
  lang: 'en' | 'ta';
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staffList,
  routes,
  onSaveStaff,
  onDeleteStaff,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<DeliveryStaff | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [routeId, setRouteId] = useState('');
  const [shiftStatus, setShiftStatus] = useState<'off_duty' | 'on_route' | 'break'>('off_duty');
  const [searchQuery, setSearchQuery] = useState('');

  const openNewModal = () => {
    setEditingStaff(null);
    setFullName('');
    setPhone('+91 ');
    setEmail('');
    setRouteId(routes[0]?.id || '');
    setShiftStatus('off_duty');
    setIsModalOpen(true);
  };

  const openEditModal = (s: DeliveryStaff) => {
    setEditingStaff(s);
    setFullName(s.fullName);
    setPhone(s.phone);
    setEmail(s.email);
    setRouteId(s.routeId);
    setShiftStatus(s.shiftStatus);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    const staffObj: DeliveryStaff = {
      id: editingStaff ? editingStaff.id : `staff-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@papertrack.tn`,
      routeId: routeId || 'default-route',
      isActive: true,
      shiftStatus,
      currentLat: editingStaff?.currentLat || 11.3992,
      currentLng: editingStaff?.currentLng || 79.6936,
      lastLocationUpdate: editingStaff?.lastLocationUpdate || 'Just registered',
      batteryLevel: editingStaff?.batteryLevel || 100,
      gpsAccuracy: editingStaff?.gpsAccuracy || 10,
    };

    onSaveStaff(staffObj);
    setIsModalOpen(false);
  };

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'விநியோக ஊழியர்கள் மேலாண்மை' : 'Delivery Staff Management'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'உண்மையான விநியோக ஊழியர்களைப் பதிவுசெய்து, வழிகளை ஒதுக்கவும் (சிதம்பரம் வட்டம்).'
              : 'Add and manage real delivery staff members, contact numbers, and assigned circuits in Chidambaram (608001).'}
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{lang === 'ta' ? 'புதிய ஊழியர் சேர்க்க' : 'Add Delivery Staff'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search staff by name or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">No Delivery Staff Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Fake demo staff records have been removed. Add your real delivery partners to begin assigning routes and monitoring GPS in Chidambaram (608001).
          </p>
          <button
            onClick={openNewModal}
            className="mt-5 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer inline-flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Delivery Staff</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-sky-400 font-bold flex items-center justify-center text-sm shadow-md">
                      {staff.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{staff.fullName}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                          staff.shiftStatus === 'on_route'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {staff.shiftStatus === 'on_route' ? '🟢 Active On Route' : '⚪ Off-Duty'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(staff)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                      title="Edit Staff"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove staff member ${staff.fullName}?`)) {
                          onDeleteStaff(staff.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{staff.phone}</span>
                  </div>
                  {staff.email && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Navigation className="w-3.5 h-3.5 text-sky-600" />
                    <span className="font-semibold text-slate-800">
                      Location: Chidambaram (608001)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated: {staff.lastLocationUpdate || 'Active'}</span>
                <span>Accuracy: {staff.gpsAccuracy || 10}m</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingStaff ? 'Edit Staff Member' : 'Register Real Delivery Staff'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. K. Jayaraman"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (Calling & WhatsApp) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98401 23456"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Shift Status
                </label>
                <select
                  value={shiftStatus}
                  onChange={(e) => setShiftStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="off_duty">Off-Duty</option>
                  <option value="on_route">Active On Route</option>
                  <option value="break">On Break</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
