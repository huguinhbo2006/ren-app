// =============================================================================
// Rentame Mobile — Shared Models & TypeScript Interfaces
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface Plan {
  id: number;
  name: string;
  slug: 'free' | 'pro';
  description: string;
  price_cents: number;
  duration_days: number;
  features: PlanFeatures;
  is_active: boolean;
}

export interface PlanFeatures {
  reports: boolean;
  export_pdf: boolean;
  export_excel: boolean;
  multi_user: boolean;
  contract_pdf: boolean;
  audit_log: boolean;
  advanced_dashboard: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  plan: Plan | null;
  plan_expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  token: string;
  user: User;
  abilities: string[];
  expires_at: string | null;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  email: string | null;
  phone: string;
  rfc: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  rental_count?: number;
  total_owed_cents?: number;
  created_at: string;
  updated_at: string;
}

export type AssetStatus = 'available' | 'rented' | 'maintenance' | 'inactive';

export interface AssetCategory {
  id: number;
  user_id: number;
  name: string;
  icon: string;
  color: string;
  description: string | null;
}

export interface Asset {
  id: number;
  user_id: number;
  category_id: number | null;
  category?: AssetCategory;
  name: string;
  description: string | null;
  serial_number: string | null;
  daily_rate_cents: number;
  weekly_rate_cents: number;
  monthly_rate_cents: number;
  deposit_cents: number;
  status: AssetStatus;
  location: string | null;
  notes: string | null;
  images: string[];
  primary_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtraService {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  price_cents: number;
  unit: string;
  is_active: boolean;
}

export type RentalStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Rental {
  id: number;
  user_id: number;
  customer_id: number;
  asset_id: number;
  folio: string;
  customer?: Customer;
  asset?: Asset;
  extras?: RentalExtra[];
  payments?: Payment[];
  start_date: string;
  end_date: string;
  actual_return_date: string | null;
  rental_days: number;
  base_amount_cents: number;
  extras_amount_cents: number;
  discount_cents: number;
  deposit_cents: number;
  deposit_returned: boolean;
  total_amount_cents: number;
  status: RentalStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  terms_text: string | null;
  days_remaining?: number;
  is_overdue?: boolean;
  paid_amount_cents?: number;
  pending_amount_cents?: number;
  pending_balance_cents?: number;
  status_label?: string;
  payment_status_label?: string;
  created_at: string;
  updated_at: string;
}

export interface RentalExtra {
  id: number;
  rental_id: number;
  extra_service_id: number | null;
  name: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents?: number;
  total_price_cents?: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check';
export type PaymentType = 'income' | 'deposit';

export interface Payment {
  id: number;
  rental_id: number;
  rental_folio?: string;
  user_id: number;
  rental?: Pick<Rental, 'id' | 'folio' | 'customer' | 'asset'>;
  amount_cents: number;
  payment_date: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  type: PaymentType;
  created_at: string;
}

export type ExpenseType = 'maintenance' | 'repair' | 'purchase' | 'other';

export interface Expense {
  id: number;
  user_id: number;
  asset_id: number | null;
  asset?: Pick<Asset, 'id' | 'name'>;
  category: string;
  description: string;
  amount_cents: number;
  expense_date: string;
  vendor: string | null;
  receipt_url: string | null;
  type: ExpenseType;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  total_rentals_active: number;
  monthly_income_cents: number;
  monthly_expenses_cents: number;
  accounts_receivable_cents: number;
  assets_available: number;
  assets_rented: number;
  assets_maintenance: number;
  rentals_expiring_soon: RentalExpiringSoon[];
  recent_payments: RecentPaymentItem[];
  monthly_chart: MonthlyChartData[];
}

export interface RentalExpiringSoon {
  id: number;
  folio: string;
  end_date: string;
  days_remaining: number;
  customer: Pick<Customer, 'id' | 'name' | 'phone'>;
  asset: Pick<Asset, 'id' | 'name'>;
}

export interface RecentPaymentItem {
  id: number;
  rental_id: number;
  rental_folio?: string;
  customer_name?: string;
  amount_cents: number;
  payment_date: string;
  method: PaymentMethod;
  type: PaymentType;
  reference: string | null;
}

export interface MonthlyChartData {
  month: string;
  income_cents: number;
  expenses_cents: number;
}
