// Shared Supabase client for the AdviseU Admin experience.
import { createClient } from "@supabase/supabase-js";

const metaEnv = typeof import.meta !== "undefined" ? import.meta.env ?? {} : {};
const processEnv =
  typeof process !== "undefined" && process.env ? process.env : {};

const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL ?? processEnv.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ?? processEnv.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
