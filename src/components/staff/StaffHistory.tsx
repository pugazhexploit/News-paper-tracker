import React from 'react';
import { DeliveryStaff, DeliveryEntry } from '../../types';
import { CheckCircle, Clock, MapPin, AlertOctagon } from 'lucide-react';

interface StaffHistoryProps {
  staff: DeliveryStaff;
  entries: DeliveryEntry[];
  lang: 'en' | 'ta';
}

export const StaffHistory: React.FC<StaffHistoryProps> = ({
  staff,
  entries,
  lang
}) => {
  const staffEntries = entries.filter((e) => e.staffId === staff.id);

  return (
    <div className="space-y-4 pb-20 text-xs">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          {lang === 'ta' ? 'இன்றைய விநியோக வரலாறு' : "Today's Delivery Log History"}
        </h2>
        <p className="text-slate-500 mt-0.5">
          {staffEntries.length} total actions recorded by {staff.fullName} today.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {staffEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No deliveries completed today yet.
          </div>
        ) : (
          staffEntries.map((e) => (
            <div key={e.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    e.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {e.status === 'delivered' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertOctagon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{e.customerName}</h4>
                  <p className="text-slate-500 font-medium">
                    {e.newspaperName} (Qty: {e.quantity})
                  </p>
                  {e.missedReason && (
                    <span className="text-rose-600 font-semibold text-[11px] block mt-0.5">
                      Reason: {e.missedReason}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    e.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {e.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  {e.deliveredAt ? new Date(e.deliveredAt).toLocaleTimeString() : '-'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
