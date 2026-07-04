import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatter ───────────────────────────────────────────────────────
export const formatCurrency = (
  amount: number | string | null | undefined,
  options?: { showSign?: boolean; compact?: boolean }
): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return "₹0";

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    notation: options?.compact ? "compact" : "standard",
  });

  const formatted = formatter.format(Math.abs(num));

  if (options?.showSign && num > 0) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return formatted;
};

// ─── Date Formatters ─────────────────────────────────────────────────────────
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd/MM/yyyy");
  } catch {
    return "—";
  }
};

export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "—";
  try {
    return format(new Date(date), "dd/MM/yyyy, hh:mm a");
  } catch {
    return "—";
  }
};

export const formatRelativeTime = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "—";
  try {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  } catch {
    return "—";
  }
};

// ─── Number Formatters ────────────────────────────────────────────────────────
export const formatNumber = (num: number | string | null | undefined): string => {
  const n = typeof num === "string" ? parseFloat(num) : (num ?? 0);
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("en-IN").format(n);
};

// ─── String Utilities ─────────────────────────────────────────────────────────
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateReferenceNumber = (): string => {
  const prefix = "TXN";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ─── Balance Helpers ─────────────────────────────────────────────────────────
export const getBalanceStatus = (
  balance: number
): "paid" | "pending" | "credit" => {
  if (balance <= 0) return "paid";
  return "pending";
};

export const getBalanceColor = (balance: number): string => {
  if (balance > 0) return "text-red-600 dark:text-red-400";
  if (balance < 0) return "text-emerald-600 dark:text-emerald-400";
  return "text-gray-600 dark:text-gray-400";
};

// ─── File size formatter ─────────────────────────────────────────────────────
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ─── Image to base64 ─────────────────────────────────────────────────────────
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

// ─── Debounce ────────────────────────────────────────────────────────────────
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
