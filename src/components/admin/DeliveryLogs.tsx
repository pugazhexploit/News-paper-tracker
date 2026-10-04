import React, { useState } from 'react';
import { DeliveryEntry, Newspaper, DeliveryStaff, Customer } from '../../types';
import {
  FileText,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Edit,
  Clock,
  MapPin,
  Camera,
  Search,
  X
} from 'lucide-react';
import { exportDeliveriesToCSV } from '../../services/reportService';

interface DeliveryLogsProps {
  entries: DeliveryEntry[];
  newspapers: Newspaper[];
  staffList: DeliveryStaff[];
  customers: Customer[];
  onUpdateEntry: (entry: DeliveryEntry) => void;
  lang: 'en' | 'ta';
}

export const DeliveryLogs: React.FC<DeliveryLogsProps> = ({
  entries,
  newspapers,
  staffList,
  customers,
  onUpdateEntry,
  lang
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterPaper, setFilterPaper] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing correction modal
  const [editingEntry, setEditingEntry] = useState<DeliveryEntry | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<'delivered' | 'missed' | 'pending'>('delivered');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  const filteredEntries = entries.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterStaff !== 'all' && e.staffId !== filterStaff) return false;
    if (filterPaper !== 'all' && e.newspaperId !== filterPaper) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        e.customerName.toLowerCase().includes(q) ||
        e.newspaperName.toLowerCase().includes(q) ||
        e.staffName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const openCorrectionModal = (e: DeliveryEntry) => {
    setEditingEntry(e);
    setCorrectionStatus(e.status as any);
    setCorrectionNotes(e.notes || '');
    setCorrectionReason(e.missedReason || '');
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const updated: DeliveryEntry = {
      ...editingEntry,
      status: correctionStatus,
      notes: correctionNotes || undefined,
      missedReason: correctionStatus === 'missed' ? correctionReason : undefined,
      deliveredAt: correctionStatus === 'delivered' ? (editingEntry.deliveredAt || new Date().toISOString()) : undefined,
    };

    onUpdateEntry(updated);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'விநியோகப் பதிவுகள் மற்றும் தணிக்கை' : 'Daily Delivery Entries & Audit Logs'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'விநியோக நிலை, விடுபட்டதற்கான காரணங்கள் மற்றும் புகைப்பட ஆதாரங்களை சரிபார்க்கவும்.'
              : 'Audit delivery logs, GPS timestamps, proof photos, and execute authorized supervisor corrections.'}
          </p>
        </div>

        <button
          onClick={() => exportDeliveriesToCSV(entries)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Export All Logs (CSV)</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, staff, paper..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses ({entries.length})</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="missed">Missed</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>

        {/* Staff */}
        <div>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Delivery Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Newspaper */}
        <div>
          <select
            value={filterPaper}
            onChange={(e) => setFilterPaper(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Newspapers</option>
            {newspapers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Newspaper & Quantity</th>
                <th className="px-5 py-3.5">Delivery Staff</th>
                <th className="px-5 py-3.5">Status & Time</th>
                <th className="px-5 py-3.5">GPS Confirmation</th>
                <th className="px-5 py-3.5">Notes / Missed Reason</th>
                <th className="px-5 py-3.5 text-right">Correct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No delivery log entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{entry.customerName}</div>
                      <div className="text-[10px] text-slate-400">ID: {entry.customerId}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{entry.newspaperName}</div>
                      <div className="text-[11px] text-sky-600 font-bold">Qty: {entry.quantity}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-700">{entry.staffName}</div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          entry.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : entry.status === 'missed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {entry.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {entry.deliveredAt ? new Date(entry.deliveredAt).toLocaleTimeString() : 'Pending'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {entry.latitude && entry.longitude ? (
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-max">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">Not captured</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {entry.missedReason ? (
                        <span className="text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded inline-block text-[11px]">
                          ⚠️ {entry.missedReason}
                        </span>
                      ) : entry.notes ? (
                        <span className="text-slate-600 italic text-[11px]">"{entry.notes}"</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openCorrectionModal(entry)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                        title="Supervisor Correction"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Correction Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Admin Delivery Status Correction
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4 mt-4">
              <div>
                <span className="text-slate-500 block">Customer:</span>
                <span className="font-bold text-slate-900 text-sm">{editingEntry.customerName}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Newspaper:</span>
                <span className="font-semibold text-slate-800">{editingEntry.newspaperName}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Corrected Delivery Status
                </label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="delivered">Delivered</option>
                  <option value="missed">Missed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {correctionStatus === 'missed' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reason for Missed Delivery
                  </label>
                  <input
                    type="text"
                    required
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Locked gate, Customer out of town"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason for Change
                </label>
                <textarea
                  rows={2}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="e.g. Verified by phone call with customer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Save & Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
