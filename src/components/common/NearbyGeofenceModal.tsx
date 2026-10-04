import React from 'react';
import { Customer, Newspaper, DeliveryStaff } from '../../types';
import { MapPin, CheckCircle, X, BellRing, Navigation } from 'lucide-react';
import { formatDistance, openExternalGoogleMapsNavigation } from '../../services/locationService';

interface NearbyGeofenceModalProps {
  customer: Customer | null;
  distanceMeters: number;
  newspapers: Newspaper[];
  staff: DeliveryStaff;
  onConfirmDelivered: (customer: Customer) => void;
  onDismiss: () => void;
  lang: 'en' | 'ta';
}

export const NearbyGeofenceModal: React.FC<NearbyGeofenceModalProps> = ({
  customer,
  distanceMeters,
  newspapers,
  staff,
  onConfirmDelivered,
  onDismiss,
  lang
}) => {
  if (!customer) return null;

  const paperMap = new Map(newspapers.map((p) => [p.id, p]));
  const activeSubs = customer.subscriptions.filter((s) => s.isActive);

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 max-w-lg mx-auto animate-bounce-short">
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border-2 border-sky-400">
        {/* Header Alert Tag */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-xl animate-pulse">
              <BellRing className="w-5 h-5 text-sky-400" />
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-400 block leading-tight">
                {lang === 'ta' ? '📍 அருகில் உள்ள வாடிக்கையாளர் எச்சரிக்கை' : '📍 Nearby Delivery Alert (Geofence)'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Within {Math.round(distanceMeters)}m radius of house entrance
              </span>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Address Details */}
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-base text-white">
              {customer.fullName}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
              Pending
            </span>
          </div>

          <p className="text-slate-300 font-medium">
            #{customer.houseNumber}, {customer.street}, {customer.area}
          </p>

          {customer.landmark && (
            <p className="text-[11px] text-amber-300 bg-amber-950/40 p-1.5 rounded-lg border border-amber-800/40">
              📍 <strong>Landmark:</strong> {customer.landmark}
            </p>
          )}

          {customer.deliveryInstructions && (
            <p className="text-[11px] text-slate-400 italic">
              "{customer.deliveryInstructions}"
            </p>
          )}
        </div>

        {/* Newspapers required for this house */}
        <div className="mt-3 pt-2.5 border-t border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Newspapers to Deliver:
          </span>
          <div className="space-y-1">
            {activeSubs.map((sub) => {
              const paper = paperMap.get(sub.newspaperId);
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold"
                >
                  <span className="text-white">{paper?.name || sub.newspaperId}</span>
                  <span className="text-sky-400 font-black">× {sub.quantity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={() => openExternalGoogleMapsNavigation(customer.latitude, customer.longitude)}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-2xl transition cursor-pointer"
            title="Google Maps turn-by-turn"
          >
            <Navigation className="w-5 h-5" />
          </button>

          <button
            onClick={() => onConfirmDelivered(customer)}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 fill-current" />
            <span>Confirm Delivery Completed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
