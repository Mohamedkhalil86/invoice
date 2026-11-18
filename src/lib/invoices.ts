import { createClient } from "@supabase/supabase-js";

export type InvoiceItem = { id: string; name: string; quantity: number; price: number };
export type Invoice = { id: string; number: string; client: string; items: InvoiceItem[]; date: string; total: number; creator: string };

const fallbackUrl = "https://hlfdfphzjciivhsuupvy.supabase.co";
const fallbackPublishableKey = "sb_publishable_1DsaxxjDSVwi9wUttcHu8Q_W_5zzd-z";
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || fallbackUrl;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || fallbackPublishableKey;
// Supabase JS expects the project root. Accept a pasted REST endpoint too,
// but strip `/rest/v1` before the client appends its own REST path.
const projectUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
export const isSupabaseConfigured = Boolean(projectUrl && publishableKey);
const supabase = createClient(projectUrl, publishableKey, {
  // New sb_publishable keys belong in `apikey`; they are not JWTs and should
  // not be manually copied into Authorization as a Bearer token.
  global: { headers: { apikey: publishableKey } },
});
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
