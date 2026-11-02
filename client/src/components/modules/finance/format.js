export const formatMoney = (value, currency = "USD", { compact = false } = {}) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...(compact
        ? { notation: "compact", maximumFractionDigits: 1 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
};
export const CURRENCIES = ["USD", "NGN", "GBP", "EUR"];

export const CURRENCY_LABELS = {
  USD: "USD - US Dollar",
  NGN: "NGN - Nigerian Naira",
  GBP: "GBP - Pound Sterling",
  EUR: "EUR - Euro",
};

// UTC so a date saved as "2026-01-28" never shifts to the previous day.
export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
      })
    : "Not set";

export const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
export const todayInput = () => new Date().toISOString().slice(0, 10);
export const inDaysInput = (days) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export const INVOICE_STATUS_LABELS = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  OVERDUE: "Overdue",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const invoiceStatusStyles = {
  PAID: "bg-primary/10 text-primary",
  OVERDUE: "bg-destructive/10 text-destructive",
  PENDING: "bg-chart-4/10 text-chart-4",
  PARTIALLY_PAID: "bg-chart-5/10 text-chart-5",
  CANCELLED: "bg-muted text-muted-foreground",
};

export const PAYMENT_METHOD_LABELS = {
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
  CARD: "Card",
  OTHER: "Other",
};

export const EXPENSE_CATEGORY_LABELS = {
  PROCUREMENT: "Procurement",
  LOGISTICS: "Logistics",
  SALARIES: "Salaries",
  UTILITIES: "Utilities",
  TAXES_DUTIES: "Taxes & duties",
  MARKETING: "Marketing",
  OTHER: "Other",
};