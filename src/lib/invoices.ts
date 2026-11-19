import { getSupabaseBrowserClient } from "./supabase-browser";
import { supabasePublishableKey, supabaseUrl } from "./supabase-config";

export type InvoiceItem = { id: string; name: string; quantity: number; price: number; itemDiscountPercent?: number; lineTotal?: number };
export type Invoice = { id: string; number: string; client: string; items: InvoiceItem[]; date: string; total: number; creator: string; subtotal?: number; invoiceDiscountPercent?: number; invoiceDiscountAmount?: number };

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
const supabase = getSupabaseBrowserClient();
const table = "invoices";

function errorMessage(error: unknown, httpStatus?: number): string {
  if (!error || typeof error !== "object") return String(error || "Unknown Supabase error");
  const value = error as { message?: string; code?: string; status?: number; details?: string; hint?: string };
  const statusCode = httpStatus ?? value.status;
  const status = statusCode ? `HTTP ${statusCode}: ` : "";
  const code = value.code ? ` [${value.code}]` : "";
  const detail = value.details ? ` — ${value.details}` : "";
  const hint = value.hint ? ` (${value.hint})` : "";
  const authTip = statusCode === 401
    ? " تحقق من صلاحية publishable key وأنه تابع لمشروع Supabase نفسه."
    : "";
  return `${status}${value.message || "Supabase request failed"}${code}${detail}${hint}${authTip}`;
}

export async function fetchCloudInvoices(): Promise<{ data: Invoice[]; error: string | null }> {
  try {
    const { data, error, status } = await supabase.from(table)
      .select("id, number, client, items, date, total, creator, subtotal, invoice_discount_percent, invoice_discount_amount")
      .order("date", { ascending: false });
    if (error) return { data: [], error: errorMessage(error, status) };
    const rows = (data ?? []) as {id:string;number:string;client:string;items:InvoiceItem[]|null;date:string;total:number|string;creator:string;subtotal:number|string|null;invoice_discount_percent:number|string|null;invoice_discount_amount:number|string|null}[];
    return { data: rows.map((row) => {
      const items = row.items ?? [];
      const subtotal = Number(row.subtotal) || items.reduce((sum, item) => sum + (item.lineTotal ?? item.quantity * item.price * (1 - Number(item.itemDiscountPercent || 0) / 100)), 0);
      const invoiceDiscountPercent = Number(row.invoice_discount_percent) || 0;
      const invoiceDiscountAmount = Number(row.invoice_discount_amount) || subtotal * invoiceDiscountPercent / 100;
      return { ...row, items, subtotal, invoiceDiscountPercent, invoiceDiscountAmount, total: Number(row.total) } as Invoice;
    }), error: null };
  } catch (error) {
    return { data: [], error: errorMessage(error) };
  }
}

export async function saveCloudInvoice(invoice: Invoice): Promise<{ error: string | null }> {
  try {
    const { error, status } = await supabase.from(table).insert(toDatabaseInvoice(invoice));
    return { error: error ? errorMessage(error, status) : null };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateCloudInvoice(invoice: Invoice): Promise<{ error: string | null }> {
  try {
    const { data, error, status } = await supabase.from(table)
      .update(toDatabaseInvoice(invoice))
      .eq("id", invoice.id)
      .select("id")
      .maybeSingle();
    if (error) return { error: errorMessage(error, status) };
    return { error: data ? null : "Invoice was not found or update permission was denied." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

function toDatabaseInvoice(invoice: Invoice) {
  return {
    id: invoice.id, number: invoice.number, client: invoice.client, items: invoice.items,
    date: invoice.date, total: invoice.total, subtotal: invoice.subtotal ?? invoice.total,
    invoice_discount_percent: invoice.invoiceDiscountPercent ?? 0,
    invoice_discount_amount: invoice.invoiceDiscountAmount ?? 0, creator: invoice.creator,
  };
}

export async function deleteCloudInvoice(id: string): Promise<{ error: string | null }> {
  try {
    const { data, error, status } = await supabase.from(table)
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return { error: errorMessage(error, status) };
    return { error: data ? null : "Invoice was not found or delete permission was denied." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
