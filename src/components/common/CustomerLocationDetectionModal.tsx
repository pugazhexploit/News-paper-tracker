import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Customer,
  Newspaper,
  DeliveryStaff,
  Subscription,
  PaymentStatus
} from '../../types';
import {
  MapPin,
  Navigation,
  Search,
  Crosshair,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Plus,
  Trash2,
  Home,
  Phone,
  User,
  ShieldAlert,
  Info,
  Building,
  CreditCard,
  Compass,
  Check,
  Database
} from 'lucide-react';
import { calculateDistanceMeters, formatDistance } from '../../services/locationService';
import { supabaseService } from '../../services/supabaseService';

interface CustomerLocationDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
  existingCustomers: Customer[];
  newspapers: Newspaper[];
  staffList: DeliveryStaff[];
  editingCustomer?: Customer | null;
  defaultStaffId?: string;
  lang: 'en' | 'ta';
}

// Controller component to smoothly pan and zoom Google Map dynamically
const MapController: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);
  return null;
};

// Default coordinates centered on Chidambaram, Tamil Nadu (PIN: 608001)
const CHIDAMBARAM_DEFAULT = {
  lat: 11.3992,
  lng: 79.6936,
  city: 'Chidambaram',
  district: 'Cuddalore District',
  state: 'Tamil Nadu',
  pincode: '608001'
};

