import type { NextApiRequest, NextApiResponse } from "next";

import { withRateLimit } from "@kan/api/utils/rateLimit";

export const config = { api: { bodyParser: true } };

// Supabase handles auth directly via its own endpoints
// This route is kept for backwards compatibility and custom auth operations
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { all } = req.query;
  const path = Array.isArray(all) ? all.join("/") : all;

  // Handle social providers endpoint for compatibility
  if (path === "social-providers") {
    const providers: string[] = [];
    if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true") providers.push("google");
    if (process.env.NEXT_PUBLIC_GITHUB_ENABLED === "true") providers.push("github");
    if (process.env.NEXT_PUBLIC_DISCORD_ENABLED === "true") providers.push("discord");
    if (process.env.NEXT_PUBLIC_APPLE_ENABLED === "true") providers.push("apple");
    if (process.env.NEXT_PUBLIC_MICROSOFT_ENABLED === "true") providers.push("microsoft");
    
    return res.status(200).json(providers);
  }

  // For other auth operations, return info about Supabase
  return res.status(200).json({
    message: "Auth is handled by Supabase",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}

export default withRateLimit(
  { points: 100, duration: 60 },
  handler,
);
