import { Newspaper, Customer, DeliveryStaff, DeliveryRoute, DeliveryEntry, AppNotification, PaymentRecord } from '../types';

export const CHIDAMBARAM_CENTER = {
  lat: 11.3992,
  lng: 79.6936,
  city: 'Chidambaram',
  district: 'Cuddalore District',
  state: 'Tamil Nadu',
  pincode: '608001'
};

// Standard newspaper catalog available for Chidambaram & Cuddalore distribution
export const INITIAL_NEWSPAPERS: Newspaper[] = [
  {
    id: 'paper-hindu-en',
    name: 'The Hindu – English',
    nameTamil: 'தி இந்து (ஆங்கிலம்)',
    language: 'English',
    publisher: 'Kasturi & Sons Ltd',
    edition: 'Cuddalore & Chidambaram',
    pricePerCopy: 9.0,
    subscriptionMonthly: 270,
    isActive: true,
    color: '#0284c7', // sky-600
  },
  {
    id: 'paper-hindu-tamil',
    name: 'The Hindu – Tamil',
    nameTamil: 'தி இந்து தமிழ் திசை',
    language: 'Tamil',
    publisher: 'Kasturi & Sons Ltd',
    edition: 'Cuddalore Edition',
    pricePerCopy: 6.0,
    subscriptionMonthly: 180,
    isActive: true,
    color: '#0d9488', // teal-600
  },
  {
    id: 'paper-dina-thanthi',
    name: 'Dina Thanthi – Tamil',
    nameTamil: 'தினத்தந்தி (கடலூர் / சிதம்பரம்)',
    language: 'Tamil',
    publisher: 'Thanthi Trust',
    edition: 'Cuddalore Central',
    pricePerCopy: 6.0,
    subscriptionMonthly: 180,
    isActive: true,
    color: '#7c3aed', // violet-600
  },
  {
    id: 'paper-dinamalar',
    name: 'Dinamalar – Tamil',
    nameTamil: 'தினமலர் (சிதம்பரம்)',
    language: 'Tamil',
    publisher: 'Dinamalar Publications',
    edition: 'Cuddalore Metro',
    pricePerCopy: 6.0,
    subscriptionMonthly: 180,
    isActive: true,
    color: '#ea580c', // orange-600
  },
  {
    id: 'paper-nie-en',
    name: 'The New Indian Express – English',
    nameTamil: 'தி நியூ இந்தியன் எக்ஸ்பிரஸ்',
    language: 'English',
    publisher: 'Express Publications',
    edition: 'Chidambaram City',
    pricePerCopy: 7.5,
    subscriptionMonthly: 225,
    isActive: true,
    color: '#d97706', // amber-600
  },
  {
    id: 'paper-tn-tamil',
    name: 'Tamil Nadu Newspaper – Tamil',
    nameTamil: 'தமிழ் நாடு நாளிதழ் (சிதம்பரம் பதிப்பு)',
    language: 'Tamil',
    publisher: 'TN Media Ltd',
    edition: 'Chidambaram Morning',
    pricePerCopy: 5.0,
    subscriptionMonthly: 150,
    isActive: true,
    color: '#e11d48', // rose-600
  }
];

// Mock fake customer and staff records removed
export const INITIAL_STAFF: DeliveryStaff[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_ROUTES: DeliveryRoute[] = [];
export const INITIAL_DELIVERY_ENTRIES: DeliveryEntry[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
