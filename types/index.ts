import { Prisma } from "@prisma/client";

// ─── Customer Types ───────────────────────────────────────────────────────────
export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  village: string | null;
  notes: string | null;
  openingBalance: number;
  currentBalance: number;
  isPinned: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    transactions: number;
  };
};

export type CustomerWithTransactions = Customer & {
  transactions: Transaction[];
};

// ─── Transaction Types ────────────────────────────────────────────────────────
export type TransactionType = "SALE" | "PAYMENT" | "ADJUSTMENT";

export type Transaction = {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes: string | null;
  referenceNumber: string | null;
  date: Date;
  runningBalance: number;
  createdById: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Pick<Customer, "id" | "name" | "phone">;
};

// ─── Business Settings Types ──────────────────────────────────────────────────
export type BusinessSettings = {
  id: string;
  businessName: string;
  ownerName: string;
  address: string;
  phone: string;
  gstNumber: string;
  upiId: string;
  upiQrImage: string | null;
  logoImage: string | null;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  footerMessage: string;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Audit Log Types ──────────────────────────────────────────────────────────
export type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Prisma.JsonValue | null;
  newData: Prisma.JsonValue | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

// ─── API Response Types ───────────────────────────────────────────────────────
export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// ─── Dashboard Types ──────────────────────────────────────────────────────────
export type DashboardStats = {
  todaySales: number;
  todayPayments: number;
  outstandingAmount: number;
  totalCustomers: number;
  totalTransactions: number;
  monthlyData: MonthlyData[];
  recentTransactions: Transaction[];
  pendingCustomers: Customer[];
};

export type MonthlyData = {
  month: string;
  sales: number;
  payments: number;
  outstanding: number;
};

// ─── Ledger Types ─────────────────────────────────────────────────────────────
export type LedgerEntry = {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: TransactionType;
  referenceNumber: string | null;
  notes: string | null;
};

export type LedgerData = {
  customer: Customer;
  business: BusinessSettings;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  entries: LedgerEntry[];
  generatedAt: Date;
  dateRange?: {
    from: Date;
    to: Date;
  };
};

// ─── Filter/Sort Types ────────────────────────────────────────────────────────
export type CustomerFilter = "all" | "pending" | "paid" | "pinned" | "favorites" | "deleted";
export type SortDirection = "asc" | "desc";

export type CustomerSortField =
  | "name"
  | "currentBalance"
  | "createdAt"
  | "updatedAt";

export type TransactionFilter = "all" | "SALE" | "PAYMENT" | "ADJUSTMENT";

// ─── Report Types ─────────────────────────────────────────────────────────────
export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type ReportData = {
  period: ReportPeriod;
  totalSales: number;
  totalPayments: number;
  outstanding: number;
  transactions: Transaction[];
  customerSummary: CustomerSummary[];
};

export type CustomerSummary = {
  customer: Customer;
  totalSales: number;
  totalPayments: number;
  balance: number;
  transactionCount: number;
};

// ─── Navigation Types ─────────────────────────────────────────────────────────
export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
};

// ─── Theme Types ──────────────────────────────────────────────────────────────
export type Theme = "light" | "dark" | "system";
