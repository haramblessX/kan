import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// For compatibility with existing code that imports initAuth
export { initAuth, createServerClient } from "./auth";

// Get user from request headers (for API routes)
export async function getUserFromRequest(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Get the authorization header
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || user.email?.split("@")[0] || "",
    image: user.user_metadata?.avatar_url || null,
    emailVerified: !!user.email_confirmed_at,
  };
}

// Verify session from cookies (for server components)
export async function getSessionFromCookies(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
      image: session.user.user_metadata?.avatar_url || null,
      emailVerified: !!session.user.email_confirmed_at,
    },
    session: {
      id: session.access_token,
      userId: session.user.id,
      expiresAt: new Date(session.expires_at! * 1000),
    },
  };
}
