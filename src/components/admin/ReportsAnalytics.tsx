import React, { useState } from 'react';
import {
  DeliveryEntry,
  Newspaper,
  DeliveryStaff,
  Customer,
  DeliveryRoute
} from '../../types';
import {
  FileText,
  FileDown,
  Download,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Users,
  Award
} from 'lucide-react';
import {
  generateDailyReportPDF,
  exportDeliveriesToCSV,
  exportCustomersToCSV
} from '../../services/reportService';

interface ReportsAnalyticsProps {
  entries: DeliveryEntry[];
  newspapers: Newspaper[];
  staffList: DeliveryStaff[];
  customers: Customer[];
  routes: DeliveryRoute[];
  lang: 'en' | 'ta';
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  entries,
  newspapers,
  staffList,
  customers,
  routes,
  lang
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const deliveredCount = entries.filter((e) => e.status === 'delivered').length;
  const missedCount = entries.filter((e) => e.status === 'missed').length;
  const totalCount = entries.length;
  const successRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  // Staff Performance Breakdown
  const staffPerformance = staffList.map((staff) => {
    const staffEntries = entries.filter((e) => e.staffId === staff.id);
    const delivered = staffEntries.filter((e) => e.status === 'delivered').length;
    const missed = staffEntries.filter((e) => e.status === 'missed').length;
    const total = staffEntries.length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return {
      staff,
      total,
      delivered,
      missed,
      rate,
    };
  });

  const handleDownloadPDF = () => {
    generateDailyReportPDF(selectedDate, entries, newspapers, customers.length);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'அறிக்கைகள் & பகுப்பாய்வு' : 'Reports & Analytics Center'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'தினசரி மற்றும் வாராந்திர நாளிதழ் விநியோக சுருக்கம், பி.டி.எஃப் (PDF) மற்றும் சி.எஸ்.வி (CSV) பதிவிறக்கம்.'
              : 'Generate daily audit summaries, dispatch orders, staff efficiency logs, and export printable PDF & CSV files.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={() => exportDeliveriesToCSV(entries)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Logged Deliveries
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Scheduled for today</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              On-Time Success Rate
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{successRate}%</p>
          <span className="text-xs text-slate-500 mt-1 block">
            {deliveredCount} delivered successfully
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Exceptions & Missed
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{missedCount}</p>
          <span className="text-xs text-slate-500 mt-1 block">Requires follow-up</span>
        </div>
      </div>

      {/* Staff Performance League */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Delivery Staff Efficiency & Completion
            </h3>
          </div>
          <span className="text-xs text-slate-500">Live GPS tracking metrics</span>
        </div>

        <div className="space-y-4">
          {staffPerformance.map(({ staff, total, delivered, missed, rate }) => (
            <div
              key={staff.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-sky-400 font-bold flex items-center justify-center shrink-0">
                  {staff.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{staff.fullName}</h4>
                  <p className="text-slate-500">
                    Phone: {staff.phone} • Route ID: {staff.routeId}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 sm:text-right">
                <div>
                  <span className="text-slate-500 block">Deliveries:</span>
                  <span className="font-bold text-slate-900">
                    {delivered} / {total}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Accuracy:</span>
                  <span className="font-bold text-emerald-600 text-sm">{rate}%</span>
                </div>

                <div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      staff.shiftStatus === 'on_route'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {staff.shiftStatus === 'on_route' ? '🟢 Active Route' : '⚪ Off-Duty'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
