// Plugins are now handled by Supabase directly
// This file is kept for backwards compatibility

import type { dbClient } from "@kan/db/client";

export function createPlugins(_db: dbClient) {
  // Supabase handles all auth plugins natively:
  // - Magic links (built-in)
  // - OAuth providers (configured in Supabase dashboard)
  // - API keys (can use Supabase service role)
  // - Stripe (handled separately in @kan/stripe)
  return [];
}
