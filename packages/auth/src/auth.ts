import { createClient } from "@supabase/supabase-js";
import { env } from "next-runtime-env";

import type { dbClient } from "@kan/db/client";

export type SupabaseAuthClient = ReturnType<typeof createClient>;

export const initAuth = (_db: dbClient) => {
  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL") || "";
  const supabaseAnonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return {
    supabase,
    // Compatibility layer for existing code
    handler: async (req: Request) => {
      // Supabase handles auth via its own endpoints
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  };
};

// Server-side Supabase client with service role for admin operations
export const createServerClient = () => {
  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL") || "";
  const supabaseServiceKey = env("SUPABASE_SERVICE_ROLE_KEY") || "";

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
