import React, { useState, useEffect, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
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
  Compass,
  MapPin,
  ExternalLink,
  LocateFixed,
  Play,
  Crosshair,
  RefreshCw,
  Radio
} from 'lucide-react';
import {
  calculateDistanceMeters,
  formatDistance,
  openExternalGoogleMapsNavigation
} from '../../services/locationService';
import { storageService } from '../../services/storageService';

// Subcomponent to dynamically pan/center map when coordinates change or user clicks center
const MapPanController: React.FC<{ targetLat?: number; targetLng?: number }> = ({ targetLat, targetLng }) => {
  const map = useMap();
  useEffect(() => {
    if (map && targetLat && targetLng) {
      map.panTo({ lat: targetLat, lng: targetLng });
    }
  }, [map, targetLat, targetLng]);
  return null;
};

interface StaffRouteMapProps {
  staff: DeliveryStaff;
  customers: Customer[];
  entries: DeliveryEntry[];
  newspapers: Newspaper[];
  geofenceRadiusMeters: number;
  onSimulateArrival: (staff: DeliveryStaff, customer: Customer) => void;
  lang: 'en' | 'ta';
}

export const StaffRouteMap: React.FC<StaffRouteMapProps> = ({
  staff,
  customers,
  entries,
  newspapers,
  geofenceRadiusMeters,
  onSimulateArrival,
  lang
}) => {
  const defaultCenter = staff.currentLat && staff.currentLng
    ? { lat: staff.currentLat, lng: staff.currentLng }
    : { lat: 11.3992, lng: 79.6936 };

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSyncingGps, setIsSyncingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  const assignedCustomers = customers.filter((c) => c.assignedStaffId === staff.id);

  // Manual High-Accuracy GPS refresh
  const handleRecaptureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('GPS not supported on device');
      return;
    }

    setIsSyncingGps(true);
    setGpsStatusMsg(lang === 'ta' ? 'ஜிபிஎஸ் பெறுகிறது...' : 'Acquiring high-precision GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        storageService.updateStaffLocation(staff.id, lat, lng, acc);
        setIsSyncingGps(false);
        setGpsStatusMsg(
          lang === 'ta'
            ? `ஜிபிஎஸ் புதுப்பிக்கப்பட்டது (துல்லியம்: ±${acc}மீ)`
            : `GPS Refreshed! Accuracy: ±${acc}m`
        );
        setTimeout(() => setGpsStatusMsg(null), 4000);
      },
      (err) => {
        console.warn('Manual GPS error:', err.message);
        // Fallback with lower accuracy if high precision timed out
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            storageService.updateStaffLocation(staff.id, lat, lng, acc);
            setIsSyncingGps(false);
            setGpsStatusMsg(`GPS Updated (±${acc}m)`);
            setTimeout(() => setGpsStatusMsg(null), 4000);
          },
          (errFallback) => {
            setIsSyncingGps(false);
            setGpsStatusMsg(`GPS Error: ${errFallback.message || 'Check location permission'}`);
            setTimeout(() => setGpsStatusMsg(null), 5000);
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [staff.id, lang]);

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

  // Find nearest pending customer
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
    <div className="space-y-4 pb-20">
      {/* Nearest Target Bar */}
      {nearestCustomer && (
        <div className="bg-sky-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase text-sky-200 block">
              Nearest Pending Delivery
            </span>
            <div className="font-extrabold text-sm sm:text-base mt-0.5">
              #{nearestCustomer.customer.houseNumber}, {nearestCustomer.customer.street} ({nearestCustomer.customer.fullName})
            </div>
            <span className="text-sky-200 font-semibold">
              Distance: {formatDistance(nearestCustomer.distanceMeters)} • Geofence Radius: {geofenceRadiusMeters}m
            </span>
          </div>

          <button
            onClick={() => onSimulateArrival(staff, nearestCustomer!.customer)}
            className="px-3 py-2 bg-white text-sky-900 font-bold rounded-xl shadow hover:bg-sky-50 transition cursor-pointer shrink-0"
            title="Simulate approaching house"
          >
            Arrive (50m)
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[480px] sm:h-[550px] relative">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={16}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          {/* Auto Map Recentering Controller */}
          <MapPanController targetLat={staff.currentLat} targetLng={staff.currentLng} />

          {/* Staff Current Position Marker */}
          {staff.currentLat && staff.currentLng && (
            <AdvancedMarker
              position={{ lat: staff.currentLat, lng: staff.currentLng }}
              title="Your Current Location (Delivery Partner)"
            >
              <div className="relative z-30">
                <span className="absolute -inset-3 rounded-full bg-sky-500/30 animate-ping" />
                <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-white text-sky-400 flex items-center justify-center shadow-2xl">
                  <Navigation className="w-5 h-5 transform rotate-45" />
                </div>
                <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow border border-slate-700">
                  You 🛵 (±{staff.gpsAccuracy || 5}m)
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Assigned Customer Stop Markers */}
          {assignedCustomers.map((customer, idx) => {
            const status = getCustomerDeliveryStatus(customer.id);
            const isDelivered = status === 'delivered';
            const isMissed = status === 'missed';

            return (
              <AdvancedMarker
                key={customer.id}
                position={{ lat: customer.latitude, lng: customer.longitude }}
                onClick={() => setSelectedCustomer(customer)}
                title={`${customer.fullName} (#${customer.houseNumber})`}
              >
                <div className="relative cursor-pointer transition transform hover:scale-110">
                  <div
                    className={`w-8 h-8 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white ${
                      isDelivered
                        ? 'bg-emerald-600'
                        : isMissed
                        ? 'bg-rose-600'
                        : 'bg-sky-600 animate-pulse'
                    }`}
                  >
                    {isDelivered ? <CheckCircle className="w-4 h-4" /> : `#${customer.houseNumber}`}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window */}
          {selectedCustomer && (
            <InfoWindow
              position={{ lat: selectedCustomer.latitude, lng: selectedCustomer.longitude }}
              onCloseClick={() => setSelectedCustomer(null)}
            >
              <div className="p-2 max-w-xs text-xs font-sans text-slate-900">
                <div className="font-bold text-sm text-slate-800">
                  {selectedCustomer.fullName} (#{selectedCustomer.houseNumber})
                </div>
                <p className="text-slate-600 mt-0.5">
                  {selectedCustomer.street}, {selectedCustomer.area}
                </p>
                {selectedCustomer.deliveryInstructions && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-1 rounded mt-1">
                    "{selectedCustomer.deliveryInstructions}"
                  </p>
                )}
                <button
                  onClick={() => openExternalGoogleMapsNavigation(selectedCustomer.latitude, selectedCustomer.longitude)}
                  className="mt-2 w-full py-1.5 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate in Google Maps</span>
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Floating Quick Recenter & GPS Sync Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
          <button
            onClick={handleRecaptureLocation}
            disabled={isSyncingGps}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-white text-slate-800 hover:text-sky-600 text-xs font-bold rounded-2xl shadow-xl border border-slate-200 transition cursor-pointer hover:shadow-2xl active:scale-95"
            title="Recalculate exact GPS coordinates using device sensor"
          >
            <LocateFixed className={`w-4 h-4 text-sky-600 ${isSyncingGps ? 'animate-spin' : ''}`} />
            <span>{isSyncingGps ? 'Getting GPS...' : 'Locate Me'}</span>
          </button>

          {gpsStatusMsg && (
            <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur text-white text-[11px] font-semibold rounded-xl shadow-lg border border-slate-700 animate-fade-in flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{gpsStatusMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
