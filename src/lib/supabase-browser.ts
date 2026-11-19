import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./supabase-config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  browserClient ??= createBrowserClient(supabaseUrl, supabasePublishableKey, {
    global: { headers: { apikey: supabasePublishableKey } },
  });
  return browserClient;
}
