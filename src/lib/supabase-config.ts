const fallbackUrl = "https://hlfdfphzjciivhsuupvy.supabase.co";
const fallbackPublishableKey = "sb_publishable_1DsaxxjDSVwi9wUttcHu8Q_W_5zzd-z";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || fallbackUrl;
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || fallbackPublishableKey;

