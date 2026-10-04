import React from 'react';
import {
  Customer,
  Newspaper,
  DeliveryStaff,
  DeliveryRoute,
  DeliveryEntry,
  PaymentRecord
} from '../../types';
import {
  Users,
  Newspaper as PaperIcon,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Bike,
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowUpRight,
  IndianRupee,
  Layers
} from 'lucide-react';

interface AdminDashboardProps {
  customers: Customer[];
  newspapers: Newspaper[];
  staffList: DeliveryStaff[];
  routes: DeliveryRoute[];
  entries: DeliveryEntry[];
  payments: PaymentRecord[];
  onNavigateTab: (tab: string) => void;
  onOpenAIAssistant: () => void;
  lang: 'en' | 'ta';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  customers,
  newspapers,
  staffList,
  routes,
  entries,
  payments,
  onNavigateTab,
  onOpenAIAssistant,
  lang
}) => {
  // Total active subscriptions across customers
  const totalActiveSubscriptions = customers.reduce(
    (acc, c) => acc + c.subscriptions.filter((s) => s.isActive).length,
    0
  );

  // Total copies required today
  const totalRequiredCopies = customers.reduce(
    (acc, c) =>
      acc +
      c.subscriptions
        .filter((s) => s.isActive)
        .reduce((sum, sub) => sum + sub.quantity, 0),
    0
  );

  const deliveredEntries = entries.filter((e) => e.status === 'delivered');
  const deliveredCopies = deliveredEntries.reduce((sum, e) => sum + e.quantity, 0);

  const missedEntries = entries.filter((e) => e.status === 'missed');
  const missedCopies = missedEntries.reduce((sum, e) => sum + e.quantity, 0);

  const pendingCopies = Math.max(0, totalRequiredCopies - deliveredCopies - missedCopies);

  const completionRate = totalRequiredCopies > 0
    ? Math.round((deliveredCopies / totalRequiredCopies) * 100)
    : 0;

  const staffOnRoute = staffList.filter((s) => s.shiftStatus === 'on_route').length;

  // Newspaper distribution counts
  const paperStats = newspapers.map((paper) => {
    let required = 0;
    customers.forEach((c) => {
      c.subscriptions.forEach((sub) => {
        if (sub.isActive && sub.newspaperId === paper.id) {
          required += sub.quantity;
        }
      });
    });

    const delivered = entries
      .filter((e) => e.newspaperId === paper.id && e.status === 'delivered')
      .reduce((sum, e) => sum + e.quantity, 0);

    return {
      paper,
      required,
      delivered,
    };
  });

  // Area stats
  const areaCounts = customers.reduce<Record<string, { total: number; delivered: number }>>((acc, c) => {
    const area = c.area || 'General';
    if (!acc[area]) {
      acc[area] = { total: 0, delivered: 0 };
    }
    const copies = c.subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.quantity, 0);
    acc[area].total += copies;

    const del = entries
      .filter((e) => e.customerId === c.id && e.status === 'delivered')
      .reduce((sum, e) => sum + e.quantity, 0);
    acc[area].delivered += del;

    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Banner with Today's Live Status */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{lang === 'ta' ? 'அதிகாலை விநியோகக் கண்காணிப்பு' : 'Morning Distribution Dispatch Live'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lang === 'ta' ? 'சிதம்பரம் நாளிதழ் விநியோக மையம்' : 'Chidambaram Newspaper Distribution Hub'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              {lang === 'ta'
                ? 'சிதம்பரம் கீழரத, மேலரத, தெற்கு, வடக்கு ரத வீதிகள், கனகசபை நகர், அண்ணாமலை நகர் (கடலூர் மாவட்டம் - 608001) நேரலை ஜி.பி.எஸ் கண்காணிப்பு மற்றும் புவிவேலி எச்சரிக்கைகள்.'
                : 'Real-time GPS tracking, 50m geofencing arrival alerts, and daily newspaper delivery metrics across Chidambaram circuits (Cuddalore District, 608001).'}
            </p>
          </div>

          {/* Quick AI Action Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex flex-col space-y-2 max-w-xs">
            <div className="flex items-center space-x-2 text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>AI Route Copilot</span>
            </div>
            <p className="text-xs text-slate-200">
              Analyze morning traffic, depot sorting, and landmark verification using Google Maps data.
            </p>
            <button
              onClick={onOpenAIAssistant}
              className="mt-1 w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shadow-md"
            >
              <span>Ask AI Dispatcher</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'ta' ? 'வாடிக்கையாளர்கள்' : 'Active Customers'}
            </span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {customers.filter((c) => c.isActive).length}
          </p>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{totalActiveSubscriptions} active subscriptions</span>
          </div>
        </div>

        {/* Required Copies Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'ta' ? 'இன்றைய நாளிதழ்கள்' : 'Required Today'}
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <PaperIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {totalRequiredCopies}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Copies across {newspapers.filter((n) => n.isActive).length} newspapers
          </span>
        </div>

        {/* Delivered Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'ta' ? 'விநியோகிக்கப்பட்டது' : 'Delivered Copies'}
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {deliveredCopies}
          </p>
          <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
            <span className="font-bold text-slate-800">{completionRate}%</span>
            <span>completed so far</span>
          </div>
        </div>

        {/* Staff on duty */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {lang === 'ta' ? 'செயலில் உள்ள ஊழியர்' : 'Staff On Route'}
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Bike className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {staffOnRoute} <span className="text-sm font-normal text-slate-500">/ {staffList.length}</span>
          </p>
          <div className="flex items-center space-x-1 text-xs text-sky-600 font-semibold mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS Tracking Live</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Sub-Metrics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {lang === 'ta' ? 'இன்றைய விநியோக முன்னேற்றம்' : "Today's Delivery Progress"}
            </h3>
            <p className="text-xs text-slate-500">
              {deliveredCopies} of {totalRequiredCopies} copies distributed ({pendingCopies} pending, {missedCopies} missed)
            </p>
          </div>
          <span className="text-xl font-black text-sky-600">{completionRate}%</span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${totalRequiredCopies > 0 ? (deliveredCopies / totalRequiredCopies) * 100 : 0}%` }}
            title={`Delivered: ${deliveredCopies}`}
          />
          <div
            className="bg-rose-500 transition-all duration-500"
            style={{ width: `${totalRequiredCopies > 0 ? (missedCopies / totalRequiredCopies) * 100 : 0}%` }}
            title={`Missed: ${missedCopies}`}
          />
          <div
            className="bg-sky-400 transition-all duration-500"
            style={{ width: `${totalRequiredCopies > 0 ? (pendingCopies / totalRequiredCopies) * 100 : 0}%` }}
            title={`Pending: ${pendingCopies}`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 font-medium mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Delivered ({deliveredCopies})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-400" />
            <span>Pending ({pendingCopies})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Missed ({missedCopies})</span>
          </div>
        </div>
      </div>

      {/* Grid: Newspaper Breakdown & Area Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newspaper Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {lang === 'ta' ? 'நாளிதழ் வாரியான விநியோகம்' : 'Newspaper-wise Dispatch Today'}
              </h3>
              <button
                onClick={() => onNavigateTab('newspapers')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {paperStats.map(({ paper, required, delivered }) => {
                const pct = required > 0 ? Math.round((delivered / required) * 100) : 0;
                return (
                  <div key={paper.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: paper.color }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-slate-800">
                          {paper.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {delivered} / {required}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: paper.color || '#0284c7',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Area Stats */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {lang === 'ta' ? 'பகுதி வாரியான விநியோகம்' : 'Area-wise Delivery Coverage'}
              </h3>
              <button
                onClick={() => onNavigateTab('live_map')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                View on Map
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(areaCounts).map(([area, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
                return (
                  <div key={area} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-bold text-xs sm:text-sm text-slate-800">
                          {area}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {stats.delivered} / {stats.total} copies ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Circuit: Chidambaram Car Streets & Annamalai Nagar (608001)</span>
            <span className="font-semibold text-emerald-600">All routes active</span>
          </div>
        </div>
      </div>

      {/* Recent Delivery Entries Audit Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            {lang === 'ta' ? 'சமீபத்திய விநியோகப் பதிவுகள்' : 'Recent Delivery Activity'}
          </h3>
          <button
            onClick={() => onNavigateTab('deliveries')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
          >
            View All Logs
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No delivery records logged today yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      entry.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-700'
                        : entry.status === 'missed'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {entry.status === 'delivered' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertOctagon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {entry.customerName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {entry.newspaperName} (Qty: {entry.quantity}) • Delivered by {entry.staffName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      entry.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {entry.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {entry.deliveredAt ? new Date(entry.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
