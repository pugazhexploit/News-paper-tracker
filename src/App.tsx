import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import {
  UserRole,
  Customer,
  Newspaper,
  DeliveryStaff,
  DeliveryRoute,
  DeliveryEntry,
  AppNotification,
  PaymentRecord
} from './types';
import { storageService, AppSettings } from './services/storageService';
import { checkCustomerGeofences, GeofenceCheckResult } from './services/locationService';

// Common Components
import { Navbar } from './components/Navbar';
import { QuotaBanner } from './components/QuotaBanner';
import { NearbyGeofenceModal } from './components/common/NearbyGeofenceModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { SupabaseSchemaModal } from './components/common/SupabaseSchemaModal';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LiveTrackingMap } from './components/admin/LiveTrackingMap';
import { CustomerManagement } from './components/admin/CustomerManagement';
import { NewspaperManagement } from './components/admin/NewspaperManagement';
import { RouteManagement } from './components/admin/RouteManagement';
import { DeliveryLogs } from './components/admin/DeliveryLogs';
import { ReportsAnalytics } from './components/admin/ReportsAnalytics';
import { PaymentsTracking } from './components/admin/PaymentsTracking';
import { AdminSettings } from './components/admin/AdminSettings';
import { AIDispatchAssistant } from './components/admin/AIDispatchAssistant';
import { StaffManagement } from './components/admin/StaffManagement';

// Staff Components
import { StaffHome } from './components/staff/StaffHome';
import { StaffRouteMap } from './components/staff/StaffRouteMap';
import { StaffDeliveryList } from './components/staff/StaffDeliveryList';
import { StaffHistory } from './components/staff/StaffHistory';

import {
  LayoutDashboard,
  MapPin,
  Users,
  Newspaper as PaperIcon,
  Route,
  FileCheck2,
  BarChart3,
  CreditCard,
  Settings,
  Bike,
  Home,
  CheckCircle,
  History,
  Navigation
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBeizfMp4-LZZGVPRxm4RDSGasVKtvhxfY';

// Gentle audio beep synthesizer using Web Audio API
function playArrivalBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.36);
  } catch {
    // Audio context may require user gesture on some browsers
  }
}

