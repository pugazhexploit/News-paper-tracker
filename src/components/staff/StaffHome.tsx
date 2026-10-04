import React, { useState } from 'react';
import {
  DeliveryStaff,
  DeliveryRoute,
  Customer,
  DeliveryEntry,
  Newspaper
} from '../../types';
import {
  Bike,
  Play,
  Square,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Compass,
  ArrowRight,
  Battery,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { formatDistance, calculateDistanceMeters, openExternalGoogleMapsNavigation } from '../../services/locationService';
import { CustomerLocationDetectionModal } from '../common/CustomerLocationDetectionModal';

interface StaffHomeProps {
  staff: DeliveryStaff;
  route?: DeliveryRoute;
  customers: Customer[];
  entries: DeliveryEntry[];
  newspapers: Newspaper[];
  staffList?: DeliveryStaff[];
  onToggleShift: (newStatus: 'on_route' | 'off_duty') => void;
  onNavigateToTab: (tab: string) => void;
  onSaveCustomer?: (customer: Customer) => void;
  lang: 'en' | 'ta';
}

export const StaffHome: React.FC<StaffHomeProps> = ({
  staff,
  route,
  customers,
  entries,
  newspapers,
  staffList = [],
  onToggleShift,
  onNavigateToTab,
  onSaveCustomer,
  lang
}) => {
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const isOnRoute = staff.shiftStatus === 'on_route';

  // Customer stops for this staff member
  const assignedCustomers = customers.filter((c) => c.assignedStaffId === staff.id);

  const getCustomerDeliveryStatus = (customerId: string) => {
    const custEntries = entries.filter((e) => e.customerId === customerId);
    if (custEntries.some((e) => e.status === 'delivered')) {
      const activeCust = customers.find((c) => c.id === customerId);
      const totalSubs = activeCust?.subscriptions.filter((s) => s.isActive).length || 0;
      const deliveredSubs = custEntries.filter((e) => e.status === 'delivered').length;
      if (deliveredSubs >= totalSubs && totalSubs > 0) return 'delivered';
    }
    if (custEntries.some((e) => e.status === 'missed')) return 'missed';
    return 'pending';
  };

  const totalStops = assignedCustomers.length;
  const deliveredStops = assignedCustomers.filter((c) => getCustomerDeliveryStatus(c.id) === 'delivered').length;
  const pendingStops = assignedCustomers.filter((c) => getCustomerDeliveryStatus(c.id) === 'pending').length;
  const missedStops = assignedCustomers.filter((c) => getCustomerDeliveryStatus(c.id) === 'missed').length;

  const totalCopiesRequired = assignedCustomers.reduce(
    (sum, c) => sum + c.subscriptions.filter((s) => s.isActive).reduce((a, b) => a + b.quantity, 0),
    0
  );

  const totalCopiesDelivered = entries
    .filter((e) => e.staffId === staff.id && e.status === 'delivered')
    .reduce((sum, e) => sum + e.quantity, 0);

  // Find nearest pending customer if current coordinates exist
  let nearestCustomer: { customer: Customer; distanceMeters: number } | null = null;
  if (staff.currentLat && staff.currentLng) {
    const pendings = assignedCustomers.filter((c) => getCustomerDeliveryStatus(c.id) === 'pending');
    for (const p of pendings) {
      const d = calculateDistanceMeters(staff.currentLat, staff.currentLng, p.latitude, p.longitude);
      if (!nearestCustomer || d < nearestCustomer.distanceMeters) {
        nearestCustomer = { customer: p, distanceMeters: d };
      }
    }
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Shift Control Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white">{staff.fullName}</h2>
              <p className="text-xs text-slate-300 font-medium">
                {route?.name || 'Chidambaram Morning Route'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/10">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnRoute ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>{isOnRoute ? 'ON SHIFT' : 'OFF DUTY'}</span>
          </div>
        </div>

        {/* GPS tracking status bar */}
        <div className="mt-5 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Navigation className={`w-4 h-4 ${isOnRoute ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-slate-200">
              GPS Geofencing: {isOnRoute ? 'Active (50m House Arrival Alert)' : 'Paused'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>Accuracy: ~{staff.gpsAccuracy || 8}m</span>
          </div>
        </div>

        {/* Shift Toggle Button & Add Customer Row */}
        <div className="mt-5 space-y-2">
          {isOnRoute ? (
            <button
              onClick={() => onToggleShift('off_duty')}
              className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>{lang === 'ta' ? 'பணியை முடிக்கவும் (Stop Shift)' : 'Complete Shift (Stop Location)'}</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleShift('on_route')}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{lang === 'ta' ? 'அதிகாலை விநியோகத்தைத் தொடங்கு (Start Shift)' : 'Start Delivery Shift (Share GPS)'}</span>
            </button>
          )}

          {/* Quick Register Customer Button */}
          {onSaveCustomer && (
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>{lang === 'ta' ? 'புதிய வாடிக்கையாளரைச் சேர்க்க (GPS)' : 'Add Customer at Current House (Auto GPS)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Houses</span>
          <p className="text-xl font-black text-slate-900 mt-1">{totalStops}</p>
          <span className="text-[10px] text-slate-500 font-semibold">{totalCopiesRequired} papers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Delivered</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{deliveredStops}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{totalCopiesDelivered} copies</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-sky-600 block">Pending</span>
          <p className="text-xl font-black text-sky-600 mt-1">{pendingStops}</p>
          <span className="text-[10px] text-sky-700 font-semibold">{missedStops} missed</span>
        </div>
      </div>

      {/* Nearest Next Stop Recommendation Card */}
      {nearestCustomer && (
        <div className="bg-sky-50 border border-sky-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-sky-800 mb-2">
            <div className="flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>{lang === 'ta' ? 'அடுத்த வீடு (அருகில்)' : 'Next Stop Ahead'}</span>
            </div>
            <span className="bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full text-[11px]">
              {formatDistance(nearestCustomer.distanceMeters)} away
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base">
            {nearestCustomer.customer.fullName}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            #{nearestCustomer.customer.houseNumber}, {nearestCustomer.customer.street}, {nearestCustomer.customer.area}
          </p>

          <div className="mt-4 flex items-center space-x-2">
            <button
              onClick={() => openExternalGoogleMapsNavigation(nearestCustomer.customer.latitude, nearestCustomer.customer.longitude)}
              className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate in Google Maps</span>
            </button>

            <button
              onClick={() => onNavigateToTab('customers')}
              className="py-2.5 px-4 bg-white border border-sky-300 text-sky-800 font-bold text-xs rounded-xl hover:bg-sky-100 transition cursor-pointer"
            >
              Deliver Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateToTab('map')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="p-2 w-9 h-9 bg-sky-100 text-sky-700 rounded-xl mb-3 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {lang === 'ta' ? 'வரைபடம் காண்க' : 'Route Map'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live pins & turns
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab('customers')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-sky-300 transition text-left cursor-pointer flex flex-col justify-between"
        >
          <div className="p-2 w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl mb-3 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {lang === 'ta' ? 'இன்றைய பட்டியல்' : 'Customer List'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              One-tap mark delivered
            </p>
          </div>
        </button>
      </div>

      {/* Automatic Customer Location Detection Modal */}
      {onSaveCustomer && (
        <CustomerLocationDetectionModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onSaveCustomer={(c) => {
            onSaveCustomer(c);
            setIsAddCustomerOpen(false);
          }}
          existingCustomers={customers}
          newspapers={newspapers}
          staffList={staffList.length > 0 ? staffList : [staff]}
          defaultStaffId={staff.id}
          lang={lang}
        />
      )}
    </div>
  );
};
