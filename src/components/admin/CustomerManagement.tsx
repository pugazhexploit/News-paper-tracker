import React, { useState } from 'react';
import {
  Customer,
  Newspaper,
  DeliveryStaff,
  Subscription
} from '../../types';
import {
  UserPlus,
  Search,
  MapPin,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileDown,
  Navigation,
  Layers,
  CreditCard,
  Building,
  Crosshair
} from 'lucide-react';
import { exportCustomersToCSV } from '../../services/reportService';
import { CustomerLocationDetectionModal } from '../common/CustomerLocationDetectionModal';

interface CustomerManagementProps {
  customers: Customer[];
  newspapers: Newspaper[];
  staffList: DeliveryStaff[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  lang: 'en' | 'ta';
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  newspapers,
  staffList,
  onSaveCustomer,
  onDeleteCustomer,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const areas = Array.from(new Set(customers.map((c) => c.area))).filter(Boolean);
  const paperMap = new Map(newspapers.map((p) => [p.id, p]));

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.houseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = selectedArea === 'all' || c.area === selectedArea;

    return matchesSearch && matchesArea;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'வாடிக்கையாளர் மேலாண்மை' : 'Customer & Subscription Registry'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'தானியங்கி ஜி.பி.எஸ் இடம் அறிதல் மற்றும் கூகிள் வரைபட முகவரி நிரப்புதல்.'
              : 'Auto-detect house GPS location, Google Maps geocoding, and newspaper subscriptions in Chidambaram (608001).'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportCustomersToCSV(customers, newspapers)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openNewCustomerModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'ta' ? 'புதிய வாடிக்கையாளர்' : 'Add Customer'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={
              lang === 'ta'
                ? 'பெயர், தொலைபேசி, தெரு, பகுதி வாரியாகத் தேடுங்கள்...'
                : 'Search by customer name, phone, street, house number, area...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {areas.length > 0 && (
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Chidambaram Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}

          <div className="text-xs text-slate-500 font-semibold px-2">
            Total: {filteredCustomers.length}
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-5 py-3.5">Customer & Contact</th>
                <th className="px-5 py-3.5">House & Street Address</th>
                <th className="px-5 py-3.5">Subscribed Newspapers</th>
                <th className="px-5 py-3.5">Assigned Staff</th>
                <th className="px-5 py-3.5">GPS Pin (Lat/Lng)</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="max-w-sm mx-auto text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-sm">No Customer Records Yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click "Add Customer" to detect GPS location and register customer households in Chidambaram (608001).
                      </p>
                      <button
                        onClick={openNewCustomerModal}
                        className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                      >
                        + Add First Customer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const staff = staffList.find((s) => s.id === customer.assignedStaffId);
                  const activeSubs = customer.subscriptions.filter((s) => s.isActive);

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{customer.fullName}</div>
                        <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">
                          #{customer.houseNumber}, {customer.street}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {customer.area}, {customer.city} - {customer.pincode}
                        </div>
                        {customer.landmark && (
                          <div className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            📍 {customer.landmark}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {activeSubs.map((sub) => {
                            const p = paperMap.get(sub.newspaperId);
                            return (
                              <div key={sub.id} className="flex items-center space-x-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: p?.color || '#0284c7' }}
                                />
                                <span className="font-semibold text-slate-700 text-[11px]">
                                  {p?.name || sub.newspaperId}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">
                                  (x{sub.quantity})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-700">
                          {staff?.fullName || 'Unassigned'}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {staff?.shiftStatus === 'on_route' ? '🟢 Active Shift' : '⚪ Off-Duty'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-1 text-slate-600 font-mono text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-sky-600" />
                          <span>
                            {customer.latitude.toFixed(4)}, {customer.longitude.toFixed(4)}
                          </span>
                        </div>
                        {customer.gpsAccuracy && (
                          <span className="text-[10px] text-emerald-600">
                            ±{customer.gpsAccuracy}m accuracy
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            customer.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : customer.paymentStatus === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {customer.paymentStatus}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          ₹{customer.monthlyAmount}/mo
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                            title="Edit Customer & Location"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete customer ${customer.fullName}?`)) {
                                onDeleteCustomer(customer.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automatic Customer Location Detection Modal */}
      <CustomerLocationDetectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveCustomer={(c) => {
          onSaveCustomer(c);
          setIsModalOpen(false);
        }}
        existingCustomers={customers}
        newspapers={newspapers}
        staffList={staffList}
        editingCustomer={editingCustomer}
        lang={lang}
      />
    </div>
  );
};