export default function App() {
  const [role, setRole] = useState<UserRole>('admin');
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [staffTab, setStaffTab] = useState<string>('home');
  const [lang, setLang] = useState<'en' | 'ta'>('en');

  // Application Data States
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [newspapers, setNewspapers] = useState<Newspaper[]>(() => storageService.getNewspapers());
  const [staffList, setStaffList] = useState<DeliveryStaff[]>(() => storageService.getStaff());
  const [routes, setRoutes] = useState<DeliveryRoute[]>(() => storageService.getRoutes());
  const [entries, setEntries] = useState<DeliveryEntry[]>(() => storageService.getDeliveryEntries());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => storageService.getNotifications());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => storageService.getPayments());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [offlineQueue, setOfflineQueue] = useState<DeliveryEntry[]>(() => storageService.getOfflineQueue());

  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => staffList[0]?.id || '');

  // Modals & Panels
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isNotifsDrawerOpen, setIsNotifsDrawerOpen] = useState(false);

  // Active nearby geofence alert modal state
  const [activeGeofenceAlert, setActiveGeofenceAlert] = useState<{
    customer: Customer;
    distanceMeters: number;
  } | null>(null);

  // Sync state from storageService
  const refreshFromStorage = useCallback(() => {
    setCustomers(storageService.getCustomers());
    setNewspapers(storageService.getNewspapers());
    setStaffList(storageService.getStaff());
    setRoutes(storageService.getRoutes());
    setEntries(storageService.getDeliveryEntries());
    setNotifications(storageService.getNotifications());
    setPayments(storageService.getPayments());
    setSettings(storageService.getSettings());
    setOfflineQueue(storageService.getOfflineQueue());
  }, []);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(refreshFromStorage);
    return () => {
      unsubscribe();
    };
  }, [refreshFromStorage]);

  const currentStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  const currentRoute = routes.find((r) => r.staffId === currentStaff?.id) || routes[0];

  // Geofence proximity watcher when staff is on shift
  useEffect(() => {
    if (role !== 'staff' || !currentStaff || currentStaff.shiftStatus !== 'on_route') return;
    if (!currentStaff.currentLat || !currentStaff.currentLng) return;

    // Check geofences around assigned customers
    const assignedCusts = customers.filter((c) => c.assignedStaffId === currentStaff.id);
    const results = checkCustomerGeofences(
      currentStaff.currentLat,
      currentStaff.currentLng,
      assignedCusts,
      settings.geofenceRadiusMeters,
      settings.autoCooldownSeconds
    );

    // If any pending customer should alert
    const trigger = results.find((r) => {
      if (!r.shouldAlert) return false;
      // Check if all papers are already delivered for this customer
      const custEntries = entries.filter((e) => e.customerId === r.customer.id);
      const totalActiveSubs = r.customer.subscriptions.filter((s) => s.isActive).length;
      const deliveredSubs = custEntries.filter((e) => e.status === 'delivered').length;
      return deliveredSubs < totalActiveSubs;
    });

    if (trigger) {
      setActiveGeofenceAlert({
        customer: trigger.customer,
        distanceMeters: trigger.distanceMeters,
      });

      if (settings.soundAlertsEnabled) {
        playArrivalBeep();
      }
      if (settings.vibrationAlertsEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      // Add to notifications
      const paperNames = trigger.customer.subscriptions
        .filter((s) => s.isActive)
        .map((s) => {
          const np = newspapers.find((p) => p.id === s.newspaperId);
          return `${np?.name || s.newspaperId} (x${s.quantity})`;
        })
        .join(', ');

      storageService.addNotification({
        id: `notif-geo-${Date.now()}`,
        recipientId: currentStaff.id,
        title: `📍 Nearby Delivery Alert: ${trigger.customer.fullName}`,
        titleTamil: `📍 அருகிலுள்ள விநியோகம்: ${trigger.customer.fullName}`,
        message: `Within ${Math.round(trigger.distanceMeters)}m of #${trigger.customer.houseNumber}, ${trigger.customer.street}. Papers: ${paperNames}`,
        notificationType: 'geofence_arrival',
        relatedCustomerId: trigger.customer.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }, [
    role,
    currentStaff,
    customers,
    entries,
    newspapers,
    settings.geofenceRadiusMeters,
    settings.autoCooldownSeconds,
    settings.soundAlertsEnabled,
    settings.vibrationAlertsEnabled
  ]);

  // Handler for simulating arrival at a customer house
  const handleSimulateArrival = (staff: DeliveryStaff, customer: Customer) => {
    // Move staff right outside the customer door (within 15m)
    const simulatedLat = customer.latitude - 0.0001;
    const simulatedLng = customer.longitude - 0.0001;

    storageService.updateStaffLocation(staff.id, simulatedLat, simulatedLng, 5);

    setActiveGeofenceAlert({
      customer,
      distanceMeters: 14,
    });

    if (settings.soundAlertsEnabled) playArrivalBeep();
    if (settings.vibrationAlertsEnabled && navigator.vibrate) navigator.vibrate([150, 80, 150]);

    // Notification
    const paperNames = customer.subscriptions
      .filter((s) => s.isActive)
      .map((s) => {
        const np = newspapers.find((p) => p.id === s.newspaperId);
        return `${np?.name || s.newspaperId} (x${s.quantity})`;
      })
      .join(', ');

    storageService.addNotification({
      id: `notif-geo-${Date.now()}`,
      recipientId: staff.id,
      title: `📍 Nearby Delivery Alert: ${customer.fullName}`,
      titleTamil: `📍 அருகிலுள்ள விநியோகம்: ${customer.fullName}`,
      message: `Within 14m of #${customer.houseNumber}, ${customer.street}. Subscribed: ${paperNames}`,
      notificationType: 'geofence_arrival',
      relatedCustomerId: customer.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  };

  // Confirm delivery from nearby geofence modal
  const handleConfirmGeofenceDelivery = (customer: Customer) => {
    customer.subscriptions
      .filter((s) => s.isActive)
      .forEach((sub) => {
        const paper = newspapers.find((p) => p.id === sub.newspaperId);
        const entry: DeliveryEntry = {
          id: `entry-${customer.id}-${sub.newspaperId}-${Date.now()}`,
          customerId: customer.id,
          customerName: customer.fullName,
          newspaperId: sub.newspaperId,
          newspaperName: paper?.name || sub.newspaperId,
          staffId: currentStaff?.id || 'unassigned',
          staffName: currentStaff?.fullName || 'Delivery Partner',
          routeId: currentStaff?.routeId || 'chidambaram-route',
          deliveryDate: new Date().toISOString().split('T')[0],
          quantity: sub.quantity,
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          latitude: customer.latitude,
          longitude: customer.longitude,
          notes: 'Confirmed via 50m Geofence Arrival prompt',
          isSynced: true,
          createdAt: new Date().toISOString(),
        };
        storageService.saveDeliveryEntry(entry);
      });

    setActiveGeofenceAlert(null);
  };

  const handleToggleStaffShift = (status: 'on_route' | 'off_duty') => {
    if (!currentStaff) return;
    storageService.updateStaffShift(currentStaff.id, status);
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'geometry']}>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
        {/* Compliance Quota Exceeded Banner */}
        <QuotaBanner />

        {/* Global Navigation Bar */}
        <Navbar
          currentRole={role}
          onRoleChange={setRole}
          staffList={staffList}
          selectedStaffId={selectedStaffId}
          onSelectStaff={setSelectedStaffId}
          lang={lang}
          onLangToggle={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
          unreadNotifsCount={unreadNotifs}
          onOpenNotifications={() => setIsNotifsDrawerOpen(true)}
          onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          offlineQueueCount={offlineQueue.length}
          onFlushOfflineQueue={() => {
            const count = storageService.flushOfflineQueue();
            alert(`Synced ${count} offline delivery entries.`);
          }}
          onResetDemo={() => {
            if (confirm('Reset PaperTrack sample data to initial state?')) {
              storageService.resetAllDemoData();
            }
          }}
        />

        {/* Main Body */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
          {/* ============================================================== */}
          {/* ADMIN INTERFACE                                                 */}
          {/* ============================================================== */}
          {role === 'admin' ? (
            <div className="flex flex-col md:flex-row gap-6 flex-1">
              {/* Desktop Admin Sidebar Navigation */}
              <aside className="w-full md:w-60 shrink-0">
                <nav className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm sticky top-24 space-y-1 text-xs">
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {lang === 'ta' ? 'நிர்வாக மையம்' : 'Operations Menu'}
                  </div>

                  {[
                    { id: 'dashboard', label: lang === 'ta' ? 'டாஷ்போர்டு' : 'Dashboard', icon: LayoutDashboard },
                    { id: 'live_map', label: lang === 'ta' ? 'நேரலை ஜி.பி.எஸ்' : 'Live Fleet Map', icon: MapPin },
                    { id: 'customers', label: lang === 'ta' ? 'வாடிக்கையாளர்கள்' : 'Customers', icon: Users },
                    { id: 'newspapers', label: lang === 'ta' ? 'நாளிதழ்கள்' : 'Newspapers', icon: PaperIcon },
                    { id: 'staff_management', label: lang === 'ta' ? 'ஊழியர்கள்' : 'Delivery Staff', icon: Bike },
                    { id: 'routes', label: lang === 'ta' ? 'விநியோக வழிகள்' : 'Delivery Routes', icon: Route },
                    { id: 'deliveries', label: lang === 'ta' ? 'விநியோகப் பதிவு' : 'Delivery Logs', icon: FileCheck2 },
                    { id: 'reports', label: lang === 'ta' ? 'அறிக்கைகள்' : 'Reports & Analytics', icon: BarChart3 },
                    { id: 'payments', label: lang === 'ta' ? 'சந்தாக் கட்டணம்' : 'Billing & Payments', icon: CreditCard },
                    { id: 'settings', label: lang === 'ta' ? 'அமைப்புகள்' : 'Geofence Settings', icon: Settings },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = adminTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setAdminTab(item.id)}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-2xl font-bold transition cursor-pointer text-left ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Admin Main Workspace Area */}
              <main className="flex-1 min-w-0">
                {adminTab === 'dashboard' && (
                  <AdminDashboard
                    customers={customers}
                    newspapers={newspapers}
                    staffList={staffList}
                    routes={routes}
                    entries={entries}
                    payments={payments}
                    onNavigateTab={setAdminTab}
                    onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
                    lang={lang}
                  />
                )}

                {adminTab === 'live_map' && (
                  <LiveTrackingMap
                    customers={customers}
                    staffList={staffList}
                    routes={routes}
                    entries={entries}
                    newspapers={newspapers}
                    geofenceRadiusMeters={settings.geofenceRadiusMeters}
                    onSimulateArrival={handleSimulateArrival}
                    lang={lang}
                  />
                )}

                {adminTab === 'customers' && (
                  <CustomerManagement
                    customers={customers}
                    newspapers={newspapers}
                    staffList={staffList}
                    onSaveCustomer={(c) => storageService.saveCustomer(c)}
                    onDeleteCustomer={(id) => storageService.deleteCustomer(id)}
                    lang={lang}
                  />
                )}

                {adminTab === 'newspapers' && (
                  <NewspaperManagement
                    newspapers={newspapers}
                    customers={customers}
                    onSaveNewspaper={(np) => storageService.saveNewspaper(np)}
                    lang={lang}
                  />
                )}

                {adminTab === 'staff_management' && (
                  <StaffManagement
                    staffList={staffList}
                    routes={routes}
                    onSaveStaff={(s) => storageService.saveStaff(s)}
                    onDeleteStaff={(id) => storageService.deleteStaff(id)}
                    lang={lang}
                  />
                )}

                {adminTab === 'routes' && (
                  <RouteManagement
                    routes={routes}
                    customers={customers}
                    staffList={staffList}
                    onSaveRoute={(r) => storageService.saveRoute(r)}
                    lang={lang}
                  />
                )}

                {adminTab === 'deliveries' && (
                  <DeliveryLogs
                    entries={entries}
                    newspapers={newspapers}
                    staffList={staffList}
                    customers={customers}
                    onUpdateEntry={(e) => storageService.saveDeliveryEntry(e)}
                    lang={lang}
                  />
                )}

                {adminTab === 'reports' && (
                  <ReportsAnalytics
                    entries={entries}
                    newspapers={newspapers}
                    staffList={staffList}
                    customers={customers}
                    routes={routes}
                    lang={lang}
                  />
                )}

                {adminTab === 'payments' && (
                  <PaymentsTracking
                    customers={customers}
                    payments={payments}
                    onRecordPayment={(p) => storageService.recordPayment(p)}
                    lang={lang}
                  />
                )}

                {adminTab === 'settings' && (
                  <AdminSettings
                    settings={settings}
                    onSaveSettings={(s) => storageService.saveSettings(s)}
                    lang={lang}
                  />
                )}
              </main>
            </div>
          ) : (
            /* ============================================================== */
            /* DELIVERY STAFF MOBILE INTERFACE                                */
            /* ============================================================== */
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
              {staffList.length === 0 || !currentStaff ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm my-8">
                  <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
                    <Bike className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg">No Delivery Staff Registered</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
                    Fake mock staff records have been removed. Please add your real delivery partner in the Admin panel to start using the mobile delivery workflow.
                  </p>
                  <button
                    onClick={() => {
                      setRole('admin');
                      setAdminTab('staff_management');
                    }}
                    className="mt-6 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Go to Admin to Add Delivery Staff
                  </button>
                </div>
              ) : (
                <>
                  {staffTab === 'home' && (
                    <StaffHome
                      staff={currentStaff}
                      route={currentRoute}
                      customers={customers}
                      entries={entries}
                      newspapers={newspapers}
                      staffList={staffList}
                      onToggleShift={handleToggleStaffShift}
                      onNavigateToTab={setStaffTab}
                      onSaveCustomer={(c) => storageService.saveCustomer(c)}
                      lang={lang}
                    />
                  )}

                  {staffTab === 'map' && (
                    <StaffRouteMap
                      staff={currentStaff}
                      customers={customers}
                      entries={entries}
                      newspapers={newspapers}
                      geofenceRadiusMeters={settings.geofenceRadiusMeters}
                      onSimulateArrival={handleSimulateArrival}
                      lang={lang}
                    />
                  )}

                  {staffTab === 'customers' && (
                    <StaffDeliveryList
                      staff={currentStaff}
                      customers={customers}
                      entries={entries}
                      newspapers={newspapers}
                      staffList={staffList}
                      onSaveDeliveryEntry={(e) => storageService.saveDeliveryEntry(e)}
                      onSaveCustomer={(c) => storageService.saveCustomer(c)}
                      lang={lang}
                    />
                  )}

                  {staffTab === 'history' && (
                    <StaffHistory
                      staff={currentStaff}
                      entries={entries}
                      lang={lang}
                    />
                  )}
                </>
              )}

              {/* Staff Mobile Sticky Bottom Navigation */}
              <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 max-w-lg mx-auto shadow-2xl flex items-center justify-around text-[10px] font-bold">
                <button
                  onClick={() => setStaffTab('home')}
                  className={`flex flex-col items-center p-1.5 transition cursor-pointer ${
                    staffTab === 'home' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Home className="w-5 h-5 mb-0.5" />
                  <span>{lang === 'ta' ? 'முகப்பு' : 'Home'}</span>
                </button>

                <button
                  onClick={() => setStaffTab('map')}
                  className={`flex flex-col items-center p-1.5 transition cursor-pointer ${
                    staffTab === 'map' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MapPin className="w-5 h-5 mb-0.5" />
                  <span>{lang === 'ta' ? 'வரைபடம்' : 'My Route'}</span>
                </button>

                <button
                  onClick={() => setStaffTab('customers')}
                  className={`flex flex-col items-center p-1.5 transition cursor-pointer ${
                    staffTab === 'customers' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 mb-0.5" />
                  <span>{lang === 'ta' ? 'வாடிக்கையாளர்' : 'Stops'}</span>
                </button>

                <button
                  onClick={() => setStaffTab('history')}
                  className={`flex flex-col items-center p-1.5 transition cursor-pointer ${
                    staffTab === 'history' ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-5 h-5 mb-0.5" />
                  <span>{lang === 'ta' ? 'வரலாறு' : 'History'}</span>
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Global Nearby House Arrival Geofence Modal */}
        <NearbyGeofenceModal
          customer={activeGeofenceAlert?.customer || null}
          distanceMeters={activeGeofenceAlert?.distanceMeters || 50}
          newspapers={newspapers}
          staff={currentStaff}
          onConfirmDelivered={handleConfirmGeofenceDelivery}
          onDismiss={() => setActiveGeofenceAlert(null)}
          lang={lang}
        />

        {/* Smart Notifications Drawer */}
        <NotificationDrawer
          isOpen={isNotifsDrawerOpen}
          onClose={() => setIsNotifsDrawerOpen(false)}
          notifications={notifications}
          onMarkRead={(id) => storageService.markNotificationRead(id)}
          onMarkAllRead={() => storageService.markAllNotificationsRead()}
          onClearAll={() => storageService.clearNotifications()}
          lang={lang}
        />

        {/* AI Route Intelligence Assistant Modal */}
        <AIDispatchAssistant
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          lang={lang}
        />

        {/* Supabase Schema Modal */}
        <SupabaseSchemaModal
          isOpen={isSchemaModalOpen}
          onClose={() => setIsSchemaModalOpen(false)}
        />
      </div>
    </APIProvider>
  );
}
