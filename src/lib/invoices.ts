import { getSupabaseBrowserClient } from "./supabase-browser";
import { supabasePublishableKey, supabaseUrl } from "./supabase-config";

export type InvoiceItem = { id: string; name: string; quantity: number; price: number };
export type Invoice = { id: string; number: string; client: string; items: InvoiceItem[]; date: string; total: number; creator: string };

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
      .select("id, number, client, items, date, total, creator")
      .order("date", { ascending: false });
    if (error) return { data: [], error: errorMessage(error, status) };
    return { data: (data ?? []) as Invoice[], error: null };
  } catch (error) {
    return { data: [], error: errorMessage(error) };
  }
}

export async function saveCloudInvoice(invoice: Invoice): Promise<{ error: string | null }> {
  try {
    const { error, status } = await supabase.from(table).insert(invoice);
    return { error: error ? errorMessage(error, status) : null };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateCloudInvoice(invoice: Invoice): Promise<{ error: string | null }> {
  try {
    const { data, error, status } = await supabase.from(table)
      .update(invoice)
      .eq("id", invoice.id)
      .select("id")
      .maybeSingle();
    if (error) return { error: errorMessage(error, status) };
    return { error: data ? null : "Invoice was not found or update permission was denied." };
  } catch (error) {
    return { error: errorMessage(error) };
  }
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
