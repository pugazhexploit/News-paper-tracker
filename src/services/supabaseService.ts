import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Customer } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabaseService = {
  isConfigured(): boolean {
    return !!supabaseClient;
  },

  getClient(): SupabaseClient | null {
    return supabaseClient;
  },

  /**
   * Save or update a customer record in the Supabase PostgreSQL customers table.
   * Maps TypeScript model to the PostgreSQL schema defined in supabaseSchema.sql.
   */
  async saveCustomer(customer: Customer): Promise<{
    success: boolean;
    error?: string;
    isConfigured: boolean;
    source: 'supabase' | 'local_fallback';
  }> {
    if (!supabaseClient) {
      return {
        success: true,
        isConfigured: false,
        source: 'local_fallback'
      };
    }

    try {
      const fullHouse = customer.floorApartment
        ? `${customer.houseNumber} (${customer.floorApartment})`
        : customer.houseNumber;

      const customerPayload = {
        id: customer.id,
        full_name: customer.fullName,
        phone: customer.phone,
        alternate_phone: customer.alternatePhone || null,
        house_number: fullHouse,
        street: customer.street,
        area: customer.area,
        city: customer.city || 'Chidambaram',
        district: customer.district || 'Cuddalore District',
        pincode: customer.pincode || '608001',
        latitude: customer.latitude,
        longitude: customer.longitude,
        place_id: customer.placeId || null,
        landmark: customer.landmark || null,
        delivery_instructions: customer.deliveryInstructions || null,
        assigned_staff_id: customer.assignedStaffId && !customer.assignedStaffId.startsWith('staff-')
          ? customer.assignedStaffId
          : null,
        monthly_amount: customer.monthlyAmount || 0,
        payment_status: customer.paymentStatus || 'unpaid',
        last_payment_date: customer.lastPaymentDate || null,
        is_active: customer.isActive ?? true
      };

      const { data, error } = await supabaseClient
        .from('customers')
        .upsert(customerPayload, { onConflict: 'id' })
        .select();

      if (error) {
        console.error('Supabase customer upsert error:', error);
        return {
          success: false,
          error: error.message,
          isConfigured: true,
          source: 'supabase'
        };
      }

      // Also upsert subscriptions if any
      if (customer.subscriptions && customer.subscriptions.length > 0) {
        const subsPayload = customer.subscriptions.map((sub) => ({
          id: sub.id,
          customer_id: customer.id,
          newspaper_id: sub.newspaperId,
          quantity: sub.quantity,
          delivery_schedule: sub.deliverySchedule || 'all_days',
          start_date: sub.startDate || new Date().toISOString().split('T')[0],
          end_date: sub.endDate || null,
          special_instructions: sub.specialInstructions || null,
          is_active: sub.isActive ?? true
        }));

        await supabaseClient
          .from('subscriptions')
          .upsert(subsPayload, { onConflict: 'id' });
      }

      return {
        success: true,
        isConfigured: true,
        source: 'supabase'
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error saving customer to Supabase:', message);
      return {
        success: false,
        error: message,
        isConfigured: true,
        source: 'supabase'
      };
    }
  }
};