export const CustomerLocationDetectionModal: React.FC<CustomerLocationDetectionModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
  existingCustomers,
  newspapers,
  staffList,
  editingCustomer,
  defaultStaffId,
  lang
}) => {
  // GPS State
  const [gpsStatus, setGpsStatus] = useState<'detecting' | 'detected' | 'denied' | 'error' | 'idle'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [floorApartment, setFloorApartment] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState(CHIDAMBARAM_DEFAULT.city);
  const [district, setDistrict] = useState(CHIDAMBARAM_DEFAULT.district);
  const [state, setState] = useState(CHIDAMBARAM_DEFAULT.state);
  const [pincode, setPincode] = useState(CHIDAMBARAM_DEFAULT.pincode);
  const [latitude, setLatitude] = useState(CHIDAMBARAM_DEFAULT.lat);
  const [longitude, setLongitude] = useState(CHIDAMBARAM_DEFAULT.lng);
  const [placeId, setPlaceId] = useState<string | undefined>(undefined);
  const [formattedAddress, setFormattedAddress] = useState<string>('');
  const [landmark, setLandmark] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Drop in newspaper box at gate');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mapZoom, setMapZoom] = useState(17);

  // Places Autocomplete reference
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Maps Libraries
  const placesLib = useMapsLibrary('places');

  // Extract address components into state fields
  const applyAddressComponents = useCallback((components: google.maps.GeocoderAddressComponent[]) => {
    let detectedHouse = '';
    let detectedStreet = '';
    let detectedArea = '';
    let detectedCity = '';
    let detectedDistrict = '';
    let detectedState = '';
    let detectedPincode = '';

    for (const comp of components) {
      const types = comp.types;
      if (types.includes('street_number') || types.includes('premise') || types.includes('subpremise')) {
        detectedHouse = comp.long_name;
      } else if (types.includes('route')) {
        detectedStreet = comp.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('neighborhood')) {
        detectedArea = comp.long_name;
      } else if (types.includes('locality') || types.includes('postal_town')) {
        detectedCity = comp.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        detectedDistrict = comp.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        detectedState = comp.long_name;
      } else if (types.includes('postal_code')) {
        detectedPincode = comp.long_name;
      }
    }

    if (detectedHouse) setHouseNumber(detectedHouse);
    if (detectedStreet) setStreet(detectedStreet);
    if (detectedArea) setArea(detectedArea);
    if (detectedCity) setCity(detectedCity);
    if (detectedDistrict) setDistrict(detectedDistrict);
    if (detectedState) setState(detectedState);
    if (detectedPincode) setPincode(detectedPincode);
  }, []);

  // Reverse Geocoding helper using Google Maps Geocoder API
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
      return;
    }
    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsGeocoding(false);
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const place = results[0];
        setFormattedAddress(place.formatted_address || '');
        if (place.place_id) setPlaceId(place.place_id);
        applyAddressComponents(place.address_components);
      }
    });
  }, [applyAddressComponents]);

  // Automatic GPS Detection Handler
  const detectCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);
        setGpsStatus('detected');
        setMapZoom(18);

        // Reverse geocode detected coordinates
        reverseGeocode(lat, lng);
      },
      (error) => {
        console.warn('Browser Geolocation error or permission denied:', error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('error');
        }
        // Fallback to Chidambaram default center
        setLatitude(CHIDAMBARAM_DEFAULT.lat);
        setLongitude(CHIDAMBARAM_DEFAULT.lng);
        setGpsAccuracy(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }, [reverseGeocode]);

  // Initialize or Reset form on modal open
  useEffect(() => {
    if (!isOpen) return;

    setSaveStatus('idle');
    setSupabaseSyncMessage(null);

    if (editingCustomer) {
      setFullName(editingCustomer.fullName);
      setPhone(editingCustomer.phone);
      setAlternatePhone(editingCustomer.alternatePhone || '');
      setHouseNumber(editingCustomer.houseNumber);
      setFloorApartment(editingCustomer.floorApartment || '');
      setStreet(editingCustomer.street);
      setArea(editingCustomer.area);
      setCity(editingCustomer.city || CHIDAMBARAM_DEFAULT.city);
      setDistrict(editingCustomer.district || CHIDAMBARAM_DEFAULT.district);
      setState(editingCustomer.state || CHIDAMBARAM_DEFAULT.state);
      setPincode(editingCustomer.pincode || CHIDAMBARAM_DEFAULT.pincode);
      setLatitude(editingCustomer.latitude);
      setLongitude(editingCustomer.longitude);
      setPlaceId(editingCustomer.placeId);
      setFormattedAddress(editingCustomer.formattedAddress || '');
      setGpsAccuracy(editingCustomer.gpsAccuracy || null);
      setLandmark(editingCustomer.landmark || '');
      setDeliveryInstructions(editingCustomer.deliveryInstructions || '');
      setAssignedStaffId(editingCustomer.assignedStaffId || staffList[0]?.id || '');
      setPaymentStatus(editingCustomer.paymentStatus);
      setSubscriptions(JSON.parse(JSON.stringify(editingCustomer.subscriptions)));
      setGpsStatus('idle');
    } else {
      // New Customer Mode: Reset and automatically detect location
      setFullName('');
      setPhone('+91 ');
      setAlternatePhone('');
      setHouseNumber('');
      setFloorApartment('');
      setStreet('');
      setArea('East Car Street');
      setCity(CHIDAMBARAM_DEFAULT.city);
      setDistrict(CHIDAMBARAM_DEFAULT.district);
      setState(CHIDAMBARAM_DEFAULT.state);
      setPincode(CHIDAMBARAM_DEFAULT.pincode);
      setLatitude(CHIDAMBARAM_DEFAULT.lat);
      setLongitude(CHIDAMBARAM_DEFAULT.lng);
      setPlaceId(undefined);
      setFormattedAddress('');
      setLandmark('');
      setDeliveryInstructions('Drop in newspaper box at gate');
      setAssignedStaffId(defaultStaffId || staffList[0]?.id || '');
      setPaymentStatus('paid');
      setSubscriptions([
        {
          id: `sub-${Date.now()}`,
          customerId: '',
          newspaperId: newspapers[0]?.id || 'paper-hindu-en',
          quantity: 1,
          deliverySchedule: 'all_days',
          startDate: new Date().toISOString().split('T')[0],
          isActive: true
        }
      ]);

      // Automatically detect current GPS coordinates
      detectCurrentLocation();
    }
  }, [isOpen, editingCustomer, defaultStaffId, staffList, newspapers, detectCurrentLocation]);

  // When Google Maps loads and coordinates are present but address isn't geocoded yet
  useEffect(() => {
    if (isOpen && typeof google !== 'undefined' && google.maps && google.maps.Geocoder && !formattedAddress && !isGeocoding) {
      reverseGeocode(latitude, longitude);
    }
  }, [isOpen, latitude, longitude, formattedAddress, isGeocoding, reverseGeocode]);

  // Initialize Google Places Autocomplete on search input
  useEffect(() => {
    if (!placesLib || !searchInputRef.current || !isOpen) return;

    if (!autocompleteRef.current) {
      autocompleteRef.current = new placesLib.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['geometry', 'address_components', 'formatted_address', 'name', 'place_id']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setLatitude(lat);
          setLongitude(lng);
          setMapZoom(18);
          setPlaceId(place.place_id);
          setFormattedAddress(place.formatted_address || place.name || '');

          if (place.address_components) {
            applyAddressComponents(place.address_components);
          }
          setGpsStatus('idle');
        }
      });
    }
  }, [placesLib, isOpen, applyAddressComponents]);

  // Manual fallback search if user presses Enter or clicks Search button
  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) return;

    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: `${query}, Tamil Nadu, India` }, (results, status) => {
      setIsGeocoding(false);
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const place = results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLatitude(lat);
        setLongitude(lng);
        setMapZoom(18);
        if (place.place_id) setPlaceId(place.place_id);
        setFormattedAddress(place.formatted_address || '');
        applyAddressComponents(place.address_components);
        setGpsStatus('idle');
      }
    });
  };

  // Safe handler when marker is dragged or map is clicked
  const handlePositionChange = (newLat: number, newLng: number) => {
    setLatitude(newLat);
    setLongitude(newLng);
    reverseGeocode(newLat, newLng);
  };

  // Duplicate household detection (within 25m or same house + street)
  const potentialDuplicates = existingCustomers.filter((c) => {
    if (editingCustomer && c.id === editingCustomer.id) return false;
    const distance = calculateDistanceMeters(latitude, longitude, c.latitude, c.longitude);
    const sameStreetAndHouse =
      c.houseNumber.trim().toLowerCase() === houseNumber.trim().toLowerCase() &&
      c.street.trim().toLowerCase() === street.trim().toLowerCase() &&
      houseNumber.trim().length > 0;
    return distance <= 25 || sameStreetAndHouse;
  });

  // Calculate monthly subscription total
  const paperMap = new globalThis.Map<string, Newspaper>(newspapers.map((p) => [p.id, p]));
  const totalMonthly = subscriptions.reduce((sum, sub) => {
    if (!sub.isActive) return sum;
    const paper = paperMap.get(sub.newspaperId);
    return sum + (paper?.subscriptionMonthly || 180) * sub.quantity;
  }, 0);

  // Form submission: save to customer registry + Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !houseNumber.trim() || !street.trim()) {
      alert('Please fill in required fields: Customer Name, Phone Number, House Number, and Street.');
      return;
    }

    setSaveStatus('saving');

    const customerId = editingCustomer ? editingCustomer.id : `cust-${Date.now()}`;
    const customerObj: Customer = {
      id: customerId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      houseNumber: houseNumber.trim(),
      floorApartment: floorApartment.trim() || undefined,
      street: street.trim(),
      area: area.trim() || 'Chidambaram Central',
      city: city.trim() || CHIDAMBARAM_DEFAULT.city,
      district: district.trim() || CHIDAMBARAM_DEFAULT.district,
      state: state.trim() || CHIDAMBARAM_DEFAULT.state,
      pincode: pincode.trim() || CHIDAMBARAM_DEFAULT.pincode,
      latitude: Number(latitude),
      longitude: Number(longitude),
      placeId: placeId || undefined,
      formattedAddress: formattedAddress || undefined,
      gpsAccuracy: gpsAccuracy || undefined,
      landmark: landmark.trim() || undefined,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      assignedStaffId: assignedStaffId || 'unassigned',
      isActive: true,
      paymentStatus,
      monthlyAmount: totalMonthly,
      subscriptions: subscriptions.map((s) => ({ ...s, customerId }))
    };

    // Save to primary registry
    onSaveCustomer(customerObj);

    // Save/Sync to Supabase PostgreSQL customers table
    try {
      const syncResult = await supabaseService.saveCustomer(customerObj);
      if (syncResult.isConfigured && syncResult.success) {
        setSupabaseSyncMessage('Saved to Supabase customers table & Local Registry');
      } else {
        setSupabaseSyncMessage('Saved to Local Customer Registry (Ready for Supabase sync)');
      }
    } catch {
      setSupabaseSyncMessage('Saved to Local Registry');
    }

    setSaveStatus('saved');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 my-3 sm:my-6 max-h-[96vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                {editingCustomer
                  ? lang === 'ta'
                    ? 'வாடிக்கையாளர் விவரங்களைத் திருத்துக'
                    : 'Edit Customer & Verified Location'
                  : lang === 'ta'
                  ? 'தானியங்கி ஜி.பி.எஸ் வாடிக்கையாளர் பதிவு'
                  : 'Add Customer (Automatic GPS Location Detection)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ta'
                  ? 'ஜி.பி.எஸ் இருப்பிடத்தைக் கண்டறிந்து, கூகிள் வரைபடத்தில் துல்லியமாகப் பின் குத்தவும்.'
                  : 'Detect device GPS, pinpoint exact house on Google Maps, and auto-reverse geocode address.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Clean Scrollable Layout */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 pt-4">
          <form id="customer-form" onSubmit={handleSave} className="space-y-5">
            {/* 1. CUSTOMER NAME & MOBILE NUMBER */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-sky-600" />
                  <span>1. Customer Personal Details</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">* Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kumar Raghavan"
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Mobile (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98400 12345"
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alternate Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      placeholder="e.g. 04144 220123"
                      className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. AUTOMATIC LOCATION DETECTION STATUS */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs">
                {gpsStatus === 'detecting' ? (
                  <div className="flex items-center space-x-2 text-sky-600 font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Detecting current GPS coordinates via device sensor...</span>
                  </div>
                ) : gpsStatus === 'detected' ? (
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-emerald-800">
                      GPS Detected: ({latitude.toFixed(6)}, {longitude.toFixed(6)})
                    </span>
                    {gpsAccuracy !== null && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          gpsAccuracy <= 20
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : gpsAccuracy <= 35
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        Accuracy: ±{gpsAccuracy}m {gpsAccuracy <= 20 ? '(High)' : '(Adjust Pin)'}
                      </span>
                    )}
                  </div>
                ) : gpsStatus === 'denied' ? (
                  <div className="flex items-center space-x-1.5 text-amber-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>GPS Permission Denied. Use search bar or drag map marker directly onto the customer house.</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span>Pin Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                  </div>
                )}

                {isGeocoding && (
                  <span className="flex items-center text-[11px] text-sky-600 font-semibold pl-2">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Reverse geocoding address...
                  </span>
                )}
              </div>

              {/* Current Location Recapture Button */}
              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={gpsStatus === 'detecting'}
                className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                title="Recapture device GPS coordinates"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Use My Current Location</span>
              </button>
            </div>

            {/* GPS Accuracy Warning Banner if accuracy > 25m */}
            {gpsAccuracy !== null && gpsAccuracy > 25 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-start space-x-2 text-xs text-amber-900 shadow-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">GPS Accuracy Variance (±{gpsAccuracy}m): </span>
                  Device signal has moderate variance. Please <strong>drag the map pin</strong> directly onto the customer's front gate or doorway for accurate morning delivery geofencing.
                </div>
              </div>
            )}

            {/* 3 & 4. GOOGLE MAPS INTERACTIVE MAP & SEARCH BAR */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
              {/* 4. Search Address Bar with Google Places Autocomplete */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search house, street, landmark or area (e.g. East Car Street, Chidambaram)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualSearch();
                    }
                  }}
                  className="w-full text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleManualSearch()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>

              {/* 3. Interactive Map Canvas */}
              <div className="relative w-full h-64 sm:h-80 bg-slate-100">
                <Map
                  mapId="DEMO_MAP_ID"
                  center={{ lat: latitude, lng: longitude }}
                  zoom={mapZoom}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  className="w-full h-full"
                  onClick={(e) => {
                    if (e.detail?.latLng) {
                      handlePositionChange(e.detail.latLng.lat, e.detail.latLng.lng);
                    }
                  }}
                >
                  <MapController center={{ lat: latitude, lng: longitude }} zoom={mapZoom} />

                  {/* Draggable Customer Marker */}
                  <AdvancedMarker
                    position={{ lat: latitude, lng: longitude }}
                    draggable={true}
                    onDragEnd={(e) => {
                      if (e.latLng) {
                        const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : Number(e.latLng.lat);
                        const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : Number(e.latLng.lng);
                        handlePositionChange(lat, lng);
                      }
                    }}
                    title="Drag me to pinpoint customer's exact house or front gate"
                  >
                    <div className="relative flex flex-col items-center cursor-grab active:cursor-grabbing group">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl border-2 border-white transform transition-transform group-hover:scale-110">
                        <Home className="w-5 h-5" />
                      </div>
                      <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md mt-1 whitespace-nowrap">
                        {houseNumber ? `#${houseNumber}` : 'Customer Pin'}
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Nearby existing customers markers for visual reference */}
                  {existingCustomers.map((c) => {
                    if (editingCustomer && c.id === editingCustomer.id) return null;
                    return (
                      <AdvancedMarker
                        key={c.id}
                        position={{ lat: c.latitude, lng: c.longitude }}
                        title={`Existing Customer: ${c.fullName} (#${c.houseNumber}, ${c.street})`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-500/80 border border-white text-white flex items-center justify-center text-[10px] font-bold opacity-75 shadow-xs">
                          {c.houseNumber}
                        </div>
                      </AdvancedMarker>
                    );
                  })}
                </Map>

                {/* Map instruction overlay pill */}
                <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-xl shadow pointer-events-none flex items-center space-x-1.5">
                  <Navigation className="w-3 h-3 text-sky-400" />
                  <span>Drag the pin or tap on the map to pinpoint exact house gate</span>
                </div>
              </div>

              {/* Detected Geocoded Address Bar */}
              {formattedAddress && (
                <div className="p-3 bg-sky-50/90 border-t border-sky-100 flex items-start space-x-2 text-xs text-sky-900">
                  <CheckCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Google Maps Reverse Geocoded Address: </span>
                    <span>{formattedAddress}</span>
                    {placeId && (
                      <span className="text-[10px] text-sky-700 block font-mono mt-0.5">
                        Place ID: {placeId}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DUPLICATE CUSTOMER WARNING BANNER */}
            {potentialDuplicates.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 space-y-1 shadow-xs">
                <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Possible Duplicate / Nearby Household Found:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1">
                  {potentialDuplicates.map((dup) => {
                    const dist = Math.round(calculateDistanceMeters(latitude, longitude, dup.latitude, dup.longitude));
                    return (
                      <li key={dup.id}>
                        <strong>{dup.fullName}</strong> at #{dup.houseNumber}, {dup.street} (~{dist}m away).
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[11px] text-amber-700 italic pt-1">
                  Note: Multiple family members or apartment tenants may share the same building. You can proceed with registration.
                </p>
              </div>
            )}

            {/* 5. AUTO-FILLED AND EDITABLE ADDRESS FIELDS */}
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-sky-600" />
                  <span>5. Address Details (Auto-filled by Geocoder & Fully Editable)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Verify & complete house details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    House / Door No *
                  </label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. 14 or 42/B"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Check door number</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Floor & Apartment Details
                  </label>
                  <input
                    type="text"
                    value={floorApartment}
                    onChange={(e) => setFloorApartment(e.target.value)}
                    placeholder="e.g. 2nd Floor, Flat 3B"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Floor / Block / Complex</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. East Car Street"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Auto-filled from route</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. East Car Street"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chidambaram"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Cuddalore District"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="608001"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Landmark (for morning delivery boy)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Big Nandi Statue / Opp. Murugan Tea Stall"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Delivery Instructions
                  </label>
                  <input
                    type="text"
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Drop in newspaper box at gate / 2nd floor"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* DELIVERY ASSIGNMENT & PAYMENT STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Delivery Partner
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Select Staff Partner --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.phone}) - {s.shiftStatus === 'on_route' ? '🟢 Active' : '⚪ Off-Duty'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="paid">Paid (₹{totalMonthly}/month)</option>
                  <option value="unpaid">Unpaid / Due</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            {/* NEWSPAPER SUBSCRIPTIONS */}
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Newspaper Subscriptions ({subscriptions.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSubscriptions((prev) => [
                      ...prev,
                      {
                        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                        customerId: editingCustomer?.id || '',
                        newspaperId: newspapers[0]?.id || 'paper-hindu-en',
                        quantity: 1,
                        deliverySchedule: 'all_days',
                        startDate: new Date().toISOString().split('T')[0],
                        isActive: true
                      }
                    ]);
                  }}
                  className="flex items-center space-x-1 text-xs text-sky-600 font-bold hover:text-sky-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Newspaper</span>
                </button>
              </div>

              <div className="space-y-2">
                {subscriptions.map((sub, index) => {
                  return (
                    <div key={sub.id} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <select
                        value={sub.newspaperId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubscriptions((prev) => {
                            const clone = [...prev];
                            clone[index].newspaperId = val;
                            return clone;
                          });
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                      >
                        {newspapers.filter((n) => n.isActive).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.language}) - ₹{p.subscriptionMonthly}/mo
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center space-x-1">
                        <span className="text-slate-500 font-medium">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={sub.quantity}
                          onChange={(e) => {
                            const q = Math.max(1, parseInt(e.target.value) || 1);
                            setSubscriptions((prev) => {
                              const clone = [...prev];
                              clone[index].quantity = q;
                              return clone;
                            });
                          }}
                          className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                        />
                      </div>

                      {subscriptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSubscriptions((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOCATION PREVIEW CARD */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Verified GPS Coordinates:</span>
                  </span>
                  <span className="font-mono text-slate-200 font-bold">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </span>
                  {gpsAccuracy !== null && (
                    <span className="text-slate-400 font-medium">(±{gpsAccuracy}m accuracy)</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300">
                  {houseNumber && street
                    ? `#${houseNumber}${floorApartment ? ` (${floorApartment})` : ''}, ${street}, ${area}, ${city} - ${pincode}`
                    : formattedAddress || 'Location selected on Google Maps'}
                </p>

                {landmark && (
                  <p className="text-[10px] text-sky-300">
                    Landmark: {landmark}
                  </p>
                )}
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 shrink-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Monthly</div>
                <div className="text-lg font-black text-sky-400">₹{totalMonthly}/mo</div>
              </div>
            </div>

            {/* Supabase Sync Feedback */}
            {supabaseSyncMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
                <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{supabaseSyncMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* 7. MODAL FOOTER: SAVE CUSTOMER & CANCEL BUTTONS */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 mt-2">
          <div className="text-[11px] text-slate-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {placeId ? `Place ID: ${placeId.substring(0, 16)}...` : 'Device GPS + Google Geocoding'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Supabase customers table ready</span>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="customer-form"
              disabled={saveStatus === 'saving'}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Customer Saved!</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingCustomer ? 'Update Customer' : 'Save Customer & Location'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
