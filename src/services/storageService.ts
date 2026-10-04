import {
  Customer,
  Newspaper,
  DeliveryStaff,
  DeliveryRoute,
  DeliveryEntry,
  AppNotification,
  PaymentRecord,
  AuditLog
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_NEWSPAPERS,
  INITIAL_STAFF,
  INITIAL_ROUTES,
  INITIAL_DELIVERY_ENTRIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENTS
} from '../data/mockData';
import { supabaseService } from './supabaseService';

const KEYS = {
  CUSTOMERS: 'papertrack_chidambaram_v9_customers',
  NEWSPAPERS: 'papertrack_chidambaram_v9_newspapers',
  STAFF: 'papertrack_chidambaram_v9_staff',
  ROUTES: 'papertrack_chidambaram_v9_routes',
  ENTRIES: 'papertrack_chidambaram_v9_entries',
  NOTIFICATIONS: 'papertrack_chidambaram_v9_notifications',
  PAYMENTS: 'papertrack_chidambaram_v9_payments',
  AUDIT_LOGS: 'papertrack_chidambaram_v9_audit_logs',
  SETTINGS: 'papertrack_chidambaram_v9_settings',
  OFFLINE_QUEUE: 'papertrack_chidambaram_v9_offline_queue',
};

// Purge any old legacy keys from previous runs containing fake customers or fake staff
try {
  const legacyKeys = [
    'papertrack_clean_v5_customers',
    'papertrack_clean_v5_staff',
    'papertrack_clean_v5_routes',
    'papertrack_clean_v5_entries',
    'papertrack_clean_v5_notifications',
    'papertrack_clean_v5_payments',
    'papertrack_clean_v5_newspapers',
    'papertrack_customers',
    'papertrack_staff',
    'papertrack_routes',
    'papertrack_entries'
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch {
  // Ignore in SSR/test environments
}

export interface AppSettings {
  geofenceRadiusMeters: number; // default 50
  soundAlertsEnabled: boolean;
  vibrationAlertsEnabled: boolean;
  autoCooldownSeconds: number; // default 120
  allowPhotoUploadProof: boolean;
  requireStaffGpsForDelivery: boolean;
  adminNotificationAlerts: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  geofenceRadiusMeters: 50,
  soundAlertsEnabled: true,
  vibrationAlertsEnabled: true,
  autoCooldownSeconds: 120,
  allowPhotoUploadProof: true,
  requireStaffGpsForDelivery: false,
  adminNotificationAlerts: true,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export const storageService = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // Customers
  getCustomers(): Customer[] {
    const raw = localStorage.getItem(KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    try {
      const parsed: Customer[] = JSON.parse(raw);
      // Filter out any legacy mock fake customers
      const filtered = parsed.filter(
        (c) =>
          !c.id.startsWith('cust-ramesh') &&
          !c.id.startsWith('cust-selvi') &&
          !c.id.startsWith('cust-balu') &&
          !c.id.startsWith('cust-priya') &&
          !c.id.startsWith('cust-anand')
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomer(customer: Customer) {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
      this.addAuditLog('Admin', 'Update Customer', 'customers', customer.id, `Updated customer ${customer.fullName}`);
    } else {
      customers.push(customer);
      this.addAuditLog('Admin', 'Create Customer', 'customers', customer.id, `Created customer ${customer.fullName}`);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    notifyListeners();

    // Asynchronously sync to Supabase PostgreSQL database
    supabaseService.saveCustomer(customer).then((res) => {
      if (res.isConfigured && res.success) {
        this.addAuditLog('System', 'Supabase Sync', 'customers', customer.id, `Synced ${customer.fullName} to Supabase customers table`);
      }
    }).catch((err) => {
      console.warn('Background Supabase sync notice:', err);
    });
  },

  deleteCustomer(id: string) {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    this.addAuditLog('Admin', 'Delete Customer', 'customers', id, `Deleted customer ID ${id}`);
    notifyListeners();
  },

  // Newspapers
  getNewspapers(): Newspaper[] {
    const raw = localStorage.getItem(KEYS.NEWSPAPERS);
    if (!raw) {
      localStorage.setItem(KEYS.NEWSPAPERS, JSON.stringify(INITIAL_NEWSPAPERS));
      return INITIAL_NEWSPAPERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_NEWSPAPERS;
    }
  },

  saveNewspaper(newspaper: Newspaper) {
    const papers = this.getNewspapers();
    const idx = papers.findIndex((p) => p.id === newspaper.id);
    if (idx >= 0) {
      papers[idx] = newspaper;
      this.addAuditLog('Admin', 'Update Newspaper', 'newspapers', newspaper.id, `Updated newspaper ${newspaper.name}`);
    } else {
      papers.push(newspaper);
      this.addAuditLog('Admin', 'Create Newspaper', 'newspapers', newspaper.id, `Added newspaper ${newspaper.name}`);
    }
    localStorage.setItem(KEYS.NEWSPAPERS, JSON.stringify(papers));
    notifyListeners();
  },

  // Staff
  getStaff(): DeliveryStaff[] {
    const raw = localStorage.getItem(KEYS.STAFF);
    if (!raw) {
      localStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    try {
      const parsed: DeliveryStaff[] = JSON.parse(raw);
      // Filter out any legacy mock fake staff
      const filtered = parsed.filter(
        (s) =>
          !s.id.startsWith('staff-murugan') &&
          !s.id.startsWith('staff-karthik') &&
          !s.id.startsWith('staff-saravanan')
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(KEYS.STAFF, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return INITIAL_STAFF;
    }
  },

  saveStaff(staffMember: DeliveryStaff) {
    const list = this.getStaff();
    const idx = list.findIndex((s) => s.id === staffMember.id);
    if (idx >= 0) {
      list[idx] = staffMember;
    } else {
      list.push(staffMember);
    }
    localStorage.setItem(KEYS.STAFF, JSON.stringify(list));
    notifyListeners();
  },

  deleteStaff(id: string) {
    const list = this.getStaff().filter((s) => s.id !== id);
    localStorage.setItem(KEYS.STAFF, JSON.stringify(list));
    this.addAuditLog('Admin', 'Delete Staff', 'staff', id, `Removed staff member ID ${id}`);
    notifyListeners();
  },

  updateStaffLocation(staffId: string, lat: number, lng: number, accuracy?: number) {
    const staffList = this.getStaff();
    const idx = staffList.findIndex((s) => s.id === staffId);
    if (idx >= 0) {
      staffList[idx] = {
        ...staffList[idx],
        currentLat: lat,
        currentLng: lng,
        lastLocationUpdate: 'Just now',
        gpsAccuracy: accuracy ?? 10,
      };
      localStorage.setItem(KEYS.STAFF, JSON.stringify(staffList));
      notifyListeners();
    }
  },

  updateStaffShift(staffId: string, status: 'off_duty' | 'on_route' | 'break') {
    const staffList = this.getStaff();
    const idx = staffList.findIndex((s) => s.id === staffId);
    if (idx >= 0) {
      const staff = staffList[idx];
      staffList[idx] = {
        ...staff,
        shiftStatus: status,
      };
      localStorage.setItem(KEYS.STAFF, JSON.stringify(staffList));

      // Trigger notification
      this.addNotification({
        id: `notif-${Date.now()}`,
        recipientId: 'admin',
        title: status === 'on_route' ? `Shift Started: ${staff.fullName}` : `Shift Ended: ${staff.fullName}`,
        titleTamil: status === 'on_route' ? `பணி தொடங்கியது: ${staff.fullName}` : `பணி நிறைவுற்றது: ${staff.fullName}`,
        message: `${staff.fullName} ${status === 'on_route' ? 'started active delivery shift' : 'went off-duty'}.`,
        notificationType: status === 'on_route' ? 'shift_started' : 'shift_stopped',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      this.addAuditLog(staff.fullName, 'Shift Status Change', 'shifts', staffId, `Changed shift to ${status}`);
      notifyListeners();
    }
  },

  // Routes
  getRoutes(): DeliveryRoute[] {
    const raw = localStorage.getItem(KEYS.ROUTES);
    if (!raw) {
      localStorage.setItem(KEYS.ROUTES, JSON.stringify(INITIAL_ROUTES));
      return INITIAL_ROUTES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ROUTES;
    }
  },

  saveRoute(route: DeliveryRoute) {
    const routes = this.getRoutes();
    const idx = routes.findIndex((r) => r.id === route.id);
    if (idx >= 0) {
      routes[idx] = route;
    } else {
      routes.push(route);
    }
    localStorage.setItem(KEYS.ROUTES, JSON.stringify(routes));
    notifyListeners();
  },

  // Delivery Entries
  getDeliveryEntries(): DeliveryEntry[] {
    const raw = localStorage.getItem(KEYS.ENTRIES);
    if (!raw) {
      localStorage.setItem(KEYS.ENTRIES, JSON.stringify(INITIAL_DELIVERY_ENTRIES));
      return INITIAL_DELIVERY_ENTRIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DELIVERY_ENTRIES;
    }
  },

  saveDeliveryEntry(entry: DeliveryEntry) {
    const entries = this.getDeliveryEntries();
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      entries[idx] = entry;
      this.addAuditLog(entry.staffName || 'Staff', 'Update Delivery Entry', 'delivery_entries', entry.id, `Status set to ${entry.status}`);
    } else {
      entries.unshift(entry);
      this.addAuditLog(entry.staffName || 'Staff', 'New Delivery Entry', 'delivery_entries', entry.id, `${entry.newspaperName} -> ${entry.customerName} (${entry.status})`);
    }
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));

    // Update stop status in route if all customer's papers are handled
    this.checkAndUpdateRouteStop(entry.customerId);

    // Create notification if delivered or missed
    if (entry.status === 'delivered') {
      this.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        recipientId: 'admin',
        title: `Paper Delivered: ${entry.customerName}`,
        titleTamil: `நாளிதழ் விநியோகம்: ${entry.customerName}`,
        message: `${entry.newspaperName} (Qty: ${entry.quantity}) delivered by ${entry.staffName}.`,
        notificationType: 'delivery_completed',
        relatedCustomerId: entry.customerId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } else if (entry.status === 'missed') {
      this.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        recipientId: 'admin',
        title: `Delivery Missed: ${entry.customerName}`,
        titleTamil: `விநியோகம் தவறவிடப்பட்டது: ${entry.customerName}`,
        message: `Reason: ${entry.missedReason || 'Not reachable'} - Reported by ${entry.staffName}.`,
        notificationType: 'delivery_missed',
        relatedCustomerId: entry.customerId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    notifyListeners();
  },

  checkAndUpdateRouteStop(customerId: string) {
    const routes = this.getRoutes();
    const entries = this.getDeliveryEntries().filter((e) => e.customerId === customerId);
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const activeSubs = customer.subscriptions.filter((s) => s.isActive);
    const deliveredCount = activeSubs.filter((s) =>
      entries.some((e) => e.newspaperId === s.newspaperId && e.status === 'delivered')
    ).length;

    let stopStatus: 'delivered' | 'pending' | 'missed' = 'pending';
    if (deliveredCount === activeSubs.length && activeSubs.length > 0) {
      stopStatus = 'delivered';
    } else if (entries.some((e) => e.status === 'missed')) {
      stopStatus = 'missed';
    }

    let changed = false;
    routes.forEach((route) => {
      route.stops.forEach((stop) => {
        if (stop.customerId === customerId) {
          stop.status = stopStatus;
          if (stopStatus === 'delivered' && !stop.completedAt) {
            stop.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          changed = true;
        }
      });
    });

    if (changed) {
      localStorage.setItem(KEYS.ROUTES, JSON.stringify(routes));
    }
  },

  // Notifications
  getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  addNotification(notif: AppNotification) {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs.slice(0, 100))); // keep 100 recent
    notifyListeners();
  },

  markNotificationRead(id: string) {
    const notifs = this.getNotifications();
    const item = notifs.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      notifyListeners();
    }
  },

  markAllNotificationsRead() {
    const notifs = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifyListeners();
  },

  clearNotifications() {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
    notifyListeners();
  },

  // Payments
  getPayments(): PaymentRecord[] {
    const raw = localStorage.getItem(KEYS.PAYMENTS);
    if (!raw) {
      localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  recordPayment(payment: PaymentRecord) {
    const payments = this.getPayments();
    payments.unshift(payment);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));

    // Update customer status to paid
    const customers = this.getCustomers();
    const cust = customers.find((c) => c.id === payment.customerId);
    if (cust) {
      cust.paymentStatus = 'paid';
      cust.lastPaymentDate = payment.paidOn;
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    }

    this.addAuditLog('Admin', 'Payment Recorded', 'payments', payment.id, `₹${payment.amount} collected for ${payment.customerName}`);
    notifyListeners();
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addAuditLog(actorName: string, action: string, tableName: string, recordId: string, details: string) {
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorName,
      action,
      tableName,
      recordId,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(log);
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
  },

  // Settings
  getSettings(): AppSettings {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    this.addAuditLog('Admin', 'Settings Updated', 'settings', 'global', `Geofence radius: ${settings.geofenceRadiusMeters}m`);
    notifyListeners();
  },

  // Offline Sync Queue
  getOfflineQueue(): DeliveryEntry[] {
    const raw = localStorage.getItem(KEYS.OFFLINE_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addToOfflineQueue(entry: DeliveryEntry) {
    const queue = this.getOfflineQueue();
    queue.push(entry);
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    notifyListeners();
  },

  flushOfflineQueue(): number {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;
    const count = queue.length;
    queue.forEach((entry) => {
      this.saveDeliveryEntry({ ...entry, isSynced: true });
    });
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    notifyListeners();
    return count;
  },

  // Reset to demo data
  resetAllDemoData() {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(KEYS.NEWSPAPERS, JSON.stringify(INITIAL_NEWSPAPERS));
    localStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    localStorage.setItem(KEYS.ROUTES, JSON.stringify(INITIAL_ROUTES));
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(INITIAL_DELIVERY_ENTRIES));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    this.addAuditLog('System', 'Demo Reset', 'all', 'system', 'Restored initial sample data');
    notifyListeners();
  }
};
