import React, { useState } from 'react';
import {
  Customer,
  DeliveryStaff,
  DeliveryEntry,
  Newspaper,
  DeliveryStatus
} from '../../types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Camera,
  Navigation,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Check,
  RotateCcw,
  UserPlus
} from 'lucide-react';
import { openExternalGoogleMapsNavigation } from '../../services/locationService';
import { CustomerLocationDetectionModal } from '../common/CustomerLocationDetectionModal';

interface StaffDeliveryListProps {
  staff: DeliveryStaff;
  customers: Customer[];
  entries: DeliveryEntry[];
  newspapers: Newspaper[];
  staffList?: DeliveryStaff[];
  onSaveDeliveryEntry: (entry: DeliveryEntry) => void;
  onSaveCustomer?: (customer: Customer) => void;
  lang: 'en' | 'ta';
}

export const StaffDeliveryList: React.FC<StaffDeliveryListProps> = ({
  staff,
  customers,
  entries,
  newspapers,
  staffList = [],
  onSaveDeliveryEntry,
  onSaveCustomer,
  lang
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'missed'>('pending');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Missed reason modal state
  const [missedCustomer, setMissedCustomer] = useState<{ customer: Customer; paperId: string; paperName: string } | null>(null);
  const [missedReason, setMissedReason] = useState('Gate locked / No response');
  const [missedNotes, setMissedNotes] = useState('');

  // Proof photo modal state
  const [photoProofCustomer, setPhotoProofCustomer] = useState<Customer | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const paperMap = new Map(newspapers.map((p) => [p.id, p]));
  const assignedCustomers = customers.filter((c) => c.assignedStaffId === staff.id);

  // Helper to get entry for a customer & newspaper
  const getEntry = (customerId: string, newspaperId: string) => {
    return entries.find(
      (e) => e.customerId === customerId && e.newspaperId === newspaperId
    );
  };

  const getCustomerOverallStatus = (c: Customer): 'delivered' | 'pending' | 'missed' => {
    const activeSubs = c.subscriptions.filter((s) => s.isActive);
    if (activeSubs.length === 0) return 'delivered';

    const custEntries = entries.filter((e) => e.customerId === c.id);
    const deliveredCount = activeSubs.filter((s) =>
      custEntries.some((e) => e.newspaperId === s.newspaperId && e.status === 'delivered')
    ).length;

    if (deliveredCount === activeSubs.length) return 'delivered';
    if (custEntries.some((e) => e.status === 'missed')) return 'missed';
    return 'pending';
  };

  const handleMarkPaperDelivered = (customer: Customer, newspaperId: string, quantity: number) => {
    const paper = paperMap.get(newspaperId);
    const newEntry: DeliveryEntry = {
      id: `entry-${customer.id}-${newspaperId}-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.fullName,
      newspaperId,
      newspaperName: paper?.name || newspaperId,
      staffId: staff.id,
      staffName: staff.fullName,
      routeId: staff.routeId,
      deliveryDate: new Date().toISOString().split('T')[0],
      quantity,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      latitude: staff.currentLat || customer.latitude,
      longitude: staff.currentLng || customer.longitude,
      isSynced: true,
      createdAt: new Date().toISOString(),
    };

    onSaveDeliveryEntry(newEntry);
  };

  const handleConfirmMissed = () => {
    if (!missedCustomer) return;

    const newEntry: DeliveryEntry = {
      id: `entry-${missedCustomer.customer.id}-${missedCustomer.paperId}-${Date.now()}`,
      customerId: missedCustomer.customer.id,
      customerName: missedCustomer.customer.fullName,
      newspaperId: missedCustomer.paperId,
      newspaperName: missedCustomer.paperName,
      staffId: staff.id,
      staffName: staff.fullName,
      routeId: staff.routeId,
      deliveryDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      status: 'missed',
      missedReason: missedReason,
      notes: missedNotes,
      latitude: staff.currentLat || missedCustomer.customer.latitude,
      longitude: staff.currentLng || missedCustomer.customer.longitude,
      isSynced: true,
      createdAt: new Date().toISOString(),
    };

    onSaveDeliveryEntry(newEntry);
    setMissedCustomer(null);
  };

  const filteredCustomers = assignedCustomers.filter((c) => {
    const status = getCustomerOverallStatus(c);
    if (filter === 'all') return true;
    return status === filter;
  });

  return (
    <div className="space-y-4 pb-20 text-xs">
      {/* Header with Title and Add Customer button */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm">
            {lang === 'ta' ? 'இன்றைய விநியோகப் பட்டியல்' : 'Today’s Delivery Stops'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {assignedCustomers.length} total customer stops assigned
          </p>
        </div>

        {onSaveCustomer && (
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2 text-center font-bold rounded-xl transition cursor-pointer ${
            filter === 'pending'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({assignedCustomers.filter((c) => getCustomerOverallStatus(c) === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`flex-1 py-2 text-center font-bold rounded-xl transition cursor-pointer ${
            filter === 'delivered'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Delivered ({assignedCustomers.filter((c) => getCustomerOverallStatus(c) === 'delivered').length})
        </button>
        <button
          onClick={() => setFilter('missed')}
          className={`flex-1 py-2 text-center font-bold rounded-xl transition cursor-pointer ${
            filter === 'missed'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Missed ({assignedCustomers.filter((c) => getCustomerOverallStatus(c) === 'missed').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 text-center font-bold rounded-xl transition cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({assignedCustomers.length})
        </button>
      </div>

      {/* Customer Delivery Cards */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800 text-sm">No customers in this list</p>
            <p className="text-slate-400 mt-1">
              Use "+ Add Customer" above to register new subscribers at their doorstep using automatic GPS.
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer, idx) => {
            const overallStatus = getCustomerOverallStatus(customer);
            const isExpanded = expandedCustomerId === customer.id;
            const activeSubs = customer.subscriptions.filter((s) => s.isActive);

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl border shadow-sm transition overflow-hidden ${
                  overallStatus === 'delivered'
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : overallStatus === 'missed'
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 text-sm">{customer.fullName}</h4>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            overallStatus === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : overallStatus === 'missed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {overallStatus}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        #{customer.houseNumber}, {customer.street}, {customer.area}
                      </p>
                      {customer.landmark && (
                        <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                          📍 {customer.landmark}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => openExternalGoogleMapsNavigation(customer.latitude, customer.longitude)}
                      className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                      title="Open Google Maps Navigation"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                    <a
                      href={`tel:${customer.phone}`}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="Call Customer"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Subscriptions to Deliver at this House */}
                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Newspapers to drop ({activeSubs.length}):
                  </div>

                  {activeSubs.map((sub) => {
                    const paper = paperMap.get(sub.newspaperId);
                    const entry = getEntry(customer.id, sub.newspaperId);
                    const isPaperDelivered = entry?.status === 'delivered';
                    const isPaperMissed = entry?.status === 'missed';

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: paper?.color || '#0284c7' }}
                          />
                          <div>
                            <span className="font-bold text-slate-800">
                              {paper?.name || sub.newspaperId}
                            </span>
                            <span className="ml-1 text-slate-500 font-semibold">
                              (Qty: {sub.quantity})
                            </span>
                            {entry && (
                              <div className="text-[10px] text-slate-400">
                                {isPaperDelivered ? `Delivered at ${entry.deliveredAt?.split('T')[1]?.substring(0, 5) || 'Morning'}` : `Missed: ${entry.missedReason || 'Skipped'}`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {isPaperDelivered ? (
                            <span className="flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg">
                              <Check className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </span>
                          ) : isPaperMissed ? (
                            <span className="flex items-center space-x-1 text-rose-700 font-bold bg-rose-100 px-2 py-1 rounded-lg">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Missed</span>
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setMissedCustomer({
                                    customer,
                                    paperId: sub.newspaperId,
                                    paperName: paper?.name || sub.newspaperId,
                                  })
                                }
                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold rounded-lg transition cursor-pointer"
                              >
                                Missed
                              </button>
                              <button
                                onClick={() => handleMarkPaperDelivered(customer, sub.newspaperId, sub.quantity)}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition flex items-center space-x-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Delivered</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expanded Details / Special Instructions */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 space-y-2">
                    {customer.deliveryInstructions && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                        <strong>Delivery Instructions:</strong> {customer.deliveryInstructions}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Coordinates: {customer.latitude.toFixed(5)}, {customer.longitude.toFixed(5)}</span>
                      <span>Payment: {customer.paymentStatus.toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Missed Reason Dialog */}
      {missedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">
              Mark as Missed: {missedCustomer.customer.fullName}
            </h3>
            <p className="text-slate-500 mt-0.5">
              {missedCustomer.paperName}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Non-Delivery:
                </label>
                <select
                  value={missedReason}
                  onChange={(e) => setMissedReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                >
                  <option value="Gate locked / No response">Gate locked / No response</option>
                  <option value="Customer requested holiday pause">Customer requested holiday pause</option>
                  <option value="Severe waterlogging / Dog issue">Dog issue / Gate inaccessible</option>
                  <option value="Depot copy shortage">Depot copy shortage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Additional Notes (optional):
                </label>
                <input
                  type="text"
                  value={missedNotes}
                  onChange={(e) => setMissedNotes(e.target.value)}
                  placeholder="e.g. Will re-attempt tomorrow morning"
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                onClick={() => setMissedCustomer(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMissed}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow cursor-pointer"
              >
                Confirm Missed
              </button>
            </div>
          </div>
        </div>
      )}

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
