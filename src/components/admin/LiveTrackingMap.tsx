import React, { useState, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Customer,
  DeliveryStaff,
  DeliveryRoute,
  DeliveryEntry,
  Newspaper
} from '../../types';
import {
  Navigation,
  CheckCircle,
  Clock,
  AlertTriangle,
  Compass,
  Layers,
  LocateFixed,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { calculateDistanceMeters, formatDistance } from '../../services/locationService';

interface LiveTrackingMapProps {
  customers: Customer[];
  staffList: DeliveryStaff[];
  routes: DeliveryRoute[];
  entries: DeliveryEntry[];
  newspapers: Newspaper[];
  geofenceRadiusMeters: number;
  onSimulateArrival: (staff: DeliveryStaff, customer: Customer) => void;
  lang: 'en' | 'ta';
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  customers,
  staffList,
  routes,
  entries,
  newspapers,
  geofenceRadiusMeters,
  onSimulateArrival,
  lang
}) => {
  // Default centered around Chidambaram, Cuddalore District (608001)
  const defaultCenter = { lat: 11.3992, lng: 79.6936 };
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedStaffMarker, setSelectedStaffMarker] = useState<DeliveryStaff | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered' | 'missed'>('all');
  const [isSimulating, setIsSimulating] = useState(false);

  // Maps library for vector geometry if needed
  const mapsLib = useMapsLibrary('maps');

  const paperMap = new globalThis.Map<string, Newspaper>(newspapers.map((p) => [p.id, p]));

  // Get status for customer for today
  const getCustomerDeliveryStatus = (customerId: string): 'delivered' | 'pending' | 'missed' => {
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

  const filteredCustomers = customers.filter((c) => {
    if (selectedStaffId !== 'all' && c.assignedStaffId !== selectedStaffId) {
      return false;
    }
    const status = getCustomerDeliveryStatus(c.id);
    if (filterStatus !== 'all' && status !== filterStatus) {
      return false;
    }
    return true;
  });

  // Filtered staff
  const activeStaff = staffList.filter((s) => selectedStaffId === 'all' || s.id === selectedStaffId);

  // Simulate a delivery staff stepping into the next pending customer's geofence
  const handleRunSimulation = () => {
    const staff = staffList.find((s) => s.shiftStatus === 'on_route') || staffList[0];
    const pendingCustomers = customers.filter((c) => getCustomerDeliveryStatus(c.id) === 'pending');
    if (!staff || pendingCustomers.length === 0) return;

    setIsSimulating(true);
    const target = pendingCustomers[0];
    // Trigger simulated arrival
    setTimeout(() => {
      onSimulateArrival(staff, target);
      setIsSimulating(false);
    }, 800);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Map Control Toolbar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {lang === 'ta' ? 'நேரலை விநியோகம் & ஜி.பி.எஸ் வரைபடம்' : 'Live Delivery & GPS Tracking Map'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ta'
                ? `சிதம்பரம், கடலூர் மாவட்டம் (608001) | புவிவேலி ஆரம்: ${geofenceRadiusMeters}மீ`
                : `Chidambaram, Cuddalore District (608001) | Geofence Radius: ${geofenceRadiusMeters}m`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Staff filter */}
          <div className="flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">{lang === 'ta' ? 'ஊழியர்:' : 'Staff:'}</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">{lang === 'ta' ? 'அனைத்து ஊழியர்கள்' : 'All Staff (Fleet)'}</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.shiftStatus === 'on_route' ? 'Active' : 'Off-duty'})
                </option>
              ))}
            </select>
          </div>

          {/* Delivery status filter */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'pending' ? 'bg-sky-600 text-white' : 'text-sky-700 hover:bg-sky-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('delivered')}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'delivered' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setFilterStatus('missed')}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'missed' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              Missed
            </button>
          </div>

          {/* Simulation Trigger button */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            title="Simulate delivery partner approaching customer house to test 50m geofence alert"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Geofence Arrival'}</span>
          </button>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="relative w-full h-[540px]">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          {/* Customer House Advanced Markers */}
          {filteredCustomers.map((customer) => {
            const status = getCustomerDeliveryStatus(customer.id);
            const isSelected = selectedCustomer?.id === customer.id;

            return (
              <AdvancedMarker
                key={customer.id}
                position={{ lat: customer.latitude, lng: customer.longitude }}
                onClick={() => setSelectedCustomer(customer)}
                title={`${customer.fullName} - ${customer.houseNumber}, ${customer.street}`}
              >
                <div
                  className={`relative cursor-pointer transition-transform transform hover:scale-110 ${
                    isSelected ? 'scale-125 z-30' : 'z-10'
                  }`}
                >
                  {/* Marker Pin */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 text-white ${
                      status === 'delivered'
                        ? 'bg-emerald-600 border-white'
                        : status === 'missed'
                        ? 'bg-rose-600 border-white'
                        : 'bg-sky-600 border-white animate-pulse'
                    }`}
                  >
                    {status === 'delivered' ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : status === 'missed' ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-black">
                        {customer.subscriptions.reduce((sum, s) => sum + s.quantity, 0)}
                      </span>
                    )}
                  </div>
                  {/* House Number badge */}
                  <div className="absolute -bottom-2 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1 rounded shadow">
                    #{customer.houseNumber}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Delivery Staff Advanced Markers */}
          {activeStaff.map((staff) => {
            if (!staff.currentLat || !staff.currentLng) return null;
            const isOnRoute = staff.shiftStatus === 'on_route';

            return (
              <AdvancedMarker
                key={staff.id}
                position={{ lat: staff.currentLat, lng: staff.currentLng }}
                onClick={() => setSelectedStaffMarker(staff)}
                title={`${staff.fullName} (${staff.shiftStatus})`}
              >
                <div className="relative cursor-pointer z-40">
                  {/* Pulsing radar circle for active staff */}
                  {isOnRoute && (
                    <span className="absolute -inset-2 rounded-full bg-sky-500/40 animate-ping" />
                  )}
                  <div className="relative w-11 h-11 rounded-full bg-slate-900 border-2 border-sky-400 text-white flex items-center justify-center shadow-xl">
                    <Navigation className="w-5 h-5 text-sky-400 transform rotate-45" />
                  </div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow border border-slate-700">
                    {staff.fullName.split(' ')[0]} {isOnRoute ? '🛵' : '⏸️'}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Customer Info Window */}
          {selectedCustomer && (
            <InfoWindow
              position={{ lat: selectedCustomer.latitude, lng: selectedCustomer.longitude }}
              onCloseClick={() => setSelectedCustomer(null)}
            >
              <div className="p-2 max-w-xs text-slate-900 font-sans">
                <div className="flex items-center justify-between border-b pb-1 mb-2">
                  <span className="font-bold text-sm text-slate-800">{selectedCustomer.fullName}</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      getCustomerDeliveryStatus(selectedCustomer.id) === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : getCustomerDeliveryStatus(selectedCustomer.id) === 'missed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {getCustomerDeliveryStatus(selectedCustomer.id)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-1">
                  <strong>Address:</strong> #{selectedCustomer.houseNumber}, {selectedCustomer.street}, {selectedCustomer.area}, {selectedCustomer.city} - {selectedCustomer.pincode}
                </p>

                {selectedCustomer.landmark && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-1 rounded mb-2 font-medium">
                    📍 <strong>Landmark:</strong> {selectedCustomer.landmark}
                  </p>
                )}

                {selectedCustomer.deliveryInstructions && (
                  <p className="text-[11px] text-slate-600 italic mb-2">
                    "{selectedCustomer.deliveryInstructions}"
                  </p>
                )}

                <div className="mt-2 pt-1 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Today's Subscriptions:
                  </span>
                  <div className="space-y-1">
                    {selectedCustomer.subscriptions
                      .filter((s) => s.isActive)
                      .map((s) => {
                        const paper = paperMap.get(s.newspaperId);
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-xs bg-slate-50 px-2 py-1 rounded"
                          >
                            <span className="font-medium text-slate-700">
                              {paper?.name || s.newspaperId}
                            </span>
                            <span className="font-bold text-sky-600">x{s.quantity}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Staff Info Window */}
          {selectedStaffMarker && selectedStaffMarker.currentLat && selectedStaffMarker.currentLng && (
            <InfoWindow
              position={{ lat: selectedStaffMarker.currentLat, lng: selectedStaffMarker.currentLng }}
              onCloseClick={() => setSelectedStaffMarker(null)}
            >
              <div className="p-2 text-slate-900 font-sans">
                <div className="flex items-center justify-between border-b pb-1 mb-2">
                  <span className="font-bold text-sm text-slate-800">{selectedStaffMarker.fullName}</span>
                  <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                    {selectedStaffMarker.shiftStatus === 'on_route' ? 'Active Shift' : 'Off Duty'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-1">
                  📞 {selectedStaffMarker.phone}
                </p>
                <p className="text-xs text-slate-600 mb-1">
                  🎯 GPS Accuracy: {selectedStaffMarker.gpsAccuracy || 8}m
                </p>
                <p className="text-xs text-slate-600 mb-2">
                  🔋 Battery: {selectedStaffMarker.batteryLevel || 85}% | Updated: {selectedStaffMarker.lastLocationUpdate}
                </p>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Floating Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-slate-200 text-xs space-y-1.5 pointer-events-auto z-20">
          <span className="font-bold text-slate-700 block text-[11px] mb-1 uppercase tracking-wider">
            {lang === 'ta' ? 'வரைபடக் குறியீடுகள்' : 'Live Legend'}
          </span>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-600 border border-white shadow-sm inline-block" />
            <span className="text-slate-600">Pending Delivery</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shadow-sm inline-block" />
            <span className="text-slate-600">Delivered</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white shadow-sm inline-block" />
            <span className="text-slate-600">Missed</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-sky-400 shadow-sm inline-block" />
            <span className="text-slate-600">Delivery Staff (GPS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
