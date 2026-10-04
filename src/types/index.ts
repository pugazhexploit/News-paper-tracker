export type UserRole = 'admin' | 'staff';

export type DeliveryStatus = 'pending' | 'delivered' | 'missed' | 'postponed' | 'paused';

export type PaymentStatus = 'paid' | 'unpaid' | 'overdue';

export interface Newspaper {
  id: string;
  name: string;
  nameTamil?: string;
  language: 'English' | 'Tamil' | 'Bilingual' | 'Other';
  publisher: string;
  edition: string;
  pricePerCopy: number; // in INR (₹)
  subscriptionMonthly: number; // in INR (₹)
  isActive: boolean;
  color: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  newspaperId: string;
  quantity: number;
  deliverySchedule: 'all_days' | 'weekdays_only' | 'weekends_only' | 'sunday_only';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  specialInstructions?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  houseNumber: string;
  floorApartment?: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  formattedAddress?: string;
  gpsAccuracy?: number;
  landmark?: string;
  deliveryInstructions?: string;
  assignedStaffId: string;
  isActive: boolean;
  paymentStatus: PaymentStatus;
  monthlyAmount: number;
  lastPaymentDate?: string;
  subscriptions: Subscription[];
}

export interface DeliveryStaff {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  routeId: string;
  isActive: boolean;
  shiftStatus: 'off_duty' | 'on_route' | 'break';
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  batteryLevel?: number;
  gpsAccuracy?: number; // in meters
}

export interface RouteStop {
  id: string;
  customerId: string;
  stopOrder: number;
  status: DeliveryStatus;
  completedAt?: string;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  staffId: string;
  area: string;
  district: string;
  routeDate: string;
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedDurationMins: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface DeliveryEntry {
  id: string;
  customerId: string;
  customerName: string;
  newspaperId: string;
  newspaperName: string;
  staffId: string;
  staffName: string;
  routeId: string;
  deliveryDate: string; // YYYY-MM-DD
  quantity: number;
  status: DeliveryStatus;
  deliveredAt?: string;
  latitude?: number;
  longitude?: number;
  proofPhotoUrl?: string;
  notes?: string;
  missedReason?: string;
  isSynced: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // 'admin' or staffId
  title: string;
  titleTamil?: string;
  message: string;
  notificationType: 'geofence_arrival' | 'delivery_completed' | 'delivery_missed' | 'shift_started' | 'shift_stopped' | 'route_completed' | 'alert';
  relatedCustomerId?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    customerName?: string;
    address?: string;
    newspapers?: string;
    lat?: number;
    lng?: number;
  };
}

export interface AuditLog {
  id: string;
  actorName: string;
  action: string;
  tableName: string;
  recordId: string;
  details: string;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  monthYear: string; // e.g. "October 2026"
  amount: number;
  paidOn: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
  receiptNumber: string;
  notes?: string;
}
